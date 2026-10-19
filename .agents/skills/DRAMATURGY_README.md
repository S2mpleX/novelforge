# 小说戏剧张力 Skill Pack v1.0

面向 Antigravity 的叙事节奏、结局设计与独立审稿技能包。兼容 Agent Skills (`SKILL.md`) 目录形式。

## 快速安装

1. 把此压缩包**解压到 Antigravity 小说项目的根目录**。压缩包包含 `.agents/skills/`，不需要额外复制嵌套目录。
2. 完成后确认 `<项目目录>/.agents/skills/story-architect/SKILL.md` 等四份文件存在。
3. 在 Antigravity Agent 对话中输入 `/story-architect`、`/scene-dramaturge`、`/ending-forge` 或 `/cold-reader`；如果没有出现命令，可重新打开项目/刷新 Agent 侧栏并在 Customizations 检查。

Windows PowerShell 安装示例（请替换真实目录）：

```powershell
Expand-Archive -LiteralPath "D:\Downloads\novel-dramaturgy-skills.zip" -DestinationPath "D:\AI小说生成器" -Force
Get-ChildItem "D:\AI小说生成器\.agents\skills" -Directory
```

如果你使用的是自己的小说生成应用，而非直接在 Antigravity 写小说：把 `SKILL.md` 作为独立 Agent 的系统/开发指令参考，由你的编排层决定加载时机；**Skill 文件本身不会自动创建独立模型上下文或执行多 Agent 调度**。

## 推荐执行链

新建故事：`/story-architect` → `/ending-forge` → `/scene-dramaturge`（按场景）→ `/cold-reader`（隔离上下文审稿）→ 局部返修。

已有稿件：先 `/cold-reader` → 找出情绪与因果断点 → `/story-architect` 处理结构性问题或 `/scene-dramaturge` 处理场景问题 → 再冷读。

**不要每章强制使用全部 Skill。** 结构改造只在需要时执行；审稿建议也不必全盘采纳。

## 重要说明

- 「结构完整」≠「有戏剧性」，「冲突密度」≠「可读性」，评分只是定位手段，不是艺术目标。
- 无高潮的场景可以非常有力：温柔、琐碎、沉默和幽默，是后续情绪的抵押品。
- 不把反转、牺牲、金句、悬念钩子固定为配额，不要求每章都爆点。
- 模型只能模拟读者反应；真实读者盲测才能确认效果。
- 角色不能为了制造高潮突然降智；结局不能靠临时新增规则或无伏笔超能力。

可直接复制的工作指令见 `PROMPTS.md`。
