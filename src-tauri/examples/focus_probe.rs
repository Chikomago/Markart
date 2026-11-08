#[path = "../src/plugin_focus.rs"]
mod plugin_focus;
#[tauri::command]
fn focus_probe_report(app: tauri::AppHandle, value: serde_json::Value) {
    println!("FOCUS_PROBE {}", value);
    app.exit(0);
}
fn main() {
    let mode = if std::env::args().any(|arg| arg == "--window-focus") {
        "window"
    } else {
        "current"
    };
    let mut context = tauri::generate_context!();
    context.config_mut().app.windows.clear();
    context.config_mut().identifier = "com.markart.focus-probe".into();
    tauri::Builder::default()
        .plugin(plugin_focus::init())
        .invoke_handler(tauri::generate_handler![
            focus_probe_report,
            plugin_focus::plugin_focus_token
        ])
        .setup(move |app| {
            let window = tauri::WebviewWindowBuilder::new(
                app,
                "focus-probe",
                tauri::WebviewUrl::External(
                    format!(
                        "http://127.0.0.1:5173/experiments/focus-reopen-check.html?mode={mode}"
                    )
                    .parse()
                    .unwrap(),
                ),
            )
            .title("Markart Focus Probe — 模拟数据")
            .inner_size(1000., 760.)
            .focused(true)
            .on_page_load(|view, event| {
                if event.event() == tauri::webview::PageLoadEvent::Finished {
                    let _ = view.set_focus();
                }
            })
            .build()?;
            let _ = window.set_focus();
            Ok(())
        })
        .run(context)
        .expect("focus probe failed");
}
