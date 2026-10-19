use std::io::{self, BufRead, Write};
use serde_json::{json, Value};
use novelforge_ai_lib::database::DbManager;
use novelforge_ai_lib::models::*;

fn main() {
    // 强制将日志输出至 stderr，确保 stdout 纯净用于 JSON-RPC 2.0 传输
    eprintln!("[NovelForge MCP] Starting Model Context Protocol Server (v2.3.3)...");

    let db = match DbManager::new() {
        Ok(d) => {
            eprintln!("[NovelForge MCP] Connected to SQLite database: {}", d.get_db_path());
            d
        }
        Err(e) => {
            eprintln!("[NovelForge MCP] ❌ Failed to connect SQLite database: {}", e);
            std::process::exit(1);
        }
    };

    let stdin = io::stdin();
    let mut stdout = io::stdout();

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => break,
        };

        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let request: Value = match serde_json::from_str(trimmed) {
            Ok(v) => v,
            Err(e) => {
                eprintln!("[NovelForge MCP] Invalid JSON: {}", e);
                let err_res = json!({
                    "jsonrpc": "2.0",
                    "id": Value::Null,
                    "error": {
                        "code": -32700,
                        "message": format!("Parse error: {}", e)
                    }
                });
                let _ = writeln!(stdout, "{}", serde_json::to_string(&err_res).unwrap());
                let _ = stdout.flush();
                continue;
            }
        };

        let method = request["method"].as_str().unwrap_or_default();
        let id = request.get("id").cloned();

        match method {
            "initialize" => {
                let res = json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {
                            "tools": {}
                        },
                        "serverInfo": {
                            "name": "novelforge-ai",
                            "version": "2.3.3"
                        }
                    }
                });
                let _ = writeln!(stdout, "{}", serde_json::to_string(&res).unwrap());
                let _ = stdout.flush();
            }

            "notifications/initialized" | "initialized" => {
                eprintln!("[NovelForge MCP] Client handshake completed.");
            }

            "ping" => {
                let res = json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "result": {}
                });
                let _ = writeln!(stdout, "{}", serde_json::to_string(&res).unwrap());
                let _ = stdout.flush();
            }

            "tools/list" => {
                let tools = get_tools_definition();
                let res = json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "result": {
                        "tools": tools
                    }
                });
                let _ = writeln!(stdout, "{}", serde_json::to_string(&res).unwrap());
                let _ = stdout.flush();
            }

            "tools/call" => {
                let params = &request["params"];
                let tool_name = params["name"].as_str().unwrap_or_default();
                let args = &params["arguments"];

                let call_result = handle_tool_call(&db, tool_name, args);
                let res = match call_result {
                    Ok(text_content) => json!({
                        "jsonrpc": "2.0",
                        "id": id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": text_content
                                }
                            ],
                            "isError": false
                        }
                    }),
                    Err(err_msg) => json!({
                        "jsonrpc": "2.0",
                        "id": id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": err_msg
                                }
                            ],
                            "isError": true
                        }
                    }),
                };
                let _ = writeln!(stdout, "{}", serde_json::to_string(&res).unwrap());
                let _ = stdout.flush();
            }

            other => {
                if let Some(req_id) = id {
                    let err_res = json!({
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "error": {
                            "code": -32601,
                            "message": format!("Method not found: {}", other)
                        }
                    });
                    let _ = writeln!(stdout, "{}", serde_json::to_string(&err_res).unwrap());
                    let _ = stdout.flush();
                }
            }
        }
    }
}

