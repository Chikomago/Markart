import AppKit
import Foundation
import WebKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

@MainActor
final class PDFExport: NSObject, WKNavigationDelegate {
    private let app = NSApplication.shared
    private let webView = WKWebView(frame: NSRect(x: 0, y: 0, width: 794, height: 1123))
    private let window: NSWindow
    private let output: URL
    private let paper: NSSize
    private let margin: CGFloat
    private var pageCuts: [CGFloat] = []

    init(input: URL, output: URL, pageSize: String, marginMM: Double) {
        self.output = output
        if pageSize == "Letter" { self.paper = NSSize(width: 612, height: 792) }
        else if pageSize == "A4" { self.paper = NSSize(width: 595, height: 842) }
        else {
            let dimensions = pageSize.split(separator: "x").compactMap { Double($0) }
            self.paper = dimensions.count == 2 ? NSSize(width: dimensions[0] * 72.0 / 25.4, height: dimensions[1] * 72.0 / 25.4) : NSSize(width: 595, height: 842)
        }
        self.margin = CGFloat(marginMM * 72.0 / 25.4)
        self.window = NSWindow(contentRect: webView.frame, styleMask: [.borderless], backing: .buffered, defer: false)
        super.init()
        app.setActivationPolicy(.prohibited)
        window.contentView = webView
        window.orderOut(nil)
        webView.navigationDelegate = self
        webView.loadFileURL(input, allowingReadAccessTo: input.deletingLastPathComponent())
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { self.render() }
    }

    private func render() {
        let printableWidth = paper.width - margin * 2
        let printableHeight = paper.height - margin * 2
        guard printableWidth > 0 && printableHeight > 0 else { fail("页边距超出纸张大小"); return }
        let pageHeight = printableHeight * webView.bounds.width / printableWidth
        let script = """
        (() => {
          const height = Math.ceil(document.body.getBoundingClientRect().bottom + scrollY);
          const protectedRects = [];
          const add = rect => { if (rect.height > 0) protectedRects.push([rect.top + scrollY, rect.bottom + scrollY]); };
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            if (!walker.currentNode.textContent.trim()) continue;
            const range = document.createRange(); range.selectNodeContents(walker.currentNode);
            for (const rect of range.getClientRects()) add(rect);
          }
          for (const element of document.querySelectorAll('img,svg,pre,blockquote,tr,.markart-display-math,.cm-mermaid-preview')) {
            const rect = element.getBoundingClientRect();
            if (rect.height < \(pageHeight) * .8) add(rect);
          }
          for (const heading of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
            const rect = heading.getBoundingClientRect(), next = heading.nextElementSibling?.getBoundingClientRect();
            protectedRects.push([rect.top + scrollY, Math.max(rect.bottom, next ? next.top + Math.min(next.height, 48) : rect.bottom) + scrollY]);
          }
          const cuts = [0];
          while (cuts[cuts.length - 1] + \(pageHeight) < height) {
            const start = cuts[cuts.length - 1]; let end = start + \(pageHeight);
            for (let count = 0; count < protectedRects.length + 1; count++) {
              const overlaps = protectedRects.filter(([top, bottom]) => top < end + .5 && bottom > end - .5);
              if (!overlaps.length) break;
              const candidate = Math.min(...overlaps.map(([top]) => top)) - 1;
              if (candidate <= start + 1) break;
              end = candidate;
            }
            cuts.push(end);
          }
          cuts.push(height); return { height, cuts };
        })()
        """
        webView.evaluateJavaScript(script) { value, error in
            guard error == nil, let layout = value as? [String: Any], let height = layout["height"] as? NSNumber,
                  let cuts = layout["cuts"] as? [NSNumber], height.doubleValue > 0 else { self.fail("无法测量导出内容分页"); return }
            self.pageCuts = cuts.map { CGFloat($0.doubleValue) }
            let configuration = WKPDFConfiguration()
            configuration.rect = CGRect(x: 0, y: 0, width: self.webView.bounds.width, height: height.doubleValue)
            self.capture(configuration)
        }
    }

    private func capture(_ configuration: WKPDFConfiguration) {
        webView.createPDF(configuration: configuration) { result in
            do {
                let data = try result.get()
                if self.output.pathExtension.lowercased() == "png" {
                    let png = try self.renderPNG(data)
                    try png.write(to: self.output, options: .atomic)
                    print("PNG_OK \(png.count)")
                } else {
                    let paged = try self.paginate(data)
                    guard paged.count > 100, paged.starts(with: Data("%PDF".utf8)) else { self.fail("PDF 输出无效"); return }
                    try paged.write(to: self.output, options: .atomic)
                    print("PDF_OK \(paged.count)")
                }
                exit(0)
            } catch { self.fail("PDF 生成失败：\(error)") }
        }
    }

