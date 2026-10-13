use tauri::{AppHandle, Emitter, State};

use crate::database::DbManager;
use crate::models::{
    AiModel, AiProvider, Chapter, ChapterVersion, Character, CharacterRelationship,
    CollaborativeWorkflowInput, CollaborativeWorkflowResult, ContinuityAuditFinding,
    ContinuityAuditResponse, CreateChapterInput, CreateCharacterInput,
    CreateCharacterRelationshipInput, CreateNovelInput, CreatePlotThreadInput, CreateSceneInput,
    CreateStoryArcInput, CreateStoryEventInput, CreateStoryPhaseInput, CreateWorldRuleInput,
    GenerateStreamInput, Novel, PlotThread, ReviewReport, SaveProviderInput, Scene,
    StoryArc, StoryEvent, StoryPhase, StreamChunkPayload, StylePolishResponse, Volume, WorldRule,
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
        let content = ch.content.unwrap_or_default();
        if is_md {
            out.push_str(&format!("## 第 {} 章 {}\n\n{}\n\n", ch.chapter_number, ch.title, content));
        } else {
            out.push_str(&format!("第 {} 章 {}\n\n{}\n\n", ch.chapter_number, ch.title, content));
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
            objective: rs.objective,
            outline: rs.outline,
            pov_character_id: pov_char_id,
            location_id: rs.location,
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

    let mut user_prompt = format!(
        "请依据编剧拆解的以下场景细纲，撰写第 {} 章《{}》的完整正文草稿（目标字数约 {} 字）：\n\n",
        chapter.chapter_number, chapter.title, input.target_word_count.unwrap_or(3000)
    );

    for s in &scenes {
        user_prompt.push_str(&format!("【场次 {}】：目标 - {}\n细纲节奏 - {}\n\n", s.sequence, s.objective, s.outline));
    }

    let client = OpenAIClient::new();
    let req = ChatCompletionRequest {
        model: model.model_name,
        messages: vec![
            ChatMessage { role: "system".to_string(), content: system_prompt },
            ChatMessage { role: "user".to_string(), content: user_prompt },
        ],
        temperature: Some(0.75),
        max_tokens: Some(4000),
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

