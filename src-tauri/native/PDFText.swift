import Foundation
import AppKit
import PDFKit

struct TextOutput: Encodable {
    let text: String
}

// PDFKit can return CJK compatibility radicals in place of ordinary Han characters.
// Normalize only those ranges; normalizing the whole page would also alter math symbols.
func normalizeCompatibilityHan(_ input: String) -> String {
    input.unicodeScalars.map { scalar in
        let value = scalar.value
        if (0x2F00...0x2FD5).contains(value) || (0xF900...0xFAFF).contains(value) {
            return String(scalar).precomposedStringWithCompatibilityMapping
        }
        return String(scalar)
    }.joined()
}

func pageTextWithParagraphs(_ page: PDFPage) -> String {
    let raw = page.string ?? ""
    let source = raw as NSString
    var fragments: [(text: String, bounds: NSRect?)] = []
    source.enumerateSubstrings(in: NSRange(location: 0, length: source.length), options: .byLines) { part, range, _, _ in
        guard let part, !part.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        let bounds = page.selection(for: range)?.bounds(for: page)
        if let bounds {
            for index in fragments.indices.reversed() {
                guard let previous = fragments[index].bounds else { continue }
                let horizontalGap = bounds.minX - previous.maxX
                let verticalOverlap = min(bounds.maxY, previous.maxY) - max(bounds.minY, previous.minY)
                if horizontalGap >= -2 && horizontalGap <= 3 && verticalOverlap > 2 {
                    fragments[index].text += normalizeCompatibilityHan(part)
                    fragments[index].bounds = previous.union(bounds)
                    return
                }
            }
        }
        fragments.append((normalizeCompatibilityHan(part), bounds))
    }
    var lines: [String] = []
    var previousBounds: NSRect?
    for fragment in fragments {
        let bounds = fragment.bounds
        if let previousBounds, let bounds {
            let gap = previousBounds.minY - bounds.maxY
            if gap > max(10, min(previousBounds.height, bounds.height) * 0.9) {
                lines.append("")
            }
        }
        lines.append(fragment.text)
        previousBounds = bounds
    }
    return lines.joined(separator: "\n")
}

guard CommandLine.arguments.count == 3 else {
    fputs("usage: pdf-text INPUT_PDF OUTPUT_JSON\n", stderr)
    exit(2)
}
let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
guard let document = PDFDocument(url: input), document.pageCount > 0 else {
    fputs("PDF 无法读取或没有页面\n", stderr)
    exit(1)
}
var text: [String] = []
for index in 0..<document.pageCount {
    guard let page = document.page(at: index) else { continue }
    text.append(pageTextWithParagraphs(page))

}
let encoded = try JSONEncoder().encode(TextOutput(text: text.joined(separator: "\n\n")))
try encoded.write(to: output, options: .atomic)
