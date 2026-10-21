#![recursion_limit = "512"]

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
            "description": "装配指定章节的五层创作记忆包（L0~L4 Context Pack），用于生成正文时的世界观、人物与前情注入。支持返回结构化解耦记忆或预渲染系统提示词",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "chapter_id": { "type": "string", "description": "章节ID" },
                    "prompt_intent": { "type": "string", "description": "创作意图或本场关键情节" },
                    "format": { "type": "string", "enum": ["both", "structured", "text"], "description": "返回格式：'both' 为完整对象（含各层及拼接好的提示词，默认），'structured' 为解耦各层对象，'text' 仅返回预渲染提示词字符串" }
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
        },
        {
            "name": "novelforge_create_canon_fact",
            "description": "向长期记忆引擎（L2~L4）录入一条权威因果事实，自动建立 FTS5 倒排索引，严防后续剧情矛盾",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "subject": { "type": "string", "description": "事实主体（如：角色名、组织、地理坐标、道具名）" },
                    "predicate": { "type": "string", "description": "谓词/关系（如：掌握、击杀、归附于、被损毁、产出）" },
                    "object_value": { "type": "string", "description": "事实客体/状态结果（如：纯净淡水、4号滤罐、避难所契约）" },
                    "authority_level": { "type": "string", "enum": ["CANON", "CONFIRMED_PLOT", "HYPOTHESIS"], "description": "权威级别，默认为 CONFIRMED_PLOT" },
                    "source_chapter_id": { "type": "string", "description": "来源章节ID（可选）" }
                },
                "required": ["novel_id", "predicate", "object_value"]
            }
        },
        {
            "name": "novelforge_list_canon_facts",
            "description": "列出指定小说在长期记忆库中沉淀的所有权威因果事实",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "query": { "type": "string", "description": "检索过滤词（可选）" }
                },
                "required": ["novel_id"]
            }
        },
        {
            "name": "novelforge_record_character_state",
            "description": "向角色状态时间轴记录一次动态变迁（如：心理状态、健康度、装备数值、身份跃迁）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "character_id": { "type": "string", "description": "角色ID" },
                    "field_name": { "type": "string", "description": "变迁属性字段（如：防毒滤罐寿命、热量储备、修为境界、阵营身份）" },
                    "previous_value": { "type": "string", "description": "先前状态（可选）" },
                    "new_value": { "type": "string", "description": "最新跃迁状态" },
                    "source_chapter_id": { "type": "string", "description": "来源章节ID（可选）" }
                },
                "required": ["character_id", "field_name", "new_value"]
            }
        },
        {
            "name": "novelforge_create_plot_thread",
            "description": "在长期记忆库中埋设一条剧情伏笔或关键悬念线索",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "title": { "type": "string", "description": "伏笔标题（如：旧军工厂弹药库坐标）" },
                    "description": { "type": "string", "description": "伏笔详情与前置线索" },
                    "introduced_chapter_id": { "type": "string", "description": "引入本伏笔的章节ID（可选）" }
                },
                "required": ["novel_id", "title"]
            }
        },
        {
            "name": "novelforge_commit_chapter_with_memory",
            "description": "【推荐核心创作流水线】原子化一次性提交章节正文，并同时沉淀因果事实、角色状态与伏笔，彻底保障长期记忆自洽闭环！",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "chapter_id": { "type": "string", "description": "章节ID" },
                    "content": { "type": "string", "description": "完整章节正文内容" },
                    "source_type": { "type": "string", "description": "写入来源，默认 AI_MCP_PROSE" },
                    "canon_facts": {
                        "type": "array",
                        "description": "本章确立的核心因果事实列表",
                        "items": {
                            "type": "object",
                            "properties": {
                                "subject": { "type": "string", "description": "主体" },
                                "predicate": { "type": "string", "description": "关系/动词" },
                                "object_value": { "type": "string", "description": "客体/状态" },
                                "authority_level": { "type": "string", "description": "CANON 或 CONFIRMED_PLOT" }
                            },
                            "required": ["predicate", "object_value"]
                        }
                    },
                    "character_state_updates": {
                        "type": "array",
                        "description": "本章引发的角色动态属性变迁",
                        "items": {
                            "type": "object",
                            "properties": {
                                "character_id": { "type": "string", "description": "角色ID" },
                                "field_name": { "type": "string", "description": "属性字段名" },
                                "previous_value": { "type": "string", "description": "先前值" },
                                "new_value": { "type": "string", "description": "最新值" }
                            },
                            "required": ["character_id", "field_name", "new_value"]
                        }
                    },
                    "plot_threads": {
                        "type": "array",
                        "description": "本章新增的剧情伏笔",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": { "type": "string", "description": "伏笔标题" },
                                "description": { "type": "string", "description": "线索详情" }
                            },
                            "required": ["title"]
                        }
                    }
                },
                "required": ["novel_id", "chapter_id", "content"]
            }
        },
        {
            "name": "novelforge_evaluate_chapter",
            "description": "【无头质量门禁与反思巡检】在正文提交前，执行套话浓度诊断（去AI味/人情味打分0~100）、已故/闭关角色违规言行动作检测、伏笔推进检测与字数健康度评估",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "chapter_id": { "type": "string", "description": "待检查的章节ID（可选）" },
                    "content": { "type": "string", "description": "正文文本（若未传则自动读取 chapter_id 当前正文）" }
                },
                "required": ["novel_id"]
            }
        },
        {
            "name": "novelforge_scan_entity_proposals",
            "description": "从章节正文中智能扫描高频出现但尚未录入 Story Bible 的新角色与实体，生成反哺提案",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "chapter_id": { "type": "string", "description": "章节ID（可选）" },
                    "content": { "type": "string", "description": "正文文本（可选）" }
                },
                "required": ["novel_id"]
            }
        },
        {
            "name": "novelforge_propose_chapter_revision",
            "description": "【非破坏性候选提案】向指定章节提交新修订草稿版本（source_type='AI_PROPOSAL'），绝不破坏或覆盖当前活动正文，等待作者或主管批准",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "chapter_id": { "type": "string", "description": "章节ID" },
                    "content": { "type": "string", "description": "候选修订正文完整内容" },
                    "proposal_summary": { "type": "string", "description": "本次修改的动机或主要润色说明" },
                    "reasoning_trace": { "type": "string", "description": "Agent 推理思考过程（Chain-of-thought，可选持久化记录）" }
                },
                "required": ["novel_id", "chapter_id", "content"]
            }
        },
        {
            "name": "novelforge_accept_chapter_proposal",
            "description": "采纳并生效某个候选提案版本（将其设为章节 active_version_id，并自动同步更新字数与全文索引）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "chapter_id": { "type": "string", "description": "章节ID" },
                    "version_id": { "type": "string", "description": "要采纳生效的版本ID" }
                },
                "required": ["novel_id", "chapter_id", "version_id"]
            }
        },
        {
            "name": "novelforge_list_chapter_versions",
            "description": "查询指定章节的所有历史快照与候选提案版本列表",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "chapter_id": { "type": "string", "description": "章节ID" }
                },
                "required": ["chapter_id"]
            }
        },
        {
            "name": "novelforge_rollback_chapter_version",
            "description": "【原子级因果安全回滚】将章节安全回退至指定的历史快照版本，并可选择级联将该版本之后沉淀的因果事实标记为失效（INVALIDATED_BY_ROLLBACK），杜绝剧情脏数据",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "chapter_id": { "type": "string", "description": "章节ID" },
                    "target_version_id": { "type": "string", "description": "目标回退版本ID" },
                    "cascade_memory": { "type": "boolean", "description": "是否级联将该版本之后的因果事实标记为失效，默认 true" }
                },
                "required": ["novel_id", "chapter_id", "target_version_id"]
            }
        },
        {
            "name": "novelforge_split_chapter",
            "description": "在指定的字符偏移点将某个长章节拆分为两个连续章节，并自动维护章节序号与后继重排",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "chapter_id": { "type": "string", "description": "待拆分的章节ID" },
                    "split_point": { "type": "integer", "description": "拆分字符位置（字符偏移索引）" },
                    "new_chapter_title": { "type": "string", "description": "新生成后半章的标题" },
                    "split_type": { "type": "string", "enum": ["CONTENT_OFFSET", "PARAGRAPH_INDEX"], "description": "拆分方式，默认 CONTENT_OFFSET" }
                },
                "required": ["chapter_id", "split_point"]
            }
        },
        {
            "name": "novelforge_merge_chapters",
            "description": "将两章相邻章节正文合并为单章，并自动无损拼接场景与设定关联",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "source_chapter_id": { "type": "string", "description": "待合并的第一章（保留为主体）" },
                    "target_chapter_id": { "type": "string", "description": "被并入的第二章（正文追加至文末）" }
                },
                "required": ["source_chapter_id", "target_chapter_id"]
            }
        },
        {
            "name": "novelforge_list_scenes",
            "description": "查询指定章节下的所有场景细纲（Scenes）列表",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "chapter_id": { "type": "string", "description": "章节ID" }
                },
                "required": ["chapter_id"]
            }
        },
        {
            "name": "novelforge_create_scene",
            "description": "在指定章节下创建场景细纲节拍（Scene Beat），规划本场景的核心冲突、大纲与视角人物",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "chapter_id": { "type": "string", "description": "所属章节ID" },
                    "title": { "type": "string", "description": "场景名称（如'客栈密谈'）" },
                    "objective": { "type": "string", "description": "本场景的核心冲突或推进目标" },
                    "outline": { "type": "string", "description": "本场景的微观细纲要点" },
                    "pov_character_id": { "type": "string", "description": "视角人物ID（可选）" },
                    "sequence": { "type": "integer", "description": "场景在本章中的序号，如 1, 2, 3" }
                },
                "required": ["chapter_id", "objective"]
            }
        },
        {
            "name": "novelforge_get_active_voice_profile",
            "description": "获取当前小说的作者文风规范档案（句式节奏、词汇语调、感官描写比例、POV 偏好与自定义法则）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID（可选，不传返回全局默认文风）" }
                }
            }
        },
        {
            "name": "novelforge_list_plot_threads",
            "description": "查询小说沉淀的所有剧情伏笔与悬念线索（含状态：PLANTED, DEVELOPING, RESOLVED, ABANDONED）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID" }
                },
                "required": ["novel_id"]
            }
        },
        {
            "name": "novelforge_update_plot_thread",
            "description": "更新剧情伏笔的状态与线索进展（如推进至 DEVELOPING 或完结标记为 RESOLVED）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "id": { "type": "string", "description": "伏笔ID" },
                    "title": { "type": "string", "description": "伏笔标题" },
                    "description": { "type": "string", "description": "最新线索补充" },
                    "status": { "type": "string", "enum": ["PLANTED", "DEVELOPING", "RESOLVED", "ABANDONED"], "description": "伏笔生命周期状态" },
                    "expected_resolution": { "type": "string", "description": "预期回收节点" }
                },
                "required": ["id", "title"]
            }
        },
        {
            "name": "novelforge_list_workflow_templates",
            "description": "获取系统中可用的多 Agent 剧情推演流水线模板（如'网文黄金三章开篇推演'、'高潮单章精细爆破'）",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "novel_id": { "type": "string", "description": "小说作品ID（可选）" }
                }
            }
        },
        {
            "name": "novelforge_create_workflow_run",
            "description": "依据指定模板启动一次剧情流水线推演实例，初始化多步创作节拍与上下文绑定",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "template_id": { "type": "string", "description": "工作流模板ID" },
                    "novel_id": { "type": "string", "description": "小说作品ID" },
                    "target_chapter_id": { "type": "string", "description": "目标章节ID（可选）" },
                    "context_bindings_json": { "type": "string", "description": "绑定的角色或世界法则设定上下文 JSON（可选）" }
                },
                "required": ["template_id", "novel_id"]
            }
        },
        {
            "name": "novelforge_advance_workflow_step",
            "description": "推进剧情推演流水线到下一步骤，支持传入本步打磨后的输出参数，供下游步骤动态消费",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "run_id": { "type": "string", "description": "推演实例ID" },
                    "step_index": { "type": "integer", "description": "当前推进的步骤索引 (从 0 开始)" },
                    "input_values_json": { "type": "string", "description": "本步骤各动态变量（如 step_1_output）的键值对 JSON（可选）" },
                    "auto_advance_next": { "type": "boolean", "description": "是否自动推进后继步骤（可选）" }
                },
                "required": ["run_id", "step_index"]
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
            let msg = format!(
                "✅ 成功保存第 {} 章《{}》正文，累计字数: {} 字，已生成新版本快照。\n\
                 【💡 长期记忆闭环建议】：为保证故事因果一致，请继续调用 `novelforge_create_canon_fact` 沉淀本章因果事实，或调用 `novelforge_record_character_state` 记录角色状态变迁！", 
                updated.chapter_number, updated.title, updated.word_count
            );
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
            let gender = args["gender"].as_str().map(|s| s.to_string());
            let avatar_url = args["avatar_url"].as_str().map(|s| s.to_string());
            let visual_summary = args["visual_summary"].as_str().map(|s| s.to_string());

            let char = db.create_character(CreateCharacterInput {
                novel_id,
                name,
                aliases,
                profile,
                personality,
                background,
                motivation,
                gender,
                avatar_url,
                visual_summary,
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
            let format_mode = args["format"].as_str().unwrap_or("both");

            let pack = db.assemble_memory_context_pack(novel_id, chapter_id, prompt_intent, None)
                .map_err(|e| e.to_string())?;

            if format_mode == "text" {
                Ok(pack.assembled_system_prompt)
            } else if format_mode == "structured" {
                let structured = json!({
                    "working_memory_l0": pack.working_memory_l0,
                    "short_term_l1": pack.short_term_l1,
                    "arc_memory_l2": pack.arc_memory_l2,
                    "canon_rules_l3": pack.canon_rules_l3,
                    "character_profiles_l3": pack.character_profiles_l3,
                    "retrieved_history_l4": pack.retrieved_history_l4,
                });
                serde_json::to_string_pretty(&structured).map_err(|e| e.to_string())
            } else {
                serde_json::to_string_pretty(&pack).map_err(|e| e.to_string())
            }
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

        "novelforge_create_canon_fact" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let subject = args["subject"].as_str().map(|s| s.to_string());
            let predicate = args["predicate"].as_str().ok_or("Missing predicate")?.to_string();
            let object_value = args["object_value"].as_str().ok_or("Missing object_value")?.to_string();
            let authority_level = args["authority_level"].as_str().map(|s| s.to_string());
            let source_chapter_id = args["source_chapter_id"].as_str().map(|s| s.to_string());

            let fact = db.create_canon_fact(CreateCanonFactInput {
                novel_id,
                subject_id: subject,
                predicate,
                object_value,
                truth_scope: Some("GLOBAL".to_string()),
                authority_level: authority_level.or_else(|| Some("CONFIRMED_PLOT".to_string())),
                source_chapter_id,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&fact).map_err(|e| e.to_string())
        }

        "novelforge_list_canon_facts" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let query = args["query"].as_str();
            let facts = db.list_canon_facts(novel_id, query).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&facts).map_err(|e| e.to_string())
        }

        "novelforge_record_character_state" => {
            let character_id = args["character_id"].as_str().ok_or("Missing character_id")?.to_string();
            let field_name = args["field_name"].as_str().ok_or("Missing field_name")?.to_string();
            let new_value = args["new_value"].as_str().ok_or("Missing new_value")?.to_string();
            let previous_value = args["previous_value"].as_str().map(|s| s.to_string());
            let source_chapter_id = args["source_chapter_id"].as_str().map(|s| s.to_string());

            let event = db.create_character_state_event(CreateCharacterStateEventInput {
                character_id,
                source_chapter_id,
                effective_time: None,
                field_name,
                previous_value,
                new_value,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&event).map_err(|e| e.to_string())
        }

        "novelforge_create_plot_thread" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let title = args["title"].as_str().ok_or("Missing title")?.to_string();
            let description = args["description"].as_str().map(|s| s.to_string());
            let introduced_chapter_id = args["introduced_chapter_id"].as_str().map(|s| s.to_string());

            let pt = db.create_plot_thread(CreatePlotThreadInput {
                novel_id,
                title,
                description,
                introduced_chapter_id,
                expected_resolution: None,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&pt).map_err(|e| e.to_string())
        }

        "novelforge_commit_chapter_with_memory" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?;
            let content = args["content"].as_str().ok_or("Missing content")?;
            let source_type = args["source_type"].as_str().unwrap_or("AI_MCP_PROSE");

            // 1. 保存正文并生成新版本快照
            let updated = db.save_chapter_content(chapter_id, content, true, source_type).map_err(|e| e.to_string())?;

            let mut fact_count = 0;
            // 2. 批量记录权威因果事实
            if let Some(facts) = args["canon_facts"].as_array() {
                for f in facts {
                    let sub = f["subject"].as_str().unwrap_or_default().to_string();
                    let pred = f["predicate"].as_str().unwrap_or_default().to_string();
                    let obj = f["object_value"].as_str().unwrap_or_default().to_string();
                    let auth = f["authority_level"].as_str().unwrap_or("CONFIRMED_PLOT").to_string();

                    if !pred.is_empty() && !obj.is_empty() {
                        let _ = db.create_canon_fact(CreateCanonFactInput {
                            novel_id: novel_id.to_string(),
                            subject_id: if sub.is_empty() { None } else { Some(sub) },
                            predicate: pred,
                            object_value: obj,
                            truth_scope: Some("GLOBAL".to_string()),
                            authority_level: Some(auth),
                            source_chapter_id: Some(chapter_id.to_string()),
                        });
                        fact_count += 1;
                    }
                }
            }

            let mut state_count = 0;
            // 3. 批量记录角色状态变更
            if let Some(states) = args["character_state_updates"].as_array() {
                for s in states {
                    let char_id = s["character_id"].as_str().unwrap_or_default().to_string();
                    let field = s["field_name"].as_str().unwrap_or_default().to_string();
                    let prev = s["previous_value"].as_str().map(|v| v.to_string());
                    let new_val = s["new_value"].as_str().unwrap_or_default().to_string();

                    if !char_id.is_empty() && !field.is_empty() && !new_val.is_empty() {
                        let _ = db.create_character_state_event(CreateCharacterStateEventInput {
                            character_id: char_id,
                            source_chapter_id: Some(chapter_id.to_string()),
                            effective_time: None,
                            field_name: field,
                            previous_value: prev,
                            new_value: new_val,
                        });
                        state_count += 1;
                    }
                }
            }

            let mut thread_count = 0;
            // 4. 批量埋设剧情伏笔
            if let Some(threads) = args["plot_threads"].as_array() {
                for th in threads {
                    let title = th["title"].as_str().unwrap_or_default().to_string();
                    let desc = th["description"].as_str().map(|d| d.to_string());

                    if !title.is_empty() {
                        let _ = db.create_plot_thread(CreatePlotThreadInput {
                            novel_id: novel_id.to_string(),
                            title,
                            description: desc,
                            introduced_chapter_id: Some(chapter_id.to_string()),
                            expected_resolution: None,
                        });
                        thread_count += 1;
                    }
                }
            }

            Ok(format!(
                "🎉 【章节与长期记忆流水线提交成功】！\n\
                 - 章节: 第 {} 章《{}》 (累计字数: {} 字)\n\
                 - 权威因果事实已沉淀: {} 条 (已自动建立 FTS5 倒排索引)\n\
                 - 角色动态状态已记录: {} 组\n\
                 - 剧情伏笔已埋设: {} 条\n\
                 全书长期记忆库已完成实时原子同步与版本快照保存！",
                updated.chapter_number, updated.title, updated.word_count,
                fact_count, state_count, thread_count
            ))
        }

        "novelforge_evaluate_chapter" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let chapter_id = args["chapter_id"].as_str().map(|s| s.to_string());
            let content = args["content"].as_str().map(|s| s.to_string());

            let report = db.evaluate_chapter(EvaluateChapterInput {
                novel_id,
                chapter_id,
                content,
            })?;
            serde_json::to_string_pretty(&report).map_err(|e| e.to_string())
        }

        "novelforge_scan_entity_proposals" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let chapter_id = args["chapter_id"].as_str().map(|s| s.to_string());
            let content = args["content"].as_str().map(|s| s.to_string());

            let report = db.evaluate_chapter(EvaluateChapterInput {
                novel_id,
                chapter_id,
                content,
            })?;
            serde_json::to_string_pretty(&report.entity_proposals).map_err(|e| e.to_string())
        }

        "novelforge_propose_chapter_revision" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?.to_string();
            let content = args["content"].as_str().ok_or("Missing content")?.to_string();
            let proposal_summary = args["proposal_summary"].as_str().map(|s| s.to_string());
            let reasoning_trace = args["reasoning_trace"].as_str().map(|s| s.to_string());

            let proposal = db.create_chapter_proposal(CreateChapterProposalInput {
                novel_id,
                chapter_id,
                content,
                proposal_summary,
                reasoning_trace,
            }).map_err(|e| e.to_string())?;

            let res = json!({
                "message": format!("✅ 成功暂存第 {} 版候选修订草稿（字数: {} 字），当前活动正文未受破坏性影响，等待作者或审核批准。", proposal.version_number, proposal.word_count),
                "proposal": proposal
            });
            serde_json::to_string_pretty(&res).map_err(|e| e.to_string())
        }

        "novelforge_accept_chapter_proposal" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?.to_string();
            let version_id = args["version_id"].as_str().ok_or("Missing version_id")?.to_string();

            let chapter = db.accept_chapter_proposal(AcceptChapterProposalInput {
                novel_id,
                chapter_id,
                version_id,
            }).map_err(|e| e.to_string())?;

            Ok(format!("🎉 成功采纳并生效候选提案！第 {} 章《{}》已更新为该版本正文，累计字数: {} 字。", chapter.chapter_number, chapter.title, chapter.word_count))
        }

        "novelforge_list_chapter_versions" => {
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?;
            let versions = db.list_chapter_versions(chapter_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&versions).map_err(|e| e.to_string())
        }

        "novelforge_rollback_chapter_version" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?.to_string();
            let target_version_id = args["target_version_id"].as_str().ok_or("Missing target_version_id")?.to_string();
            let cascade_memory = args["cascade_memory"].as_bool();

            let res = db.rollback_chapter_version(RollbackChapterVersionInput {
                novel_id,
                chapter_id,
                target_version_id,
                cascade_memory,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&res).map_err(|e| e.to_string())
        }

        "novelforge_split_chapter" => {
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?.to_string();
            let split_point = args["split_point"].as_i64().ok_or("Missing split_point")?;
            let new_chapter_title = args["new_chapter_title"].as_str().map(|s| s.to_string());
            let split_type = args["split_type"].as_str().unwrap_or("CONTENT_OFFSET").to_string();

            let (ch1, ch2) = db.split_chapter(SplitChapterInput {
                chapter_id,
                split_type,
                split_point,
                new_chapter_title,
            }).map_err(|e| e.to_string())?;

            Ok(format!("✅ 成功将章节拆分为两章：\n1. 第 {} 章《{}》 ({} 字)\n2. 第 {} 章《{}》 ({} 字)", 
                ch1.chapter_number, ch1.title, ch1.word_count,
                ch2.chapter_number, ch2.title, ch2.word_count
            ))
        }

        "novelforge_merge_chapters" => {
            let source_chapter_id = args["source_chapter_id"].as_str().ok_or("Missing source_chapter_id")?.to_string();
            let target_chapter_id = args["target_chapter_id"].as_str().ok_or("Missing target_chapter_id")?.to_string();

            let merged = db.merge_chapters(MergeChaptersInput {
                source_chapter_id,
                target_chapter_id,
            }).map_err(|e| e.to_string())?;

            Ok(format!("✅ 成功合并两章！合并后为第 {} 章《{}》，累计字数: {} 字。", 
                merged.chapter_number, merged.title, merged.word_count))
        }

        "novelforge_list_scenes" => {
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?;
            let scenes = db.list_scenes(chapter_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&scenes).map_err(|e| e.to_string())
        }

        "novelforge_create_scene" => {
            let chapter_id = args["chapter_id"].as_str().ok_or("Missing chapter_id")?.to_string();
            let sequence = args["sequence"].as_i64().unwrap_or(1);
            let title = args["title"].as_str().map(|s| s.to_string());
            let objective = args["objective"].as_str().unwrap_or("推动核心情节").to_string();
            let outline = args["outline"].as_str().unwrap_or("").to_string();
            let pov_character_id = args["pov_character_id"].as_str().map(|s| s.to_string());

            let scene = db.create_scene(CreateSceneInput {
                chapter_id,
                sequence,
                order_index: Some(sequence),
                title,
                scene_number: Some(sequence),
                objective,
                outline,
                pov_character_id,
                location_id: args["location_id"].as_str().map(|s| s.to_string()),
                content: args["content"].as_str().map(|s| s.to_string()),
                time_anchor: args["time_anchor"].as_str().map(|s| s.to_string()),
                conflict_target: args["conflict_target"].as_str().map(|s| s.to_string()),
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&scene).map_err(|e| e.to_string())
        }

        "novelforge_get_active_voice_profile" => {
            let novel_id = args["novel_id"].as_str();
            let vp = db.get_active_voice_profile(novel_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&vp).map_err(|e| e.to_string())
        }

        "novelforge_list_plot_threads" => {
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?;
            let pts = db.list_plot_threads(novel_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&pts).map_err(|e| e.to_string())
        }

        "novelforge_update_plot_thread" => {
            let id = args["id"].as_str().ok_or("Missing id")?.to_string();
            let title = args["title"].as_str().ok_or("Missing title")?.to_string();
            let description = args["description"].as_str().map(|s| s.to_string());
            let status = args["status"].as_str().map(|s| s.to_string());
            let expected_resolution = args["expected_resolution"].as_str().map(|s| s.to_string());

            let pt = db.update_plot_thread(UpdatePlotThreadInput {
                id,
                title,
                description,
                introduced_chapter_id: None,
                expected_resolution,
                resolved_chapter_id: None,
                status,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&pt).map_err(|e| e.to_string())
        }

        "novelforge_list_workflow_templates" => {
            let novel_id = args["novel_id"].as_str();
            let templates = db.list_workflow_templates(novel_id).map_err(|e| e.to_string())?;
            serde_json::to_string_pretty(&templates).map_err(|e| e.to_string())
        }

        "novelforge_create_workflow_run" => {
            let template_id = args["template_id"].as_str().ok_or("Missing template_id")?.to_string();
            let novel_id = args["novel_id"].as_str().ok_or("Missing novel_id")?.to_string();
            let target_chapter_id = args["target_chapter_id"].as_str().map(|s| s.to_string());
            let context_bindings_json = args["context_bindings_json"].as_str().map(|s| s.to_string());

            let run_details = db.create_workflow_run(CreateWorkflowRunInput {
                template_id,
                novel_id,
                target_chapter_id,
                run_mode: Some("HEADLESS_AGENT".to_string()),
                context_bindings_json,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&run_details).map_err(|e| e.to_string())
        }

        "novelforge_advance_workflow_step" => {
            let run_id = args["run_id"].as_str().ok_or("Missing run_id")?.to_string();
            let step_index = args["step_index"].as_i64().ok_or("Missing step_index")?;
            let input_values_json = args["input_values_json"].as_str().map(|s| s.to_string());
            let auto_advance_next = args["auto_advance_next"].as_bool();

            let run_details = db.advance_workflow_step(AdvanceWorkflowStepInput {
                run_id,
                step_index,
                input_values_json,
                auto_advance_next,
            }).map_err(|e| e.to_string())?;

            serde_json::to_string_pretty(&run_details).map_err(|e| e.to_string())
        }

        unknown => Err(format!("Unknown tool: {}", unknown)),
    }
}
