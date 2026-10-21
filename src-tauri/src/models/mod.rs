use serde::{Deserialize, Serialize};

// ==========================================
// V2.0 MULTI-LEVEL HIERARCHY MODELS
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HierarchyConfig {
    #[serde(default = "default_false")]
    pub enable_parts: bool,
    #[serde(default = "default_true")]
    pub enable_volumes: bool,
    #[serde(default = "default_true")]
    pub enable_scenes: bool,
    #[serde(default = "default_false")]
    pub enable_beats: bool,
}

fn default_true() -> bool {
    true
}
fn default_false() -> bool {
    false
}

impl Default for HierarchyConfig {
    fn default() -> Self {
        Self {
            enable_parts: false,
            enable_volumes: true,
            enable_scenes: true,
            enable_beats: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Series {
    pub id: String,
    pub title: String,
    pub description: String,
    pub genre_profile: String,
    pub world_definition: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSeriesInput {
    pub title: String,
    pub description: Option<String>,
    pub genre_profile: Option<String>,
    pub world_definition: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Part {
    pub id: String,
    pub novel_id: String,
    pub part_number: i64,
    pub title: String,
    pub summary: String,
    pub order_index: i64,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePartInput {
    pub novel_id: String,
    pub part_number: Option<i64>,
    pub title: String,
    pub summary: Option<String>,
    pub order_index: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Novel {
    pub id: String,
    pub title: String,
    pub description: String,
    pub genre_profile: String,
    pub language: String,
    pub writing_style: String,
    pub status: String,
    pub cover_url: Option<String>,
    pub series_id: Option<String>,
    pub series_order: Option<i64>,
    pub hierarchy_config: Option<String>,
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
    pub series_id: Option<String>,
    pub hierarchy_config: Option<HierarchyConfig>,
    pub cover_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateNovelInput {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub genre_profile: Option<String>,
    pub writing_style: Option<String>,
    pub cover_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Volume {
    pub id: String,
    pub novel_id: String,
    pub part_id: Option<String>,
    pub title: String,
    pub order_index: i64,
    pub summary: String,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateVolumeInput {
    pub novel_id: String,
    pub part_id: Option<String>,
    pub title: String,
    pub summary: Option<String>,
    pub order_index: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateVolumeInput {
    pub id: String,
    pub title: String,
    pub summary: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub id: String,
    pub novel_id: String,
    pub part_id: Option<String>,
    pub volume_id: Option<String>,
    pub chapter_number: i64,
    pub order_index: Option<i64>,
    pub title: String,
    pub chapter_goal: Option<String>,
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
    pub part_id: Option<String>,
    pub volume_id: Option<String>,
    pub chapter_number: Option<i64>,
    pub order_index: Option<i64>,
    pub title: String,
    pub chapter_goal: Option<String>,
    pub initial_content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateChapterTitleInput {
    pub id: String,
    pub title: String,
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
    #[serde(default)]
    pub gender: String,
    #[serde(default)]
    pub avatar_url: String,
    #[serde(default)]
    pub visual_summary: String,
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
    #[serde(default)]
    pub gender: Option<String>,
    #[serde(default)]
    pub avatar_url: Option<String>,
    #[serde(default)]
    pub visual_summary: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCharacterInput {
    pub id: String,
    pub name: String,
    pub aliases: Option<String>,
    pub profile: Option<String>,
    pub personality: Option<String>,
    pub background: Option<String>,
    pub motivation: Option<String>,
    pub status: Option<String>,
    #[serde(default)]
    pub gender: Option<String>,
    #[serde(default)]
    pub avatar_url: Option<String>,
    #[serde(default)]
    pub visual_summary: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzeCharacterAppearanceInput {
    pub image_url: String,
    pub character_name: Option<String>,
    pub gender: Option<String>,
    pub genre: Option<String>,
    pub provider_id: Option<String>,
    pub model_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzeCharacterAppearanceResult {
    pub visual_summary: String,
    pub appearance_tags: Vec<String>,
    pub facial_features: Option<String>,
    pub clothing_style: Option<String>,
    pub body_type: Option<String>,
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
pub struct UpdateWorldRuleInput {
    pub id: String,
    pub title: String,
    pub rule_content: String,
    pub authority_level: Option<String>,
    pub status: Option<String>,
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
pub struct UpdatePlotThreadInput {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub introduced_chapter_id: Option<String>,
    pub expected_resolution: Option<String>,
    pub resolved_chapter_id: Option<String>,
    pub status: Option<String>,
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
pub struct UpdateStoryPhaseInput {
    pub id: String,
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
    pub order_index: Option<i64>,
    pub title: Option<String>,
    pub scene_number: Option<i64>,
    pub objective: String,
    pub outline: String,
    pub pov_character_id: Option<String>,
    pub location_id: String,
    pub content: Option<String>,
    pub word_count: Option<i64>,
    pub time_anchor: Option<String>,
    pub conflict_target: Option<String>,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSceneInput {
    pub chapter_id: String,
    pub sequence: i64,
    pub order_index: Option<i64>,
    pub title: Option<String>,
    pub scene_number: Option<i64>,
    pub objective: String,
    pub outline: String,
    pub pov_character_id: Option<String>,
    pub location_id: Option<String>,
    pub content: Option<String>,
    pub time_anchor: Option<String>,
    pub conflict_target: Option<String>,
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

// --- PHASE 6 & 7: PUBLISHING & DIAGNOSTICS ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseHealthReport {
    pub db_path: String,
    pub db_size_bytes: u64,
    pub integrity_status: String,
    pub wal_checkpoint: String,
    pub total_novels: i64,
    pub total_chapters: i64,
    pub total_versions: i64,
    pub total_characters: i64,
    pub total_world_rules: i64,
    pub total_canon_facts: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NovelArchive {
    pub novel: Novel,
    pub chapters: Vec<Chapter>,
    pub characters: Vec<Character>,
    pub character_relationships: Vec<CharacterRelationship>,
    pub character_states: Vec<CharacterStateEvent>,
    pub world_rules: Vec<WorldRule>,
    pub canon_facts: Vec<CanonFact>,
    pub plot_threads: Vec<PlotThread>,
    pub story_phases: Vec<StoryPhase>,
    pub story_arcs: Vec<StoryArc>,
    pub exported_at: i64,
    pub version: String,
}

// ==========================================
// V2.0 INDEPENDENT PLOT SYSTEM & HIERARCHY OPERATIONS
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlotBeat {
    pub id: String,
    pub scene_id: String,
    pub beat_number: i64,
    pub beat_type: String, // ACTION, DIALOGUE, EMOTION, TWIST, REVELATION, HOOK, FORESHADOW
    pub title: String,
    pub description: String,
    pub emotional_shift: String,
    pub characters_present: String,
    pub order_index: i64,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePlotBeatInput {
    pub scene_id: String,
    pub beat_number: Option<i64>,
    pub beat_type: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub emotional_shift: Option<String>,
    pub characters_present: Option<String>,
    pub order_index: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Paragraph {
    pub id: String,
    pub chapter_id: String,
    pub scene_id: Option<String>,
    pub beat_id: Option<String>,
    pub paragraph_index: i64,
    pub paragraph_type: String,
    pub content: String,
    pub character_speaker_id: Option<String>,
    pub word_count: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateParagraphInput {
    pub chapter_id: String,
    pub scene_id: Option<String>,
    pub beat_id: Option<String>,
    pub paragraph_index: i64,
    pub paragraph_type: Option<String>,
    pub content: String,
    pub character_speaker_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterArc {
    pub id: String,
    pub novel_id: String,
    pub character_id: String,
    pub title: String,
    pub stage_from: String,
    pub stage_to: String,
    pub current_stage: String,
    pub internal_conflict: String,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCharacterArcInput {
    pub novel_id: String,
    pub character_id: String,
    pub title: String,
    pub stage_from: Option<String>,
    pub stage_to: Option<String>,
    pub current_stage: Option<String>,
    pub internal_conflict: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParallelThread {
    pub id: String,
    pub novel_id: String,
    pub title: String,
    pub pov_character_id: Option<String>,
    pub thread_color: String,
    pub summary: String,
    pub convergence_target: String,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateParallelThreadInput {
    pub novel_id: String,
    pub title: String,
    pub pov_character_id: Option<String>,
    pub thread_color: Option<String>,
    pub summary: Option<String>,
    pub convergence_target: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlotAssociation {
    pub id: String,
    pub novel_id: String,
    pub relation_type: String, // MAIN_PLOT, SUBPLOT, STORY_ARC, CHARACTER_ARC, FORESHADOWING, TIMELINE_EVENT, PARALLEL_THREAD
    pub entity_id: String,
    pub target_type: String, // PART, VOLUME, CHAPTER, SCENE, BEAT
    pub target_id: String,
    pub role_in_target: String, // INTRODUCES, PROGRESSES, CLIMAX, RESOLVES, FORESHADOWS, MENTIONS
    pub notes: String,
    pub weight: i64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePlotAssociationInput {
    pub novel_id: String,
    pub relation_type: String,
    pub entity_id: String,
    pub target_type: String,
    pub target_id: String,
    pub role_in_target: Option<String>,
    pub notes: Option<String>,
    pub weight: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlotAssociationView {
    pub association: PlotAssociation,
    pub entity_title: String,
    pub target_title: String,
}

// Lifecycle and Structure Operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveNodeInput {
    pub node_type: String, // 'CHAPTER' | 'SCENE' | 'BEAT' | 'VOLUME'
    pub node_id: String,
    pub new_parent_id: Option<String>,
    pub new_order: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplitChapterInput {
    pub chapter_id: String,
    pub split_type: String, // 'CONTENT_OFFSET' | 'SCENE_INDEX' | 'PARAGRAPH_INDEX'
    pub split_point: i64,
    pub new_chapter_title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplitSceneInput {
    pub scene_id: String,
    pub split_beat_index: i64,
    pub new_scene_title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeChaptersInput {
    pub source_chapter_id: String,
    pub target_chapter_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeScenesInput {
    pub source_scene_id: String,
    pub target_scene_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenumberHierarchyInput {
    pub novel_id: String,
    pub per_volume_chapter_numbering: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentTreeNode {
    pub id: String,
    pub node_type: String, // SERIES, NOVEL, PART, VOLUME, CHAPTER, SCENE, BEAT
    pub title: String,
    pub number: i64,
    pub order_index: i64,
    pub parent_id: Option<String>,
    pub word_count: i64,
    pub status: String,
    pub goal_or_summary: String,
    pub associated_plot_count: i64,
    pub children: Vec<ContentTreeNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NovelContentTree {
    pub novel_id: String,
    pub hierarchy_config: HierarchyConfig,
    pub root_nodes: Vec<ContentTreeNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HierarchicalCreationContext {
    pub novel_id: String,
    pub chapter_id: String,
    pub scene_id: Option<String>,
    pub series_summary: Option<String>,
    pub part_title: Option<String>,
    pub part_goal: Option<String>,
    pub volume_title: Option<String>,
    pub volume_goal: Option<String>,
    pub chapter_title: String,
    pub chapter_number: i64,
    pub chapter_goal: String,
    pub scene_title: Option<String>,
    pub scene_objective: Option<String>,
    pub scene_beats: Vec<PlotBeat>,
    pub associated_main_lines: Vec<String>,
    pub associated_subplots: Vec<String>,
    pub associated_story_arcs: Vec<String>,
    pub associated_character_arcs: Vec<String>,
    pub active_foreshadowings: Vec<String>,
    pub parallel_threads: Vec<String>,
    pub recent_timeline_events: Vec<String>,
    pub l3_canon_rules: Vec<String>,
    pub l3_active_character_profiles: Vec<String>,
    pub formatted_system_prompt: String,
}

// ==========================================
// V2.3 WORKFLOW ENGINE & TOOLBOX MODELS
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowTemplate {
    pub id: String,
    pub novel_id: Option<String>,
    pub name: String,
    pub description: String,
    pub category: String, // general, fantasy, urban, scifi, mystery
    pub steps_json: String,
    pub is_builtin: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveWorkflowTemplateInput {
    pub id: Option<String>,
    pub novel_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub steps_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowRun {
    pub id: String,
    pub template_id: String,
    pub novel_id: String,
    pub target_chapter_id: Option<String>,
    pub status: String, // PENDING, RUNNING, WAITING_STEP, COMPLETED, FAILED, PAUSED
    pub current_step_index: i64,
    pub run_mode: String, // AUTO, STEP
    pub context_bindings_json: String,
    pub total_tokens: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkflowRunInput {
    pub template_id: String,
    pub novel_id: String,
    pub target_chapter_id: Option<String>,
    pub run_mode: Option<String>,
    pub context_bindings_json: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStepRecord {
    pub id: String,
    pub run_id: String,
    pub step_index: i64,
    pub step_key: String,
    pub title: String,
    pub prompt_rendered: String,
    pub input_values_json: String,
    pub raw_output: String,
    pub edited_output: String,
    pub status: String, // PENDING, RUNNING, COMPLETED, FAILED
    pub error_message: String,
    pub token_usage: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvanceWorkflowStepInput {
    pub run_id: String,
    pub step_index: i64,
    pub input_values_json: Option<String>,
    pub auto_advance_next: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateWorkflowStepOutputInput {
    pub step_record_id: String,
    pub edited_output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowRunDetails {
    pub run: WorkflowRun,
    pub template: WorkflowTemplate,
    pub steps: Vec<WorkflowStepRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteToolboxActionInput {
    pub novel_id: String,
    pub action_type: String, // name, intro, premise, cheat, world_law, gold_opening, chapter_outline, dialogue_polish
    pub chapter_id: Option<String>,
    pub custom_input: Option<String>,
    pub character_ids: Option<Vec<String>>,
    pub world_rule_ids: Option<Vec<String>>,
    pub include_prev_chapter: Option<bool>,
    pub include_memo: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteToolboxActionResult {
    pub action_type: String,
    pub system_prompt: String,
    pub user_prompt: String,
    pub target_destination: String, // insert_editor, save_as_character, save_as_rule, save_as_chapter
    pub assembled_context_summary: String,
}

// ==========================================
// V2.3.1 VOICE PROFILES & REVIEW ARBITRATION
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceProfile {
    pub id: String,
    pub novel_id: Option<String>,
    pub name: String,
    pub description: String,
    pub sample_text: String,
    pub sentence_rhythm: String, // FAST_PACED, BALANCED, ELABORATE
    pub vocabulary_tone: String, // VERNACULAR, CLASSICAL_MODERN, COLD_REALISTIC
    pub pov_preference: String, // THIRD_LIMITED, THIRD_OMNISCIENT, FIRST_PERSON
    pub sensory_ratio: String, // VISUAL_FOCUS, ACTION_FOCUS, EMOTIONAL_FOCUS, BALANCED
    pub custom_rules_json: String,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveVoiceProfileInput {
    pub id: Option<String>,
    pub novel_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub sample_text: Option<String>,
    pub sentence_rhythm: Option<String>,
    pub vocabulary_tone: Option<String>,
    pub pov_preference: Option<String>,
    pub sensory_ratio: Option<String>,
    pub custom_rules_json: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateFindingRepairInput {
    pub finding_id: String,
    pub chapter_id: String,
    pub custom_instruction: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FindingRepairResult {
    pub finding_id: String,
    pub original_quote: String,
    pub repaired_text: String,
    pub explanation: String,
}

// ==========================================
// V2.4 MULTI-MODEL ARENA (双模比稿竞技场)
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelArenaRun {
    pub id: String,
    pub novel_id: String,
    pub chapter_id: Option<String>,
    pub prompt: String,
    pub model_a_provider: String,
    pub model_a_name: String,
    pub model_a_output: String,
    pub model_a_duration_ms: i64,
    pub model_a_tokens: i64,
    pub model_b_provider: String,
    pub model_b_name: String,
    pub model_b_output: String,
    pub model_b_duration_ms: i64,
    pub model_b_tokens: i64,
    pub winner_slot: String, // "A", "B", "TIE", "MERGED", "NONE"
    pub is_blind: bool,
    pub merged_output: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveModelArenaRunInput {
    pub id: Option<String>,
    pub novel_id: String,
    pub chapter_id: Option<String>,
    pub prompt: String,
    pub model_a_provider: String,
    pub model_a_name: String,
    pub model_a_output: String,
    pub model_a_duration_ms: i64,
    pub model_a_tokens: i64,
    pub model_b_provider: String,
    pub model_b_name: String,
    pub model_b_output: String,
    pub model_b_duration_ms: i64,
    pub model_b_tokens: i64,
    pub winner_slot: Option<String>,
    pub is_blind: Option<bool>,
    pub merged_output: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArenaStreamChunkPayload {
    pub session_id: String,
    pub slot: String, // "A" or "B"
    pub chunk: String,
    pub is_done: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteArenaDuelInput {
    pub session_id: String,
    pub novel_id: String,
    pub chapter_id: Option<String>,
    pub system_prompt: String,
    pub user_prompt: String,
    pub slot_a_provider_id: Option<String>,
    pub slot_a_model: Option<String>,
    pub slot_a_temperature: Option<f32>,
    pub slot_b_provider_id: Option<String>,
    pub slot_b_model: Option<String>,
    pub slot_b_temperature: Option<f32>,
    pub max_tokens: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArenaDuelResult {
    pub session_id: String,
    pub slot_a_output: String,
    pub slot_a_duration_ms: i64,
    pub slot_b_output: String,
    pub slot_b_duration_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeArenaOutputsInput {
    pub novel_id: String,
    pub prompt: String,
    pub output_a: String,
    pub output_b: String,
    pub merge_focus: Option<String>,
}

// ==========================================
// V2.5.1 AI PROMPT OPTIMIZER MODELS
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizeWritingPromptInput {
    pub novel_id: Option<String>,
    pub chapter_id: Option<String>,
    pub raw_prompt: String,
    pub target_length: Option<i64>,
    pub optimization_angle: Option<String>,
    pub style_mode: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizeWritingPromptResult {
    pub original_prompt: String,
    pub optimized_prompt: String,
    pub enhancement_points: Vec<String>,
    pub suggested_hooks: Option<String>,
    pub suggested_tags: Vec<String>,
}

// ==========================================
// V3.3.0 AGENTIC HEADLESS EVALUATION & PROPOSAL MODELS
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClicheMatch {
    pub rule_key: String,
    pub label: String,
    pub matched_text: String,
    pub excerpt: String,
    pub suggestion: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsistencyIssue {
    pub issue_type: String, // DECEASED_CHARACTER_ACTION, SECLUDED_CHARACTER, UNRESOLVED_THREAD, WORD_COUNT_ANOMALY
    pub severity: String,   // CRITICAL, WARNING, INFO
    pub title: String,
    pub description: String,
    pub target_entity: Option<String>,
    pub suggestion: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityProposal {
    pub entity_type: String, // CHARACTER
    pub name: String,
    pub frequency: usize,
    pub context_sample: String,
    pub suggested_action: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationReport {
    pub novel_id: String,
    pub chapter_id: Option<String>,
    pub word_count: usize,
    pub reading_time_minutes: usize,
    pub humanizer_score: u32,
    pub verdict: String, // PASS, NEEDS_REVISION, CRITICAL_ISSUES
    pub cliche_matches: Vec<ClicheMatch>,
    pub consistency_issues: Vec<ConsistencyIssue>,
    pub entity_proposals: Vec<EntityProposal>,
    pub actionable_summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluateChapterInput {
    pub novel_id: String,
    pub chapter_id: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterProposal {
    pub version_id: String,
    pub chapter_id: String,
    pub version_number: i64,
    pub word_count: i64,
    pub source_type: String,
    pub proposal_summary: Option<String>,
    pub content_snippet: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateChapterProposalInput {
    pub novel_id: String,
    pub chapter_id: String,
    pub content: String,
    pub proposal_summary: Option<String>,
    pub reasoning_trace: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcceptChapterProposalInput {
    pub novel_id: String,
    pub chapter_id: String,
    pub version_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackChapterVersionInput {
    pub novel_id: String,
    pub chapter_id: String,
    pub target_version_id: String,
    pub cascade_memory: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackResult {
    pub chapter_id: String,
    pub restored_version_id: String,
    pub restored_version_number: i64,
    pub word_count: i64,
    pub invalidated_facts_count: usize,
    pub message: String,
}

// ==========================================
// V3.4.0 CHARACTER DIALOGUE SANDBOX (角色对戏演武场)
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterActorConfig {
    pub character_id: String,
    pub character_name: String,
    pub provider_id: Option<String>,
    pub model_name: Option<String>,
    pub private_motivation: String,
    pub private_secret: String,
    pub voice_quirks: Option<String>,
    pub order_index: i64,
    #[serde(default)]
    pub is_human: Option<bool>,
    #[serde(default)]
    pub avatar_url: Option<String>,
    #[serde(default)]
    pub visual_summary: Option<String>,
    #[serde(default)]
    pub gender: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DialogueRoundRecord {
    pub round_index: i64,
    pub speaker_id: String,
    pub speaker_name: String,
    pub inner_thought: String,      // 私密心理独白 (对其他角色完全屏蔽)
    #[serde(default)]
    pub subtext: Option<String>,    // 潜台词/弦外之音
    pub character_action: String,   // 动作与微表情
    pub speech: String,             // 台词
    pub is_narrator_event: bool,    // 是否为旁白/环境突发事件
    pub is_edited_by_user: bool,    // 是否经过作者原地编辑
    #[serde(default)]
    pub ooc_warning: Option<String>, // 人设偏离/崩坏智能诊断预警
    #[serde(default)]
    pub branch_id: Option<String>,  // 所属推演分支 ID ('main' 或自定义分支)
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterSandboxSession {
    pub id: String,
    pub novel_id: String,
    pub chapter_id: Option<String>,
    pub scene_id: Option<String>,
    pub title: String,
    pub scene_setting: String,
    pub scene_goal: String,
    pub characters_config_json: String,
    pub dialogue_history_json: String,
    pub status: String,
    pub synthesized_prose: Option<String>,
    #[serde(default)]
    pub branches_json: Option<String>, // 树状分支推演列表 JSON
    #[serde(default)]
    pub active_branch_id: Option<String>, // 当前活跃分支 ID (默认 'main')
    #[serde(default)]
    pub inspiration_notes_json: Option<String>, // 捕获并提炼的灵感火花与金句列表 JSON
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSandboxSessionInput {
    pub novel_id: String,
    pub chapter_id: Option<String>,
    pub scene_id: Option<String>,
    pub title: String,
    pub scene_setting: String,
    pub scene_goal: String,
    pub characters_config: Vec<CharacterActorConfig>,
    pub branches_json: Option<String>,
    pub active_branch_id: Option<String>,
    pub inspiration_notes_json: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSandboxSessionInput {
    pub id: String,
    pub title: Option<String>,
    pub scene_setting: Option<String>,
    pub scene_goal: Option<String>,
    pub characters_config: Option<Vec<CharacterActorConfig>>,
    pub dialogue_history: Option<Vec<DialogueRoundRecord>>,
    pub status: Option<String>,
    pub synthesized_prose: Option<String>,
    pub branches_json: Option<String>,
    pub active_branch_id: Option<String>,
    pub inspiration_notes_json: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteSandboxStepInput {
    pub session_id: String,
    pub target_speaker_id: Option<String>, // 若指定则由该角色发言，否则按顺序轮换
    pub narrator_intervention: Option<String>, // 作者作为旁白插入的环境变故/台词
    pub temperature: Option<f32>,
    #[serde(default)]
    pub action_guidance: Option<String>, // 作者指定该角色的核心行动路线/应对策略
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteSandboxStepResult {
    pub round: DialogueRoundRecord,
    pub next_recommended_speaker_id: Option<String>,
    pub is_completed: bool,
    pub total_rounds: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterActionOption {
    pub id: String,
    pub label: String,          // 策略标签，如 "隐忍探底" / "寸步不让" / "借刀破局"
    pub stance: String,         // 策略立场描述
    pub inner_motive: String,   // 内心暗流与动机算盘
    pub action_preview: String, // 肢体微动作预判
    pub speech_preview: String, // 话术策略与示例台词
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProbeCharacterActionsInput {
    pub session_id: String,
    pub target_speaker_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProbeCharacterActionsResult {
    pub session_id: String,
    pub speaker_id: String,
    pub speaker_name: String,
    pub options: Vec<CharacterActionOption>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DistillSandboxInspirationsInput {
    pub session_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DistillSandboxInspirationsResult {
    pub session_id: String,
    pub golden_quotes: Vec<String>,
    pub micro_actions: Vec<String>,
    pub psychological_insights: Vec<String>,
    pub plot_twists: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynthesizeSandboxProseInput {
    pub session_id: String,
    pub custom_guidance: Option<String>,
    pub pov_mode: Option<String>, // 'THIRD_LIMITED' | 'THIRD_OMNISCIENT'
    #[serde(default)]
    pub polishing_style: Option<String>, // 'CINEMATIC' | 'PSYCHOLOGICAL' | 'HARDCORE_TENSE'
    #[serde(default)]
    pub start_round_index: Option<usize>,
    #[serde(default)]
    pub end_round_index: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynthesizeSandboxProseResult {
    pub session_id: String,
    pub synthesized_prose: String,
    pub word_count: usize,
    pub duration_ms: i64,
}



