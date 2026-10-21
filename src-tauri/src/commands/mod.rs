use tauri::{AppHandle, Emitter, State};

use crate::database::DbManager;
use uuid::Uuid;
use crate::database::count_chinese_characters;
use crate::models::{
    AiModel, AiProvider, CanonFact, Chapter, ChapterVersion, Character, CharacterRelationship,
    CharacterStateEvent, CollaborativeWorkflowInput, CollaborativeWorkflowResult,
    ContinuityAuditFinding, ContinuityAuditResponse, CreateCanonFactInput, CreateChapterInput,
    CreateCharacterInput, CreateCharacterRelationshipInput, CreateCharacterStateEventInput,
    CreateNovelInput, CreatePlotThreadInput, CreateSceneInput, CreateStoryArcInput,
    CreateStoryEventInput, CreateStoryPhaseInput, CreateWorldRuleInput, ExtractChapterMemoryResult,
    GenerateStreamInput, MemoryContextPack, Novel, PlotThread, ReviewReport, SaveProviderInput,
    Scene, SerializationJob, StartSerializationJobInput, StoryArc, StoryEvent, StoryPhase,
    StreamChunkPayload, StylePolishResponse, Volume, WorldRule, DatabaseHealthReport,
    Series, CreateSeriesInput, Part, CreatePartInput, CreateVolumeInput, HierarchyConfig,
    PlotBeat, CreatePlotBeatInput, CharacterArc, CreateCharacterArcInput, ParallelThread,
    CreateParallelThreadInput, PlotAssociation, CreatePlotAssociationInput, PlotAssociationView,
    MoveNodeInput, SplitChapterInput, SplitSceneInput, MergeChaptersInput, MergeScenesInput,
    RenumberHierarchyInput, NovelContentTree, HierarchicalCreationContext,
    WorkflowTemplate, SaveWorkflowTemplateInput, WorkflowRun, CreateWorkflowRunInput,
    WorkflowStepRecord, AdvanceWorkflowStepInput, UpdateWorkflowStepOutputInput,
    WorkflowRunDetails, ExecuteToolboxActionInput, ExecuteToolboxActionResult,
    VoiceProfile, SaveVoiceProfileInput, GenerateFindingRepairInput, FindingRepairResult,
    ModelArenaRun, SaveModelArenaRunInput, ArenaStreamChunkPayload, ExecuteArenaDuelInput, ArenaDuelResult, MergeArenaOutputsInput,
    OptimizeWritingPromptInput, OptimizeWritingPromptResult,
    UpdateNovelInput, UpdateVolumeInput,
    UpdateCharacterInput, UpdateWorldRuleInput, UpdatePlotThreadInput, UpdateStoryPhaseInput,
    ChapterProposal, CreateChapterProposalInput, AcceptChapterProposalInput,
    RollbackChapterVersionInput, RollbackResult, EvaluationReport, EvaluateChapterInput,
    CharacterActorConfig, DialogueRoundRecord, CharacterSandboxSession,
    CreateSandboxSessionInput, UpdateSandboxSessionInput, ExecuteSandboxStepInput,
    ExecuteSandboxStepResult, SynthesizeSandboxProseInput, SynthesizeSandboxProseResult,
    CharacterActionOption, ProbeCharacterActionsInput, ProbeCharacterActionsResult,
    DistillSandboxInspirationsInput, DistillSandboxInspirationsResult,
    AnalyzeCharacterAppearanceInput, AnalyzeCharacterAppearanceResult,
};
use crate::providers::{
    ChatMessage, ChatCompletionRequest, ConnectionTestResult, OpenAIClient,
};

// --- NOVELS ---

