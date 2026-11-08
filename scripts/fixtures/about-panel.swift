import Cocoa
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let before = CommandLine.arguments.contains("--before")
let version = "0.1.0"
let paragraph = NSMutableParagraphStyle()
paragraph.alignment = before ? .left : .center
let credits = NSAttributedString(string: "Chikoma\nGPL v3", attributes: [.paragraphStyle: paragraph])
let icon = NSImage(contentsOfFile: FileManager.default.currentDirectoryPath + "/src-tauri/icons/128x128.png")!
icon.size = NSSize(width: 128, height: 128)
app.orderFrontStandardAboutPanel(options: [.applicationName: "Markart", .applicationVersion: before ? version : "", .version: version, .applicationIcon: icon, .credits: credits])
func descendants(_ view: NSView) -> [NSView] { return [view] + view.subviews.flatMap(descendants) }
DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) {
    guard let window = app.windows.first(where: { $0.isVisible }), let content = window.contentView else { print("FAIL About panel missing"); exit(1) }
    let views = descendants(content)
    let labels = views.compactMap { ($0 as? NSTextField)?.stringValue }
    let versionLabels = labels.filter { $0.contains(version) }.joined(separator: " ")
    let occurrences = versionLabels.components(separatedBy: version).count - 1
    let details = views.compactMap { $0 as? NSTextView }.first(where: { $0.string.contains("Chikoma") })
    let style = details?.textStorage?.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle
    if let output = CommandLine.arguments.first(where: { $0.hasSuffix(".png") }), let bitmap = content.bitmapImageRepForCachingDisplay(in: content.bounds) {
        content.cacheDisplay(in: content.bounds, to: bitmap)
        try! bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: output))
    }
    guard occurrences == 1 else { print("FAIL Version repeated: \(versionLabels)"); exit(1) }
    guard style?.alignment == .center else { print("FAIL Credits are not centered"); exit(1) }
    guard details?.string == "Chikoma\nGPL v3" else { print("FAIL Unexpected labels in credits"); exit(1) }
    print("PASS Native About panel shows one version and centered author/license without labels")
    exit(0)
}
app.run()
