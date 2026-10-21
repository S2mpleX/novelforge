use std::collections::{HashMap, HashSet};
use regex::Regex;
use crate::database::DbManager;
use crate::models::{
    ClicheMatch, ConsistencyIssue, EntityProposal, EvaluationReport,
};

pub struct RuleDef {
    pub key: &'static str,
    pub label: &'static str,
    pub pattern: &'static str,
    pub hint: &'static str,
}

const RED_CLICHE_RULES: &[RuleDef] = &[
    RuleDef {
        key: "notA-butB",
        label: "「不是A，而是B」假靶子句式",
        pattern: r"不是[^。！？，]{1,18}[，,]?\s*而是",
        hint: "三毒句式之首：假靶子/同义替换。建议删除前半句直接写事实，或改写散句",
    },
    RuleDef {
        key: "parallel-three",
        label: "同构工整排比",
        pattern: r"有的[^。；]{1,20}有的[^。；]{1,20}有的|一边[^。；]{1,20}一边[^。；]{1,20}一边",
        hint: "同构排比是AI检测器高度敏感特征，建议保留最关键一条，其余改写为参差白描",
    },
    RuleDef {
        key: "eye-flash",
        label: "「眼中闪过一丝」脸谱眼神",
        pattern: r"(眼中|眼里|眼底|眸中|眸子)闪过[一哪怕丝抹缕]?",
        hint: "三字鉴定词级AI指纹。建议改为微动作：他垂下眼，或是神色未变",
    },
    RuleDef {
        key: "mouth-curve",
        label: "「嘴角勾起/扯出」刻板抽搐",
        pattern: r"嘴角(勾起|微微?上扬|掠过|浮现|扯出|挑起)",
        hint: "典型网文脸谱化套话。建议白描具体神情或不写多余面部表情",
    },
    RuleDef {
        key: "heart-surge",
        label: "「心中涌起/一震」抽象说明",
        pattern: r"(心中|心头|心底)(涌起|泛起|掠过|一震|一动|一紧|暗道)",
        hint: "抽象情绪外化套话。建议以生理反应替代：手微不可察地一颤 / 喉咙发紧",
    },
    RuleDef {
        key: "dai-zhe",
        label: "「，带着…」万能状语尾巴",
        pattern: r"[，,]带着[一哪怕丝抹股种几分]",
        hint: "万能状语导致句式僵化。建议拆为独立动作短句",
    },
    RuleDef {
        key: "shen-xi",
        label: "「深吸一口气」公式化呼吸",
        pattern: r"深吸(了一口|一口)气?",
        hint: "高频机械动作。建议替换为与具体环境物象的交互",
    },
    RuleDef {
        key: "sh-fang-fu",
        label: "「仿佛/犹如…一般」廉价比喻",
        pattern: r"(仿佛|犹如|宛若|如同)[^。！？]{1,24}(一般|般|似的)",
        hint: "虚浮比喻，建议删去比喻词，直接白描视觉实体",
    },
    RuleDef {
        key: "bu-rong-zhi-yi",
        label: "「不容置疑/不易察觉」上帝视角判定",
        pattern: r"不容置疑|不容置喙|不易察觉|毋庸置疑",
        hint: "直接下判断剥夺了读者推理感。建议通过声音、停顿等细节展示",
    },
    RuleDef {
        key: "explaining-connect",
        label: "「首先/其次/总而言之」说明文过渡",
        pattern: r"(首先|其次|再者)[，、]|综上所述|总而言之|值得一提的是|值得注意的是|不难发现|由此可见|不可否认的是",
        hint: "典型公文说明文报幕词，小说中禁止出现，请直接描写故事发生",
    },
    RuleDef {
        key: "cold-air",
        label: "「倒吸一口凉气」套路惊叹",
        pattern: r"倒吸(了一口|一口)凉气",
        hint: "网文高频降智套话。建议描写围观者的神情凝滞或鸦雀无声",
    },
    RuleDef {
        key: "air-freeze",
        label: "「空气凝固」环境套话",
        pattern: r"空气(仿佛|似乎|宛如)?凝固",
        hint: "俗套环境形容。可描写具体物象：火把劈啪作响、烛火微晃",
    },
    RuleDef {
        key: "bu-de-bu-shuo",
        label: "「不得不说」评论员口吻",
        pattern: r"不得不说|说实话|坦白讲",
        hint: "破坏叙事沉浸感的作者私货口吻，请直接删除",
    },
    RuleDef {
        key: "tan-qi",
        label: "「轻叹了一口气」机械叹息",
        pattern: r"轻叹(了一口|一口)气|幽幽叹(了一口|一口)气",
        hint: "高频填充叹词，若非关键情节建议精简",
    },
];

