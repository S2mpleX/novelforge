/**
 * NovelForge AI — 模型网关与模型 ID 持久化专项单元测试
 */
import { api } from '../src/utils/tauriBridge';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log(' NovelForge AI — 模型网关与模型 ID 持久化 专项测试');
  console.log('===============================================================\n');

  // Test 1: 保存并读取自定义模型 ID
  console.log('▶ [测试 1] 保存自定义模型 ID 并验证其在数据库中正确持久化');
  const providerInput = {
    name: '本地网关 (CPA 测试)',
    provider_type: 'OPENAI_COMPATIBLE',
    base_url: 'http://127.0.0.1:8317/v1',
    api_key: 'test-key-cpa',
    is_active: true,
    models: [
      {
        model_name: 'gemini-3.8-flash-high',
        display_name: 'Gemini 3.8 Flash High',
        is_default: true,
      },
    ],
  };

  const saved = await api.saveProvider(providerInput);
  assert(saved.name === '本地网关 (CPA 测试)', '服务商名称保存正确');
  assert(saved.base_url === 'http://127.0.0.1:8317/v1', 'Base URL 保存正确');

  const models = await api.listModels(saved.id);
  assert(models.length > 0, `服务商模型列表非空（数量: ${models.length}）`);
  const defaultModel = models.find((m) => m.is_default) || models[0];
  assert(
    defaultModel?.model_name === 'gemini-3.8-flash-high',
    `成功还原模型 ID 为 gemini-3.8-flash-high（非硬编码 gpt-4o-mini），实际为: ${defaultModel?.model_name}`
  );

  // Test 2: 切换到另一个服务商（例如 DeepSeek），验证多服务商共存与独立模型 ID
  console.log('\n▶ [测试 2] 增加并保存第二个服务商（DeepSeek），验证各自模型独立隔离');
  const deepseekInput = {
    name: 'DeepSeek 官方',
    provider_type: 'OPENAI_COMPATIBLE',
    base_url: 'https://api.deepseek.com/v1',
    api_key: 'sk-deepseek-secret',
    is_active: true,
    models: [
      {
        model_name: 'deepseek-chat',
        display_name: 'DeepSeek Chat',
        is_default: true,
      },
    ],
  };

  const savedDeepSeek = await api.saveProvider(deepseekInput);
  assert(savedDeepSeek.name === 'DeepSeek 官方', 'DeepSeek 服务商保存成功');

  const deepseekModels = await api.listModels(savedDeepSeek.id);
  const deepseekDef = deepseekModels.find((m) => m.is_default) || deepseekModels[0];
  assert(
    deepseekDef?.model_name === 'deepseek-chat',
    `DeepSeek 独立模型 ID 为 deepseek-chat，实际为: ${deepseekDef?.model_name}`
  );

  // 再次核验 CPA 服务商的模型未被覆盖或串扰
  const cpaModelsAgain = await api.listModels(saved.id);
  const cpaDefAgain = cpaModelsAgain.find((m) => m.is_default) || cpaModelsAgain[0];
  assert(
    cpaDefAgain?.model_name === 'gemini-3.8-flash-high',
    `CPA 模型保持为 gemini-3.8-flash-high 未被篡改，实际为: ${cpaDefAgain?.model_name}`
  );

  // Test 3: 修改已有服务商的模型 ID 并重新打开验证
  console.log('\n▶ [测试 3] 更新服务商模型为新模型并重新加载验证');
  await api.saveProvider({
    id: saved.id,
    name: saved.name,
    provider_type: saved.provider_type,
    base_url: saved.base_url,
    api_key: saved.api_key,
    is_active: true,
    models: [
      {
        model_name: 'claude-3-7-sonnet',
        display_name: 'Claude 3.7 Sonnet',
        is_default: true,
      },
    ],
  });

  const reloadedModels = await api.listModels(saved.id);
  const reloadedDef = reloadedModels.find((m) => m.is_default) || reloadedModels[0];
  assert(
    reloadedDef?.model_name === 'claude-3-7-sonnet',
    `模型 ID 成功更新为 claude-3-7-sonnet，实际为: ${reloadedDef?.model_name}`
  );

  console.log('\n===============================================================');
  console.log(` 测试总结: 共 ${totalTests} 项，通过 ${passedTests} 项，失败 ${failedTests} 项`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('测试运行异常:', e);
  process.exit(1);
});
