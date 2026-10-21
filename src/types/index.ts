export interface HierarchyConfig {
  enable_parts: boolean;
  enable_volumes: boolean;
  enable_scenes: boolean;
  enable_plot_beats: boolean;
  default_planning_level: 'CHAPTER' | 'SCENE' | 'PLOT_BEAT';
  default_publishing_level: 'VOLUME' | 'CHAPTER';
}

export interface Novel {
  id: string;
  title: string;
  description: string;
  genre_profile: string;
  language: string;
  writing_style: string;
  status: string;
  cover_url?: string;
  series_id?: string;
  hierarchy_config?: HierarchyConfig;
  created_at: number;
  updated_at: number;
  chapter_count?: number;
  total_word_count?: number;
  chapter_target_length?: number;
}

export interface Series {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  created_at: number;
  updated_at: number;
}

export interface Part {
  id: string;
  novel_id: string;
  title: string;
  description?: string;
  sequence: number;
  created_at: number;
}

export interface Volume {
  id: string;
  novel_id: string;
  part_id?: string;
  title: string;
  description?: string;
  summary?: string;
  sequence?: number;
  order_index?: number;
  status: string;
  created_at: number;
}

export interface Chapter {
  id: string;
  novel_id: string;
  part_id?: string;
  volume_id?: string;
  chapter_number: number;
  sequence?: number;
  title: string;
  chapter_goal?: string;
  status: string;
  active_version_id?: string;
  word_count: number;
  content?: string;
  created_at: number;
  updated_at: number;
}

export interface ChapterVersion {
  id: string;
  chapter_id: string;
  version_number: number;
  content: string;
  source_type: string;
  created_by: string;
  content_hash: string;
  created_at: number;
}

export interface Character {
  id: string;
  novel_id: string;
  name: string;
  aliases: string;
  profile: string;
  personality: string;
  background: string;
  motivation: string;
  gender?: string;
  avatar_url?: string;
  visual_summary?: string;
  status: string;
  created_at: number;
  updated_at: number;
}

export interface AnalyzeCharacterAppearanceInput {
  image_url: string;
  character_name?: string;
  gender?: string;
  genre?: string;
  provider_id?: string;
  model_name?: string;
}

export interface AnalyzeCharacterAppearanceResult {
  visual_summary: string;
  appearance_tags: string[];
  facial_features?: string;
  clothing_style?: string;
  body_type?: string;
}

export interface WorldRule {
  id: string;
  novel_id: string;
  title: string;
  rule_content: string;
  authority_level: 'CANON' | 'EXTENDED' | 'HYPOTHESIS' | 'DEPRECATED';
  status: string;
  created_at: number;
}

export interface PlotThread {
  id: string;
  novel_id: string;
  title: string;
  description: string;
  introduced_chapter_id?: string;
  expected_resolution: string;
  resolved_chapter_id?: string;
  status: 'PLANTED' | 'DEVELOPING' | 'READY_TO_RESOLVE' | 'RESOLVED' | 'ABANDONED';
  created_at: number;
  updated_at: number;
}

