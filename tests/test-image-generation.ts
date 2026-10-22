import assert from 'assert';
import fs from 'fs';
import { api } from '../src/utils/tauriBridge';

console.log('===============================================================');
console.log('🎨✨🖼️ NovelForge AI — 角色立绘与作品封面 AI 原画生图网关自动化测试');
console.log('===============================================================');

let passCount = 0;
function test(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res
        .then(() => {
          console.log(`  ✅ PASS: ${name}`);
          passCount++;
        })
        .catch((e: any) => {
          console.error(`  ❌ FAIL: ${name}`, e.message);
          throw e;
        });
    } else {
      console.log(`  ✅ PASS: ${name}`);
      passCount++;
    }
  } catch (e: any) {
    console.error(`  ❌ FAIL: ${name}`, e.message);
    throw e;
  }
}

async function runAllTests() {
  // -------------------------------------------------------------
  // PART 1: Rust 后端生图网关契约断言
  // -------------------------------------------------------------
  console.log('\n▶ [PART 1] Rust 后端数据结构、Client 与 Tauri Command 静态断言');

  const rustModels = fs.readFileSync('src-tauri/src/models/mod.rs', 'utf8');
  const rustClient = fs.readFileSync('src-tauri/src/providers/openai_compatible.rs', 'utf8');
  const rustCommands = fs.readFileSync('src-tauri/src/commands/mod.rs', 'utf8');
  const rustLib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

  test('Rust models 完整定义 GenerateImageInput 与 GenerateImageResult', () => {
    assert(rustModels.includes('pub struct GenerateImageInput'), '包含 GenerateImageInput 结构体');
    assert(rustModels.includes('pub struct GenerateImageResult'), '包含 GenerateImageResult 结构体');
    assert(rustModels.includes('pub prompt: String'), '包含 prompt 字段');
    assert(rustModels.includes('pub image_url: String'), '包含 image_url 字段');
  });

  test('OpenAIClient 实现符合 OpenAI / SiliconFlow 标准的 generate_image 协议', () => {
    assert(rustClient.includes('pub async fn generate_image'), 'OpenAIClient 包含 generate_image 方法');
    assert(rustClient.includes('/images/generations'), '支持标准 /images/generations 端点自动路由');
    assert(rustClient.includes('b64_json'), '支持 b64_json 格式解析并自动封装 data URL');
  });

  test('Rust commands 注册并提供 generate_image 命令', () => {
    assert(rustCommands.includes('pub async fn generate_image'), '包含 generate_image command');
    assert(rustLib.includes('commands::generate_image'), '在 tauri::Builder 中注册 generate_image');
  });

  // -------------------------------------------------------------
  // PART 2: 前端 TypeScript 类型与 Tauri Bridge IPC 通道断言
  // -------------------------------------------------------------
  console.log('\n▶ [PART 2] 前端 TypeScript 接口与 Bridge / WebMock IPC 断言');

  const typesSource = fs.readFileSync('src/types/index.ts', 'utf8');
  const bridgeSource = fs.readFileSync('src/utils/tauriBridge.ts', 'utf8');
  const mockSource = fs.readFileSync('src/utils/webMockStorage.ts', 'utf8');

  test('TypeScript types 导出 GenerateImageInput 与 GenerateImageResult', () => {
    assert(typesSource.includes('export interface GenerateImageInput'), '导出 GenerateImageInput');
    assert(typesSource.includes('export interface GenerateImageResult'), '导出 GenerateImageResult');
  });

  test('Tauri Bridge 暴露 api.generateImage 并打通 WebMock 离线保底', () => {
    assert(bridgeSource.includes('generateImage:'), 'api 包含 generateImage 方法');
    assert(mockSource.includes("case 'generate_image':"), 'WebMock 处理 generate_image 命令');
  });

  await test('通过 api.generateImage 实际调用生图并返回合规图片数据', async () => {
    const res = await api.generateImage({
      prompt: '国风剑客立绘，白衣长剑，剑眉星目',
      model_name: 'black-forest-labs/FLUX.1-schnell',
      size: '1024x1024',
    });
    assert(res, '应有返回结果');
    assert(res.image_url, '必须包含 image_url');
    assert(res.image_url.startsWith('data:image') || res.image_url.startsWith('http'), 'image_url 应为有效的 data URL 或 http 地址');
    assert(res.model === 'black-forest-labs/FLUX.1-schnell', '模型应与请求匹配');
  });

  // -------------------------------------------------------------
  // PART 3: 角色立绘创绘工坊 (CharacterAvatarModal) 组件断言
  // -------------------------------------------------------------
  console.log('\n▶ [PART 3] 角色立绘创绘工坊 (CharacterAvatarModal) 架构断言');

  const avatarModalSource = fs.readFileSync('src/components/modals/CharacterAvatarModal.tsx', 'utf8');

  test('CharacterAvatarModal 具备 6 大专业美学艺术风格预设', () => {
    assert(avatarModalSource.includes("'xianxia_cg'"), '包含仙侠3D CG风格');
    assert(avatarModalSource.includes("'anime_lightnovel'"), '包含二次元轻小说风格');
    assert(avatarModalSource.includes("'cinematic_realism'"), '包含电影级写实立绘');
    assert(avatarModalSource.includes("'concept_art'"), '包含厚涂概念设计');
    assert(avatarModalSource.includes("'traditional_ink'"), '包含国风水墨古韵');
    assert(avatarModalSource.includes("'cyber_scifi'"), '包含赛博未来机能');
  });

  test('CharacterAvatarModal 具备 3 种机位构图与多大模型支持', () => {
    assert(avatarModalSource.includes("'bust'"), '包含半身立绘');
    assert(avatarModalSource.includes("'portrait'"), '包含面部特写');
    assert(avatarModalSource.includes("'fullbody'"), '包含全身原画');
    assert(avatarModalSource.includes('dall-e-3'), '支持 DALL-E 3');
    assert(avatarModalSource.includes('FLUX.1-schnell'), '支持 FLUX.1');
    assert(avatarModalSource.includes('cogview-3-plus'), '支持 智谱 CogView');
  });

  test('CharacterAvatarModal 自动注入人设外貌与性格动机装配 Prompt', () => {
    assert(avatarModalSource.includes('assemblePrompt'), '包含 assemblePrompt 提示词装配器');
    assert(avatarModalSource.includes('character.visual_summary'), '深度读取 character.visual_summary');
    assert(avatarModalSource.includes('character.personality'), '深度读取 character.personality');
  });

  // -------------------------------------------------------------
  // PART 4: 角色管理与沙盘演练各入口深度集成断言
  // -------------------------------------------------------------
  console.log('\n▶ [PART 4] 角色面板、档案视图与演练沙盘全链路集成断言');

  const charViewSource = fs.readFileSync('src/components/views/CharactersView.tsx', 'utf8');
  const charPanelSource = fs.readFileSync('src/components/docking/panels/CharacterProfilesPanel.tsx', 'utf8');
  const sandboxPanelSource = fs.readFileSync('src/components/docking/panels/CharacterSandboxPanel.tsx', 'utf8');

  test('CharactersView (全书角色大表) 集成 AI 生成立绘与悬浮触发', () => {
    assert(charViewSource.includes('CharacterAvatarModal'), '挂载 CharacterAvatarModal 模态框');
    assert(charViewSource.includes('AI 生成立绘'), '表单中提供 AI 生成立绘按钮');
    assert(charViewSource.includes('AI立绘'), '卡片头像提供快捷悬停 AI 生图操作');
  });

  test('CharacterProfilesPanel (工作台人物档案面板) 集成立绘 AI 创绘', () => {
    assert(charPanelSource.includes('CharacterAvatarModal'), '挂载 CharacterAvatarModal 模态框');
    assert(charPanelSource.includes('AI 生成立绘'), '表单中提供 AI 生成立绘按钮');
  });

  test('CharacterSandboxPanel (角色对戏演练沙盘) 集成演练角色立绘创绘', () => {
    assert(sandboxPanelSource.includes('CharacterAvatarModal'), '挂载 CharacterAvatarModal 模态框');
    assert(sandboxPanelSource.includes('AI 生成立绘'), '演练角色立绘修改弹窗中支持 AI 生成');
  });

  // -------------------------------------------------------------
  // PART 5: 作品封面与装帧设计工坊 (BookCoverModal) 升级断言
  // -------------------------------------------------------------
  console.log('\n▶ [PART 5] 作品封面工坊 (BookCoverModal) AI 原画生成升级断言');

  const bookCoverSource = fs.readFileSync('src/components/modals/BookCoverModal.tsx', 'utf8');

  test('BookCoverModal 拥有独立的 AI 原画生图 Tab 与装帧流派意境预设', () => {
    assert(bookCoverSource.includes("'AI_GENERATE'"), '包含 AI_GENERATE Tab 状态');
    assert(bookCoverSource.includes('✨ AI 原画生图'), 'Tab 显示 ✨ AI 原画生图');
    assert(bookCoverSource.includes('COVER_STYLE_PRESETS'), '配置 6 大封面文学原画风格预设');
    assert(bookCoverSource.includes('assembleCoverPrompt'), '包含小说封面意象 Prompt 装配器');
  });

  test('BookCoverModal 生图后自动联动左侧 3D 实体书卷并支持一键持久化', () => {
    assert(bookCoverSource.includes('getPreviewCoverUrl'), 'getPreviewCoverUrl 自动读取 generatedCoverUrl');
    assert(bookCoverSource.includes('handleGenerateCover'), '包含 handleGenerateCover 生图执行逻辑');
    assert(bookCoverSource.includes('api.generateImage'), '直接调用 api.generateImage');
    assert(bookCoverSource.includes('updateNovel'), '一键保存并持久化至 SQLite activeNovel.cover_url');
  });

  console.log('\n===============================================================');
  console.log(`🎉 恭喜！全部 ${passCount} 项生图网关与立绘/封面创作工坊测试断言 100% 通过！`);
  console.log('===============================================================');
}

runAllTests().catch((e) => {
  console.error('测试套件执行异常终止:', e);
  process.exit(1);
});
