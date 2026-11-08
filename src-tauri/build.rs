fn main() {
  #[cfg(target_os = "macos")]
  {
    let out_dir = std::path::PathBuf::from(std::env::var("OUT_DIR").expect("Cargo OUT_DIR"));
    let module_cache = out_dir.join("swift-module-cache");
    std::fs::create_dir_all(&module_cache).expect("create Swift module cache");
    let arch = std::env::var("CARGO_CFG_TARGET_ARCH").expect("target architecture");
    let apple_arch = if arch == "aarch64" { "arm64" } else { &arch };
    let apple_target = format!("{apple_arch}-apple-macosx11.0");
    let document_source = std::path::Path::new("native/QuickCaptureDocument.m");
    let document_object = out_dir.join("quick-capture-document.o");
    let document_library = out_dir.join("libquick_capture_document.a");
    let status = std::process::Command::new("clang")
      .args(["-target", &apple_target, "-fobjc-arc", "-c", "-o"])
      .arg(&document_object)
      .arg(document_source)
      .status().expect("compile quick capture document bridge");
    assert!(status.success(), "quick capture document bridge compilation failed");
    let alert_source = std::path::Path::new("native/UnsavedAlert.m");
    let alert_object = out_dir.join("unsaved-alert.o");
    let status = std::process::Command::new("clang")
      .args(["-target", &apple_target, "-fobjc-arc", "-c", "-o"])
      .arg(&alert_object)
      .arg(alert_source)
      .status().expect("compile unsaved alert bridge");
    assert!(status.success(), "unsaved alert bridge compilation failed");
    let status = std::process::Command::new("ar")
      .args(["rcs"])
      .arg(&document_library)
      .arg(&document_object)
      .arg(&alert_object)
      .status().expect("archive quick capture document bridge");
    assert!(status.success(), "quick capture document bridge archive failed");
    println!("cargo:rustc-link-search=native={}", out_dir.display());
    println!("cargo:rustc-link-lib=static=quick_capture_document");
    println!("cargo:rustc-link-lib=framework=AppKit");
    println!("cargo:rerun-if-changed=native/QuickCaptureDocument.m");
    println!("cargo:rerun-if-changed=native/UnsavedAlert.m");
    let output = std::path::Path::new("resources/pdf-export");
    let source = std::path::Path::new("native/PDFExport.swift");
    std::fs::create_dir_all("resources").expect("create PDF helper resource directory");
    let status = std::process::Command::new("swiftc")
        .env("CLANG_MODULE_CACHE_PATH", &module_cache)
        .env("SWIFT_MODULE_CACHE_PATH", &module_cache)
        .arg("-target").arg(&apple_target)
        .arg(source).args(["-O", "-o"])
        .arg(output)
        .status().expect("compile PDF helper");
    assert!(status.success(), "PDF helper compilation failed");
    println!("cargo:rerun-if-changed=native/PDFExport.swift");
    let text_source = std::path::Path::new("native/PDFText.swift");
    let text_output = std::path::Path::new("resources/pdf-text");
    let status = std::process::Command::new("swiftc")
        .env("CLANG_MODULE_CACHE_PATH", &module_cache)
        .env("SWIFT_MODULE_CACHE_PATH", &module_cache)
        .arg("-target").arg(&apple_target)
        .arg(text_source).args(["-O", "-o"])
        .arg(text_output)
        .status().expect("compile PDF text helper");
    assert!(status.success(), "PDF text helper compilation failed");
    println!("cargo:rerun-if-changed=native/PDFText.swift");
  }
  tauri_build::build()
}