export interface AiProvider {
  id: string;
  name: string;
  provider_type: string;
  base_url: string;
  api_key: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface AiModel {
  id: string;
  provider_id: string;
  model_name: string;
  display_name: string;
  context_window: number;
  max_output_tokens: number;
  is_default: boolean;
  created_at: number;
}

export interface ConnectionTestResult {
  success: boolean;
  latency_ms: number;
  message: string;
  models_found: string[];
}

export interface StreamChunkPayload {
  chapter_id: string;
  chunk: string;
  is_done: boolean;
  error?: string;
}

// --- Phase 2: Relationships, Story Arcs, Scenes, Events ---

export interface CharacterRelationship {
  id: string;
  novel_id: string;
  source_character_id: string;
  target_character_id: string;
  relation_type: string;
  description: string;
  status: string;
  created_at: number;
}

export interface StoryPhase {
  id: string;
  novel_id: string;
  title: string;
  order_index: number;
  goal: string;
  status: string;
  created_at: number;
}

export interface StoryArc {
  id: string;
  novel_id: string;
  phase_id?: string;
  title: string;
  goal: string;
  description: string;
  status: 'PLANNING' | 'DEVELOPING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  start_chapter_id?: string;
  planned_end: string;
  priority: 'MAIN' | 'SUB' | 'CHARACTER' | 'WORLD';
  created_at: number;
}

export interface Scene {
  id: string;
  chapter_id: string;
  sequence: number;
  objective: string;
  outline: string;
  pov_character_id?: string;
  location_id: string;
  status: string;
  created_at: number;
}

export interface StoryEvent {
  id: string;
  novel_id: string;
  title: string;
  description: string;
  story_time: string;
  source_chapter_id?: string;
  cause_event_id?: string;
  location_id: string;
  status: string;
  created_at: number;
}

// --- Phase 3: Review Reports & Orchestrator Results ---

export interface ReviewFinding {
  id: string;
  report_id: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'SUGGESTION';
  category: 'CONTINUITY' | 'CHARACTER' | 'WORLD_RULE' | 'TIMELINE' | 'STYLE';
  title: string;
  description: string;
  evidence_quote: string;
  suggestion: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  created_at: number;
}

export interface ReviewReport {
  id: string;
  chapter_id: string;
  version_number: number;
  score: number;
  summary: string;
  created_at: number;
  findings: ReviewFinding[];
}

export interface StyleRevisionItem {
  original_text: string;
  revised_text: string;
  rationale: string;
}

export interface StylePolishResponse {
  summary: string;
  revisions: StyleRevisionItem[];
}

export interface CollaborativeWorkflowResult {
  chapter_id: string;
  planned_scenes: Scene[];
  generated_draft: string;
  review_report?: ReviewReport;
  message: string;
}

// --- Phase 4: Layered Memory Engine (L0~L4) ---

export interface CanonFact {
  id: string;
  novel_id: string;
  subject_id: string;
  predicate: string;
  object_value: string;
  truth_scope: 'GLOBAL' | 'LOCAL' | 'CONTINGENT';
  authority_level: 'CONFIRMED_PLOT' | 'CANON' | 'HYPOTHESIS';
  status: string;
  effective_from: string;
  effective_until: string;
  source_chapter_id?: string;
  version: number;
  created_at: number;
}

export interface CharacterStateEvent {
  id: string;
  character_id: string;
  source_chapter_id?: string;
  effective_time: string;
  field_name: string;
  previous_value: string;
  new_value: string;
  status: string;
  created_at: number;
}

export interface MemoryContextPack {
  working_memory_l0: string;
  short_term_l1: string[];
  arc_memory_l2: string[];
  canon_rules_l3: string[];
  character_profiles_l3: string[];
  retrieved_history_l4: string[];
  assembled_system_prompt: string;
}

export interface ExtractChapterMemoryResult {
  chapter_id: string;
  chapter_summary: string;
  character_state_events: CharacterStateEvent[];
  timeline_events: StoryEvent[];
  identified_threads: PlotThread[];
  new_canon_facts: CanonFact[];
  message: string;
}

// --- Phase 5: Serialization Engine ---

export interface SerializationJob {
  id: string;
  novel_id: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'WAITING_REVIEW' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  target_chapters_count: number;
  completed_chapters_count: number;
  current_chapter_id?: string;
  auto_approve: boolean;
  budget_tokens: number;
  used_tokens: number;
  config: string;
  error_message?: string;
  created_at: number;
  updated_at: number;
}

export interface StartSerializationJobInput {
  novel_id: string;
  chapters_count: number;
  chapter_target_words?: number;
  auto_approve?: boolean;
  budget_tokens?: number;
}

// --- Phase 6 & 7: Publishing & Diagnostics ---

export interface DatabaseHealthReport {
  db_path: string;
  db_size_bytes: number;
  integrity_status: string;
  wal_checkpoint: string;
  total_novels: number;
  total_chapters: number;
  total_versions: number;
  total_characters: number;
  total_world_rules: number;
  total_canon_facts: number;
}

// --- V2.0 Independent Plot Relations & Hierarchy Lifecycle ---

export interface PlotBeat {
  id: string;
  scene_id: string;
  beat_number: number;
  beat_type: 'ACTION' | 'DIALOGUE' | 'EMOTION' | 'TWIST' | 'REVELATION' | 'HOOK' | 'FORESHADOW' | 'CRISIS';
  title: string;
  description: string;
  emotional_shift: string;
  characters_present: string;
  order_index: number;
  status: 'PENDING' | 'DRAFTED' | 'COMPLETED' | 'CANCELLED';
  created_at: number;
}

export interface CreatePlotBeatInput {
  scene_id: string;
  beat_number?: number;
  beat_type?: string;
  title: string;
  description?: string;
  emotional_shift?: string;
  characters_present?: string;
  order_index?: number;
}

export interface CharacterArc {
  id: string;
  novel_id: string;
  character_id: string;
  title: string;
  stage_from: string;
  stage_to: string;
  current_stage: string;
  internal_conflict: string;
  status: 'ACTIVE' | 'RESOLVED' | 'PAUSED';
  created_at: number;
  updated_at: number;
}

export interface CreateCharacterArcInput {
  novel_id: string;
  character_id: string;
  title: string;
  stage_from?: string;
  stage_to?: string;
  current_stage?: string;
  internal_conflict?: string;
}

export interface ParallelThread {
  id: string;
  novel_id: string;
  title: string;
  pov_character_id?: string;
  thread_color: string;
  summary: string;
  convergence_target: string;
  status: 'ACTIVE' | 'CONVERGED' | 'ABANDONED';
  created_at: number;
  updated_at: number;
}

export interface CreateParallelThreadInput {
  novel_id: string;
  title: string;
  pov_character_id?: string;
  thread_color?: string;
  summary?: string;
  convergence_target?: string;
}

export type PlotRelationType =
  | 'MAIN_PLOT'
  | 'SUBPLOT'
  | 'STORY_ARC'
  | 'CHARACTER_ARC'
  | 'FORESHADOWING'
  | 'TIMELINE_EVENT'
  | 'PARALLEL_THREAD';

export type HierarchyTargetType =
  | 'PART'
  | 'VOLUME'
  | 'CHAPTER'
  | 'SCENE'
  | 'BEAT';

export interface PlotAssociation {
  id: string;
  novel_id: string;
  relation_type: PlotRelationType;
  entity_id: string;
  target_type: HierarchyTargetType;
  target_id: string;
  role_in_target: string;
  notes: string;
  weight: number;
  created_at: number;
}

export interface CreatePlotAssociationInput {
  novel_id: string;
  relation_type: string;
  entity_id: string;
  target_type: string;
  target_id: string;
  role_in_target?: string;
  notes?: string;
  weight?: number;
}

export interface PlotAssociationView {
  association: PlotAssociation;
  entity_title: string;
  target_title: string;
}

export interface MoveNodeInput {
  node_type: 'PART' | 'VOLUME' | 'CHAPTER' | 'SCENE' | 'BEAT';
  node_id: string;
  new_parent_id?: string;
  new_order?: number;
}

export interface SplitChapterInput {
  chapter_id: string;
  split_type: 'CONTENT_OFFSET' | 'SCENE_INDEX' | 'PARAGRAPH_INDEX';
  split_point: number;
  new_chapter_title?: string;
}

export interface MergeChaptersInput {
  source_chapter_id: string;
  target_chapter_id: string;
}

export interface SplitSceneInput {
  scene_id: string;
  split_beat_index: number;
  new_scene_title?: string;
}

export interface MergeScenesInput {
  source_scene_id: string;
  target_scene_id: string;
}

export interface RenumberHierarchyInput {
  novel_id: string;
  per_volume_chapter_numbering?: boolean;
}

export interface ContentTreeNode {
  id: string;
  node_type: 'SERIES' | 'NOVEL' | 'PART' | 'VOLUME' | 'CHAPTER' | 'SCENE' | 'BEAT';
  title: string;
  number: number;
  order_index: number;
  parent_id?: string;
  word_count: number;
  status: string;
  goal_or_summary: string;
  associated_plot_count: number;
  children: ContentTreeNode[];
}

export interface NovelContentTree {
  novel_id: string;
  hierarchy_config: HierarchyConfig;
  root_nodes: ContentTreeNode[];
}

export interface HierarchicalCreationContext {
  novel_id: string;
  chapter_id: string;
  scene_id?: string;
  series_summary?: string;
  part_title?: string;
  part_goal?: string;
  volume_title?: string;
  volume_goal?: string;
  chapter_title: string;
  chapter_number: number;
  chapter_goal: string;
  scene_title?: string;
  scene_objective?: string;
  scene_beats: PlotBeat[];
  associated_main_lines: string[];
  associated_subplots: string[];
  associated_story_arcs: string[];
  associated_character_arcs: string[];
  active_foreshadowings: string[];
  parallel_threads: string[];
  recent_timeline_events: string[];
  l3_canon_rules: string[];
  l3_active_character_profiles: string[];
  formatted_system_prompt: string;
}

// ==========================================
// V2.3 WORKFLOW ENGINE & TOOLBOX TYPES
// ==========================================

export interface WorkflowStepConfig {
  step_key: string;
  title: string;
  agent_role: string;
  description?: string;
  prompt_template: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  novel_id?: string | null;
  name: string;
  description: string;
  category: string;
  steps_json: string;
  is_builtin: boolean;
  created_at: number;
  updated_at: number;
}

export interface SaveWorkflowTemplateInput {
  id?: string;
  novel_id?: string | null;
  name: string;
  description?: string;
  category?: string;
  steps_json: string;
}

export interface WorkflowRun {
  id: string;
  template_id: string;
  novel_id: string;
  target_chapter_id?: string | null;
  status: 'PENDING' | 'RUNNING' | 'WAITING_STEP' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  current_step_index: number;
  run_mode: 'AUTO' | 'STEP';
  context_bindings_json: string;
  total_tokens: number;
  created_at: number;
  updated_at: number;
}

export interface CreateWorkflowRunInput {
  template_id: string;
  novel_id: string;
  target_chapter_id?: string | null;
  run_mode?: 'AUTO' | 'STEP';
  context_bindings_json?: string;
}

export interface WorkflowStepRecord {
  id: string;
  run_id: string;
  step_index: number;
  step_key: string;
  title: string;
  prompt_rendered: string;
  input_values_json: string;
  raw_output: string;
  edited_output: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error_message: string;
  token_usage: number;
  created_at: number;
  updated_at: number;
}

export interface AdvanceWorkflowStepInput {
  run_id: string;
  step_index: number;
  input_values_json?: string;
  auto_advance_next?: boolean;
}

export interface UpdateWorkflowStepOutputInput {
  step_record_id: string;
  edited_output: string;
}

export interface WorkflowRunDetails {
  run: WorkflowRun;
  template: WorkflowTemplate;
  steps: WorkflowStepRecord[];
}

export type ToolboxActionType =
  | 'name'
  | 'intro'
  | 'premise'
  | 'cheat'
  | 'world_law'
  | 'gold_opening'
  | 'chapter_outline'
  | 'dialogue_polish'
  | 'humanizer_polish'
  | 'story_architect'
  | 'scene_dramaturge'
  | 'ending_forge'
  | 'cold_reader';

export interface ExecuteToolboxActionInput {
  novel_id: string;
  action_type: ToolboxActionType;
  chapter_id?: string | null;
  custom_input?: string | null;
  character_ids?: string[] | null;
  world_rule_ids?: string[] | null;
  include_prev_chapter?: boolean | null;
  include_memo?: boolean | null;
}

export interface ExecuteToolboxActionResult {
  action_type: string;
  system_prompt: string;
  user_prompt: string;
  target_destination: 'insert_editor' | 'save_as_character' | 'save_as_rule' | 'save_as_chapter';
  assembled_context_summary: string;
}

// ==========================================
// V2.3.1 VOICE PROFILES & FINDING REPAIR TYPES
// ==========================================

export interface VoiceProfile {
  id: string;
  novel_id?: string | null;
  name: string;
  description: string;
  sample_text: string;
  sentence_rhythm: string;
  vocabulary_tone: string;
  pov_preference: string;
  sensory_ratio: string;
  custom_rules_json: string;
  is_active: boolean;
  is_builtin: boolean;
  created_at: number;
  updated_at: number;
}

export interface SaveVoiceProfileInput {
  id?: string;
  novel_id?: string | null;
  name: string;
  description?: string;
  sample_text?: string;
  sentence_rhythm?: string;
  vocabulary_tone?: string;
  pov_preference?: string;
  sensory_ratio?: string;
  custom_rules_json?: string;
  is_active?: boolean;
}

export interface GenerateFindingRepairInput {
  novel_id: string;
  chapter_id: string;
  finding_id: string;
  custom_instructions?: string;
}

export interface FindingRepairResult {
  finding_id: string;
  finding_title: string;
  severity: string;
  original_quote: string;
  repair_suggestion: string;
  revised_text_draft: string;
  diff_summary: string;
  voice_profile_used: string;
}

// ==========================================
// V2.4 MULTI-MODEL ARENA (双模比稿竞技场)
// ==========================================

export interface ModelArenaRun {
  id: string;
  novel_id: string;
  chapter_id?: string | null;
  prompt: string;
  model_a_provider: string;
  model_a_name: string;
  model_a_output: string;
  model_a_duration_ms: number;
  model_a_tokens: number;
  model_b_provider: string;
  model_b_name: string;
  model_b_output: string;
  model_b_duration_ms: number;
  model_b_tokens: number;
  winner_slot: 'A' | 'B' | 'TIE' | 'MERGED' | 'NONE';
  is_blind: boolean;
  merged_output?: string;
  created_at: number;
}

export interface SaveModelArenaRunInput {
  id?: string;
  novel_id: string;
  chapter_id?: string | null;
  prompt: string;
  model_a_provider: string;
  model_a_name: string;
  model_a_output: string;
  model_a_duration_ms: number;
  model_a_tokens: number;
  model_b_provider: string;
  model_b_name: string;
  model_b_output: string;
  model_b_duration_ms: number;
  model_b_tokens: number;
  winner_slot?: 'A' | 'B' | 'TIE' | 'MERGED' | 'NONE';
  is_blind?: boolean;
  merged_output?: string;
}

export interface ArenaStreamChunkPayload {
  session_id: string;
  slot: 'A' | 'B';
  chunk: string;
  is_done: boolean;
  error?: string | null;
}

export interface ExecuteArenaDuelInput {
  session_id: string;
  novel_id: string;
  chapter_id?: string;
  system_prompt: string;
  user_prompt: string;
  slot_a_provider_id?: string;
  slot_a_model?: string;
  slot_a_temperature?: number;
  slot_b_provider_id?: string;
  slot_b_model?: string;
  slot_b_temperature?: number;
  max_tokens?: number;
}

export interface ArenaDuelResult {
  session_id: string;
  slot_a_output: string;
  slot_a_duration_ms: number;
  slot_b_output: string;
  slot_b_duration_ms: number;
}

export interface MergeArenaOutputsInput {
  novel_id: string;
  prompt: string;
  output_a: string;
  output_b: string;
  merge_focus?: string;
}

// ==========================================
// V2.5 EPUB EXPORT & TYPESETTER CLEANER TYPES
// ==========================================

export interface EpubExportResult {
  file_path: string;
  file_size: number;
  chapter_count: number;
  word_count: number;
  title: string;
}

export type TypesetPreset = 'QIDIAN' | 'FANQIE' | 'JINJIANG' | 'GENERAL';

export interface TypesetOptions {
  indentTwoEm?: boolean;
  convertPunctuation?: boolean;
  fixQuotes?: boolean;
  convertDashesAndEllipsis?: boolean;
  removeRedundantBlankLines?: boolean;
  removeTrailingSpaces?: boolean;
  blankLineBetweenParagraphs?: boolean;
  censorScan?: boolean;
}

export interface CensorMatch {
  word: string;
  category: 'POLITICS' | 'VIOLENCE' | 'PORN' | 'PLATFORM_BANNED';
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  line: number;
  column: number;
  suggest?: string;
}

export interface TypesetResult {
  cleanedText: string;
  originalCharCount: number;
  cleanedCharCount: number;
  paragraphCount: number;
  censorMatches: CensorMatch[];
}

// ==========================================
// V2.5.1 AI PROMPT OPTIMIZER TYPES
// ==========================================

export type PromptOptimizationAngle = 'DRAMA_CONFLICT' | 'SENSORY_DETAIL' | 'PLOT_HOOK' | 'CONCISE_PUNCHY';

export interface OptimizeWritingPromptInput {
  novel_id?: string;
  chapter_id?: string;
  raw_prompt: string;
  target_length?: number;
  optimization_angle?: PromptOptimizationAngle | string;
  style_mode?: string;
}

export interface OptimizeWritingPromptResult {
  original_prompt: string;
  optimized_prompt: string;
  enhancement_points: string[];
  suggested_hooks?: string;
  suggested_tags: string[];
}

// ==========================================
// V3.3.0 AGENTIC HEADLESS & PROPOSAL TYPES
// ==========================================

export interface ClicheMatch {
  rule_key: string;
  label: string;
  matched_text: string;
  excerpt: string;
  suggestion: string;
}

export interface ConsistencyIssue {
  issue_type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  target_entity?: string;
  suggestion: string;
}

export interface EntityProposal {
  entity_type: string;
  name: string;
  frequency: number;
  context_sample: string;
  suggested_action: string;
}

export interface EvaluationReport {
  novel_id: string;
  chapter_id?: string;
  word_count: number;
  reading_time_minutes: number;
  humanizer_score: number;
  verdict: 'PASS' | 'NEEDS_REVISION' | 'CRITICAL_ISSUES';
  cliche_matches: ClicheMatch[];
  consistency_issues: ConsistencyIssue[];
  entity_proposals: EntityProposal[];
  actionable_summary: string;
}

export interface ChapterProposal {
  version_id: string;
  chapter_id: string;
  version_number: number;
  word_count: number;
  source_type: string;
  proposal_summary?: string;
  content_snippet: string;
  created_at: number;
}

export interface RollbackResult {
  chapter_id: string;
  restored_version_id: string;
  restored_version_number: number;
  word_count: number;
  invalidated_facts_count: number;
  message: string;
}

// ==========================================
// V3.4.0 CHARACTER DIALOGUE SANDBOX TYPES
// ==========================================

export interface CharacterActorConfig {
  character_id: string;
  character_name: string;
  provider_id?: string;
  model_name?: string;
  private_motivation: string;
  private_secret: string;
  voice_quirks?: string;
  order_index: number;
  is_human?: boolean;
}

export interface DialogueRoundRecord {
  round_index: number;
  speaker_id: string;
  speaker_name: string;
  inner_thought: string;
  subtext?: string;
  character_action: string;
  speech: string;
  is_narrator_event: boolean;
  is_edited_by_user: boolean;
  ooc_warning?: string;
  branch_id?: string;
  timestamp: number;
}

export interface SandboxBranch {
  id: string;
  name: string;
  fork_round_index: number;
  history: DialogueRoundRecord[];
  created_at: number;
}

export interface CharacterSandboxSession {
  id: string;
  novel_id: string;
  chapter_id?: string;
  scene_id?: string;
  title: string;
  scene_setting: string;
  scene_goal: string;
  characters_config_json: string;
  dialogue_history_json: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  synthesized_prose?: string;
  branches_json?: string;
  active_branch_id?: string;
  inspiration_notes_json?: string;
  created_at: number;
  updated_at: number;
}

export interface InspirationNote {
  id: string;
  type: 'QUOTE' | 'ACTION' | 'PSYCHOLOGY' | 'TWIST';
  content: string;
  speaker_name?: string;
  round_index?: number;
  created_at: number;
}

export interface CreateSandboxSessionInput {
  novel_id: string;
  chapter_id?: string;
  scene_id?: string;
  title: string;
  scene_setting: string;
  scene_goal: string;
  characters_config: CharacterActorConfig[];
  branches_json?: string;
  active_branch_id?: string;
  inspiration_notes_json?: string;
}

export interface UpdateSandboxSessionInput {
  id: string;
  title?: string;
  scene_setting?: string;
  scene_goal?: string;
  characters_config?: CharacterActorConfig[];
  dialogue_history?: DialogueRoundRecord[];
  status?: string;
  synthesized_prose?: string;
  branches_json?: string;
  active_branch_id?: string;
  inspiration_notes_json?: string;
}

export interface ExecuteSandboxStepInput {
  session_id: string;
  target_speaker_id?: string;
  narrator_intervention?: string;
  temperature?: number;
  action_guidance?: string;
}

export interface CharacterActionOption {
  id: string;
  label: string;
  stance: string;
  inner_motive: string;
  action_preview: string;
  speech_preview: string;
}

export interface ProbeCharacterActionsInput {
  session_id: string;
  target_speaker_id?: string;
}

export interface ProbeCharacterActionsResult {
  session_id: string;
  speaker_id: string;
  speaker_name: string;
  options: CharacterActionOption[];
}

export interface DistillSandboxInspirationsInput {
  session_id: string;
}

export interface DistillSandboxInspirationsResult {
  session_id: string;
  golden_quotes: string[];
  micro_actions: string[];
  psychological_insights: string[];
  plot_twists: string[];
}

export interface ExecuteSandboxStepResult {
  round: DialogueRoundRecord;
  next_recommended_speaker_id?: string;
  is_completed: boolean;
  total_rounds: number;
}

export interface SynthesizeSandboxProseInput {
  session_id: string;
  custom_guidance?: string;
  pov_mode?: string;
  polishing_style?: 'CINEMATIC' | 'PSYCHOLOGICAL' | 'HARDCORE_TENSE';
  start_round_index?: number;
  end_round_index?: number;
}

export interface SynthesizeSandboxProseResult {
  session_id: string;
  synthesized_prose: string;
  word_count: number;
  duration_ms: number;
}




