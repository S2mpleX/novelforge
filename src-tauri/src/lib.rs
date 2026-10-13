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
            // Character Relationships (Phase 2)
            commands::list_character_relationships,
            commands::create_character_relationship,
            commands::delete_character_relationship,
            // Story Phases & Arcs (Phase 2)
            commands::list_story_phases,
            commands::create_story_phase,
            commands::delete_story_phase,
            commands::list_story_arcs,
            commands::create_story_arc,
            commands::update_story_arc_status,
            // Scenes & Events (Phase 2)
            commands::list_scenes,
            commands::create_scene,
            commands::update_scene_status,
            commands::list_story_events,
            commands::create_story_event,
            // Review Reports (Phase 3)
            commands::list_review_reports,
            commands::get_latest_review_report,
            commands::update_finding_status,
            // Multi-Agent Orchestration (Phase 3)
            commands::run_continuity_audit,
            commands::run_style_polish,
            commands::run_scene_planning,
            commands::run_collaborative_workflow,
            // Layered Memory Engine (Phase 4)
            commands::list_canon_facts,
            commands::create_canon_fact,
            commands::delete_canon_fact,
            commands::list_character_state_events,
            commands::create_character_state_event,
            commands::search_chapters_fts,
            commands::assemble_memory_context_pack,
            commands::extract_chapter_memory,
            // Serialization Engine (Phase 5)
            commands::create_serialization_job,
            commands::get_serialization_job,
            commands::list_serialization_jobs,
            commands::pause_serialization_job,
            commands::cancel_serialization_job,
            commands::advance_serialization_job_step,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NovelForge AI application");
}