fn get_tools_definition() -> Value {
    json!([
        {
            "name": "novelforge_list_novels",
            "description": "获取当前系统中所有长篇小说作品列表（包含作品ID、书名、简介、流派、文风、累计字数与章节数）",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "novelforge_get_novel",
            "description": "获取指定小说的详细档案和统计数据",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" }
                },
                "required": ["novel_id"]
            }
        },
        {
            "name": "novelforge_create_novel",
            "description": "在系统中创建一部全新的长篇小说项目",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "title": { "type": "string", "description": "小说书名" },
                    "description": { "type": "string", "description": "故事简介或梗概" },
                    "genre_profile": { "type": "string", "description": "作品流派题材（如：东方玄幻、硬核科幻、都市修真、悬疑推理）" },
                    "writing_style": { "type": "string", "description": "叙事文风基调（如：冷峻克制、通俗快节奏、古雅庄重）" },
                    "chapter_target_length": { "type": "integer", "description": "目标单章字数，默认 3000" }
                },
                "required": ["title"]
            }
        },
        {
            "name": "novelforge_update_novel",
            "description": "修改现有小说的作品档案设定（书名、简介、题材、文风）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "id": { "type": "string", "description": "小说作品ID" },
                    "title": { "type": "string", "description": "新的小说书名" },
                    "description": { "type": "string", "description": "新的作品简介" },
                    "genre_profile": { "type": "string", "description": "新的流派题材" },
                    "writing_style": { "type": "string", "description": "新的文风基调" }
                },
                "required": ["id", "title"]
            }
        },
        {
            "name": "novelforge_get_outline",
            "description": "获取指定小说的完整大纲树（部、分卷、章节、场景细纲层级结构）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" }
                },
                "required": ["novel_id"]
            }
        },
        {
            "name": "novelforge_create_volume",
            "description": "在小说中创建新的分卷（Volume）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "title": { "type": "string", "description": "分卷标题，如'第一卷：初入尘世'" },
                    "summary": { "type": "string", "description": "本卷的核心故事大纲与阶段高潮规划" }
                },
                "required": ["novel_id", "title"]
            }
        },
        {
            "name": "novelforge_update_volume",
            "description": "修改现有分卷的标题或大纲概要",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "id": { "type": "string", "description": "分卷ID" },
                    "title": { "type": "string", "description": "新的分卷标题" },
                    "summary": { "type": "string", "description": "新的分卷大纲概要" }
                },
                "required": ["id", "title"]
            }
        },
        {
            "name": "novelforge_list_chapters",
            "description": "获取指定小说的全部章节目录列表（含章节序号、标题、字数、状态）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" }
                },
                "required": ["novel_id"]
            }
        },
        {
            "name": "novelforge_read_chapter",
            "description": "读取指定章节的正文文本、章节目标、字数与版本信息",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "chapter_id": { "type": "string", "description": "章节ID" }
                },
                "required": ["chapter_id"]
            }
        },
        {
            "name": "novelforge_create_chapter",
            "description": "为小说新建一个章节（可指定所属分卷）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "title": { "type": "string", "description": "章节标题，如'第一章：视界边缘的沉鸣'" },
                    "volume_id": { "type": "string", "description": "所属分卷ID（可选）" },
                    "chapter_goal": { "type": "string", "description": "本章的核心创作目标或主要冲突" },
                    "initial_content": { "type": "string", "description": "初始正文内容（可选）" }
                },
                "required": ["novel_id", "title"]
            }
        },
        {
            "name": "novelforge_write_chapter",
            "description": "向指定章节写入或精修正文。系统会自动记录版本控制快照，不可逆安全保障",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "chapter_id": { "type": "string", "description": "章节ID" },
                    "content": { "type": "string", "description": "章节完整正文文本（推荐段首双全角空格规范排版）" },
                    "source_type": { "type": "string", "description": "写入来源，如'AI_MCP_PROSE'" }
                },
                "required": ["chapter_id", "content"]
            }
        },
        {
            "name": "novelforge_update_chapter_title",
            "description": "重命名指定章节的标题",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "chapter_id": { "type": "string", "description": "章节ID" },
                    "title": { "type": "string", "description": "新的章节标题" }
                },
                "required": ["chapter_id", "title"]
            }
        },
        {
            "name": "novelforge_list_characters",
            "description": "查询小说的所有人物档案（性格、外貌特征、核心动机、过往经历）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" }
                },
                "required": ["novel_id"]
            }
        },
        {
            "name": "novelforge_create_character",
            "description": "在小说的人物设定库中录入新角色",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "name": { "type": "string", "description": "角色姓名" },
                    "aliases": { "type": "string", "description": "称号、别名或绰号" },
                    "profile": { "type": "string", "description": "身份定位或外貌特征" },
                    "personality": { "type": "string", "description": "性格特征" },
                    "background": { "type": "string", "description": "经历与出身背景" },
                    "motivation": { "type": "string", "description": "核心行动动机与内心追求" }
                },
                "required": ["novel_id", "name"]
            }
        },
        {
            "name": "novelforge_list_world_rules",
            "description": "读取小说的世界观公理与设定法则（Canon Rules）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" }
                },
                "required": ["novel_id"]
            }
        },
        {
            "name": "novelforge_create_world_rule",
            "description": "创建一条世界观法则，作为后续创作的因果约束",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "title": { "type": "string", "description": "法则名称，如'曲率泡稳定法则'" },
                    "rule_content": { "type": "string", "description": "法则具体公理条文" },
                    "authority_level": { "type": "string", "description": "权威级别：'CANON' 或 'EXTENDED'" }
                },
                "required": ["novel_id", "title", "rule_content"]
            }
        },
        {
            "name": "novelforge_assemble_context",
            "description": "装配指定章节的五层创作记忆包（L0~L4 Context Pack），用于生成正文时的世界观、人物与前情注入",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "chapter_id": { "type": "string", "description": "章节ID" },
                    "prompt_intent": { "type": "string", "description": "创作意图或本场关键情节" }
                },
                "required": ["novel_id", "chapter_id"]
            }
        },
        {
            "name": "novelforge_search_fts",
            "description": "基于 FTS5 对小说全书正文或章节进行全文检索，快速定位伏笔或关键段落",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "query": { "type": "string", "description": "检索关键词，支持中文词或前缀匹配" }
                },
                "required": ["novel_id", "query"]
            }
        },
        {
            "name": "novelforge_export_novel",
            "description": "将小说导出为 TXT 纯文本或标准 EPUB 电子书",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "format": { "type": "string", "enum": ["txt", "epub"], "description": "导出格式：'txt' 或 'epub'" },
                    "output_path": { "type": "string", "description": "自定义保存路径（仅对 epub 有效，可选）" }
                },
                "required": ["novel_id", "format"]
            }
        }
    ])
}

