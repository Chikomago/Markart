import AppKit
import Foundation
import WebKit

@MainActor
final class PDFProbe: NSObject, WKNavigationDelegate {
    private let app = NSApplication.shared
    private let webView = WKWebView(frame: NSRect(x: 0, y: 0, width: 640, height: 800))
    private let output: URL

    init(output: URL) {
        self.output = output
        super.init()
        app.setActivationPolicy(.prohibited)
        let window = NSWindow(contentRect: webView.frame, styleMask: [.borderless], backing: .buffered, defer: false)
        window.contentView = webView
        window.orderOut(nil)
        webView.navigationDelegate = self
        webView.loadHTMLString("""
        <!doctype html><html><meta charset="utf-8"><style>
        body { font: 16px -apple-system; color: #222; }
        table { border-collapse: collapse; } td { border: 1px solid #444; padding: 6px; }
        pre { background: #eee; padding: 8px; }
        </style><h1>PDF probe 标题</h1><p>Markdown rendered content.</p>
        <table><tr><td>Column A</td><td>Column B</td></tr></table>
        <pre>const answer = 42;</pre></html>
        """, baseURL: nil)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.createPDF(configuration: WKPDFConfiguration()) { result in
            do {
                try result.get().write(to: self.output, options: .atomic)
                print("PDF_OK \(self.output.path)")
                exit(0)
            } catch {
                fputs("PDF_ERROR \(error)\n", stderr)
                exit(1)
            }
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        fputs("PDF_NAV_ERROR \(error)\n", stderr)
        exit(1)
    }
}

func probeTrash() throws {
    let source = FileManager.default.temporaryDirectory.appendingPathComponent("markart-trash-probe-\(UUID().uuidString).txt")
    try "disposable test file".write(to: source, atomically: true, encoding: .utf8)
    var resultingURL: NSURL?
    try FileManager.default.trashItem(at: source, resultingItemURL: &resultingURL)
    guard !FileManager.default.fileExists(atPath: source.path),
          let destination = resultingURL as URL?,
          FileManager.default.fileExists(atPath: destination.path) else {
        throw NSError(domain: "MarkartProbe", code: 1)
    }
    print("TRASH_OK \(destination.path)")
}

let arguments = CommandLine.arguments
guard arguments.count >= 2 else {
    fputs("usage: NativeProbe pdf OUTPUT_PATH | trash\n", stderr)
    exit(2)
}
switch arguments[1] {
case "trash":
    do { try probeTrash() } catch { fputs("TRASH_ERROR \(error)\n", stderr); exit(1) }
case "pdf":
    guard arguments.count == 3 else { exit(2) }
    MainActor.assumeIsolated {
        let probe = PDFProbe(output: URL(fileURLWithPath: arguments[2]))
        withExtendedLifetime(probe) {
            NSApplication.shared.run()
        }
    }
default:
    exit(2)
}
