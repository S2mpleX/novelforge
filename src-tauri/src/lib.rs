pub mod commands;
pub mod database;
pub mod export;
pub mod models;
pub mod providers;

use database::DbManager;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    // 规避 Windows 下 NVIDIA 驱动（NvMemMapStoragex.dll 0xc0000005）与 WebView2 GPU 渲染崩溃冲突
    if std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").is_err() {
        unsafe {
            std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--disable-gpu --disable-gpu-compositing");
        }
    }
    println!("[NovelForge] 1. Initializing SQLite DbManager...");
    let db = DbManager::new().expect("Failed to initialize SQLite database");
    println!("[NovelForge] 2. SQLite DbManager initialized successfully.");

    println!("[NovelForge] 3. Building Tauri application...");
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            println!("[NovelForge] 4. App setup hook triggered!");
            if let Some(window) = app.get_webview_window("main") {
                println!("[NovelForge] 5. Successfully found 'main' window. Showing and focusing window...");
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            } else {
                eprintln!("[NovelForge] ⚠️ Warning: 'main' window was not found in setup hook!");
            }
            Ok(())
        })
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            // Novels
            commands::create_novel,
            commands::list_novels,
            commands::get_novel,
            commands::delete_novel,
            commands::update_novel,
            // Volumes & Chapters
            commands::list_volumes,
            commands::list_chapters,
            commands::get_chapter,
            commands::create_chapter,
            commands::save_chapter_content,
            commands::list_chapter_versions,
            commands::delete_chapter,
            commands::update_chapter_title,
            // Story Bible
            commands::list_characters,
            commands::create_character,
            commands::update_character_status,
            commands::update_character,
            commands::delete_character,
            commands::list_world_rules,
            commands::create_world_rule,
            commands::update_world_rule,
            commands::delete_world_rule,
            commands::list_plot_threads,
            commands::create_plot_thread,
            commands::update_plot_thread_status,
            commands::update_plot_thread,
            commands::delete_plot_thread,
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
            commands::delete_story_arc,
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
            // Publishing & System Diagnostics (Phase 6 & 7)
            commands::export_novel_html_book,
            commands::export_novel_epub,
            commands::export_novel_archive,
            commands::import_novel_archive,
            commands::backup_database,
            commands::optimize_database,
            // V2.0 Multi-Level Hierarchy & Plot System
            commands::create_series,
            commands::list_series,
            commands::get_series,
            commands::delete_series,
            commands::create_part,
            commands::list_parts,
            commands::get_part,
            commands::delete_part,
            commands::get_novel_hierarchy_config,
            commands::update_novel_hierarchy_config,
            commands::create_volume,
            commands::delete_volume,
            commands::update_volume,
            commands::delete_scene,
            commands::create_plot_beat,
            commands::list_plot_beats,
            commands::update_plot_beat_status,
            commands::delete_plot_beat,
            commands::create_character_arc,
            commands::list_character_arcs,
            commands::update_character_arc_stage,
            commands::delete_character_arc,
            commands::create_parallel_thread,
            commands::list_parallel_threads,
            commands::update_parallel_thread_status,
            commands::delete_parallel_thread,
            commands::create_plot_association,
            commands::delete_plot_association,
            commands::list_plot_associations_for_target,
            commands::list_plot_associations_for_entity,
            commands::list_novel_plot_matrix,
            commands::move_node,
            commands::split_chapter,
            commands::merge_chapters,
            commands::split_scene,
            commands::merge_scenes,
            commands::renumber_hierarchy,
            commands::get_novel_content_tree,
            commands::assemble_hierarchical_creation_context,
            // V2.3 Workflow Engine & Toolbox
            commands::list_workflow_templates,
            commands::save_workflow_template,
            commands::create_workflow_run,
            commands::get_workflow_run_details,
            commands::list_workflow_runs,
            commands::update_workflow_step_output,
            commands::advance_workflow_step,
            commands::assemble_toolbox_prompt,
            commands::execute_llm_chat,
            // V2.3.1 Voice Profiles & Review Repair
            commands::list_voice_profiles,
            commands::save_voice_profile,
            commands::set_active_voice_profile,
            commands::delete_voice_profile,
            commands::generate_finding_repair,
            // V2.4 Multi-Model Arena
            commands::execute_arena_duel,
            commands::merge_arena_outputs,
            commands::list_model_arena_runs,
            commands::save_model_arena_run,
            commands::delete_model_arena_run,
            // V2.5.1 AI Prompt Optimizer
            commands::optimize_writing_prompt,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NovelForge AI application");
}
