// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {

    // 规避 Windows 下 NVIDIA 驱动（NvMemMapStoragex.dll 0xc0000005）与 WebView2 GPU 渲染崩溃冲突
    if std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").is_err() {
        unsafe {
            std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--disable-gpu --disable-gpu-compositing");
        }
    }
    novelforge_ai_lib::run()
}