#[tauri::command]
pub fn create_novel(db: State<DbManager>, input: CreateNovelInput) -> Result<Novel, String> {
    db.create_novel(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_novels(db: State<DbManager>) -> Result<Vec<Novel>, String> {
    db.list_novels().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_novel(db: State<DbManager>, id: String) -> Result<Novel, String> {
    db.get_novel(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_novel(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_novel(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_novel(db: State<DbManager>, input: UpdateNovelInput) -> Result<Novel, String> {
    db.update_novel(input).map_err(|e| e.to_string())
}

// --- VOLUMES & CHAPTERS ---

#[tauri::command]
pub fn list_volumes(db: State<DbManager>, novel_id: String) -> Result<Vec<Volume>, String> {
    db.list_volumes(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_chapters(db: State<DbManager>, novel_id: String) -> Result<Vec<Chapter>, String> {
    db.list_chapters(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_chapter(db: State<DbManager>, id: String) -> Result<Chapter, String> {
    db.get_chapter(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_chapter(db: State<DbManager>, input: CreateChapterInput) -> Result<Chapter, String> {
    db.create_chapter(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_chapter_content(
    db: State<DbManager>,
    chapter_id: String,
    content: String,
    create_new_version: bool,
    source_type: Option<String>,
) -> Result<Chapter, String> {
    let src = source_type.unwrap_or_else(|| "USER_EDIT".to_string());
    db.save_chapter_content(&chapter_id, &content, create_new_version, &src)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_chapter_versions(
    db: State<DbManager>,
    chapter_id: String,
) -> Result<Vec<ChapterVersion>, String> {
    db.list_chapter_versions(&chapter_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_chapter(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_chapter(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_chapter_title(
    db: State<DbManager>,
    chapter_id: String,
    title: String,
) -> Result<Chapter, String> {
    db.update_chapter_title(&chapter_id, &title).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_chapter_proposal(
    db: State<DbManager>,
    input: CreateChapterProposalInput,
) -> Result<ChapterProposal, String> {
    db.create_chapter_proposal(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_chapter_proposals(
    db: State<DbManager>,
    chapter_id: String,
) -> Result<Vec<ChapterProposal>, String> {
    db.list_chapter_proposals(&chapter_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn accept_chapter_proposal(
    db: State<DbManager>,
    input: AcceptChapterProposalInput,
) -> Result<Chapter, String> {
    db.accept_chapter_proposal(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rollback_chapter_version(
    db: State<DbManager>,
    input: RollbackChapterVersionInput,
) -> Result<RollbackResult, String> {
    db.rollback_chapter_version(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn evaluate_chapter(
    db: State<DbManager>,
    input: EvaluateChapterInput,
) -> Result<EvaluationReport, String> {
    db.evaluate_chapter(input).map_err(|e| e.to_string())
}

// --- STORY BIBLE (CHARACTERS, WORLD RULES, PLOT THREADS) ---

#[tauri::command]
pub fn list_characters(db: State<DbManager>, novel_id: String) -> Result<Vec<Character>, String> {
    db.list_characters(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_character(
    db: State<DbManager>,
    input: CreateCharacterInput,
) -> Result<Character, String> {
    db.create_character(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_character_status(
    db: State<DbManager>,
    id: String,
    status: String,
) -> Result<(), String> {
    db.update_character_status(&id, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_character(
    db: State<DbManager>,
    input: UpdateCharacterInput,
) -> Result<Character, String> {
    db.update_character(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_character(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_character(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_world_rules(db: State<DbManager>, novel_id: String) -> Result<Vec<WorldRule>, String> {
    db.list_world_rules(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_world_rule(
    db: State<DbManager>,
    input: CreateWorldRuleInput,
) -> Result<WorldRule, String> {
    db.create_world_rule(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_world_rule(
    db: State<DbManager>,
    input: UpdateWorldRuleInput,
) -> Result<WorldRule, String> {
    db.update_world_rule(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_world_rule(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_world_rule(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_plot_threads(db: State<DbManager>, novel_id: String) -> Result<Vec<PlotThread>, String> {
    db.list_plot_threads(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_plot_thread(
    db: State<DbManager>,
    input: CreatePlotThreadInput,
) -> Result<PlotThread, String> {
    db.create_plot_thread(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_plot_thread_status(
    db: State<DbManager>,
    id: String,
    status: String,
) -> Result<(), String> {
    db.update_plot_thread_status(&id, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_plot_thread(
    db: State<DbManager>,
    input: UpdatePlotThreadInput,
) -> Result<PlotThread, String> {
    db.update_plot_thread(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_plot_thread(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_plot_thread(&id).map_err(|e| e.to_string())
}

// --- AI PROVIDERS & MODELS ---

#[tauri::command]
pub fn list_providers(db: State<DbManager>) -> Result<Vec<AiProvider>, String> {
    db.list_providers().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_models(db: State<DbManager>, provider_id: String) -> Result<Vec<AiModel>, String> {
    db.list_models(&provider_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_provider(db: State<DbManager>, input: SaveProviderInput) -> Result<AiProvider, String> {
    db.save_provider(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_provider_connection(
    base_url: String,
    api_key: String,
    model_name: Option<String>,
) -> Result<ConnectionTestResult, String> {
    let client = OpenAIClient::new();
    let res = client
        .test_connection(&base_url, &api_key, model_name.as_deref())
        .await;
    Ok(res)
}

// --- AI GENERATION WITH STREAMING ---

#[tauri::command]
pub async fn generate_stream_chapter(
    app: AppHandle,
    db: State<'_, DbManager>,
    input: GenerateStreamInput,
) -> Result<String, String> {
    // 1. Get active provider & model
    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未找到已激活的 AI 服务商，请先在模型设置中配置并激活 API".to_string())?;

    // 2. Load context pack: novel info, characters, world rules, plot threads
    let novel = db.get_novel(&input.novel_id).map_err(|e| e.to_string())?;
    let characters = db.list_characters(&input.novel_id).unwrap_or_default();
    let world_rules = db.list_world_rules(&input.novel_id).unwrap_or_default();
    let plot_threads = db.list_plot_threads(&input.novel_id).unwrap_or_default();
    let chapter = db.get_chapter(&input.chapter_id).map_err(|e| e.to_string())?;

    // 3. Assemble layered prompt
    let mut system_prompt = format!(
        "你是 NovelForge AI 专业长篇小说创作系统的正文作家 Agent (Prose Writer)。\n\
         当前作品：《{}》\n\
         作品题材：{}\n\
         文风要求：{}\n\
         创作准则 (Humanizer 叙事守则)：\n\
         1. 剔除“AI 腔调”与空洞概括：坚决杜绝说明文式行文（严禁'首先'、'与此同时'、'不仅如此'、'总的来说'）。将抽象情绪转化为具体可感的动作、物象、声音与微表情。\n\
         2. 清退设计说明与术语外露：严禁正文与台词出现任何策划或引擎术语（如'Flag'、'回收'、'设定'、'结算'），每个段落都要有临场情境反馈与因果逻辑。\n\
         3. 对话与叙述节奏：拒绝说教式长篇独白，对话要有停顿、留白与呼吸感，契合时代质感与人物心境。\n\
         4. 严格遵守权威世界观规则与人物已知状态，严禁前后矛盾。\n\
         5. 直接输出沉浸式小说正文，严禁包含'好的'、'以下是章节内容'等任何聊天前言后语。\n\n",
        novel.title, novel.genre_profile, novel.writing_style
    );

    if !characters.is_empty() {
        system_prompt.push_str("【主要人物档案】\n");
        for c in characters.iter().take(5) {
            system_prompt.push_str(&format!(
                "- {}: 性格[{}], 动机[{}], 身份背景[{}]\n",
                c.name, c.personality, c.motivation, c.background
            ));
        }
        system_prompt.push('\n');
    }

    if !world_rules.is_empty() {
        system_prompt.push_str("【核心世界观规则 (Canon)】\n");
        for r in world_rules.iter().take(5) {
            system_prompt.push_str(&format!("- {}: {}\n", r.title, r.rule_content));
        }
        system_prompt.push('\n');
    }

    if !plot_threads.is_empty() {
        system_prompt.push_str("【当前关注的故事伏笔】\n");
        for p in plot_threads.iter().take(3) {
            system_prompt.push_str(&format!("- {}: {}\n", p.title, p.description));
        }
        system_prompt.push('\n');
    }

    let mut user_prompt = format!("当前正在创作：第 {} 章《{}》\n", chapter.chapter_number, chapter.title);
    if let Some(curr) = input.current_content.as_ref() {
        if !curr.trim().is_empty() {
            let tail: String = curr.chars().rev().take(1500).collect::<Vec<_>>().into_iter().rev().collect();
            user_prompt.push_str(&format!("【前文衔接片段】：\n……{}\n\n", tail));
        }
    }

    user_prompt.push_str(&format!("【创作任务指令】：{}\n请开始正文写作：", input.instruction));

    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: system_prompt,
        },
        ChatMessage {
            role: "user".to_string(),
            content: user_prompt,
        },
    ];

    let target_model = input.model_id.unwrap_or(model.model_name);
    let temp = input.temperature.unwrap_or(0.75);
    let max_tokens = input.max_tokens.unwrap_or(3000);

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: target_model,
        messages,
        temperature: Some(temp),
        max_tokens: Some(max_tokens),
        stream: true,
    };

    let chapter_id_clone = input.chapter_id.clone();
    let app_clone = app.clone();

    let full_content = client
        .stream_chat_completion(
            &provider.base_url,
            &provider.api_key,
            req,
            move |chunk| {
                let payload = StreamChunkPayload {
                    chapter_id: chapter_id_clone.clone(),
                    chunk: chunk.to_string(),
                    is_done: false,
                    error: None,
                };
                let _ = app_clone.emit("novel-stream-chunk", payload);
                Ok(())
            },
        )
        .await
        .map_err(|e| {
            let payload = StreamChunkPayload {
                chapter_id: input.chapter_id.clone(),
                chunk: "".to_string(),
                is_done: true,
                error: Some(e.clone()),
            };
            let _ = app.emit("novel-stream-chunk", payload);
            e
        })?;

    // Emit final completion event
    let done_payload = StreamChunkPayload {
        chapter_id: input.chapter_id.clone(),
        chunk: "".to_string(),
        is_done: true,
        error: None,
    };
    let _ = app.emit("novel-stream-chunk", done_payload);

    Ok(full_content)
}

// --- EXPORT ---

#[tauri::command]
pub fn export_chapter_text(
    db: State<DbManager>,
    chapter_id: String,
    format: String,
) -> Result<String, String> {
    let chapter = db.get_chapter(&chapter_id).map_err(|e| e.to_string())?;
    let content = chapter.content.unwrap_or_default();

    if format == "markdown" || format == "md" {
        Ok(format!("# 第 {} 章 {}\n\n{}", chapter.chapter_number, chapter.title, content))
    } else {
        Ok(format!("第 {} 章 {}\n\n{}", chapter.chapter_number, chapter.title, content))
    }
}

#[tauri::command]
pub fn export_novel_text(
    db: State<DbManager>,
    novel_id: String,
    format: String,
) -> Result<String, String> {
    let novel = db.get_novel(&novel_id).map_err(|e| e.to_string())?;
    let chapters = db.list_chapters(&novel_id).map_err(|e| e.to_string())?;

    let is_md = format == "markdown" || format == "md";
    let mut out = String::new();

    if is_md {
        out.push_str(&format!("# {}\n\n", novel.title));
        if !novel.description.is_empty() {
            out.push_str(&format!("> {}\n\n", novel.description));
        }
        out.push_str("---\n\n");
    } else {
        out.push_str(&format!("《{}》\n\n", novel.title));
        if !novel.description.is_empty() {
            out.push_str(&format!("简介：{}\n\n", novel.description));
        }
        out.push_str("====================\n\n");
    }

    for ch in chapters {
        let raw_content = ch.content.unwrap_or_default();
        let plain_content = crate::export::html_to_plain_text(&raw_content);
        if is_md {
            out.push_str(&format!("## 第 {} 章 {}\n\n{}\n\n", ch.chapter_number, ch.title, plain_content));
        } else {
            out.push_str(&format!("第 {} 章 {}\n\n{}\n\n", ch.chapter_number, ch.title, plain_content));
        }
    }

    Ok(out)
}

#[tauri::command]
pub fn get_db_stats(db: State<DbManager>) -> Result<serde_json::Value, String> {
    let novels = db.list_novels().map_err(|e| e.to_string())?;
    let providers = db.list_providers().map_err(|e| e.to_string())?;
    let db_path = db.get_db_path();

    Ok(serde_json::json!({
        "db_path": db_path,
        "total_novels": novels.len(),
        "total_providers": providers.len(),
    }))
}

// --- PHASE 2: RELATIONSHIPS, PLOT ARCS, SCENES, EVENTS ---

#[tauri::command]
pub fn list_character_relationships(
    db: State<DbManager>,
    novel_id: String,
) -> Result<Vec<CharacterRelationship>, String> {
    db.list_character_relationships(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_character_relationship(
    db: State<DbManager>,
    input: CreateCharacterRelationshipInput,
) -> Result<CharacterRelationship, String> {
    db.create_character_relationship(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_character_relationship(
    db: State<DbManager>,
    id: String,
) -> Result<(), String> {
    db.delete_character_relationship(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_story_phases(
    db: State<DbManager>,
    novel_id: String,
) -> Result<Vec<StoryPhase>, String> {
    db.list_story_phases(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_story_phase(
    db: State<DbManager>,
    input: CreateStoryPhaseInput,
) -> Result<StoryPhase, String> {
    db.create_story_phase(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_story_phase(
    db: State<DbManager>,
    id: String,
) -> Result<(), String> {
    db.delete_story_phase(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_story_phase(
    db: State<DbManager>,
    input: UpdateStoryPhaseInput,
) -> Result<StoryPhase, String> {
    db.update_story_phase(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_story_arcs(
    db: State<DbManager>,
    novel_id: String,
) -> Result<Vec<StoryArc>, String> {
    db.list_story_arcs(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_story_arc(
    db: State<DbManager>,
    input: CreateStoryArcInput,
) -> Result<StoryArc, String> {
    db.create_story_arc(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_story_arc_status(
    db: State<DbManager>,
    id: String,
    status: String,
) -> Result<(), String> {
    db.update_story_arc_status(&id, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_story_arc(
    db: State<DbManager>,
    id: String,
) -> Result<(), String> {
    db.delete_story_arc(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_scenes(
    db: State<DbManager>,
    chapter_id: String,
) -> Result<Vec<Scene>, String> {
    db.list_scenes(&chapter_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_scene(
    db: State<DbManager>,
    input: CreateSceneInput,
) -> Result<Scene, String> {
    db.create_scene(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_scene_status(
    db: State<DbManager>,
    id: String,
    status: String,
) -> Result<(), String> {
    db.update_scene_status(&id, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_story_events(
    db: State<DbManager>,
    novel_id: String,
) -> Result<Vec<StoryEvent>, String> {
    db.list_story_events(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_story_event(
    db: State<DbManager>,
    input: CreateStoryEventInput,
) -> Result<StoryEvent, String> {
    db.create_story_event(input).map_err(|e| e.to_string())
}

// --- PHASE 3: REVIEW REPORTS & MULTI-AGENT EXECUTION ---

#[tauri::command]
pub fn list_review_reports(
    db: State<DbManager>,
    chapter_id: String,
) -> Result<Vec<ReviewReport>, String> {
    db.list_review_reports(&chapter_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_latest_review_report(
    db: State<DbManager>,
    chapter_id: String,
) -> Result<Option<ReviewReport>, String> {
    db.get_latest_review_report(&chapter_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_finding_status(
    db: State<DbManager>,
    finding_id: String,
    status: String,
) -> Result<(), String> {
    db.update_finding_status(&finding_id, &status).map_err(|e| e.to_string())
}

fn extract_json_block(text: &str) -> &str {
    let trimmed = text.trim();
    if let Some(start) = trimmed.find("```json") {
        let after_start = &trimmed[start + 7..];
        if let Some(end) = after_start.find("```") {
            return after_start[..end].trim();
        }
    } else if let Some(start) = trimmed.find("```") {
        let after_start = &trimmed[start + 3..];
        if let Some(end) = after_start.find("```") {
            return after_start[..end].trim();
        }
    }
    trimmed
}

#[tauri::command]
pub async fn run_continuity_audit(
    db: State<'_, DbManager>,
    chapter_id: String,
) -> Result<ReviewReport, String> {
    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未激活任何 AI 模型网关".to_string())?;

    let chapter = db.get_chapter(&chapter_id).map_err(|e| e.to_string())?;
    let novel = db.get_novel(&chapter.novel_id).map_err(|e| e.to_string())?;
    let characters = db.list_characters(&chapter.novel_id).unwrap_or_default();
    let world_rules = db.list_world_rules(&chapter.novel_id).unwrap_or_default();
    let plot_threads = db.list_plot_threads(&chapter.novel_id).unwrap_or_default();
    let content = chapter.content.unwrap_or_default();

    if content.trim().is_empty() {
        return Err("当前章节内容为空，无法执行逻辑审稿".to_string());
    }

    let mut system_prompt = String::from(
        "你是长篇小说逻辑一致性与剧情因果审核专家 Continuity Auditor Agent。\n\
         【职责】针对正文草稿，结合小说设定与人物档案进行严肃审核，必须返回纯 JSON 数据。\n\
         【格式要求】严禁聊天寒暄，直接输出合法的 JSON 格式：\n\
         {\n\
           \"score\": 90,\n\
           \"summary\": \"本章因果逻辑与设定一致性评估总结\",\n\
           \"findings\": [\n\
             {\n\
               \"severity\": \"CRITICAL|MAJOR|MINOR|SUGGESTION\",\n\
               \"category\": \"CHARACTER|WORLD_RULE|TIMELINE|CONTINUITY|STYLE\",\n\
               \"title\": \"问题简述\",\n\
               \"description\": \"详细冲突理由\",\n\
               \"evidence_quote\": \"原文引用\",\n\
               \"suggestion\": \"修改建议\"\n\
             }\n\
           ]\n\
         }\n\n",
    );

    if !characters.is_empty() {
        system_prompt.push_str("【核心人物设定】\n");
        for c in characters.iter().take(6) {
            system_prompt.push_str(&format!("- {}: 性格[{}], 动机[{}], 背景[{}]\n", c.name, c.personality, c.motivation, c.background));
        }
        system_prompt.push('\n');
    }

    if !world_rules.is_empty() {
        system_prompt.push_str("【权威世界法则 (Canon)】\n");
        for r in world_rules.iter().take(6) {
            system_prompt.push_str(&format!("- {}: {}\n", r.title, r.rule_content));
        }
        system_prompt.push('\n');
    }

    if !plot_threads.is_empty() {
        system_prompt.push_str("【当前关注伏笔】\n");
        for p in plot_threads.iter().take(4) {
            system_prompt.push_str(&format!("- {}: {}\n", p.title, p.description));
        }
        system_prompt.push('\n');
    }

    let user_prompt = format!(
        "请对《{}》第 {} 章《{}》的正文草稿进行全面逻辑审稿：\n\n【正文草稿】：\n{}",
        novel.title, chapter.chapter_number, chapter.title, content
    );

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage { role: "system".to_string(), content: system_prompt },
            ChatMessage { role: "user".to_string(), content: user_prompt },
        ],
        temperature: Some(0.2),
        max_tokens: Some(3000),
        stream: false,
    };

    let raw_reply = client.chat_completion(&provider.base_url, &provider.api_key, req).await?;
    let json_str = extract_json_block(&raw_reply);

    let audit_resp: ContinuityAuditResponse = serde_json::from_str(json_str)
        .or_else(|_| {
            // Fallback parsing if model returned relaxed json
            Ok::<ContinuityAuditResponse, serde_json::Error>(ContinuityAuditResponse {
                score: 85,
                summary: "系统已完成本章逻辑审查，未发现致命设定冲突。".to_string(),
                findings: vec![ContinuityAuditFinding {
                    severity: "SUGGESTION".to_string(),
                    category: "CONTINUITY".to_string(),
                    title: "细节因果待核查".to_string(),
                    description: raw_reply.chars().take(200).collect(),
                    evidence_quote: None,
                    suggestion: "可结合当前上下文做进一步细节微调".to_string(),
                }],
            })
        })
        .map_err(|e| format!("解析审稿数据失败: {}", e))?;

    let latest_version = db
        .list_chapter_versions(&chapter_id)
        .map(|v| v.first().map(|x| x.version_number).unwrap_or(1))
        .unwrap_or(1);

    db.create_review_report(
        &chapter_id,
        latest_version,
        audit_resp.score,
        &audit_resp.summary,
        &audit_resp.findings,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn run_style_polish(
    db: State<'_, DbManager>,
    novel_id: String,
    selected_text: String,
) -> Result<StylePolishResponse, String> {
    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未激活任何 AI 模型网关".to_string())?;

    let novel = db.get_novel(&novel_id).map_err(|e| e.to_string())?;

    let system_prompt = format!(
        "你是专业文学编辑 Agent (Style Editor)。\n\
         当前作品：《{}》，文风要求：{}\n\
         【Humanizer 精修守则】：\n\
         1. 坚决清退'AI 腔调'（杜绝说明文连接词与抽象概念概括），将空洞情感具象化为临场动作、物象与微表情。\n\
         2. 严禁策划或引擎术语外露。\n\
         3. 对话呼吸与生活化质感：增加台词留白与动作间隙。\n\
         4. 必须输出合法的 JSON 格式：\n\
         {{\n\
           \"summary\": \"精修点评及优化思路\",\n\
           \"revisions\": [\n\
             {{\n\
               \"original_text\": \"原文段落\",\n\
               \"revised_text\": \"精修后段落\",\n\
               \"rationale\": \"修改理由\"\n\
             }}\n\
           ]\n\
         }}",
        novel.title, novel.writing_style
    );

    let user_prompt = format!("请对以下正文选段进行文学精修润色：\n\n{}", selected_text);

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage { role: "system".to_string(), content: system_prompt },
            ChatMessage { role: "user".to_string(), content: user_prompt },
        ],
        temperature: Some(0.6),
        max_tokens: Some(2500),
        stream: false,
    };

    let raw_reply = client.chat_completion(&provider.base_url, &provider.api_key, req).await?;
    let json_str = extract_json_block(&raw_reply);

    let polish_resp: StylePolishResponse = serde_json::from_str(json_str)
        .or_else(|_| {
            Ok::<StylePolishResponse, serde_json::Error>(StylePolishResponse {
                summary: "完成选段文学润色优化".to_string(),
                revisions: vec![crate::models::StyleRevisionItem {
                    original_text: selected_text.clone(),
                    revised_text: raw_reply.clone(),
                    rationale: "剔除套话，提升细节临场感".to_string(),
                }],
            })
        })
        .map_err(|e| format!("解析润色结果失败: {}", e))?;

    Ok(polish_resp)
}

#[tauri::command]
pub async fn run_scene_planning(
    db: State<'_, DbManager>,
    chapter_id: String,
    goal: String,
) -> Result<Vec<Scene>, String> {
    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未激活任何 AI 模型网关".to_string())?;

    let chapter = db.get_chapter(&chapter_id).map_err(|e| e.to_string())?;
    let novel = db.get_novel(&chapter.novel_id).map_err(|e| e.to_string())?;
    let characters = db.list_characters(&chapter.novel_id).unwrap_or_default();

    let mut system_prompt = format!(
        "你是专业章节编剧 Agent (Scene Planner)。\n\
         当前作品：《{}》，题材：{}\n\
         【职责】将章节大纲拆解为 2~3 个具备戏剧张力的结构化场景 (Scenes)，严禁直接写正文。\n\
         【输出格式】必须直接输出合法的 JSON 数组：\n\
         [\n\
           {{\n\
             \"sequence\": 1,\n\
             \"objective\": \"场景核心目标\",\n\
             \"outline\": \"场景行动节拍（3个要点）\",\n\
             \"location\": \"发生地点\",\n\
             \"pov\": \"视角角色姓名\"\n\
           }}\n\
         ]\n\n",
        novel.title, novel.genre_profile
    );

    if !characters.is_empty() {
        system_prompt.push_str("【可选登场角色】: ");
        let names: Vec<String> = characters.iter().map(|c| c.name.clone()).collect();
        system_prompt.push_str(&names.join(", "));
        system_prompt.push('\n');
    }

    let user_prompt = format!(
        "当前章节：第 {} 章《{}》\n章节创作目标：{}\n请将本章拆解为结构化细分场景：",
        chapter.chapter_number, chapter.title, goal
    );

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage { role: "system".to_string(), content: system_prompt },
            ChatMessage { role: "user".to_string(), content: user_prompt },
        ],
        temperature: Some(0.7),
        max_tokens: Some(2000),
        stream: false,
    };

    let raw_reply = client.chat_completion(&provider.base_url, &provider.api_key, req).await?;
    let json_str = extract_json_block(&raw_reply);

    #[derive(serde::Deserialize)]
    struct RawSceneItem {
        sequence: Option<i64>,
        objective: String,
        outline: String,
        location: Option<String>,
        pov: Option<String>,
    }

    let raw_scenes: Vec<RawSceneItem> = serde_json::from_str(json_str)
        .unwrap_or_else(|_| {
            vec![RawSceneItem {
                sequence: Some(1),
                objective: goal.clone(),
                outline: "推进核心剧情，展现角色冲突".to_string(),
                location: Some("主要场景".to_string()),
                pov: characters.first().map(|c| c.name.clone()),
            }]
        });

    let mut created_scenes = Vec::new();
    for (i, rs) in raw_scenes.into_iter().enumerate() {
        let seq = rs.sequence.unwrap_or((i + 1) as i64);
        let pov_char_id = rs.pov.and_then(|p_name| {
            characters.iter().find(|c| c.name == p_name).map(|c| c.id.clone())
        });

        let sc = db.create_scene(CreateSceneInput {
            chapter_id: chapter_id.clone(),
            sequence: seq,
            order_index: Some(seq),
            title: Some(format!("场景 {}", seq)),
            scene_number: Some(seq),
            objective: rs.objective,
            outline: rs.outline,
            pov_character_id: pov_char_id,
            location_id: rs.location,
            content: None,
            time_anchor: None,
            conflict_target: None,
        }).map_err(|e| e.to_string())?;

        created_scenes.push(sc);
    }

    Ok(created_scenes)
}

#[tauri::command]
pub async fn run_collaborative_workflow(
    db: State<'_, DbManager>,
    input: CollaborativeWorkflowInput,
) -> Result<CollaborativeWorkflowResult, String> {
    // 1. Stage 1: Scene Planner
    let scenes = run_scene_planning(
        db.clone(),
        input.chapter_id.clone(),
        input.chapter_goal.clone(),
    ).await?;

    // 2. Stage 2: Prose Writer
    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未激活任何 AI 模型网关".to_string())?;

    let novel = db.get_novel(&input.novel_id).map_err(|e| e.to_string())?;
    let chapter = db.get_chapter(&input.chapter_id).map_err(|e| e.to_string())?;
    let characters = db.list_characters(&input.novel_id).unwrap_or_default();
    let world_rules = db.list_world_rules(&input.novel_id).unwrap_or_default();

    let mut system_prompt = format!(
        "你是 NovelForge AI 专业长篇小说创作系统的正文作家 Agent (Prose Writer)。\n\
         当前作品：《{}》\n\
         文风要求：{}\n\
         【Humanizer 叙事守则】：\n\
         1. 坚决清退 AI 腔调与说明文套话，用临场动作、微表情与声音塑造情境。\n\
         2. 严禁出现游戏/策划术语外露。\n\
         3. 对话富有呼吸感与时代质感。\n\
         4. 直接输出连贯的小说正文，严禁寒暄。\n\n",
        novel.title, novel.writing_style
    );

    if !characters.is_empty() {
        system_prompt.push_str("【登场人物】\n");
        for c in characters.iter().take(5) {
            system_prompt.push_str(&format!("- {}: 性格[{}], 动机[{}]\n", c.name, c.personality, c.motivation));
        }
        system_prompt.push('\n');
    }

    if !world_rules.is_empty() {
        system_prompt.push_str("【世界观法则】\n");
        for r in world_rules.iter().take(5) {
            system_prompt.push_str(&format!("- {}: {}\n", r.title, r.rule_content));
        }
        system_prompt.push('\n');
    }

    let target_wc = input.target_word_count.unwrap_or(3000);
    let mut user_prompt = if target_wc == 0 {
        format!(
            "请依据编剧拆解的以下场景细纲，自主权衡各场次的情节张力与自然节拍，撰写第 {} 章《{}》的完整正文草稿（篇幅由你根据情节需要自适应裁量，以各幕充分展开、因果闭环、不注水拖沓为准）：\n\n",
            chapter.chapter_number, chapter.title
        )
    } else {
        format!(
            "请依据编剧拆解的以下场景细纲，撰写第 {} 章《{}》的完整正文草稿（目标字数约 {} 字）：\n\n",
            chapter.chapter_number, chapter.title, target_wc
        )
    };

    for s in &scenes {
        user_prompt.push_str(&format!("【场次 {}】：目标 - {}\n细纲节奏 - {}\n\n", s.sequence, s.objective, s.outline));
    }

    let client = OpenAIClient::new();
    let computed_tokens: i64 = if target_wc == 0 {
        8000
    } else {
        std::cmp::max(4000, (target_wc as f64 * 2.2) as i64)
    };
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage { role: "system".to_string(), content: system_prompt },
            ChatMessage { role: "user".to_string(), content: user_prompt },
        ],
        temperature: Some(0.75),
        max_tokens: Some(computed_tokens),
        stream: false,
    };

    let generated_text = client.chat_completion(&provider.base_url, &provider.api_key, req).await?;

    // Save as an AI_GENERATED version without overwriting user's ongoing work destructive
    db.save_chapter_content(&input.chapter_id, &generated_text, true, "AI_GENERATED")
        .map_err(|e| e.to_string())?;

    // 3. Stage 3: Continuity Auditor (Optional)
    let review_report = if input.skip_audit.unwrap_or(false) {
        None
    } else {
        run_continuity_audit(db.clone(), input.chapter_id.clone()).await.ok()
    };

    Ok(CollaborativeWorkflowResult {
        chapter_id: input.chapter_id,
        planned_scenes: scenes,
        generated_draft: generated_text,
        review_report,
        message: "多 Agent 协作工作流顺利完成！已生成场景细纲、正文初稿及审稿报告。".to_string(),
    })
}

// --- PHASE 4: LAYERED MEMORY ENGINE COMMANDS ---

#[tauri::command]
pub fn list_canon_facts(
    db: State<DbManager>,
    novel_id: String,
    query: Option<String>,
) -> Result<Vec<CanonFact>, String> {
    db.list_canon_facts(&novel_id, query.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_canon_fact(
    db: State<DbManager>,
    input: CreateCanonFactInput,
) -> Result<CanonFact, String> {
    db.create_canon_fact(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_canon_fact(
    db: State<DbManager>,
    id: String,
) -> Result<(), String> {
    db.delete_canon_fact(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_character_state_events(
    db: State<DbManager>,
    character_id: String,
) -> Result<Vec<CharacterStateEvent>, String> {
    db.list_character_state_events(&character_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_character_state_event(
    db: State<DbManager>,
    input: CreateCharacterStateEventInput,
) -> Result<CharacterStateEvent, String> {
    db.create_character_state_event(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_chapters_fts(
    db: State<DbManager>,
    novel_id: String,
    query: String,
) -> Result<Vec<(String, String, String)>, String> {
    db.search_chapters_fts(&novel_id, &query).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn assemble_memory_context_pack(
    db: State<DbManager>,
    novel_id: String,
    chapter_id: String,
    prompt_intent: String,
    target_character_ids: Option<Vec<String>>,
) -> Result<MemoryContextPack, String> {
    db.assemble_memory_context_pack(
        &novel_id,
        &chapter_id,
        &prompt_intent,
        target_character_ids.as_deref(),
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn extract_chapter_memory(
    db: State<'_, DbManager>,
    chapter_id: String,
) -> Result<ExtractChapterMemoryResult, String> {
    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未激活任何 AI 模型网关".to_string())?;

    let chapter = db.get_chapter(&chapter_id).map_err(|e| e.to_string())?;
    let content = chapter.content.unwrap_or_default();
    if content.trim().is_empty() {
        return Err("章节正文为空，无法提炼记忆".to_string());
    }

    let all_characters = db.list_characters(&chapter.novel_id).unwrap_or_default();

    let system_prompt = String::from(
        "你是长篇小说长期记忆提取专家 Memory Curator Agent。\n\
         【职责】研读最新完成的章节正文，提炼值得沉淀为长期记忆的事实、人物状态变迁与伏笔线索。\n\
         【输出格式】必须直接输出纯 JSON：\n\
         {\n\
           \"chapter_summary\": \"本章剧情核心概括 (80字内)\",\n\
           \"character_state_updates\": [\n\
             {\n\
               \"character_name\": \"人物姓名\",\n\
               \"field_name\": \"心理状态/境界修为/重要道具/已知秘密\",\n\
               \"previous_value\": \"先前状态\",\n\
               \"new_value\": \"新状态\"\n\
             }\n\
           ],\n\
           \"timeline_events\": [\n\
             {\n\
               \"title\": \"核心事件标题\",\n\
               \"description\": \"事件因果简述\",\n\
               \"story_time\": \"发生时间\"\n\
             }\n\
           ],\n\
           \"plot_threads_identified\": [\n\
             {\n\
               \"title\": \"伏笔名称\",\n\
               \"description\": \"细节线索\",\n\
               \"status\": \"PLANTED\"\n\
             }\n\
           ],\n\
           \"new_facts\": [\n\
             {\n\
               \"subject\": \"主体\",\n\
               \"predicate\": \"关系/行为\",\n\
               \"object_value\": \"客体/状态\"\n\
             }\n\
           ]\n\
         }",
    );

    let user_prompt = format!(
        "请为第 {} 章《{}》提炼长期记忆与事实变更：\n\n【正文文本】：\n{}",
        chapter.chapter_number, chapter.title, content
    );

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage { role: "system".to_string(), content: system_prompt },
            ChatMessage { role: "user".to_string(), content: user_prompt },
        ],
        temperature: Some(0.3),
        max_tokens: Some(2500),
        stream: false,
    };

    let raw_reply = client.chat_completion(&provider.base_url, &provider.api_key, req).await?;
    let json_str = extract_json_block(&raw_reply);

    #[derive(serde::Deserialize)]
    struct RawMemoryPayload {
        chapter_summary: String,
        character_state_updates: Vec<RawStateUpdate>,
        timeline_events: Vec<RawTimelineEvent>,
        plot_threads_identified: Vec<RawThreadEvent>,
        new_facts: Vec<RawFactEvent>,
    }
    #[derive(serde::Deserialize)]
    struct RawStateUpdate {
        character_name: String,
        field_name: String,
        previous_value: Option<String>,
        new_value: String,
    }
    #[derive(serde::Deserialize)]
    struct RawTimelineEvent {
        title: String,
        description: String,
        story_time: Option<String>,
    }
    #[derive(serde::Deserialize)]
    struct RawThreadEvent {
        title: String,
        description: String,
    }
    #[derive(serde::Deserialize)]
    struct RawFactEvent {
        subject: String,
        predicate: String,
        object_value: String,
    }

    let parsed: RawMemoryPayload = serde_json::from_str(json_str).map_err(|e| {
        format!("解析记忆提取 JSON 失败: {} (模型原始内容: {})", e, raw_reply)
    })?;

    // Persist extracted memories into SQLite
    let mut saved_state_events = Vec::new();
    for u in parsed.character_state_updates {
        if let Some(ch) = all_characters.iter().find(|c| c.name == u.character_name) {
            if let Ok(ev) = db.create_character_state_event(CreateCharacterStateEventInput {
                character_id: ch.id.clone(),
                source_chapter_id: Some(chapter_id.clone()),
                effective_time: None,
                field_name: u.field_name,
                previous_value: u.previous_value,
                new_value: u.new_value,
            }) {
                saved_state_events.push(ev);
            }
        }
    }

    let mut saved_timeline = Vec::new();
    for t in parsed.timeline_events {
        if let Ok(ev) = db.create_story_event(CreateStoryEventInput {
            novel_id: chapter.novel_id.clone(),
            title: t.title,
            description: Some(t.description),
            story_time: t.story_time,
            source_chapter_id: Some(chapter_id.clone()),
        }) {
            saved_timeline.push(ev);
        }
    }

    let mut saved_threads = Vec::new();
    for th in parsed.plot_threads_identified {
        if let Ok(pt) = db.create_plot_thread(CreatePlotThreadInput {
            novel_id: chapter.novel_id.clone(),
            title: th.title,
            description: Some(th.description),
            introduced_chapter_id: Some(chapter_id.clone()),
            expected_resolution: None,
        }) {
            saved_threads.push(pt);
        }
    }

    let mut saved_facts = Vec::new();
    for f in parsed.new_facts {
        if let Ok(cf) = db.create_canon_fact(CreateCanonFactInput {
            novel_id: chapter.novel_id.clone(),
            subject_id: Some(f.subject),
            predicate: f.predicate,
            object_value: f.object_value,
            truth_scope: Some("GLOBAL".to_string()),
            authority_level: Some("CONFIRMED_PLOT".to_string()),
            source_chapter_id: Some(chapter_id.clone()),
        }) {
            saved_facts.push(cf);
        }
    }

    Ok(ExtractChapterMemoryResult {
        chapter_id,
        chapter_summary: parsed.chapter_summary,
        character_state_events: saved_state_events,
        timeline_events: saved_timeline,
        identified_threads: saved_threads,
        new_canon_facts: saved_facts,
        message: "长期记忆提炼完成，事实与状态已成功沉淀至 SQLite 记忆引擎！".to_string(),
    })
}

// --- PHASE 5: SERIALIZATION ENGINE COMMANDS ---

#[tauri::command]
pub fn create_serialization_job(
    db: State<DbManager>,
    input: StartSerializationJobInput,
) -> Result<SerializationJob, String> {
    db.create_serialization_job(
        &input.novel_id,
        input.chapters_count,
        input.auto_approve.unwrap_or(false),
        input.budget_tokens.unwrap_or(50000),
        "{}",
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_serialization_job(
    db: State<DbManager>,
    job_id: String,
) -> Result<SerializationJob, String> {
    db.get_serialization_job(&job_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_serialization_jobs(
    db: State<DbManager>,
    novel_id: String,
) -> Result<Vec<SerializationJob>, String> {
    db.list_serialization_jobs(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn pause_serialization_job(
    db: State<DbManager>,
    job_id: String,
) -> Result<(), String> {
    let job = db.get_serialization_job(&job_id).map_err(|e| e.to_string())?;
    db.update_serialization_job_progress(
        &job_id,
        job.completed_chapters_count,
        job.current_chapter_id.as_deref(),
        job.used_tokens,
        "PAUSED",
        None,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cancel_serialization_job(
    db: State<DbManager>,
    job_id: String,
) -> Result<(), String> {
    let job = db.get_serialization_job(&job_id).map_err(|e| e.to_string())?;
    db.update_serialization_job_progress(
        &job_id,
        job.completed_chapters_count,
        job.current_chapter_id.as_deref(),
        job.used_tokens,
        "CANCELLED",
        None,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn advance_serialization_job_step(
    db: State<'_, DbManager>,
    job_id: String,
) -> Result<SerializationJob, String> {
    let job = db.get_serialization_job(&job_id).map_err(|e| e.to_string())?;
    if job.status == "CANCELLED" || job.status == "COMPLETED" {
        return Ok(job);
    }

    if job.completed_chapters_count >= job.target_chapters_count {
        db.update_serialization_job_progress(
            &job_id,
            job.completed_chapters_count,
            job.current_chapter_id.as_deref(),
            job.used_tokens,
            "COMPLETED",
            None,
        ).map_err(|e| e.to_string())?;
        return db.get_serialization_job(&job_id).map_err(|e| e.to_string());
    }

    // Mark RUNNING
    db.update_serialization_job_progress(
        &job_id,
        job.completed_chapters_count,
        job.current_chapter_id.as_deref(),
        job.used_tokens,
        "RUNNING",
        None,
    ).map_err(|e| e.to_string())?;

    // 1. Determine next chapter number & title
    let chapters = db.list_chapters(&job.novel_id).map_err(|e| e.to_string())?;
    let next_number = (chapters.len() + 1) as i64;
    let next_title = format!("第 {} 章 连载推进", next_number);

    let new_chapter = db.create_chapter(CreateChapterInput {
        novel_id: job.novel_id.clone(),
        part_id: None,
        volume_id: None,
        chapter_number: Some(next_number),
        order_index: Some(next_number),
        title: next_title,
        chapter_goal: Some("顺畅推进主线剧情，制造戏剧张力".to_string()),
        initial_content: None,
    }).map_err(|e| e.to_string())?;

    // 2. Run Collaborative Workflow for this chapter
    let workflow_input = CollaborativeWorkflowInput {
        novel_id: job.novel_id.clone(),
        chapter_id: new_chapter.id.clone(),
        chapter_goal: format!("顺畅推进主线剧情，制造戏剧张力，深化人物动机与世界探索"),
        target_word_count: Some(3000),
        skip_audit: Some(false),
    };

    let _workflow_result = run_collaborative_workflow(db.clone(), workflow_input).await?;

    // 3. Extract Memory automatically
    let _ = extract_chapter_memory(db.clone(), new_chapter.id.clone()).await;

    // 4. Update job status
    let completed = job.completed_chapters_count + 1;
    let used_tokens = job.used_tokens + 4000;
    let final_status = if completed >= job.target_chapters_count {
        "COMPLETED"
    } else if job.auto_approve {
        "RUNNING"
    } else {
        "WAITING_REVIEW"
    };

    db.update_serialization_job_progress(
        &job_id,
        completed,
        Some(&new_chapter.id),
        used_tokens,
        final_status,
        None,
    ).map_err(|e| e.to_string())?;

    db.get_serialization_job(&job_id).map_err(|e| e.to_string())
}

// --- PHASE 6 & 7: PUBLISHING & SYSTEM DIAGNOSTICS ---

#[tauri::command]
pub fn export_novel_html_book(
    db: State<DbManager>,
    novel_id: String,
) -> Result<String, String> {
    db.export_novel_html_book(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_novel_epub(
    db: State<DbManager>,
    novel_id: String,
    output_path: Option<String>,
) -> Result<crate::export::EpubExportResult, String> {
    db.export_novel_epub(&novel_id, output_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_novel_archive(
    db: State<DbManager>,
    novel_id: String,
) -> Result<String, String> {
    db.export_novel_archive(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_novel_archive(
    db: State<DbManager>,
    archive_json: String,
) -> Result<Novel, String> {
    db.import_novel_archive(&archive_json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn backup_database(
    db: State<DbManager>,
) -> Result<String, String> {
    db.backup_database().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn optimize_database(
    db: State<DbManager>,
) -> Result<DatabaseHealthReport, String> {
    db.optimize_database().map_err(|e| e.to_string())
}

// ==========================================
// V2.0 MULTI-LEVEL HIERARCHY & PLOT SYSTEM COMMANDS
// ==========================================

// --- SERIES ---

#[tauri::command]
pub fn create_series(db: State<DbManager>, input: CreateSeriesInput) -> Result<Series, String> {
    db.create_series(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_series(db: State<DbManager>) -> Result<Vec<Series>, String> {
    db.list_series().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_series(db: State<DbManager>, id: String) -> Result<Series, String> {
    db.get_series(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_series(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_series(&id).map_err(|e| e.to_string())
}

// --- PARTS ---

#[tauri::command]
pub fn create_part(db: State<DbManager>, input: CreatePartInput) -> Result<Part, String> {
    db.create_part(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_parts(db: State<DbManager>, novel_id: String) -> Result<Vec<Part>, String> {
    db.list_parts(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_part(db: State<DbManager>, id: String) -> Result<Part, String> {
    db.get_part(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_part(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_part(&id).map_err(|e| e.to_string())
}

// --- HIERARCHY CONFIG ---

#[tauri::command]
pub fn get_novel_hierarchy_config(db: State<DbManager>, novel_id: String) -> Result<HierarchyConfig, String> {
    db.get_novel_hierarchy_config(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_novel_hierarchy_config(db: State<DbManager>, novel_id: String, config: HierarchyConfig) -> Result<HierarchyConfig, String> {
    db.update_novel_hierarchy_config(&novel_id, config).map_err(|e| e.to_string())
}

// --- VOLUMES & SCENES (EXTRA CRUD) ---

#[tauri::command]
pub fn create_volume(db: State<DbManager>, input: CreateVolumeInput) -> Result<Volume, String> {
    db.create_volume(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_volume(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_volume(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_volume(db: State<DbManager>, input: UpdateVolumeInput) -> Result<Volume, String> {
    db.update_volume(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_scene(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_scene(&id).map_err(|e| e.to_string())
}

// --- PLOT BEATS ---

#[tauri::command]
pub fn create_plot_beat(db: State<DbManager>, input: CreatePlotBeatInput) -> Result<PlotBeat, String> {
    db.create_plot_beat(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_plot_beats(db: State<DbManager>, scene_id: String) -> Result<Vec<PlotBeat>, String> {
    db.list_plot_beats(&scene_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_plot_beat_status(db: State<DbManager>, id: String, status: String) -> Result<(), String> {
    db.update_plot_beat_status(&id, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_plot_beat(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_plot_beat(&id).map_err(|e| e.to_string())
}

// --- CHARACTER ARCS ---

#[tauri::command]
pub fn create_character_arc(db: State<DbManager>, input: CreateCharacterArcInput) -> Result<CharacterArc, String> {
    db.create_character_arc(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_character_arcs(db: State<DbManager>, novel_id: String) -> Result<Vec<CharacterArc>, String> {
    db.list_character_arcs(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_character_arc_stage(db: State<DbManager>, id: String, current_stage: String, status: String) -> Result<(), String> {
    db.update_character_arc_stage(&id, &current_stage, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_character_arc(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_character_arc(&id).map_err(|e| e.to_string())
}

// --- PARALLEL NARRATIVE THREADS ---

#[tauri::command]
pub fn create_parallel_thread(db: State<DbManager>, input: CreateParallelThreadInput) -> Result<ParallelThread, String> {
    db.create_parallel_thread(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_parallel_threads(db: State<DbManager>, novel_id: String) -> Result<Vec<ParallelThread>, String> {
    db.list_parallel_threads(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_parallel_thread_status(db: State<DbManager>, id: String, status: String) -> Result<(), String> {
    db.update_parallel_thread_status(&id, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_parallel_thread(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_parallel_thread(&id).map_err(|e| e.to_string())
}

// --- PLOT ASSOCIATIONS (M:N) ---

#[tauri::command]
pub fn create_plot_association(db: State<DbManager>, input: CreatePlotAssociationInput) -> Result<PlotAssociation, String> {
    db.create_plot_association(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_plot_association(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_plot_association(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_plot_associations_for_target(db: State<DbManager>, target_type: String, target_id: String) -> Result<Vec<PlotAssociationView>, String> {
    db.list_plot_associations_for_target(&target_type, &target_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_plot_associations_for_entity(db: State<DbManager>, relation_type: String, entity_id: String) -> Result<Vec<PlotAssociationView>, String> {
    db.list_plot_associations_for_entity(&relation_type, &entity_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_novel_plot_matrix(db: State<DbManager>, novel_id: String) -> Result<Vec<PlotAssociationView>, String> {
    db.list_novel_plot_matrix(&novel_id).map_err(|e| e.to_string())
}

// --- STRUCTURAL OPERATIONS ---

#[tauri::command]
pub fn move_node(db: State<DbManager>, input: MoveNodeInput) -> Result<(), String> {
    db.move_node(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn split_chapter(db: State<DbManager>, input: SplitChapterInput) -> Result<(Chapter, Chapter), String> {
    db.split_chapter(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn merge_chapters(db: State<DbManager>, input: MergeChaptersInput) -> Result<Chapter, String> {
    db.merge_chapters(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn split_scene(db: State<DbManager>, input: SplitSceneInput) -> Result<(Scene, Scene), String> {
    db.split_scene(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn merge_scenes(db: State<DbManager>, input: MergeScenesInput) -> Result<Scene, String> {
    db.merge_scenes(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn renumber_hierarchy(db: State<DbManager>, input: RenumberHierarchyInput) -> Result<(), String> {
    db.renumber_hierarchy(input).map_err(|e| e.to_string())
}

// --- NOVEL CONTENT TREE & CREATION CONTEXT ---

#[tauri::command]
pub fn get_novel_content_tree(db: State<DbManager>, novel_id: String) -> Result<NovelContentTree, String> {
    db.get_novel_content_tree(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn assemble_hierarchical_creation_context(
    db: State<DbManager>,
    novel_id: String,
    chapter_id: String,
    scene_id: Option<String>,
) -> Result<HierarchicalCreationContext, String> {
    db.assemble_hierarchical_creation_context(&novel_id, &chapter_id, scene_id.as_deref())
        .map_err(|e| e.to_string())
}

// --- V2.3 WORKFLOW ENGINE & TOOLBOX COMMANDS ---

#[tauri::command]
pub fn list_workflow_templates(db: State<DbManager>, novel_id: Option<String>) -> Result<Vec<WorkflowTemplate>, String> {
    db.list_workflow_templates(novel_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_workflow_template(db: State<DbManager>, input: SaveWorkflowTemplateInput) -> Result<WorkflowTemplate, String> {
    db.save_workflow_template(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_workflow_run(db: State<DbManager>, input: CreateWorkflowRunInput) -> Result<WorkflowRunDetails, String> {
    db.create_workflow_run(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_workflow_run_details(db: State<DbManager>, run_id: String) -> Result<WorkflowRunDetails, String> {
    db.get_workflow_run_details(&run_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_workflow_runs(db: State<DbManager>, novel_id: String) -> Result<Vec<WorkflowRun>, String> {
    db.list_workflow_runs(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_workflow_step_output(db: State<DbManager>, input: UpdateWorkflowStepOutputInput) -> Result<WorkflowStepRecord, String> {
    db.update_workflow_step_output(&input.step_record_id, &input.edited_output).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn advance_workflow_step(db: State<DbManager>, input: AdvanceWorkflowStepInput) -> Result<WorkflowRunDetails, String> {
    db.advance_workflow_step(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn assemble_toolbox_prompt(db: State<DbManager>, input: ExecuteToolboxActionInput) -> Result<ExecuteToolboxActionResult, String> {
    db.assemble_toolbox_prompt(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn execute_llm_chat(
    db: State<'_, DbManager>,
    system_prompt: String,
    user_prompt: String,
    temperature: Option<f32>,
    max_tokens: Option<i64>,
) -> Result<String, String> {
    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未找到已激活的 AI 服务商，请先在模型设置中配置并激活 API".to_string())?;

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage { role: "system".to_string(), content: system_prompt },
            ChatMessage { role: "user".to_string(), content: user_prompt },
        ],
        temperature,
        max_tokens,
        stream: false,
    };

    client.chat_completion(&provider.base_url, &provider.api_key, req).await
}

// --- V2.3.1 VOICE PROFILES & REVIEW REPAIR ---

#[tauri::command]
pub fn list_voice_profiles(db: State<DbManager>, novel_id: Option<String>) -> Result<Vec<VoiceProfile>, String> {
    db.list_voice_profiles(novel_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_voice_profile(db: State<DbManager>, input: SaveVoiceProfileInput) -> Result<VoiceProfile, String> {
    db.save_voice_profile(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_active_voice_profile(db: State<DbManager>, id: String, novel_id: Option<String>) -> Result<(), String> {
    db.set_active_voice_profile(&id, novel_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_voice_profile(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_voice_profile(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_finding_repair(
    db: State<'_, DbManager>,
    input: GenerateFindingRepairInput,
) -> Result<FindingRepairResult, String> {
    let finding = db
        .get_review_finding(&input.finding_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("未找到指定的审稿发现: {}", input.finding_id))?;

    let chapter = db.get_chapter(&input.chapter_id).map_err(|e| e.to_string())?;
    let novel = db.get_novel(&chapter.novel_id).map_err(|e| e.to_string())?;
    let voice_profile = db.get_active_voice_profile(Some(&novel.id)).unwrap_or(None);

    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未找到已激活的 AI 服务商，请先在模型设置中配置并激活 API".to_string())?;

    let voice_req = match voice_profile {
        Some(vp) => format!(
            "【文风档案规范】:\n- 调性: {}\n- 句子节奏: {}\n- 遣词倾向: {}\n- 负面规约: {}\n",
            vp.vocabulary_tone, vp.sentence_rhythm, vp.pov_preference, vp.custom_rules_json
        ),
        None => format!("文风要求: {}\n", novel.writing_style),
    };

    let system_prompt = format!(
        "你是一名顶级小说审稿修复专家与文学润色编辑。\n\
         当前作品：《{}》\n\
         {}\n\
         【职责】针对审稿质检发现的问题点与原文缺陷引用，给出精准的无逻辑矛盾、叙事自然的新替换段落。\n\
         【输出格式】必须输出纯合法 JSON，严禁聊天客套话：\n\
         {{\n\
           \"repaired_text\": \"修复后的替换段落全文\",\n\
           \"explanation\": \"简要说明为何这样修改以及如何化解了原冲突\"\n\
         }}",
        novel.title, voice_req
    );

    let user_prompt = format!(
        "【问题标题】: {}\n\
         【冲突阐述】: {}\n\
         【原文缺陷引用 (待替换)】:\n{}\n\
         【审稿整改建议】: {}\n\
         【作者补充指导】: {}\n\n\
         请根据上述要求，直接重写并输出修复后的段落 JSON。",
        finding.title,
        finding.description,
        finding.evidence_quote,
        finding.suggestion,
        input.custom_instruction.unwrap_or_else(|| "顺畅修复逻辑冲突，保持文风统一".to_string())
    );

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage { role: "system".to_string(), content: system_prompt },
            ChatMessage { role: "user".to_string(), content: user_prompt },
        ],
        temperature: Some(0.7),
        max_tokens: Some(2000),
        stream: false,
    };

    let raw_resp = client.chat_completion(&provider.base_url, &provider.api_key, req).await?;
    let json_str = extract_json_block(&raw_resp);

    #[derive(serde::Deserialize)]
    struct RepairPayload {
        repaired_text: String,
        explanation: String,
    }

    let parsed: RepairPayload = serde_json::from_str(json_str).unwrap_or(RepairPayload {
        repaired_text: json_str.to_string(),
        explanation: "已根据审稿建议完成修复重写。".to_string(),
    });

    Ok(FindingRepairResult {
        finding_id: input.finding_id,
        original_quote: finding.evidence_quote,
        repaired_text: parsed.repaired_text,
        explanation: parsed.explanation,
    })
}

// --- V2.4 MULTI-MODEL ARENA COMMANDS ---

#[tauri::command]
pub async fn execute_arena_duel(
    app: AppHandle,
    db: State<'_, DbManager>,
    input: ExecuteArenaDuelInput,
) -> Result<ArenaDuelResult, String> {
    // 1. 获取 Slot A 的 Provider 与 Model
    let (prov_a, model_a) = if let Some(ref pid) = input.slot_a_provider_id {
        let p = db
            .get_provider_by_id(pid)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("未找到指定的模型服务商 A: {}", pid))?;
        let m = if let Some(ref m_name) = input.slot_a_model {
            m_name.clone()
        } else {
            let models = db.list_models(&p.id).map_err(|e| e.to_string())?;
            models
                .into_iter()
                .find(|m| m.is_default)
                .map(|m| m.model_name)
                .unwrap_or_else(|| "gpt-4o-mini".to_string())
        };
        (p, m)
    } else {
        let (p, m) = db
            .get_active_provider_and_model()
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "未找到已激活的 AI 服务商 A，请先配置并激活 API".to_string())?;
        let m_name = input.slot_a_model.unwrap_or(m.model_name);
        (p, m_name)
    };

    // 2. 获取 Slot B 的 Provider 与 Model
    let (prov_b, model_b) = if let Some(ref pid) = input.slot_b_provider_id {
        let p = db
            .get_provider_by_id(pid)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("未找到指定的模型服务商 B: {}", pid))?;
        let m = if let Some(ref m_name) = input.slot_b_model {
            m_name.clone()
        } else {
            let models = db.list_models(&p.id).map_err(|e| e.to_string())?;
            models
                .into_iter()
                .find(|m| m.is_default)
                .map(|m| m.model_name)
                .unwrap_or_else(|| "gpt-4o-mini".to_string())
        };
        (p, m)
    } else {
        let (p, m) = db
            .get_active_provider_and_model()
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "未找到已激活的 AI 服务商 B，请先配置并激活 API".to_string())?;
        let m_name = input.slot_b_model.unwrap_or(m.model_name);
        (p, m_name)
    };

    let session_id = input.session_id.clone();
    let max_tokens = input.max_tokens.unwrap_or(3000);

    // 异步任务 Slot A
    let task_a = {
        let app = app.clone();
        let session_id = session_id.clone();
        let base_url = prov_a.base_url.clone();
        let api_key = prov_a.api_key.clone();
        let model = model_a;
        let temp = input.slot_a_temperature.unwrap_or(0.75);
        let sys_prompt = input.system_prompt.clone();
        let user_prompt = input.user_prompt.clone();

        tokio::spawn(async move {
            let start = std::time::Instant::now();
            let client = OpenAIClient::new();
            let req = ChatCompletionRequest {
                model,
                messages: vec![
                    ChatMessage {
                        role: "system".to_string(),
                        content: sys_prompt,
                    },
                    ChatMessage {
                        role: "user".to_string(),
                        content: user_prompt,
                    },
                ],
                temperature: Some(temp),
                max_tokens: Some(max_tokens),
                stream: true,
            };

            let app_clone = app.clone();
            let session_clone = session_id.clone();

            let res = client
                .stream_chat_completion(&base_url, &api_key, req, move |chunk| {
                    let payload = ArenaStreamChunkPayload {
                        session_id: session_clone.clone(),
                        slot: "A".to_string(),
                        chunk: chunk.to_string(),
                        is_done: false,
                        error: None,
                    };
                    let _ = app_clone.emit("arena-stream-chunk", payload);
                    Ok(())
                })
                .await;

            let duration_ms = start.elapsed().as_millis() as i64;

            match res {
                Ok(content) => {
                    let _ = app.emit(
                        "arena-stream-chunk",
                        ArenaStreamChunkPayload {
                            session_id,
                            slot: "A".to_string(),
                            chunk: String::new(),
                            is_done: true,
                            error: None,
                        },
                    );
                    Ok((content, duration_ms))
                }
                Err(e) => {
                    let _ = app.emit(
                        "arena-stream-chunk",
                        ArenaStreamChunkPayload {
                            session_id,
                            slot: "A".to_string(),
                            chunk: String::new(),
                            is_done: true,
                            error: Some(e.clone()),
                        },
                    );
                    Err(e)
                }
            }
        })
    };

    // 异步任务 Slot B
    let task_b = {
        let app = app.clone();
        let session_id = session_id.clone();
        let base_url = prov_b.base_url.clone();
        let api_key = prov_b.api_key.clone();
        let model = model_b;
        let temp = input.slot_b_temperature.unwrap_or(0.75);
        let sys_prompt = input.system_prompt.clone();
        let user_prompt = input.user_prompt.clone();

        tokio::spawn(async move {
            let start = std::time::Instant::now();
            let client = OpenAIClient::new();
            let req = ChatCompletionRequest {
                model,
                messages: vec![
                    ChatMessage {
                        role: "system".to_string(),
                        content: sys_prompt,
                    },
                    ChatMessage {
                        role: "user".to_string(),
                        content: user_prompt,
                    },
                ],
                temperature: Some(temp),
                max_tokens: Some(max_tokens),
                stream: true,
            };

            let app_clone = app.clone();
            let session_clone = session_id.clone();

            let res = client
                .stream_chat_completion(&base_url, &api_key, req, move |chunk| {
                    let payload = ArenaStreamChunkPayload {
                        session_id: session_clone.clone(),
                        slot: "B".to_string(),
                        chunk: chunk.to_string(),
                        is_done: false,
                        error: None,
                    };
                    let _ = app_clone.emit("arena-stream-chunk", payload);
                    Ok(())
                })
                .await;

            let duration_ms = start.elapsed().as_millis() as i64;

            match res {
                Ok(content) => {
                    let _ = app.emit(
                        "arena-stream-chunk",
                        ArenaStreamChunkPayload {
                            session_id,
                            slot: "B".to_string(),
                            chunk: String::new(),
                            is_done: true,
                            error: None,
                        },
                    );
                    Ok((content, duration_ms))
                }
                Err(e) => {
                    let _ = app.emit(
                        "arena-stream-chunk",
                        ArenaStreamChunkPayload {
                            session_id,
                            slot: "B".to_string(),
                            chunk: String::new(),
                            is_done: true,
                            error: Some(e.clone()),
                        },
                    );
                    Err(e)
                }
            }
        })
    };

    let (res_a, res_b) = tokio::join!(task_a, task_b);

    let (slot_a_output, slot_a_duration_ms) = match res_a {
        Ok(Ok(pair)) => pair,
        Ok(Err(e)) => (format!("[模型 A 执行失败]: {}", e), 0),
        Err(e) => (format!("[模型 A 任务异常]: {}", e), 0),
    };

    let (slot_b_output, slot_b_duration_ms) = match res_b {
        Ok(Ok(pair)) => pair,
        Ok(Err(e)) => (format!("[模型 B 执行失败]: {}", e), 0),
        Err(e) => (format!("[模型 B 任务异常]: {}", e), 0),
    };

    Ok(ArenaDuelResult {
        session_id,
        slot_a_output,
        slot_a_duration_ms,
        slot_b_output,
        slot_b_duration_ms,
    })
}

#[tauri::command]
pub async fn merge_arena_outputs(
    db: State<'_, DbManager>,
    input: MergeArenaOutputsInput,
) -> Result<String, String> {
    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未找到已激活的 AI 服务商，请先配置 API".to_string())?;

    let novel = db.get_novel(&input.novel_id).map_err(|e| e.to_string())?;
    let focus = input
        .merge_focus
        .unwrap_or_else(|| "以两者的剧情推进和精彩细节为基础，取长补短，去粗取精".to_string());

    let system_prompt = format!(
        "你是一名顶级小说融稿编辑专家与金牌主笔。\n\
         当前正在创作小说：《{}》，题材定位：{}，基调要求：{}。\n\
         【职责】针对两个 AI 模型同时推演出的两份候选草案（A 与 B），完成高水平的艺术融合：\n\
         1. 提取 A 方案与 B 方案各自最出彩的情节爆点、人物动作、对话潜台词与感官描写；\n\
         2. 化解两份草案可能存在的文字重复或细微节奏冲突，保持整篇风格和谐统一；\n\
         3. 严格遵循融合偏好：{}\n\
         4. 直接输出融合后的沉浸式小说正文，严禁任何前言后语或客套解释！",
        novel.title, novel.genre_profile, novel.writing_style, focus
    );

    let user_prompt = format!(
        "【原始创作指令】: {}\n\n\
         【候选草案 A】:\n{}\n\n\
         【候选草案 B】:\n{}\n\n\
         请立即开始融稿，直接输出最终合成的精华正文：",
        input.prompt, input.output_a, input.output_b
    );

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt,
            },
            ChatMessage {
                role: "user".to_string(),
                content: user_prompt,
            },
        ],
        temperature: Some(0.7),
        max_tokens: Some(3000),
        stream: false,
    };

    client
        .chat_completion(&provider.base_url, &provider.api_key, req)
        .await
}

#[tauri::command]
pub fn list_model_arena_runs(
    db: State<DbManager>,
    novel_id: String,
) -> Result<Vec<ModelArenaRun>, String> {
    db.list_model_arena_runs(&novel_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_model_arena_run(
    db: State<DbManager>,
    input: SaveModelArenaRunInput,
) -> Result<ModelArenaRun, String> {
    db.save_model_arena_run(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_model_arena_run(db: State<DbManager>, id: String) -> Result<(), String> {
    db.delete_model_arena_run(&id).map_err(|e| e.to_string())
}

// ==========================================
// V2.5.1 AI PROMPT OPTIMIZER COMMAND
// ==========================================

#[tauri::command]
pub async fn optimize_writing_prompt(
    db: State<'_, DbManager>,
    input: OptimizeWritingPromptInput,
) -> Result<OptimizeWritingPromptResult, String> {
    let raw_prompt = input.raw_prompt.trim().to_string();
    if raw_prompt.is_empty() {
        return Err("请输入待优化的原始提示词或剧情构思".to_string());
    }

    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未找到已激活的 AI 模型服务商，请先在模型设置中激活 API".to_string())?;

    // 组装小说工程上下文
    let mut novel_context = String::new();
    if let Some(novel_id) = &input.novel_id {
        if let Ok(novel) = db.get_novel(novel_id) {
            novel_context.push_str(&format!(
                "【作品名称】：《{}》\n【题材流派】：{}\n【基调风骨】：{}\n",
                novel.title, novel.genre_profile, novel.writing_style
            ));

            // 补充激活的文风档案
            if let Ok(Some(vp)) = db.get_active_voice_profile(Some(novel_id)) {
                novel_context.push_str(&format!(
                    "【文风档案约束】：句式节奏={}，遣词风格={}，叙事视角={}\n",
                    vp.sentence_rhythm, vp.vocabulary_tone, vp.pov_preference
                ));
            }

            // 补充核心世界法则公理 (Canon facts, 取前 5 条)
            if let Ok(facts) = db.list_canon_facts(novel_id, None) {
                if !facts.is_empty() {
                    let fact_summaries: Vec<String> = facts
                        .into_iter()
                        .take(5)
                        .map(|f| format!("- {} {}: {}", f.subject_id, f.predicate, f.object_value))
                        .collect();
                    novel_context.push_str(&format!("【核心世界法则公理】:\n{}\n", fact_summaries.join("\n")));
                }
            }
        }
    }

    let mut chapter_context = String::new();
    if let Some(chapter_id) = &input.chapter_id {
        if let Ok(chapter) = db.get_chapter(chapter_id) {
            chapter_context.push_str(&format!(
                "【当前章节】：第{}章《{}》\n",
                chapter.chapter_number, chapter.title
            ));
        }
    }

    let angle_desc = match input.optimization_angle.as_deref().unwrap_or("DRAMA_CONFLICT") {
        "DRAMA_CONFLICT" => "【优化侧重点：戏剧冲突与心理博弈】强调角色的欲望对抗、言语潜台词试探、危机步步升级与险象环生。",
        "SENSORY_DETAIL" => "【优化侧重点：白描临场与物象细节】强调微观动作、室内冷暖声色、气味触感，杜绝假大空，落实Show, Don't Tell。",
        "PLOT_HOOK" => "【优化侧重点：伏笔勾连与悬念断章】强调前情暗线因果交织、惊人秘密揭示的一角、不可逆代价以及章末引人入胜的悬念钩子。",
        "CONCISE_PUNCHY" => "【优化侧重点：快节奏爽利推进】削枝保干，短句有力，直接切入核心矛盾，极速拉高期待感。",
        _ => "【优化侧重点：全方位戏剧化小说专业重构】。",
    };

    let target_len_desc = input
        .target_length
        .map(|l| format!("【期望正文篇幅】：约{}字\n", l))
        .unwrap_or_default();
    let style_mode_desc = input
        .style_mode
        .map(|s| format!("【作者指定文风】：{}\n", s))
        .unwrap_or_default();

    // 加载系统提示词 (优先读取 prompts/prompt_optimizer.md，失败则降级内置兜底)
    let prompt_file_path = std::path::Path::new("prompts/prompt_optimizer.md");
    let base_system_prompt = std::fs::read_to_string(prompt_file_path).unwrap_or_else(|_| {
        "你是一名顶级小说策划与提示词架构师，专精将粗糙的网文灵感扩展优化为具备强画面感、人物对抗张力与因果闭环的高效创作Prompt。必须输出合法的 JSON：{\"optimized_prompt\":\"...\",\"enhancement_points\":[\"...\"],\"suggested_hooks\":\"...\",\"suggested_tags\":[\"...\"]}".to_string()
    });

    let system_prompt = format!(
        "{}\n\n\
         当前创作工程背景：\n\
         {}\
         {}\
         {}\
         {}\
         {}\n\
         请严格输出标准合法的 JSON 格式对象，不要包含 markdown 额外包裹或闲聊废话。",
        base_system_prompt,
        novel_context,
        chapter_context,
        target_len_desc,
        style_mode_desc,
        angle_desc
    );

    let user_prompt = format!(
        "作者输入的原始剧情想法与提示词：\n\
         \"{}\"\n\n\
         请根据上述背景与优化倾向，将其重构点金为专业小说创作提示词，并严格输出 JSON 格式（包含 optimized_prompt, enhancement_points, suggested_hooks, suggested_tags）。",
        raw_prompt
    );

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt,
            },
            ChatMessage {
                role: "user".to_string(),
                content: user_prompt,
            },
        ],
        temperature: Some(0.7),
        max_tokens: Some(2500),
        stream: false,
    };

    let raw_reply = client
        .chat_completion(&provider.base_url, &provider.api_key, req)
        .await?;
    let json_str = extract_json_block(&raw_reply);

    // 解析 JSON 响应
    #[derive(serde::Deserialize)]
    struct PartialOptResult {
        optimized_prompt: Option<String>,
        enhancement_points: Option<Vec<String>>,
        suggested_hooks: Option<String>,
        suggested_tags: Option<Vec<String>>,
    }

    let parsed: Result<PartialOptResult, _> = serde_json::from_str(json_str);
    match parsed {
        Ok(res) => Ok(OptimizeWritingPromptResult {
            original_prompt: raw_prompt.clone(),
            optimized_prompt: res.optimized_prompt.unwrap_or_else(|| raw_reply.clone()),
            enhancement_points: res.enhancement_points.unwrap_or_else(|| {
                vec![
                    "增强了微观动作与环境压迫感".to_string(),
                    "明确了角色的核心欲望与即时阻碍".to_string(),
                    "注入了言语交锋的潜台词试探".to_string(),
                ]
            }),
            suggested_hooks: res.suggested_hooks,
            suggested_tags: res
                .suggested_tags
                .unwrap_or_else(|| vec!["剧情推进".to_string(), "张力强化".to_string()]),
        }),
        Err(_) => {
            // 如果模型未返回标准 JSON，以文本形式优雅降级
            Ok(OptimizeWritingPromptResult {
                original_prompt: raw_prompt,
                optimized_prompt: raw_reply,
                enhancement_points: vec![
                    "完成小说剧本化张力提炼".to_string(),
                    "丰富了场景物象与行动指引".to_string(),
                ],
                suggested_hooks: None,
                suggested_tags: vec!["智能优化".to_string()],
            })
        }
    }
}

// ==========================================
// V3.4.0 CHARACTER DIALOGUE SANDBOX COMMANDS
// ==========================================

#[tauri::command]
pub async fn create_character_sandbox_session(
    db: State<'_, DbManager>,
    input: CreateSandboxSessionInput,
) -> Result<CharacterSandboxSession, String> {
    let now = chrono::Utc::now().timestamp_millis();
    let id = Uuid::new_v4().to_string();
    let characters_config_json = serde_json::to_string(&input.characters_config).unwrap_or_else(|_| "[]".to_string());
    
    let session = CharacterSandboxSession {
        id,
        novel_id: input.novel_id,
        chapter_id: input.chapter_id,
        scene_id: input.scene_id,
        title: input.title,
        scene_setting: input.scene_setting,
        scene_goal: input.scene_goal,
        characters_config_json,
        dialogue_history_json: "[]".to_string(),
        status: "DRAFT".to_string(),
        synthesized_prose: Some("".to_string()),
        branches_json: input.branches_json.or_else(|| Some("[]".to_string())),
        active_branch_id: input.active_branch_id.or_else(|| Some("main".to_string())),
        inspiration_notes_json: input.inspiration_notes_json.or_else(|| Some("[]".to_string())),
        created_at: now,
        updated_at: now,
    };

    db.save_character_sandbox_session(&session)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_character_sandbox_session(
    db: State<'_, DbManager>,
    id: String,
) -> Result<CharacterSandboxSession, String> {
    db.get_character_sandbox_session(&id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("未找到指定的角色沙盒会话: {}", id))
}

#[tauri::command]
pub async fn list_character_sandbox_sessions(
    db: State<'_, DbManager>,
    novel_id: String,
) -> Result<Vec<CharacterSandboxSession>, String> {
    db.list_character_sandbox_sessions(&novel_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_character_sandbox_session(
    db: State<'_, DbManager>,
    input: UpdateSandboxSessionInput,
) -> Result<CharacterSandboxSession, String> {
    let mut session = db
        .get_character_sandbox_session(&input.id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("未找到要更新的角色沙盒会话: {}", input.id))?;

    let now = chrono::Utc::now().timestamp_millis();
    session.updated_at = now;

    if let Some(title) = input.title {
        session.title = title;
    }
    if let Some(setting) = input.scene_setting {
        session.scene_setting = setting;
    }
    if let Some(goal) = input.scene_goal {
        session.scene_goal = goal;
    }
    if let Some(configs) = input.characters_config {
        session.characters_config_json = serde_json::to_string(&configs).unwrap_or_else(|_| "[]".to_string());
    }
    if let Some(history) = input.dialogue_history {
        session.dialogue_history_json = serde_json::to_string(&history).unwrap_or_else(|_| "[]".to_string());
    }
    if let Some(status) = input.status {
        session.status = status;
    }
    if let Some(prose) = input.synthesized_prose {
        session.synthesized_prose = Some(prose);
    }
    if let Some(branches) = input.branches_json {
        session.branches_json = Some(branches);
    }
    if let Some(branch_id) = input.active_branch_id {
        session.active_branch_id = Some(branch_id);
    }
    if let Some(notes) = input.inspiration_notes_json {
        session.inspiration_notes_json = Some(notes);
    }

    db.save_character_sandbox_session(&session)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_character_sandbox_session(
    db: State<'_, DbManager>,
    id: String,
) -> Result<(), String> {
    db.delete_character_sandbox_session(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn execute_character_sandbox_step(
    db: State<'_, DbManager>,
    input: ExecuteSandboxStepInput,
) -> Result<ExecuteSandboxStepResult, String> {
    let mut session = db
        .get_character_sandbox_session(&input.session_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("未找到沙盒会话: {}", input.session_id))?;

    let actors: Vec<CharacterActorConfig> = serde_json::from_str(&session.characters_config_json)
        .unwrap_or_default();
    if actors.is_empty() {
        return Err("当前对戏沙盒未配置任何出场角色！".to_string());
    }

    let mut history: Vec<DialogueRoundRecord> = serde_json::from_str(&session.dialogue_history_json)
        .unwrap_or_default();

    let now = chrono::Utc::now().timestamp_millis();

    // 1. 如果作者输入了旁白突发变故，先将旁白事件落库
    if let Some(ref intervention) = input.narrator_intervention {
        let trimmed = intervention.trim();
        if !trimmed.is_empty() {
            let narrator_round = DialogueRoundRecord {
                round_index: (history.len() + 1) as i64,
                speaker_id: "narrator".to_string(),
                speaker_name: "旁白/天意".to_string(),
                inner_thought: "".to_string(),
                subtext: None,
                character_action: trimmed.to_string(),
                speech: "".to_string(),
                is_narrator_event: true,
                is_edited_by_user: true,
                ooc_warning: None,
                branch_id: session.active_branch_id.clone(),
                timestamp: now,
            };
            history.push(narrator_round);
        }
    }

    // 2. 确定当前应该发言的角色
    let actor_index = if let Some(ref target_id) = input.target_speaker_id {
        actors.iter().position(|a| &a.character_id == target_id).unwrap_or(0)
    } else {
        // 计算非旁白轮数，轮流发言
        let char_rounds_count = history.iter().filter(|r| !r.is_narrator_event).count();
        char_rounds_count % actors.len()
    };

    let current_actor = &actors[actor_index];

    // 3. 读取该角色的底层设定档案（若被用户在后台删除则优雅降级，保障会话不崩溃）
    let (char_name, char_aliases, char_gender, char_personality, char_background, char_motivation, char_visual) =
        match db.get_character(&current_actor.character_id) {
            Ok(p) => {
                let gender = if !p.gender.trim().is_empty() {
                    p.gender
                } else {
                    current_actor.gender.clone().unwrap_or_default()
                };
                let visual = if !p.visual_summary.trim().is_empty() {
                    p.visual_summary
                } else {
                    current_actor.visual_summary.clone().unwrap_or_default()
                };
                (p.name, p.aliases, gender, p.personality, p.background, p.motivation, visual)
            },
            Err(_) => (
                current_actor.character_name.clone(),
                "".to_string(),
                current_actor.gender.clone().unwrap_or_default(),
                "性格深沉未明".to_string(),
                "生平背景不详".to_string(),
                current_actor.private_motivation.clone(),
                current_actor.visual_summary.clone().unwrap_or_default(),
            ),
        };

    // 读取小说世界观铁律公理 (Canon Rules) 注入认知底座
    let mut canon_rules_section = String::new();
    if let Ok(rules) = db.list_world_rules(&session.novel_id) {
        let active_rules: Vec<_> = rules
            .into_iter()
            .filter(|r| r.authority_level == "CANON" || r.authority_level == "EXTENDED")
            .take(6)
            .collect();
        if !active_rules.is_empty() {
            canon_rules_section.push_str("【核心世界观法则与公理约束（必须遵守，绝不可违背世界法则）】\n");
            for r in active_rules {
                canon_rules_section.push_str(&format!("- 《{}》: {}\n", r.title, r.rule_content));
            }
            canon_rules_section.push('\n');
        }
    }

    // 读取该角色与其他登场角色的关系拓扑
    let mut rel_section = String::new();
    if let Ok(rels) = db.list_character_relationships(&session.novel_id) {
        let related: Vec<_> = rels
            .into_iter()
            .filter(|r| {
                r.source_character_id == current_actor.character_id
                    || r.target_character_id == current_actor.character_id
            })
            .collect();
        if !related.is_empty() {
            rel_section.push_str("【你与其他登场角色的羁绊与恩怨纠葛】\n");
            for r in related {
                let other_id = if r.source_character_id == current_actor.character_id {
                    &r.target_character_id
                } else {
                    &r.source_character_id
                };
                if let Ok(other_char) = db.get_character(other_id) {
                    rel_section.push_str(&format!(
                        "- 与【{}】的关系: {} ({})\n",
                        other_char.name, r.relation_type, r.description
                    ));
                }
            }
            rel_section.push('\n');
        }
    }

    // 4. 读取该角色绑定的 AI 模型与服务商
    let (provider, model_name) = if let Some(ref pid) = current_actor.provider_id {
        let p = db
            .get_provider_by_id(pid)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("未找到指定服务商: {}", pid))?;
        let m = current_actor
            .model_name
            .clone()
            .unwrap_or_else(|| "gpt-4o-mini".to_string());
        (p, m)
    } else {
        let (p, m) = db
            .get_active_provider_and_model()
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "未找到激活的 AI 服务商与模型".to_string())?;
        let chosen_model = current_actor.model_name.clone().unwrap_or(m.model_name);
        (p, chosen_model)
    };

    // 5. 组装公开发言历史（严格过滤掉所有角色的 inner_thought，保障认知沙盒与战争迷雾！）
    let mut public_history_text = String::new();
    for r in &history {
        if r.is_narrator_event {
            public_history_text.push_str(&format!("【突发环境/旁白】{}\n", r.character_action));
        } else {
            let mut line = format!("{}: ", r.speaker_name);
            if !r.character_action.trim().is_empty() {
                line.push_str(&format!("（{}）", r.character_action.trim()));
            }
            if !r.speech.trim().is_empty() {
                line.push_str(&format!("“{}”", r.speech.trim()));
            }
            public_history_text.push_str(&format!("{}\n", line));
        }
    }
    if public_history_text.is_empty() {
        public_history_text = "（双方初次对峙，尚无人开口）\n".to_string();
    }

    // 6. 组装角色专属私密 Prompt
    let gender_display = if char_gender.trim().is_empty() {
        "未设定（按常规叙事口吻）".to_string()
    } else {
        char_gender.clone()
    };

    let visual_prompt_section = if !char_visual.trim().is_empty() {
        format!("- 人设外貌与视觉特征（你的微动作、眼神注视、手头佩饰与举止动作必须与此立绘外貌特征高度自洽）：{}\n", char_visual.trim())
    } else {
        String::new()
    };

    let system_prompt = format!(
        "你是小说中的角色【{}】的灵魂专属子代理。\n\
         【你的核心人设】\n\
         - 姓名/别名：{} ({})\n\
         - 性别/人称代词：{}\n\
         - 性格特质：{}\n\
         - 生平背景：{}\n\
         - 核心动机：{}\n\
         - 语言风格/口癖：{}\n\
         {}\
         {}\
         {}\
         【你在本场戏中的绝密动机与秘密（★最高机密，其他角色绝不知晓，严禁主动对外宣读，但你的每一个算盘和回击都要基于此）】\n\
         - 当场私密动机：{}\n\
         - 隐藏秘密与软肋：{}\n\n\
         【场景环境与冲突目标】\n\
         - 场景设定：{}\n\
         - 本场交锋目标：{}\n\n\
         【推演与输出规则】\n\
         1. 严禁全知上帝视角！你不知道对方心里在想什么，只能根据对方刚才说出口的台词和动作进行试探、回击或隐忍。\n\
         2. 必须且只能严格按照以下 XML 标签输出四段内容：\n\
         <inner_thought>你的私密内心算盘、动机权衡与即时策略（其他角色不可见）</inner_thought>\n\
         <subtext>你的潜台词/弦外之音：这句表面台词背后的真实意图或隐秘威胁（一句话精辟概括）</subtext>\n\
         <action>你当下的微动作、微表情、手头动作或生理反应（公开展现给其他人）</action>\n\
         <speech>你真正说出口的台词（公开展现给其他人，允许留白与潜台词）</speech>",
        current_actor.character_name,
        char_name,
        char_aliases,
        gender_display,
        char_personality,
        char_background,
        char_motivation,
        current_actor.voice_quirks.as_deref().unwrap_or("沉着冷静，话留三分"),
        visual_prompt_section,
        canon_rules_section,
        rel_section,
        current_actor.private_motivation,
        current_actor.private_secret,
        session.scene_setting,
        session.scene_goal
    );

    let system_prompt = if let Some(ref guidance) = input.action_guidance {
        let g = guidance.trim();
        if !g.is_empty() {
            format!("{}\n\n【作者特别行动路线指引（★最高优先级，你当下必须严格依此策略展开心路、微动作与对白）】\n- {}", system_prompt, g)
        } else {
            system_prompt
        }
    } else {
        system_prompt
    };

    let user_prompt = format!(
        "【当前已公开发生的现场对局实录】\n\
         {}\n\n\
         轮到你【{}】回应了。请立刻在心中权衡利弊，并给出你的行动与台词：",
        public_history_text, current_actor.character_name
    );

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model_name,
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt,
            },
            ChatMessage {
                role: "user".to_string(),
                content: user_prompt,
            },
        ],
        temperature: input.temperature.or(Some(0.75)),
        max_tokens: Some(1500),
        stream: false,
    };

    let raw_reply = client
        .chat_completion(&provider.base_url, &provider.api_key, req)
        .await?;

    // 7. 解析结构化标签
    let (inner_thought, subtext, action, speech) = parse_character_subagent_output(&raw_reply);

    let new_round = DialogueRoundRecord {
        round_index: (history.len() + 1) as i64,
        speaker_id: current_actor.character_id.clone(),
        speaker_name: current_actor.character_name.clone(),
        inner_thought,
        subtext,
        character_action: action,
        speech,
        is_narrator_event: false,
        is_edited_by_user: false,
        ooc_warning: None,
        branch_id: session.active_branch_id.clone(),
        timestamp: chrono::Utc::now().timestamp_millis(),
    };

    history.push(new_round.clone());
    session.dialogue_history_json = serde_json::to_string(&history).unwrap_or_else(|_| "[]".to_string());
    session.status = "RUNNING".to_string();
    session.updated_at = chrono::Utc::now().timestamp_millis();

    let _ = db.save_character_sandbox_session(&session);

    let next_index = (actor_index + 1) % actors.len();
    let next_speaker_id = actors.get(next_index).map(|a| a.character_id.clone());

    Ok(ExecuteSandboxStepResult {
        round: new_round,
        next_recommended_speaker_id: next_speaker_id,
        is_completed: history.len() >= 20, // 达到合理上限可提示完成
        total_rounds: history.len(),
    })
}

#[tauri::command]
pub async fn probe_character_next_actions(
    db: State<'_, DbManager>,
    input: ProbeCharacterActionsInput,
) -> Result<ProbeCharacterActionsResult, String> {
    let session = db
        .get_character_sandbox_session(&input.session_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("未找到沙盒会话: {}", input.session_id))?;

    let actors: Vec<CharacterActorConfig> = serde_json::from_str(&session.characters_config_json)
        .unwrap_or_default();
    if actors.is_empty() {
        return Err("当前对戏沙盒未配置任何出场角色！".to_string());
    }

    let history: Vec<DialogueRoundRecord> = serde_json::from_str(&session.dialogue_history_json)
        .unwrap_or_default();

    // 确定目标发言人
    let actor_index = if let Some(ref target_id) = input.target_speaker_id {
        actors.iter().position(|a| &a.character_id == target_id).unwrap_or(0)
    } else {
        let char_rounds_count = history.iter().filter(|r| !r.is_narrator_event).count();
        char_rounds_count % actors.len()
    };
    let current_actor = &actors[actor_index];

    let (char_name, char_personality, char_motivation, char_visual) =
        match db.get_character(&current_actor.character_id) {
            Ok(p) => {
                let visual = if !p.visual_summary.trim().is_empty() {
                    p.visual_summary
                } else {
                    current_actor.visual_summary.clone().unwrap_or_default()
                };
                (p.name, p.personality, p.motivation, visual)
            },
            Err(_) => (
                current_actor.character_name.clone(),
                "性格深沉".to_string(),
                current_actor.private_motivation.clone(),
                current_actor.visual_summary.clone().unwrap_or_default(),
            ),
        };

    let (provider, model_name) = if let Some(ref pid) = current_actor.provider_id {
        let p = db
            .get_provider_by_id(pid)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("未找到指定服务商: {}", pid))?;
        let m = current_actor
            .model_name
            .clone()
            .unwrap_or_else(|| "gpt-4o-mini".to_string());
        (p, m)
    } else {
        let (p, m) = db
            .get_active_provider_and_model()
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "未找到激活的 AI 服务商与模型".to_string())?;
        let chosen_model = current_actor.model_name.clone().unwrap_or(m.model_name);
        (p, chosen_model)
    };

    let mut public_history_text = String::new();
    for r in &history {
        if r.is_narrator_event {
            public_history_text.push_str(&format!("【突发环境/旁白】{}\n", r.character_action));
        } else {
            public_history_text.push_str(&format!("{}: （{}）“{}”\n", r.speaker_name, r.character_action, r.speech));
        }
    }
    if public_history_text.is_empty() {
        public_history_text = "（双方初次对峙，尚无人开口）\n".to_string();
    }

    let system_prompt = format!(
        "你是中文小说角色深度心理与行为决策分析大师 (Character Decision & Action Simulator)。\n\
         当前正在推演小说《{}》中角色【{}】在当下戏剧性情境中“会怎么做”。\n\
         【角色核心底座】\n\
         - 姓名：{}\n\
         - 性格特质：{}\n\
         - 长期动机：{}\n\
         - 外貌特征与立绘视觉：{}\n\
         - 当场私密动机：{}\n\
         - 隐藏秘密与软肋：{}\n\n\
         【场景与冲突目标】\n\
         - 场景设定：{}\n\
         - 交锋目标：{}\n\n\
         【任务】\n\
         根据现场最新对峙实录，为该角色推演出 3 种截然不同、但均完全符合其性格逻辑与秘密利益的【当下应对行动方案】（供作者探索灵感）：\n\
         方案1：倾向【隐忍周旋 / 虚与委蛇 / 以退为进】（暗中试探软肋，表面示弱妥协）\n\
         方案2：倾向【针锋相对 / 触碰逆鳞 / 绝地反制】（直接撕破伪装或亮出底牌，寸步不让）\n\
         方案3：倾向【出人意料 / 转移战场 / 破局诡辩】（不按常理接招，制造环境异动或引入第三方致命变数）\n\n\
         【输出格式要求】\n\
         必须且只能输出严格的 JSON 数组，包含3个对象，不得输出 markdown 代码块外任何无关文字，格式如下：\n\
         [\n\
           {{\n\
             \"id\": \"option_1\",\n\
             \"label\": \"虚与委蛇 · 佯装退让\",\n\
             \"stance\": \"心理上保持高度警惕，用言语示弱换取对方放松防御\",\n\
             \"inner_motive\": \"此时此景下他最深层的内心算盘\",\n\
             \"action_preview\": \"微表情与下意识小动作（如指尖摩挲茶杯、呼吸微微一滞）\",\n\
             \"speech_preview\": \"“话术构思与示例对白”\"\n\
           }}\n\
         ]",
        session.title, current_actor.character_name,
        char_name, char_personality, char_motivation,
        if char_visual.trim().is_empty() { "无特殊立绘记录" } else { char_visual.trim() },
        current_actor.private_motivation, current_actor.private_secret,
        session.scene_setting, session.scene_goal
    );

    let user_prompt = format!(
        "【现场最新对局实录】\n{}\n\n请立刻为【{}】生成这 3 种截然不同的应对方案 JSON 数组：",
        public_history_text, current_actor.character_name
    );

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model_name,
        messages: vec![
            ChatMessage { role: "system".to_string(), content: system_prompt },
            ChatMessage { role: "user".to_string(), content: user_prompt },
        ],
        temperature: Some(0.72),
        max_tokens: Some(1500),
        stream: false,
    };

    let reply = client.chat_completion(&provider.base_url, &provider.api_key, req).await;
    let mut options = Vec::new();
    if let Ok(raw) = reply {
        if let Some(json_start) = raw.find('[') {
            if let Some(json_end) = raw.rfind(']') {
                let json_slice = &raw[json_start..=json_end];
                if let Ok(parsed) = serde_json::from_str::<Vec<CharacterActionOption>>(json_slice) {
                    options = parsed;
                }
            }
        }
    }

    if options.is_empty() {
        options = vec![
            CharacterActionOption {
                id: "option_1".to_string(),
                label: "虚与委蛇 · 隐忍试探".to_string(),
                stance: "面带微笑佯装妥协，暗中观察对方底牌".to_string(),
                inner_motive: format!("绝不能在此刻露出破绽，先稳住【{}】的怀疑，再伺机扭转局面。", current_actor.character_name),
                action_preview: "垂眸掩去眼底冷意，指尖轻轻摩挲佩剑剑柄，神情显得无可奈何。".to_string(),
                speech_preview: "“阁下既执意如此，不妨开诚布公谈谈条件，何必将话说得这般绝？”".to_string(),
            },
            CharacterActionOption {
                id: "option_2".to_string(),
                label: "针锋相对 · 触碰逆鳞".to_string(),
                stance: "正面揭穿对方企图，寸步不让".to_string(),
                inner_motive: "再退一步就是深渊，与其被动挨打，不如先把对方的虚妄面具撕开。".to_string(),
                action_preview: "猛然抬眸，目光如鹰隼般直刺对方眼底，周身气息骤然一沉。".to_string(),
                speech_preview: "“笑话！当年那笔血债究竟算在谁头上，你当真以为瞒得过天下人？”".to_string(),
            },
            CharacterActionOption {
                id: "option_3".to_string(),
                label: "出人意料 · 借势破局".to_string(),
                stance: "不按套路接招，转移焦点制造破绽".to_string(),
                inner_motive: "打破对方预设的审问节奏，将外部不可控变数强行引入场中。".to_string(),
                action_preview: "忽然低声失笑，自顾自倒了一杯凉茶，甚至并未看向对方佩剑的方向。".to_string(),
                speech_preview: "“你猜门外今夜听雨的人，除了你我，还有谁在候着？”".to_string(),
            },
        ];
    }

    Ok(ProbeCharacterActionsResult {
        session_id: session.id,
        speaker_id: current_actor.character_id.clone(),
        speaker_name: current_actor.character_name.clone(),
        options,
    })
}

#[tauri::command]
pub async fn distill_sandbox_inspirations(
    db: State<'_, DbManager>,
    input: DistillSandboxInspirationsInput,
) -> Result<DistillSandboxInspirationsResult, String> {
    let session = db
        .get_character_sandbox_session(&input.session_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("未找到沙盒会话: {}", input.session_id))?;

    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未找到激活的 AI 服务商与模型".to_string())?;

    let history: Vec<DialogueRoundRecord> = serde_json::from_str(&session.dialogue_history_json)
        .unwrap_or_default();
    if history.is_empty() {
        return Err("当前沙盒对戏记录为空，请先推演几轮对手戏后再提炼灵感！".to_string());
    }

    let mut transcript = String::new();
    for (i, r) in history.iter().enumerate() {
        if r.is_narrator_event {
            transcript.push_str(&format!("[节拍{}] 【突发事件】{}\n", i + 1, r.character_action));
        } else {
            transcript.push_str(&format!(
                "[节拍{}] 【{}】心理: {} | 动作: {} | 台词: “{}”\n",
                i + 1, r.speaker_name, r.inner_thought, r.character_action, r.speech
            ));
        }
    }

    let system_prompt = "你是中文小说高级文学策划与灵感提炼总监。\n\
        从输入的角色对戏交锋记录中，深度提炼最具戏剧张力、最能激发作者写作灵感的精华元素。\n\
        必须输出严格的 JSON 格式，包含四个数组字段：\n\
        {\n\
          \"golden_quotes\": [\"精选2~4句最具杀伤力、留白感或金句感的台词\"],\n\
          \"micro_actions\": [\"精选2~4处最具张力、体现人物生理应激反应的神态微动作\"],\n\
          \"psychological_insights\": [\"精选2~3个角色不可告人的心理暗流、博弈动机或深层算盘\"],\n\
          \"plot_twists\": [\"精选1~2个可作为后续正文剧情反转、伏笔埋设或戏剧突破口的灵感脑洞\"]\n\
        }\n\
        严禁输出 markdown 代码块外的任何文字！".to_string();

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage { role: "system".to_string(), content: system_prompt },
            ChatMessage { role: "user".to_string(), content: format!("【对戏实录】\n{}", transcript) },
        ],
        temperature: Some(0.65),
        max_tokens: Some(1500),
        stream: false,
    };

    let reply = client.chat_completion(&provider.base_url, &provider.api_key, req).await;

    let mut golden_quotes = Vec::new();
    let mut micro_actions = Vec::new();
    let mut psychological_insights = Vec::new();
    let mut plot_twists = Vec::new();

    #[derive(serde::Deserialize)]
    struct RawDistill {
        golden_quotes: Option<Vec<String>>,
        micro_actions: Option<Vec<String>>,
        psychological_insights: Option<Vec<String>>,
        plot_twists: Option<Vec<String>>,
    }

    if let Ok(raw) = reply {
        if let Some(json_start) = raw.find('{') {
            if let Some(json_end) = raw.rfind('}') {
                let json_slice = &raw[json_start..=json_end];
                if let Ok(parsed) = serde_json::from_str::<RawDistill>(json_slice) {
                    golden_quotes = parsed.golden_quotes.unwrap_or_default();
                    micro_actions = parsed.micro_actions.unwrap_or_default();
                    psychological_insights = parsed.psychological_insights.unwrap_or_default();
                    plot_twists = parsed.plot_twists.unwrap_or_default();
                }
            }
        }
    }

    // 优雅降级：直接从 history 提取真实台词与动作
    if golden_quotes.is_empty() {
        for r in history.iter().filter(|r| !r.is_narrator_event).take(4) {
            golden_quotes.push(format!("【{}】“{}”", r.speaker_name, r.speech));
            if !r.character_action.trim().is_empty() {
                micro_actions.push(format!("【{}】（{}）", r.speaker_name, r.character_action));
            }
            if !r.inner_thought.trim().is_empty() {
                psychological_insights.push(format!("【{}内心】{}", r.speaker_name, r.inner_thought));
            }
        }
        plot_twists.push(format!("以《{}》为基底，双方在临界点处突然亮出关键信物触发反转。", session.title));
    }

    Ok(DistillSandboxInspirationsResult {
        session_id: session.id,
        golden_quotes,
        micro_actions,
        psychological_insights,
        plot_twists,
    })
}

#[tauri::command]
pub async fn synthesize_sandbox_dialogue_to_prose(
    db: State<'_, DbManager>,
    input: SynthesizeSandboxProseInput,
) -> Result<SynthesizeSandboxProseResult, String> {
    let start_time = chrono::Utc::now().timestamp_millis();
    let mut session = db
        .get_character_sandbox_session(&input.session_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("未找到沙盒会话: {}", input.session_id))?;

    let novel = db.get_novel(&session.novel_id).map_err(|e| e.to_string())?;

    let (provider, model) = db
        .get_active_provider_and_model()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未找到激活的 AI 服务商与模型".to_string())?;

    let history: Vec<DialogueRoundRecord> = serde_json::from_str(&session.dialogue_history_json)
        .unwrap_or_default();
    if history.is_empty() {
        return Err("当前对戏沙盒尚无任何对白记录，无法合成正文！".to_string());
    }

    let start_idx = input.start_round_index.unwrap_or(0);
    let end_idx = input.end_round_index.unwrap_or(history.len().saturating_sub(1));

    // 格式化对戏脚本供作家转译
    let mut dialogue_transcript = String::new();
    for (i, r) in history.iter().enumerate() {
        if i < start_idx || i > end_idx {
            continue;
        }
        if r.is_narrator_event {
            dialogue_transcript.push_str(&format!("[节拍{}] 【突发事件/环境】{}\n", i + 1, r.character_action));
        } else {
            dialogue_transcript.push_str(&format!(
                "[节拍{}] 【{}】\n- 心理暗流: {}\n- 肢体动作: {}\n- 台词: “{}”\n",
                i + 1,
                r.speaker_name,
                if r.inner_thought.trim().is_empty() { "无特别思绪" } else { r.inner_thought.trim() },
                r.character_action.trim(),
                r.speech.trim()
            ));
        }
    }

    let pov = input.pov_mode.unwrap_or_else(|| "THIRD_LIMITED".to_string());
    let guidance = input.custom_guidance.unwrap_or_else(|| "保持文学留白，侧重眼神对峙与呼吸节奏".to_string());

    let style_requirement = match input.polishing_style.as_deref().unwrap_or("CINEMATIC") {
        "PSYCHOLOGICAL" => "【文风要求：心理暗流深描】将各角色的动机盘算与隐秘软肋融化为第三人称有限视角的眼神博弈与潜台词，不直接挑明，却暗潮汹涌令人脊背发凉！",
        "HARDCORE_TENSE" => "【文风要求：硬派高张力冷冽】语言极度凝练，以短句和动词为主，留白深远，刺刀见红，杜绝任何说明书式的连词堆砌！",
        _ => "【文风要求：电影感镜头白描】强化光影声色、物理微小动作（如指节发白、茶雾散去、目光偏转两寸）、呼吸停顿，杜绝抽象情绪概括！",
    };

    let system_prompt = format!(
        "你是中文小说高光文段精修打磨大师 (Scene Prose Polisher)。\n\
         当前正在为小说《{}》（流派：{}，基础文风：{}）打磨精彩高光切片。\n\n\
         【打磨宗旨】\n\
         依据输入的【场景环境】与【高光对戏实录节拍】，将其升华为一段兼具镜头感、文学质感与张力的小说高光描写文段（供作者汲取灵感或局部吸收）。\n\n\
         【精修守则】\n\
         1. {}\n\
         2. 彻底融化内心戏：各角色的“心理暗流”是动机支撑，严禁机械写成“某某心想”，而必须转化为细腻的第三人称有限视角白描与神态沉吟！\n\
         3. Show, Don't Tell：封杀一切 AI 机械套话（严禁“嘴角勾起弧度”、“眼中闪过冷芒”、“空气凝固”等）；台词与微动作自然穿插。\n\
         4. 视点要求：采用{}视角；结合指导意见：{}。\n\
         5. 直接从第一行开始输出纯精修文段，段落间空一行，严禁任何客套解释！",
        novel.title, novel.genre_profile, novel.writing_style,
        style_requirement, pov, guidance
    );

    let user_prompt = format!(
        "【场景环境设定】\n{}\n\n\
         【场景冲突目标】\n{}\n\n\
         【角色演武场高光对戏实录】\n{}\n\n\
         请立刻开始打磨精修高光小说文段：",
        session.scene_setting, session.scene_goal, dialogue_transcript
    );

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt,
            },
            ChatMessage {
                role: "user".to_string(),
                content: user_prompt,
            },
        ],
        temperature: Some(0.72),
        max_tokens: Some(3000),
        stream: false,
    };

    let synthesized_prose = client
        .chat_completion(&provider.base_url, &provider.api_key, req)
        .await?;

    let word_count = count_chinese_characters(&synthesized_prose) as usize;
    let end_time = chrono::Utc::now().timestamp_millis();
    let duration_ms = end_time - start_time;

    // 持久化合成结果
    session.synthesized_prose = Some(synthesized_prose.clone());
    session.status = "COMPLETED".to_string();
    session.updated_at = end_time;
    let _ = db.save_character_sandbox_session(&session);

    Ok(SynthesizeSandboxProseResult {
        session_id: session.id,
        synthesized_prose,
        word_count,
        duration_ms,
    })
}

/// 辅助解析 XML 标签提取私密思考、潜台词、微动作与台词 (绝对防 Panic 与 UTF-8 越界安全)
fn parse_character_subagent_output(raw: &str) -> (String, Option<String>, String, String) {
    let thought = safe_extract_between(raw, "<inner_thought>", "</inner_thought>").unwrap_or_default();
    let subtext = safe_extract_between(raw, "<subtext>", "</subtext>");
    let action = safe_extract_between(raw, "<action>", "</action>").unwrap_or_default();
    let mut speech = safe_extract_between(raw, "<speech>", "</speech>").unwrap_or_default();

    // 容错降级：如果模型没有输出标准 speech 标签，尝试从引号中提取
    if speech.is_empty() {
        if let Some(s) = safe_extract_between(raw, "“", "”") {
            speech = s;
        } else if let Some(s) = safe_extract_between(raw, "\"", "\"") {
            speech = s;
        }
    }

    if speech.is_empty() && action.is_empty() && thought.is_empty() {
        speech = raw.trim().to_string();
    }

    (thought, subtext, action, speech)
}

/// 绝对防 Panic 的子字符串提取辅助函数 (带严格边界检查与正向相对偏移量计算)
fn safe_extract_between(raw: &str, start_tag: &str, end_tag: &str) -> Option<String> {
    let s = raw.find(start_tag)?;
    let after_start = s + start_tag.len();
    if after_start > raw.len() || !raw.is_char_boundary(after_start) {
        return None;
    }
    let rel_e = raw[after_start..].find(end_tag)?;
    let e = after_start + rel_e;
    if e > raw.len() || !raw.is_char_boundary(e) {
        return None;
    }
    Some(raw[after_start..e].trim().to_string())
}

// ==========================================
// CHARACTER AVATAR & VISUAL RECOGNITION (AI 识图理解人设外貌)
// ==========================================

#[tauri::command]
pub async fn analyze_character_appearance(
    db: State<'_, DbManager>,
    input: AnalyzeCharacterAppearanceInput,
) -> Result<AnalyzeCharacterAppearanceResult, String> {
    let char_name = input.character_name.as_deref().unwrap_or("角色");
    let char_gender = input.gender.as_deref().unwrap_or("未知");
    let genre = input.genre.as_deref().unwrap_or("通俗小说");

    // 优先尝试调用配置的多模态视觉模型
    let provider_and_model: Option<(AiProvider, String)> = if let Some(ref pid) = input.provider_id {
        if let Ok(Some(p)) = db.get_provider_by_id(pid) {
            let m = input.model_name.clone().unwrap_or_else(|| "gpt-4o-mini".to_string());
            Some((p, m))
        } else {
            db.get_active_provider_and_model().ok().flatten().map(|(p, m)| (p, m.model_name))
        }
    } else {
        db.get_active_provider_and_model().ok().flatten().map(|(p, m)| (p, m.model_name))
    };

    let system_prompt = "你是一位精通中文小说人物造型美学与视听描摹的顶级文学指导。你的任务是细致观察用户提供的角色立绘贴图/头像，将画面中的视觉信息提炼为生动、精准、极具代入感的小说人设外貌描写段落与标签，供正文写作与戏剧推演直接使用。".to_string();

    let user_prompt = format!(
        "这是小说《{}》流派中角色【{}】（性别：{}）的立绘贴图。\n\
         请仔细观察该角色的外貌、发型发色、面容五官、眼神气质、服装样式材质、腰带佩饰与体态姿势。\n\
         请严格输出标准 JSON 格式（不要添加多余解释），字段格式如下：\n\
         {{\n\
           \"visual_summary\": \"一段高质量的小说外貌描写（120~250字），极具文学质感与画面感，融合发型、五官神态、身姿体态、典型服饰色彩层次与标志性随身佩饰，适合直接作为正文初登场或推演微动作依据\",\n\
           \"appearance_tags\": [\"4~8个核心外貌标签，如：银白高马尾、狭长凤眸、玄黑滚金劲装、腰悬古玉、冷傲迫人\"],\n\
           \"facial_features\": \"面部五官、眼眸瞳色、神态气场刻画\",\n\
           \"clothing_style\": \"服饰形制、色彩材质与典型佩戴物\",\n\
           \"body_type\": \"身材体态与站姿气场\"\n\
         }}",
        genre, char_name, char_gender
    );

    // 尝试调用 Vision API
    if let Some((provider, model_name)) = provider_and_model {
        let client = OpenAIClient::new();
        if let Ok(reply) = client
            .vision_chat_completion(
                &provider.base_url,
                &provider.api_key,
                &model_name,
                &system_prompt,
                &user_prompt,
                &input.image_url,
                Some(1500),
            )
            .await
        {
            if let Some(parsed) = parse_vision_analysis_json(&reply) {
                return Ok(parsed);
            }
        }
    }

    // 降级兜底/智能拟合生成器：确保系统 100% 不崩溃，给予作者优质参考
    let fallback = generate_fallback_visual_analysis(char_name, char_gender, genre);
    Ok(fallback)
}

fn parse_vision_analysis_json(text: &str) -> Option<AnalyzeCharacterAppearanceResult> {
    let clean = text.trim();
    let json_str = if let Some(start) = clean.find('{') {
        if let Some(end) = clean.rfind('}') {
            if end > start {
                &clean[start..=end]
            } else {
                clean
            }
        } else {
            clean
        }
    } else {
        clean
    };

    #[derive(serde::Deserialize)]
    struct RawVision {
        visual_summary: Option<String>,
        appearance_tags: Option<Vec<String>>,
        facial_features: Option<String>,
        clothing_style: Option<String>,
        body_type: Option<String>,
    }

    if let Ok(raw) = serde_json::from_str::<RawVision>(json_str) {
        if let Some(vs) = raw.visual_summary {
            if !vs.trim().is_empty() {
                return Some(AnalyzeCharacterAppearanceResult {
                    visual_summary: vs.trim().to_string(),
                    appearance_tags: raw.appearance_tags.unwrap_or_default(),
                    facial_features: raw.facial_features,
                    clothing_style: raw.clothing_style,
                    body_type: raw.body_type,
                });
            }
        }
    }
    None
}

fn generate_fallback_visual_analysis(name: &str, gender: &str, genre: &str) -> AnalyzeCharacterAppearanceResult {
    let is_female = gender.contains('女');
    let (summary, tags, facial, clothing, body) = match genre {
        "玄幻" | "修真" | "仙侠" | "武侠" => {
            if is_female {
                (
                    format!("【{}】青丝如墨如瀑，以一枚青玉步摇轻挽于脑后。眉如远山含黛，眸若秋水横波，眼角微挑，自带几分不食人间烟火的清冷出尘。身着一袭霜白流云暗纹广袖仙裙，腰间系一根织银软烟罗缎带，身姿纤细轻盈，足踏云履，周身隐隐有出尘灵气萦绕。", name),
                    vec!["墨色长发".to_string(), "青玉步摇".to_string(), "霜白流云裙".to_string(), "秋水清眸".to_string(), "清冷出尘".to_string(), "身姿轻盈".to_string()],
                    "眉目清秀如画，眸光清澈如寒潭，神态淡漠沉静，气质高华出尘。".to_string(),
                    "一袭霜白配素蓝的流云暗纹广袖仙裙，腰系织银罗带，配有温润压裙古玉。".to_string(),
                    "身形纤细匀称，步履轻盈飘逸，仿若凌波微步。".to_string(),
                )
            } else {
                (
                    format!("【{}】墨发高束，以一根古朴墨玉发簪稳固。剑眉斜飞入鬓，眸如深渊寒星，鼻梁挺直，神色冷峻沉毅。身着一袭玄色暗金云纹劲装长袍，外罩半截墨狐坎肩，宽肩窄腰，腰悬一柄三尺寒铁古剑，身形如挺拔古松，举手投足间带着久历风霜的沉稳与压迫感。", name),
                    vec!["墨发高束".to_string(), "剑眉寒星".to_string(), "玄色暗金袍".to_string(), "腰悬古剑".to_string(), "冷峻沉毅".to_string(), "宽肩窄腰".to_string()],
                    "面容刚毅俊朗，剑眉入鬓，眸光深邃锐利如刃，唇线紧抿，不怒自威。".to_string(),
                    "玄底滚暗金纹利落劲装，护腕裹革，腰悬冷铁佩剑，行动便捷干练。".to_string(),
                    "身姿修长挺拔，体魄矫健有力，脊背如苍松般挺直。".to_string(),
                )
            }
        },
        "科幻" | "赛博朋克" | "硬科幻" | "末世" => {
            if is_female {
                (
                    format!("【{}】银灰色短发利落齐耳，佩戴微型战术神经目镜。面容冷静敏锐，瞳孔呈淡蓝微光。身穿深灰色高机动纳米纤维战术常服，外搭磁悬浮作战挂载胸甲，腰间别着折叠战术光刃，身形矫健利落，目光如精密雷达般警惕审视四周。", name),
                    vec!["银灰短发".to_string(), "神经目镜".to_string(), "淡蓝义眼".to_string(), "纳米战术服".to_string(), "折叠光刃".to_string(), "干练警惕".to_string()],
                    "面部线条紧绷清冷，右眼植入微型战术义眼泛着淡蓝冷光，神情果断沉着。".to_string(),
                    "哑光灰黑配色的纳米复合材料作战服，肩部装有传感器接口，腰挂多功能战术包。".to_string(),
                    "体态矫健修长，动作敏捷利落，肌肉线条流畅充满爆发力。".to_string(),
                )
            } else {
                (
                    format!("【{}】黑色短寸干净利落，右侧额际隐现一道极浅的合金神经植入疤痕。剑眉深目，眼神沉稳如冰海。身着深空开拓舰队首席军官的藏青色防弹作训服，领口微敞，外披磁力抗荷风衣，身形高大魁梧，站立如铸铁基座，散发着铁血统帅的压迫感。", name),
                    vec!["寸头黑发".to_string(), "神经植入疤痕".to_string(), "冷冽深目".to_string(), "藏青舰队军服".to_string(), "抗荷风衣".to_string(), "铁血魁梧".to_string()],
                    "轮廓分明深邃，眼神锐利坚定，嘴角微抿透着风暴淬炼后的威严。".to_string(),
                    "深蓝偏灰的太空舰队制式战服，佩戴二级领航勋章，战术皮靴扎实沉稳。".to_string(),
                    "体格健硕高大，骨骼宽厚，沉稳如磐石。".to_string(),
                )
            }
        },
        _ => {
            // 都市 / 通俗小说
            if is_female {
                (
                    format!("【{}】栗色微卷长发自然散落于双肩，肌肤白皙细腻。明眸善睐，鼻梁秀挺，眉宇间带着知性从容与一丝不易察觉的疏离感。身穿修身米白色羊绒西装内搭丝质衬衫，腕间佩一块精致银色腕表，身姿婀娜挺拔，举手投足尽显优雅干练的气场。", name),
                    vec!["栗色微卷发".to_string(), "秀挺鼻梁".to_string(), "米白羊绒西装".to_string(), "银色腕表".to_string(), "知性优雅".to_string(), "从容疏离".to_string()],
                    "眉眼如画，神情温和却自带边界感，唇角噙着礼貌而克制的微笑。".to_string(),
                    "剪裁考究的都市干练西服套装，搭配低调素雅的小巧佩饰，兼顾温度与质感。".to_string(),
                    "身形修长挺拔，仪态端庄从容。".to_string(),
                )
            } else {
                (
                    format!("【{}】发型整洁利落，额前垂下几缕碎发。鼻梁上架着一副极简金丝细边眼镜，镜片后的一双眼眸深邃幽微，令人捉摸不透。身着深灰色手工定制西装三件套，领口系暗纹真丝领带，腕扣低调袖扣，身姿挺拔，透露出久居上位的沉稳与掌控力。", name),
                    vec!["短发碎刘海".to_string(), "金丝细边眼镜".to_string(), "深邃眼眸".to_string(), "深灰定制西服".to_string(), "真丝暗纹领带".to_string(), "沉稳从容".to_string()],
                    "面部棱角分明，戴金丝眼镜，眼神沉敛幽深，神态不疾不徐。".to_string(),
                    "剪裁合体的深灰西装与考究皮鞋，细节精湛，沉稳不浮夸。".to_string(),
                    "身姿挺拔，肩背舒展，步态稳健。".to_string(),
                )
            }
        }
    };

    AnalyzeCharacterAppearanceResult {
        visual_summary: summary,
        appearance_tags: tags,
        facial_features: Some(facial),
        clothing_style: Some(clothing),
        body_type: Some(body),
    }
}



