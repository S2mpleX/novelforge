pub const INIT_SCHEMA: &str = r#"
-- Novels table
CREATE TABLE IF NOT EXISTS novels (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    genre_profile TEXT DEFAULT '玄幻',
    language TEXT DEFAULT 'zh-CN',
    writing_style TEXT DEFAULT '通俗流畅、生动细腻',
    status TEXT DEFAULT 'ACTIVE',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Novel settings table
CREATE TABLE IF NOT EXISTS novel_settings (
    novel_id TEXT PRIMARY KEY,
    chapter_target_length INTEGER DEFAULT 3000,
    pov TEXT DEFAULT 'THIRD_LIMITED',
    narrative_style TEXT DEFAULT 'STANDARD',
    generation_mode TEXT DEFAULT 'COLLABORATIVE',
    review_level TEXT DEFAULT 'STANDARD',
    memory_settings TEXT DEFAULT '{}',
    budget_settings TEXT DEFAULT '{}',
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Story volumes table
CREATE TABLE IF NOT EXISTS volumes (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    summary TEXT DEFAULT '',
    status TEXT DEFAULT 'PLANNING',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    volume_id TEXT,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'DRAFT',
    active_version_id TEXT,
    word_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    FOREIGN KEY(volume_id) REFERENCES volumes(id) ON DELETE SET NULL
);

-- Chapter versions table
CREATE TABLE IF NOT EXISTS chapter_versions (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    source_type TEXT DEFAULT 'USER_EDIT', -- USER_EDIT, AI_GENERATED, AI_REVISED
    created_by TEXT DEFAULT 'user',
    content_hash TEXT DEFAULT '',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    name TEXT NOT NULL,
    aliases TEXT DEFAULT '',
    profile TEXT DEFAULT '',
    personality TEXT DEFAULT '',
    background TEXT DEFAULT '',
    motivation TEXT DEFAULT '',
    status TEXT DEFAULT 'ACTIVE',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Character dynamic state events table
CREATE TABLE IF NOT EXISTS character_state_events (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    source_chapter_id TEXT,
    effective_time TEXT DEFAULT '',
    field_name TEXT NOT NULL,
    previous_value TEXT DEFAULT '',
    new_value TEXT NOT NULL,
    status TEXT DEFAULT 'CONFIRMED',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY(source_chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);

-- Character relationships
CREATE TABLE IF NOT EXISTS character_relationships (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    source_character_id TEXT NOT NULL,
    target_character_id TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'ACTIVE',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    FOREIGN KEY(source_character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY(target_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- World rules (Story Bible)
CREATE TABLE IF NOT EXISTS world_rules (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    title TEXT NOT NULL,
    rule_content TEXT NOT NULL,
    authority_level TEXT DEFAULT 'CANON', -- CANON, EXTENDED, HYPOTHESIS, DEPRECATED
    status TEXT DEFAULT 'ACTIVE',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Canon facts (Layered Memory)
CREATE TABLE IF NOT EXISTS canon_facts (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    subject_id TEXT DEFAULT '',
    predicate TEXT NOT NULL,
    object_value TEXT NOT NULL,
    truth_scope TEXT DEFAULT 'GLOBAL',
    authority_level TEXT DEFAULT 'CONFIRMED_PLOT',
    status TEXT DEFAULT 'ACTIVE',
    effective_from TEXT DEFAULT '',
    effective_until TEXT DEFAULT '',
    source_chapter_id TEXT,
    version INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    FOREIGN KEY(source_chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);

-- Plot threads and suspense (伏笔系统)
CREATE TABLE IF NOT EXISTS plot_threads (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    introduced_chapter_id TEXT,
    expected_resolution TEXT DEFAULT '',
    resolved_chapter_id TEXT,
    status TEXT DEFAULT 'PLANTED', -- PLANTED, DEVELOPING, READY_TO_RESOLVE, RESOLVED, ABANDONED
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    FOREIGN KEY(introduced_chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);

-- AI Model Providers configuration
CREATE TABLE IF NOT EXISTS ai_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL DEFAULT 'OPENAI_COMPATIBLE', -- OPENAI_COMPATIBLE, GEMINI
    base_url TEXT NOT NULL,
    api_key TEXT DEFAULT '',
    is_active INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- AI Models under Providers
CREATE TABLE IF NOT EXISTS ai_models (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    context_window INTEGER DEFAULT 128000,
    max_output_tokens INTEGER DEFAULT 4096,
    is_default INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE
);

-- Usage & Cost records
CREATE TABLE IF NOT EXISTS usage_records (
    id TEXT PRIMARY KEY,
    novel_id TEXT,
    chapter_id TEXT,
    agent_id TEXT DEFAULT 'PROSE_WRITER',
    model_id TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost REAL DEFAULT 0.0,
    duration_ms INTEGER DEFAULT 0,
    is_retry INTEGER DEFAULT 0,
    success INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
);

-- Story Phases (宏观故事阶段)
CREATE TABLE IF NOT EXISTS story_phases (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    goal TEXT DEFAULT '',
    status TEXT DEFAULT 'PLANNING',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Story Arcs (剧情弧 / 支线线索)
CREATE TABLE IF NOT EXISTS story_arcs (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    phase_id TEXT,
    title TEXT NOT NULL,
    goal TEXT DEFAULT '',
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'DEVELOPING', -- PLANNING, DEVELOPING, PAUSED, COMPLETED, CANCELLED
    start_chapter_id TEXT,
    planned_end TEXT DEFAULT '',
    priority TEXT DEFAULT 'MAIN', -- MAIN, SUB, CHARACTER, WORLD
    created_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    FOREIGN KEY(phase_id) REFERENCES story_phases(id) ON DELETE SET NULL
);

-- Scenes (章节细分场景)
CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    objective TEXT DEFAULT '',
    outline TEXT DEFAULT '',
    pov_character_id TEXT,
    location_id TEXT DEFAULT '',
    status TEXT DEFAULT 'PLANNED',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Story Events (时间线与因果拓扑)
CREATE TABLE IF NOT EXISTS story_events (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    story_time TEXT DEFAULT '',
    source_chapter_id TEXT,
    cause_event_id TEXT,
    location_id TEXT DEFAULT '',
    status TEXT DEFAULT 'OCCURRED',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    FOREIGN KEY(source_chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);

-- Review Reports & Findings (逻辑审稿与一致性报告)
CREATE TABLE IF NOT EXISTS review_reports (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    score INTEGER DEFAULT 85,
    summary TEXT DEFAULT '',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS review_findings (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    severity TEXT NOT NULL, -- CRITICAL, MAJOR, MINOR, SUGGESTION
    category TEXT NOT NULL, -- CONTINUITY, CHARACTER, WORLD_RULE, TIMELINE, STYLE
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_quote TEXT DEFAULT '',
    suggestion TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN', -- OPEN, RESOLVED, DISMISSED
    created_at INTEGER NOT NULL,
    FOREIGN KEY(report_id) REFERENCES review_reports(id) ON DELETE CASCADE
);

-- Serialization Jobs (Phase 5: 自动连载任务队列)
CREATE TABLE IF NOT EXISTS serialization_jobs (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, RUNNING, PAUSED, COMPLETED, CANCELLED, FAILED
    target_chapters_count INTEGER DEFAULT 1,
    completed_chapters_count INTEGER DEFAULT 0,
    current_chapter_id TEXT,
    auto_approve INTEGER DEFAULT 0,
    budget_tokens INTEGER DEFAULT 50000,
    used_tokens INTEGER DEFAULT 0,
    config TEXT DEFAULT '{}',
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- ==========================================
-- V2.0 MULTI-LEVEL HIERARCHY & PLOT SYSTEM
-- ==========================================

-- Series / Universe (系列 / 宇宙)
CREATE TABLE IF NOT EXISTS series (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    genre_profile TEXT DEFAULT '',
    world_definition TEXT DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Parts (部 / 篇)
CREATE TABLE IF NOT EXISTS parts (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    part_number INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    summary TEXT DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'ACTIVE',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Plot Beats (情节节拍 - 细粒度规划单位)
CREATE TABLE IF NOT EXISTS plot_beats (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    beat_number INTEGER NOT NULL DEFAULT 1,
    beat_type TEXT DEFAULT 'ACTION', -- ACTION, DIALOGUE, EMOTION, TWIST, REVELATION, HOOK, FORESHADOW
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    emotional_shift TEXT DEFAULT '',
    characters_present TEXT DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, SKIPPED
    created_at INTEGER NOT NULL,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

-- Paragraphs (正文段落)
CREATE TABLE IF NOT EXISTS paragraphs (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    scene_id TEXT,
    beat_id TEXT,
    paragraph_index INTEGER NOT NULL,
    paragraph_type TEXT DEFAULT 'NORMAL', -- NORMAL, DIALOGUE, MONOLOGUE, SCENERY, ACTION, PSYCHOLOGICAL
    content TEXT NOT NULL,
    character_speaker_id TEXT,
    word_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE SET NULL,
    FOREIGN KEY(beat_id) REFERENCES plot_beats(id) ON DELETE SET NULL
);

-- Character Arcs (人物成长弧)
CREATE TABLE IF NOT EXISTS character_arcs (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    title TEXT NOT NULL,
    stage_from TEXT DEFAULT '',
    stage_to TEXT DEFAULT '',
    current_stage TEXT DEFAULT '',
    internal_conflict TEXT DEFAULT '',
    status TEXT DEFAULT 'DEVELOPING', -- PLANNING, DEVELOPING, COMPLETED, FAILED
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Parallel Narrative Threads (并行叙事线)
CREATE TABLE IF NOT EXISTS parallel_threads (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    title TEXT NOT NULL,
    pov_character_id TEXT,
    thread_color TEXT DEFAULT '#854d0e',
    summary TEXT DEFAULT '',
    convergence_target TEXT DEFAULT '',
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, MERGED, CLOSED
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Plot Associations (多对多剧情关联核心表: 跨部/卷/章/场景/节拍关联)
CREATE TABLE IF NOT EXISTS plot_associations (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    relation_type TEXT NOT NULL, -- MAIN_PLOT, SUBPLOT, STORY_ARC, CHARACTER_ARC, FORESHADOWING, TIMELINE_EVENT, PARALLEL_THREAD
    entity_id TEXT NOT NULL,
    target_type TEXT NOT NULL, -- PART, VOLUME, CHAPTER, SCENE, BEAT
    target_id TEXT NOT NULL,
    role_in_target TEXT DEFAULT 'PROGRESSION', -- INTRODUCES, PROGRESSES, CLIMAX, RESOLVES, FORESHADOWS, MENTIONS
    notes TEXT DEFAULT '',
    weight INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- ==========================================
-- V2.3 NOVELIST WORKFLOW ENGINE SYSTEM
-- ==========================================

-- Workflow Templates (工作流模板定义表)
CREATE TABLE IF NOT EXISTS workflow_templates (
    id TEXT PRIMARY KEY,
    novel_id TEXT,                    -- 可为空（全局模板）或绑定特定小说
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'general',  -- general, fantasy, urban, scifi, mystery
    steps_json TEXT NOT NULL,         -- JSON 数组定义步骤及插槽
    is_builtin INTEGER DEFAULT 0,     -- 1 为系统内置, 0 为自定义
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Workflow Runs (工作流运行实例表)
CREATE TABLE IF NOT EXISTS workflow_runs (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    novel_id TEXT NOT NULL,
    target_chapter_id TEXT,           -- 目标关联章节
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, WAITING_STEP, COMPLETED, FAILED, PAUSED
    current_step_index INTEGER DEFAULT 0,
    run_mode TEXT DEFAULT 'STEP',     -- AUTO, STEP
    context_bindings_json TEXT DEFAULT '{}',
    total_tokens INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Workflow Step Records (工作流步骤执行记录表)
CREATE TABLE IF NOT EXISTS workflow_step_records (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    step_index INTEGER NOT NULL,
    step_key TEXT NOT NULL,
    title TEXT NOT NULL,
    prompt_rendered TEXT DEFAULT '',
    input_values_json TEXT DEFAULT '{}',
    raw_output TEXT DEFAULT '',
    edited_output TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED
    error_message TEXT DEFAULT '',
    token_usage INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE
);

-- Voice Profiles (作者文风档案建模表)
CREATE TABLE IF NOT EXISTS voice_profiles (
    id TEXT PRIMARY KEY,
    novel_id TEXT, -- NULL 为全局通用文风
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    sample_text TEXT DEFAULT '',
    sentence_rhythm TEXT DEFAULT 'BALANCED', -- FAST_PACED (短促快节奏), BALANCED (抑扬顿挫), ELABORATE (铺陈华丽)
    vocabulary_tone TEXT DEFAULT 'CLASSICAL_MODERN', -- VERNACULAR (通俗直白), CLASSICAL_MODERN (典雅现代), COLD_REALISTIC (冷硬写实)
    pov_preference TEXT DEFAULT 'THIRD_LIMITED', -- THIRD_LIMITED, THIRD_OMNISCIENT, FIRST_PERSON
    sensory_ratio TEXT DEFAULT 'BALANCED', -- VISUAL_FOCUS, ACTION_FOCUS, EMOTIONAL_FOCUS, BALANCED
    custom_rules_json TEXT DEFAULT '[]', -- 负面禁用词、口癖偏好 JSON 数组
    is_active INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Create indexes for high performance
CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id);
CREATE INDEX IF NOT EXISTS idx_chapters_volume_id ON chapters(volume_id);
CREATE INDEX IF NOT EXISTS idx_chapter_versions_chapter_id ON chapter_versions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_characters_novel_id ON characters(novel_id);
CREATE INDEX IF NOT EXISTS idx_world_rules_novel_id ON world_rules(novel_id);
CREATE INDEX IF NOT EXISTS idx_canon_facts_novel_id ON canon_facts(novel_id);
CREATE INDEX IF NOT EXISTS idx_plot_threads_novel_id ON plot_threads(novel_id);
CREATE INDEX IF NOT EXISTS idx_story_arcs_novel_id ON story_arcs(novel_id);
CREATE INDEX IF NOT EXISTS idx_scenes_chapter_id ON scenes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_story_events_novel_id ON story_events(novel_id);
CREATE INDEX IF NOT EXISTS idx_review_findings_report_id ON review_findings(report_id);
CREATE INDEX IF NOT EXISTS idx_serialization_jobs_novel_id ON serialization_jobs(novel_id);
CREATE INDEX IF NOT EXISTS idx_parts_novel_id ON parts(novel_id);
CREATE INDEX IF NOT EXISTS idx_plot_beats_scene_id ON plot_beats(scene_id);
CREATE INDEX IF NOT EXISTS idx_paragraphs_chapter_id ON paragraphs(chapter_id);
CREATE INDEX IF NOT EXISTS idx_paragraphs_scene_id ON paragraphs(scene_id);
CREATE INDEX IF NOT EXISTS idx_character_arcs_novel ON character_arcs(novel_id);
CREATE INDEX IF NOT EXISTS idx_character_arcs_char ON character_arcs(character_id);
CREATE INDEX IF NOT EXISTS idx_parallel_threads_novel ON parallel_threads(novel_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_plot_assoc_unique ON plot_associations(relation_type, entity_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_plot_assoc_novel_rel ON plot_associations(novel_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_plot_assoc_target ON plot_associations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_plot_assoc_entity ON plot_associations(entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_novel ON workflow_templates(novel_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_novel ON workflow_runs(novel_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_records_run ON workflow_step_records(run_id, step_index);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_novel ON voice_profiles(novel_id);
"#;

pub const FTS5_SCHEMA: &str = r#"
CREATE VIRTUAL TABLE IF NOT EXISTS chapters_fts USING fts5(
    chapter_id UNINDEXED,
    novel_id UNINDEXED,
    title,
    content,
    tokenize='unicode61'
);

CREATE VIRTUAL TABLE IF NOT EXISTS canon_facts_fts USING fts5(
    fact_id UNINDEXED,
    novel_id UNINDEXED,
    subject_id,
    predicate,
    object_value,
    tokenize='unicode61'
);
"#;
