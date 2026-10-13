use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Novel {
    pub id: String,
    pub title: String,
    pub description: String,
    pub genre_profile: String,
    pub language: String,
    pub writing_style: String,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub chapter_count: Option<i64>,
    pub total_word_count: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNovelInput {
    pub title: String,
    pub description: Option<String>,
    pub genre_profile: Option<String>,
    pub language: Option<String>,
    pub writing_style: Option<String>,
    pub chapter_target_length: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Volume {
    pub id: String,
    pub novel_id: String,
    pub title: String,
    pub order_index: i64,
    pub summary: String,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub id: String,
    pub novel_id: String,
    pub volume_id: Option<String>,
    pub chapter_number: i64,
    pub title: String,
    pub status: String,
    pub active_version_id: Option<String>,
    pub word_count: i64,
    pub content: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateChapterInput {
    pub novel_id: String,
    pub volume_id: Option<String>,
    pub chapter_number: Option<i64>,
    pub title: String,
    pub initial_content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterVersion {
    pub id: String,
    pub chapter_id: String,
    pub version_number: i64,
    pub content: String,
    pub source_type: String,
    pub created_by: String,
    pub content_hash: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub id: String,
    pub novel_id: String,
    pub name: String,
    pub aliases: String,
    pub profile: String,
    pub personality: String,
    pub background: String,
    pub motivation: String,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCharacterInput {
    pub novel_id: String,
    pub name: String,
    pub aliases: Option<String>,
    pub profile: Option<String>,
    pub personality: Option<String>,
    pub background: Option<String>,
    pub motivation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldRule {
    pub id: String,
    pub novel_id: String,
    pub title: String,
    pub rule_content: String,
    pub authority_level: String,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorldRuleInput {
    pub novel_id: String,
    pub title: String,
    pub rule_content: String,
    pub authority_level: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlotThread {
    pub id: String,
    pub novel_id: String,
    pub title: String,
    pub description: String,
    pub introduced_chapter_id: Option<String>,
    pub expected_resolution: String,
    pub resolved_chapter_id: Option<String>,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePlotThreadInput {
    pub novel_id: String,
    pub title: String,
    pub description: Option<String>,
    pub introduced_chapter_id: Option<String>,
    pub expected_resolution: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiProvider {
    pub id: String,
    pub name: String,
    pub provider_type: String,
    pub base_url: String,
    pub api_key: String,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveProviderInput {
    pub id: Option<String>,
    pub name: String,
    pub provider_type: String,
    pub base_url: String,
    pub api_key: String,
    pub is_active: bool,
    pub models: Vec<AiModelInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiModel {
    pub id: String,
    pub provider_id: String,
    pub model_name: String,
    pub display_name: String,
    pub context_window: i64,
    pub max_output_tokens: i64,
    pub is_default: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiModelInput {
    pub id: Option<String>,
    pub model_name: String,
    pub display_name: String,
    pub context_window: Option<i64>,
    pub max_output_tokens: Option<i64>,
    pub is_default: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateStreamInput {
    pub novel_id: String,
    pub chapter_id: String,
    pub instruction: String,
    pub context_mode: Option<String>, // 'CONTINUE', 'POLISH', 'SCENE', 'OUTLINE'
    pub current_content: Option<String>,
    pub model_id: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChunkPayload {
    pub chapter_id: String,
    pub chunk: String,
    pub is_done: bool,
    pub error: Option<String>,
}

// --- PHASE 2: RELATIONSHIPS, PLOT ARCS, SCENES, EVENTS ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterRelationship {
    pub id: String,
    pub novel_id: String,
    pub source_character_id: String,
    pub target_character_id: String,
    pub relation_type: String,
    pub description: String,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCharacterRelationshipInput {
    pub novel_id: String,
    pub source_character_id: String,
    pub target_character_id: String,
    pub relation_type: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoryPhase {
    pub id: String,
    pub novel_id: String,
    pub title: String,
    pub order_index: i64,
    pub goal: String,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateStoryPhaseInput {
    pub novel_id: String,
    pub title: String,
    pub order_index: Option<i64>,
    pub goal: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoryArc {
    pub id: String,
    pub novel_id: String,
    pub phase_id: Option<String>,
    pub title: String,
    pub goal: String,
    pub description: String,
    pub status: String,
    pub start_chapter_id: Option<String>,
    pub planned_end: String,
    pub priority: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateStoryArcInput {
    pub novel_id: String,
    pub phase_id: Option<String>,
    pub title: String,
    pub goal: Option<String>,
    pub description: Option<String>,
    pub priority: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
    pub id: String,
    pub chapter_id: String,
    pub sequence: i64,
    pub objective: String,
    pub outline: String,
    pub pov_character_id: Option<String>,
    pub location_id: String,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSceneInput {
    pub chapter_id: String,
    pub sequence: i64,
    pub objective: String,
    pub outline: String,
    pub pov_character_id: Option<String>,
    pub location_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoryEvent {
    pub id: String,
    pub novel_id: String,
    pub title: String,
    pub description: String,
    pub story_time: String,
    pub source_chapter_id: Option<String>,
    pub cause_event_id: Option<String>,
    pub location_id: String,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateStoryEventInput {
    pub novel_id: String,
    pub title: String,
    pub description: Option<String>,
    pub story_time: Option<String>,
    pub source_chapter_id: Option<String>,
}

// --- PHASE 3: REVIEW REPORTS & MULTI-AGENT ORCHESTRATION ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewReport {
    pub id: String,
    pub chapter_id: String,
    pub version_number: i64,
    pub score: i64,
    pub summary: String,
    pub created_at: i64,
    pub findings: Vec<ReviewFinding>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewFinding {
    pub id: String,
    pub report_id: String,
    pub severity: String, // CRITICAL, MAJOR, MINOR, SUGGESTION
    pub category: String, // CONTINUITY, CHARACTER, WORLD_RULE, TIMELINE, STYLE
    pub title: String,
    pub description: String,
    pub evidence_quote: String,
    pub suggestion: String,
    pub status: String, // OPEN, RESOLVED, DISMISSED
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContinuityAuditFinding {
    pub severity: String,
    pub category: String,
    pub title: String,
    pub description: String,
    pub evidence_quote: Option<String>,
    pub suggestion: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContinuityAuditResponse {
    pub score: i64,
    pub summary: String,
    pub findings: Vec<ContinuityAuditFinding>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StyleRevisionItem {
    pub original_text: String,
    pub revised_text: String,
    pub rationale: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StylePolishResponse {
    pub summary: String,
    pub revisions: Vec<StyleRevisionItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborativeWorkflowInput {
    pub novel_id: String,
    pub chapter_id: String,
    pub chapter_goal: String,
    pub target_word_count: Option<i64>,
    pub skip_audit: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborativeWorkflowResult {
    pub chapter_id: String,
    pub planned_scenes: Vec<Scene>,
    pub generated_draft: String,
    pub review_report: Option<ReviewReport>,
    pub message: String,
}

// --- PHASE 4: LAYERED MEMORY ENGINE (L0~L4) ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanonFact {
    pub id: String,
    pub novel_id: String,
    pub subject_id: String,
    pub predicate: String,
    pub object_value: String,
    pub truth_scope: String, // GLOBAL, LOCAL, CONTINGENT
    pub authority_level: String, // CONFIRMED_PLOT, CANON, HYPOTHESIS
    pub status: String,
    pub effective_from: String,
    pub effective_until: String,
    pub source_chapter_id: Option<String>,
    pub version: i64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCanonFactInput {
    pub novel_id: String,
    pub subject_id: Option<String>,
    pub predicate: String,
    pub object_value: String,
    pub truth_scope: Option<String>,
    pub authority_level: Option<String>,
    pub source_chapter_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterStateEvent {
    pub id: String,
    pub character_id: String,
    pub source_chapter_id: Option<String>,
    pub effective_time: String,
    pub field_name: String, // 境界/法宝/伤病/心理状态/已知秘密
    pub previous_value: String,
    pub new_value: String,
    pub status: String, // CONFIRMED, REVERTED
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCharacterStateEventInput {
    pub character_id: String,
    pub source_chapter_id: Option<String>,
    pub effective_time: Option<String>,
    pub field_name: String,
    pub previous_value: Option<String>,
    pub new_value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryContextPack {
    pub working_memory_l0: String,
    pub short_term_l1: Vec<String>,
    pub arc_memory_l2: Vec<String>,
    pub canon_rules_l3: Vec<String>,
    pub character_profiles_l3: Vec<String>,
    pub retrieved_history_l4: Vec<String>,
    pub assembled_system_prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractChapterMemoryResult {
    pub chapter_id: String,
    pub chapter_summary: String,
    pub character_state_events: Vec<CharacterStateEvent>,
    pub timeline_events: Vec<StoryEvent>,
    pub identified_threads: Vec<PlotThread>,
    pub new_canon_facts: Vec<CanonFact>,
    pub message: String,
}

// --- PHASE 5: SERIALIZATION ENGINE ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializationJob {
    pub id: String,
    pub novel_id: String,
    pub status: String, // PENDING, RUNNING, PAUSED, COMPLETED, CANCELLED, FAILED
    pub target_chapters_count: i64,
    pub completed_chapters_count: i64,
    pub current_chapter_id: Option<String>,
    pub auto_approve: bool,
    pub budget_tokens: i64,
    pub used_tokens: i64,
    pub config: String,
    pub error_message: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartSerializationJobInput {
    pub novel_id: String,
    pub chapters_count: i64,
    pub chapter_target_words: Option<i64>,
    pub auto_approve: Option<bool>,
    pub budget_tokens: Option<i64>,
}