pub fn strip_html(html: &str) -> String {
    let mut in_tag = false;
    let mut out = String::with_capacity(html.len());
    for c in html.chars() {
        if c == '<' {
            in_tag = true;
        } else if c == '>' {
            in_tag = false;
        } else if !in_tag {
            out.push(c);
        }
    }
    out.replace("&nbsp;", " ")
        .replace("&quot;", "\"")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&amp;", "&")
}

pub fn safe_snippet(text: &str, byte_start: usize, byte_end: usize, lead_chars: usize, trail_chars: usize) -> String {
    let start_idx = text[..byte_start]
        .char_indices()
        .rev()
        .nth(lead_chars)
        .map(|(i, _)| i)
        .unwrap_or(0);

    let end_idx = text[byte_end..]
        .char_indices()
        .nth(trail_chars)
        .map(|(i, _)| byte_end + i)
        .unwrap_or(text.len());

    text[start_idx..end_idx].replace('\n', " ").trim().to_string()
}

pub fn count_chinese_characters(text: &str) -> usize {
    text.chars().filter(|c| !c.is_whitespace()).count()
}

pub fn evaluate_chapter_content(
    db: &DbManager,
    novel_id: &str,
    chapter_id: Option<&str>,
    raw_content: &str,
) -> Result<EvaluationReport, String> {
    let clean_text = strip_html(raw_content);
    let word_count = count_chinese_characters(&clean_text);
    let reading_time_minutes = (word_count / 400).max(1);

    // 1. 套话与 AI 味红线检测
    let mut cliche_matches: Vec<ClicheMatch> = Vec::new();
    for rule in RED_CLICHE_RULES {
        if let Ok(re) = Regex::new(rule.pattern) {
            for m in re.find_iter(&clean_text) {
                let start = m.start();
                let end = m.end();
                let matched_text = m.as_str().to_string();

                let excerpt = safe_snippet(&clean_text, start, end, 15, 20);

                cliche_matches.push(ClicheMatch {
                    rule_key: rule.key.to_string(),
                    label: rule.label.to_string(),
                    matched_text,
                    excerpt,
                    suggestion: rule.hint.to_string(),
                });
            }
        }
    }

    // 2. 世界观与角色生命状态巡检
    let mut consistency_issues: Vec<ConsistencyIssue> = Vec::new();
    let characters = db.list_characters(novel_id).unwrap_or_default();
    let plot_threads = db.list_plot_threads(novel_id).unwrap_or_default();

    let dead_statuses = ["死亡", "DECEASED", "阵亡", "陨落", "殉职", "消亡"];
    let secluded_statuses = ["闭关", "SECLUDED", "休眠", "冷冻", "潜伏", "隔离", "失联", "潜修"];

    let action_re = Regex::new(r"说道|沉声道|冷笑|拔剑|站起身|迈步|出手|喝道|皱眉|手中|冷哼").unwrap();
    let memory_re = Regex::new(r"想起|回忆|墓|遗物|死于|祭奠|魂魄|往昔|已故|曾经").unwrap();

    let sentences: Vec<&str> = clean_text
        .split(|c| c == '。' || c == '！' || c == '？' || c == '\n')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();

    for char in &characters {
        let name = char.name.trim();
        if name.is_empty() {
            continue;
        }

        let is_dead = dead_statuses.iter().any(|&s| char.status == s);
        let is_secluded = secluded_statuses.iter().any(|&s| char.status == s);

        for s in &sentences {
            if s.contains(name) {
                if is_dead && action_re.is_match(s) && !memory_re.is_match(s) {
                    consistency_issues.push(ConsistencyIssue {
                        issue_type: "DECEASED_CHARACTER_ACTION".to_string(),
                        severity: "CRITICAL".to_string(),
                        title: format!("已故角色【{}】检出违规动作/对话", name),
                        description: format!("角色【{}】生命状态为死亡，但在文中呈现主动动作：「{}」", name, s),
                        target_entity: Some(name.to_string()),
                        suggestion: "若角色确已身亡，请改为回忆视角；若属复活或假死，请先在角色档案中流转状态。".to_string(),
                    });
                    break;
                }

                if is_secluded {
                    consistency_issues.push(ConsistencyIssue {
                        issue_type: "SECLUDED_CHARACTER".to_string(),
                        severity: "WARNING".to_string(),
                        title: format!("处于闭关/隐匿状态的角色【{}】现身", name),
                        description: format!("角色【{}】当前状态为「{}」，但在本段落中被提及并活动", name, char.status),
                        target_entity: Some(name.to_string()),
                        suggestion: "请确认剧情是否已安排其出关，若已出关请同步更新其档案状态。".to_string(),
                    });
                    break;
                }
            }
        }
    }

    // 伏笔线索巡检
    for pt in &plot_threads {
        if pt.status == "PLANTED" {
            // 简单提示该伏笔可能需要跟进
            if clean_text.contains(&pt.title) {
                consistency_issues.push(ConsistencyIssue {
                    issue_type: "THREAD_MENTIONED".to_string(),
                    severity: "INFO".to_string(),
                    title: format!("伏笔【{}】被本章正文激活推进", pt.title),
                    description: format!("本章正文关联了伏笔《{}》，建议在完稿时流转其状态至 DEVELOPING 或 RESOLVED。", pt.title),
                    target_entity: Some(pt.title.clone()),
                    suggestion: "可调用 novelforge_update_plot_thread 工具更新线索进展。".to_string(),
                });
            }
        }
    }

    // 单章字数异常巡检
    let target_len = db.get_novel_target_length(novel_id);
    if target_len > 0 {
        let target = target_len as usize;
        if word_count < (target * 4) / 10 && word_count > 0 {
            consistency_issues.push(ConsistencyIssue {
                issue_type: "WORD_COUNT_ANOMALY".to_string(),
                severity: "WARNING".to_string(),
                title: "正文字数偏少".to_string(),
                description: format!("当前字数 {} 字，严重低于作品预设单章目标 {} 字的 40%", word_count, target),
                target_entity: None,
                suggestion: "建议扩充场景细节、人物微动作或环境铺垫，充实单章体量。".to_string(),
            });
        }
    }

    // 3. 未登记新角色/实体提案自动扫描
    let mut entity_proposals: Vec<EntityProposal> = Vec::new();
    let existing_names: HashSet<String> = characters.iter().map(|c| c.name.trim().to_string()).collect();
    let invalid_prefixes: HashSet<&'static str> = [
        "有人", "众人", "所有人", "几个", "两人", "那名", "这名", "对方", "老者", "少年", "青年",
        "女子", "掌柜", "小厮", "修士", "弟子", "突然", "这时", "随后", "只见", "不仅", "而且",
        "他们", "我们", "自己", "如果", "并且", "不过", "然而", "只见", "听闻", "方才"
    ].iter().cloned().collect();

    let candidate_re = Regex::new(
        r"(?:[“「]?)([\u{4e00}-\u{9fa5}]{2,4})(?:说道|沉声道|冷笑道|苦笑道|轻声道|喝道|怒道|冷哼一声|抱拳道|皱眉道|站起身|迈步走|一跃而起|心中暗想|眼中闪过)"
    ).unwrap();

    let mut name_counts: HashMap<String, usize> = HashMap::new();
    let mut name_samples: HashMap<String, String> = HashMap::new();

    for cap in candidate_re.captures_iter(&clean_text) {
        if let Some(m) = cap.get(1) {
            let cand = m.as_str().trim();
            if cand.len() >= 2 && !existing_names.contains(cand) && !invalid_prefixes.contains(cand) {
                *name_counts.entry(cand.to_string()).or_insert(0) += 1;
                if !name_samples.contains_key(cand) {
                    let sample = safe_snippet(&clean_text, m.start(), m.end(), 6, 20);
                    name_samples.insert(cand.to_string(), sample);
                }
            }
        }
    }

    for (name, count) in name_counts {
        if count >= 1 {
            let sample = name_samples.get(&name).cloned().unwrap_or_default();
            entity_proposals.push(EntityProposal {
                entity_type: "CHARACTER".to_string(),
                name: name.clone(),
                frequency: count,
                context_sample: sample,
                suggested_action: format!("在正文中检测到活跃人物「{}」共出现 {} 次，建议将其补录入小说角色设定库（Story Bible）。", name, count),
            });
        }
    }

    // 4. 计算综合人情味评分 (Humanizer Score)
    let deduction: u32 = (cliche_matches.len() as u32) * 6;
    let humanizer_score = 100u32.saturating_sub(deduction);

    let has_critical = consistency_issues.iter().any(|i| i.severity == "CRITICAL");
    let has_warning = consistency_issues.iter().any(|i| i.severity == "WARNING") || humanizer_score < 75;

    let verdict = if has_critical {
        "CRITICAL_ISSUES".to_string()
    } else if has_warning {
        "NEEDS_REVISION".to_string()
    } else {
        "PASS".to_string()
    };

    let summary = format!(
        "【质量门禁巡检完成】\n\
         - 正文字数: {} 字 (预计阅读: {} 分钟)\n\
         - 人情味评分: {}/100 (检出套话/AI腔: {} 处)\n\
         - 剧情因果巡检发现: {} 项 (严重冲突: {} 处)\n\
         - 新实体建议补录: {} 位角色\n\
         - 最终状态判定: [{}]",
        word_count, reading_time_minutes, humanizer_score,
        cliche_matches.len(),
        consistency_issues.len(),
        consistency_issues.iter().filter(|i| i.severity == "CRITICAL").count(),
        entity_proposals.len(),
        verdict
    );

    Ok(EvaluationReport {
        novel_id: novel_id.to_string(),
        chapter_id: chapter_id.map(|s| s.to_string()),
        word_count,
        reading_time_minutes,
        humanizer_score,
        verdict,
        cliche_matches,
        consistency_issues,
        entity_proposals,
        actionable_summary: summary,
    })
}
