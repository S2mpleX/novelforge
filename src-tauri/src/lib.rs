pub mod commands;
pub mod database;
pub mod models;
pub mod providers;

use database::DbManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = DbManager::new().expect("Failed to initialize SQLite database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            // Novels
            commands::create_novel,
            commands::list_novels,
            commands::get_novel,
            commands::delete_novel,
            // Volumes & Chapters
            commands::list_volumes,
            commands::list_chapters,
            commands::get_chapter,
            commands::create_chapter,
            commands::save_chapter_content,
            commands::list_chapter_versions,
            commands::delete_chapter,
            // Story Bible
            commands::list_characters,
            commands::create_character,
            commands::list_world_rules,
            commands::create_world_rule,
            commands::list_plot_threads,
            commands::create_plot_thread,
            // Providers & Models
            commands::list_providers,
            commands::list_models,
            commands::save_provider,
            commands::test_provider_connection,
            // AI Generation & Export
            commands::generate_stream_chapter,
            commands::export_chapter_text,
            commands::export_novel_text,
            commands::get_db_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NovelForge AI application");
}
