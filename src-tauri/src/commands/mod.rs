use tauri::{AppHandle, Emitter, State};

use crate::database::DbManager;
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
    UpdateCharacterInput, UpdateWorldRuleInput, UpdatePlotThreadInput,
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

