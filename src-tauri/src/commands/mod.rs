use tauri::{AppHandle, Emitter, State};

use crate::database::DbManager;
use crate::models::{
    AiModel, AiProvider, Chapter, ChapterVersion, Character, CreateChapterInput,
    CreateCharacterInput, CreateNovelInput, CreatePlotThreadInput, CreateWorldRuleInput,
    GenerateStreamInput, Novel, PlotThread, SaveProviderInput, StreamChunkPayload, Volume,
    WorldRule,
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