    private func renderPNG(_ pdf: Data) throws -> Data {
        guard let provider = CGDataProvider(data: pdf as CFData), let document = CGPDFDocument(provider), document.numberOfPages > 0 else { throw NSError(domain: "MarkartPNG", code: 1) }
        let scale: CGFloat = 1.5
        let bounds = (1...document.numberOfPages).compactMap { document.page(at: $0)?.getBoxRect(.mediaBox) }
        let width = Int(ceil((bounds.map { $0.width }.max() ?? paper.width) * scale))
        let height = Int(ceil(bounds.reduce(0) { $0 + $1.height } * scale))
        guard height <= 32767, width * height <= 150_000_000 else { throw NSError(domain: "MarkartPNG", code: 2, userInfo: [NSLocalizedDescriptionKey: "文件过长，无法输出单张 PNG；请使用 PDF"] ) }
        guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB), let bitmap = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { throw NSError(domain: "MarkartPNG", code: 3) }
        bitmap.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        bitmap.fill(CGRect(x: 0, y: 0, width: width, height: height))
        var top = CGFloat(height) / scale
        for index in 1...document.numberOfPages {
            guard let page = document.page(at: index) else { continue }
            let box = page.getBoxRect(.mediaBox)
            top -= box.height
            bitmap.saveGState()
            bitmap.translateBy(x: 0, y: top * scale)
            bitmap.scaleBy(x: scale, y: scale)
            bitmap.translateBy(x: -box.minX, y: -box.minY)
            bitmap.drawPDFPage(page)
            bitmap.restoreGState()
        }
        guard let image = bitmap.makeImage() else { throw NSError(domain: "MarkartPNG", code: 4) }
        let outputData = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(outputData as CFMutableData, UTType.png.identifier as CFString, 1, nil) else { throw NSError(domain: "MarkartPNG", code: 5) }
        CGImageDestinationAddImage(destination, image, nil)
        guard CGImageDestinationFinalize(destination) else { throw NSError(domain: "MarkartPNG", code: 6) }
        return outputData as Data
    }

    private func paginate(_ source: Data) throws -> Data {
        guard let provider = CGDataProvider(data: source as CFData),
              let document = CGPDFDocument(provider) else { throw NSError(domain: "MarkartPDF", code: 1) }
        let outputData = NSMutableData()
        guard let consumer = CGDataConsumer(data: outputData as CFMutableData) else { throw NSError(domain: "MarkartPDF", code: 2) }
        var pageRect = CGRect(x: 0, y: 0, width: paper.width, height: paper.height)
        guard let context = CGContext(consumer: consumer, mediaBox: &pageRect, nil) else { throw NSError(domain: "MarkartPDF", code: 3) }
        let printable = CGRect(x: margin, y: margin, width: paper.width - margin * 2, height: paper.height - margin * 2)
        for sourceIndex in 1...document.numberOfPages {
            guard let sourcePage = document.page(at: sourceIndex) else { continue }
            let bounds = sourcePage.getBoxRect(.mediaBox)
            guard bounds.width > 0 && bounds.height > 0 else { continue }
            let scale = printable.width / bounds.width
            let cuts = pageCuts.isEmpty ? [CGFloat(0), bounds.height] : pageCuts
            for index in 0..<(cuts.count - 1) {
                let top = cuts[index], bottom = cuts[index + 1]
                let sliceHeight = bottom - top
                context.beginPDFPage(nil)
                context.saveGState()
                let clip = CGRect(x: printable.minX, y: printable.maxY - sliceHeight * scale, width: printable.width, height: sliceHeight * scale)
                context.clip(to: clip)
                context.translateBy(x: printable.minX, y: printable.maxY - sliceHeight * scale)
                context.scaleBy(x: scale, y: scale)
                context.translateBy(x: -bounds.minX, y: -bounds.maxY + bottom)
                context.drawPDFPage(sourcePage)
                context.restoreGState()
                context.endPDFPage()
            }
        }
        context.closePDF()
        return outputData as Data
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { fail("加载失败：\(error)") }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { fail("加载失败：\(error)") }
    private func fail(_ message: String) { fputs("PDF_ERROR \(message)\n", stderr); exit(1) }
}

let size = CommandLine.arguments.count == 5 ? CommandLine.arguments[3] : ""
let customSize = size.split(separator: "x").compactMap { Double($0) }
guard CommandLine.arguments.count == 5,
      (["A4", "Letter"].contains(size) || (customSize.count == 2 && customSize.allSatisfy { $0 >= 50 && $0 <= 1000 })),
      let margin = Double(CommandLine.arguments[4]), margin >= 0, margin <= 100 else {
    fputs("usage: pdf-export INPUT_HTML OUTPUT_PDF A4|Letter|WIDTHxHEIGHT MARGIN_MM\n", stderr); exit(2)
}
MainActor.assumeIsolated {
    let exporter = PDFExport(input: URL(fileURLWithPath: CommandLine.arguments[1]), output: URL(fileURLWithPath: CommandLine.arguments[2]), pageSize: CommandLine.arguments[3], marginMM: margin)
    withExtendedLifetime(exporter) { NSApplication.shared.run() }
}
