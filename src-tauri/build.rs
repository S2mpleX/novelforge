fn main() {
    let mut windows = tauri_build::WindowsAttributes::new();
    let ascii_dir = std::path::Path::new("E:/tools/novelforge_target");
    let _ = std::fs::create_dir_all(ascii_dir);
    let ascii_icon = ascii_dir.join("icon.ico");
    if std::fs::copy("icons/icon.ico", &ascii_icon).is_ok() {
        windows = windows.window_icon_path(&ascii_icon);
    }
    let attrs = tauri_build::Attributes::new().windows_attributes(windows);
    tauri_build::try_build(attrs).expect("failed to run tauri-build");
}
