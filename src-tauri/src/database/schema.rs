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
