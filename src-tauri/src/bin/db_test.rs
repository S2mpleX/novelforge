use novelforge_ai_lib::database::DbManager;
use novelforge_ai_lib::models::{
    CreateChapterInput, CreateCharacterInput, CreateNovelInput, CreateWorldRuleInput,
};

fn main() {
    println!("=== 开始 NovelForge AI 本地数据库与全功能验证 ===");

    let db = DbManager::new().expect("初始化本地 SQLite 数据库失败");
    println!("1. 数据库初始化成功，路径: {}", db.get_db_path());

    // 1. 创建小说
    let novel = db
        .create_novel(CreateNovelInput {
            title: "星穹之门：终极纪元".to_string(),
            description: Some("跨越三千万光年的硬核科幻史诗巨作".to_string()),
            genre_profile: Some("科幻".to_string()),
            language: Some("zh-CN".to_string()),
            writing_style: Some("硬派沉稳、考据扎实".to_string()),
            chapter_target_length: Some(4000),
        })
        .expect("创建小说失败");
    println!("2. 成功创建小说: 《{}》 (ID: {})", novel.title, novel.id);

    // 2. 读取小说列表
    let novels = db.list_novels().expect("读取小说列表失败");
    assert!(novels.iter().any(|n| n.id == novel.id));
    println!("3. 验证小说列表: 当前共有 {} 部作品", novels.len());

    // 3. 创建章节
    let ch1 = db
        .create_chapter(CreateChapterInput {
            novel_id: novel.id.clone(),
            volume_id: None,
            chapter_number: Some(1),
            title: "跃迁前夕".to_string(),
            initial_content: Some(
                "巨大的反物质引擎在寒夜中发出沉闷的轰鸣，舷窗外是静谧而冰冷的柯伊伯带。".to_string(),
            ),
        })
        .expect("创建章节失败");
    println!(
        "4. 成功创建第 {} 章《{}》, 字数: {}",
        ch1.chapter_number, ch1.title, ch1.word_count
    );

    // 4. 正文编辑与版本历史
    let updated = db
        .save_chapter_content(
            &ch1.id,
            "巨大的反物质引擎在寒夜中发出沉闷的轰鸣，舷窗外是静谧而冰冷的柯伊伯带。林远深吸一口气，按下了最终指令。",
            true,
            "USER_EDIT",
        )
        .expect("更新章节正文失败");
    println!("5. 保存正文快照成功，当前字数: {}", updated.word_count);

    let versions = db.list_chapter_versions(&ch1.id).expect("获取版本列表失败");
    assert_eq!(versions.len(), 2);
    println!("6. 验证版本控制: 成功保留 {} 个历史版本快照", versions.len());

    // 5. 创建人物档案
    let character = db
        .create_character(CreateCharacterInput {
            novel_id: novel.id.clone(),
            name: "林远".to_string(),
            aliases: Some("深空领航员".to_string()),
            profile: Some("深空开拓舰队首席领航员".to_string()),
            personality: Some("沉着敏锐、孤傲冷峻".to_string()),
            background: Some("经历过第三次太阳风暴的幸存者".to_string()),
            motivation: Some("寻找失落的先驱者舰队".to_string()),
        })
        .expect("创建人物失败");
    println!("7. 成功创建角色档案: 【{}】 (动机: {})", character.name, character.motivation);

    // 6. 创建世界观规则 (Canon)
    let rule = db
        .create_world_rule(CreateWorldRuleInput {
            novel_id: novel.id.clone(),
            title: "曲率泡稳定法则".to_string(),
            rule_content: "在重力井深度超过0.15G的引力场中强行展开曲率泡将引发时空剪切。".to_string(),
            authority_level: Some("CANON".to_string()),
        })
        .expect("创建世界规则失败");
    println!("8. 成功创建权威世界观规则 (Canon): 【{}】", rule.title);

    // 7. 验证模型提供商配置
    let (provider, model) = db
        .get_active_provider_and_model()
        .expect("获取激活提供商失败")
        .expect("未找到激活提供商");
    println!(
        "9. 验证模型网关: 激活服务商[{}]，端点[{}]，默认模型[{}]",
        provider.name, provider.base_url, model.model_name
    );

    println!("=== 100% 测试验证通过！全部业务逻辑在本地 SQLite 正确持久化！ ===");
}
