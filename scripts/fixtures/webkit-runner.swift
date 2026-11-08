import Cocoa
import WebKit

// Isolated regression renderer. Never connects to an existing app or browser session.
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let page = URL(fileURLWithPath: CommandLine.arguments[1])
let web = WKWebView(frame: NSRect(x: 0, y: 0, width: 1280, height: 16000))
let window = NSWindow(contentRect: web.frame, styleMask: .borderless, backing: .buffered, defer: false)
window.contentView = web
web.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
let deadline = Date().addingTimeInterval(30)
var checking = false
var lastState = "not loaded"
let timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
    if Date() > deadline { fputs("WebKit tests timed out: \(lastState)\n", stderr); exit(1) }
    if checking { return }
    checking = true
    web.evaluateJavaScript("({ result: document.querySelector('#result')?.textContent, ready: document.readyState, progress: document.body?.dataset.testProgress, html: document.documentElement.outerHTML })") { value, error in
        checking = false
        lastState = String(describing: value ?? error as Any)
        if let state = value as? [String: Any], let result = state["result"] as? String, result != "WAIT", result.hasPrefix("[") {
            print(state["html"] as? String ?? "<pre id=\"result\">\(result)</pre>")
            exit(0)
        }
    }
}
app.run()