fn handle_tool_call(db: &DbManager, tool_name: &str, args: &Value) -> Result<String, String> {
    match tool_name {
        "novelforge_list_novels" => {
            let novels = db.list_novels().map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&novels).map_err(|e| e.to_string())
        }

        "novelforge_get_novel" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let novel = db.get_novel(novel_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&novel).map_err(|e| e.to_string())
        }

        "novelforge_create_novel" => {
            let title = args["title"].as_str().ok_or("Missing title")?.to_string();
            let description = args["description"].as_str().map(|s| s.to_string());
            let genre_profile = args["genre_profile"].as_str().map(|s| s.to_string());
            let writing_style = args["writing_style"].as_str().map(|s| s.to_string());
            let chapter_target_length = args["chapter_target_length"].as_i64();
            let cover_url = args["cover_url"].as_str().map(|s| s.to_string());

            let novel = db.create_novel(CreateNovelInput {
                title,
                description,
                genre_profile,
                language: Some("zh-CN".to_string()),
                writing_style,
                chapter_target_length,
                series_id: None,
                hierarchy_config: None,
                cover_url,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&novel).map_err(|e| e.to_string())
        }

        "novelforge_update_novel" => {
            let id = args["id"].as_str().ok_or("Missing id")?.to_string();
            let title = args["title"].as_str().ok_or("Missing title")?.to_string();
            let description = args["description"].as_str().map(|s| s.to_string());
            let genre_profile = args["genre_profile"].as_str().map(|s| s.to_string());
            let writing_style = args["writing_style"].as_str().map(|s| s.to_string());
            let cover_url = args["cover_url"].as_str().map(|s| s.to_string());

            let updated = db.update_novel(UpdateNovelInput {
                id,
                title,
                description,
                genre_profile,
                writing_style,
                cover_url,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&updated).map_err(|e| e.to_string())
        }

        "novelforge_get_outline" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let tree = db.get_novel_content_tree(novel_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&tree).map_err(|e| e.to_string())
        }

        "novelforge_create_volume" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let title = args["title"].as_str().ok_or("Missing title")?.to_string();
            let summary = args["summary"].as_str().map(|s| s.to_string());

            let vol = db.create_volume(CreateVolumeInput {
                novel_id,
                part_id: None,
                title,
                summary,
                order_index: None,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&vol).map_err(|e| e.to_string())
        }

        "novelforge_update_volume" => {
            let id = args["id"].as_str().ok_or("Missing id")?.to_string();
            let title = args["title"].as_str().ok_or("Missing title")?.to_string();
            let summary = args["summary"].as_str().map(|s| s.to_string());

            let updated = db.update_volume(UpdateVolumeInput {
                id,
                title,
                summary,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&updated).map_err(|e| e.to_string())
        }

        "novelforge_list_chapters" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let chapters = db.list_chapters(novel_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&chapters).map_err(|e| e.to_string())
        }

        "novelforge_read_chapter" => {
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?;
            let chapter = db.get_chapter(chapter_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&chapter).map_err(|e| e.to_string())
        }

        "novelforge_create_chapter" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let title = args["title"].as_str().ok_or("Missing title")?.to_string();
            let volume_id = args["volume_id"].as_str().map(|s| s.to_string());
            let chapter_goal = args["chapter_goal"].as_str().map(|s| s.to_string());
            let initial_content = args["initial_content"].as_str().map(|s| s.to_string());

            let created = db.create_chapter(CreateChapterInput {
                novel_id,
                part_id: None,
                volume_id,
                chapter_number: None,
                order_index: None,
                title,
                chapter_goal,
                initial_content,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&created).map_err(|e| e.to_string())
        }

        "novelforge_write_chapter" => {
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?;
            let content = args["content"].as_str().ok_or("Missing content")?;
            let source_type = args["source_type"].as_str().unwrap_or("AI_MCP_PROSE");

            let updated = db.save_chapter_content(chapter_id, content, true, source_type).map_err(|e| e.to_string())?;
            let msg = format!("成功保存第 {} 章《{}》正文，累计字数: {} 字，已生成新版本快照。", 
                updated.chapter_number, updated.title, updated.word_count);
            Ok(msg)
        }

        "novelforge_update_chapter_title" => {
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?;
            let title = args["title"].as_str().ok_or("Missing title")?;

            let updated = db.update_chapter_title(chapter_id, title).map_err(|e| e.to_string())?;
            Ok(format!("成功将第 {} 章标题修改为: 《{}》", updated.chapter_number, updated.title))
        }

        "novelforge_list_characters" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let characters = db.list_characters(novel_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&characters).map_err(|e| e.to_string())
        }

        "novelforge_create_character" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let name = args["name"].as_str().ok_or("Missing name")?.to_string();
            let aliases = args["aliases"].as_str().map(|s| s.to_string());
            let profile = args["profile"].as_str().map(|s| s.to_string());
            let personality = args["personality"].as_str().map(|s| s.to_string());
            let background = args["background"].as_str().map(|s| s.to_string());
            let motivation = args["motivation"].as_str().map(|s| s.to_string());

            let char = db.create_character(CreateCharacterInput {
                novel_id,
                name,
                aliases,
                profile,
                personality,
                background,
                motivation,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&char).map_err(|e| e.to_string())
        }

        "novelforge_list_world_rules" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let rules = db.list_world_rules(novel_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&rules).map_err(|e| e.to_string())
        }

        "novelforge_create_world_rule" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let title = args["title"].as_str().ok_or("Missing title")?.to_string();
            let rule_content = args["rule_content"].as_str().ok_or("Missing rule_content")?.to_string();
            let authority_level = args["authority_level"].as_str().map(|s| s.to_string());

            let rule = db.create_world_rule(CreateWorldRuleInput {
                novel_id,
                title,
                rule_content,
                authority_level,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&rule).map_err(|e| e.to_string())
        }

        "novelforge_assemble_context" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?;
            let prompt_intent = args["prompt_intent"].as_str().unwrap_or("编写后续情节");

            let pack = db.assemble_memory_context_pack(novel_id, chapter_id, prompt_intent, None)
                .map_err(|e| e.to_string())?;
            Ok(pack.assembled_system_prompt)
        }

        "novelforge_search_fts" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let query = args["query"].as_str().ok_or("Missing query")?;

            let results = db.search_chapters_fts(novel_id, query).map_err(|e| e.to_string())?;
            let formatted: Vec<Value> = results.into_iter().map(|(id, title, snippet)| {
                json!({
                    "chapter_id": id,
                    "title": title,
                    "snippet": snippet
                })
            }).collect();
            serde_json::to_string_pretty(&formatted).map_err(|e| e.to_string())
        }

        "novelforge_export_novel" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let format = args["format"].as_str().unwrap_or("txt").to_lowercase();

            if format == "epub" {
                let custom_path = args["output_path"].as_str().map(|s| s.to_string());
                let epub_res = db.export_novel_epub(novel_id, custom_path).map_err(|e| e.to_string())?;
                Ok(format!("成功导出标准 EPUB 电子书：\n- 文件路径: {}\n- 文件大小: {} 字节\n- 包含章节: {} 章", 
                    epub_res.file_path, epub_res.file_size, epub_res.chapter_count))
            } else {
                let novel = db.get_novel(novel_id).map_err(|e| e.to_string())?;
                let chapters = db.list_chapters(novel_id).map_err(|e| e.to_string())?;
                let mut out = format!("《{}》\n\n简介：{}\n\n====================\n\n", novel.title, novel.description);
                for ch in chapters {
                    let content = ch.content.as_deref().unwrap_or("（本章暂无正文）");
                    let clean = novelforge_ai_lib::export::html_to_plain_text(content);
                    out.push_str(&format!("第 {} 章 {}\n\n{}\n\n--------------------\n\n", ch.chapter_number, ch.title, clean.trim()));
                }
                Ok(out)
            }
        }

        unknown => Err(format!("Unknown tool: {}", unknown)),
    }
}
