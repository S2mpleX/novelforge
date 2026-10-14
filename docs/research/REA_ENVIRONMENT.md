# REA 工具与分析环境评估报告 (REA_ENVIRONMENT.md)

- **评估日期**：2026-10-14
- **当前客户端**：Antigravity Agentic Desktop
- **执行环境**：Windows 11 x64 / PowerShell
- **REA Skill 状态**：已挂载 (`reverse-engineer-anything` v37, 工具库涵盖 170 项能力)
- **REA MCP 状态**：已连通 (`rea` MCP Server，提供原生二进制、PE 资源、Electron/JavaScript、网络抓包、Managed .NET 等全套逆向分析工具)

---

## 1. REA MCP 工具链就绪情况

当前已注册并支持调用的关键 MCP 工具包括（部分核心分类）：

1. **二进制与可执行文件分析 (Native & PE)**：
   - `open_binary`: 打开本地二进制分析会话
   - `close_binary`: 关闭会话并释放资源
   - `binary_session`: 查询当前活动会话与证据状态
   - `inspect_pe_resources`: 分析 Windows PE 资源段、清单、版本信息与图标
   - `inspect_binary_layout`: 静态段结构与符号审查
   - `binary_overview`: 架构、入口点、段分布概览
   - `read_bytes` / `address_to_file_offset`: 字节级取证与偏移映射

2. **JavaScript / Electron 应用逆向 (Web & Electron)**：
   - `analyze_javascript_application`: 解析前端打包产物、模块依赖图谱、Webpack/Vite 捆绑包拓扑
   - `reconcile_javascript_runtime`: 运行时模块对齐与源码定位
   - `inspect_electron_page`: 审查 Electron 渲染进程结构与 IPC 通道
   - `list_electron_targets`: 枚举运行中的 Electron 调试实例
   - `recover_javascript_sources`: 混淆/压缩脚本结构恢复与 AST 符号还原

3. **托管与框架分析 (Managed & Packaging)**：
   - `inspect_managed_artifact`: C# / .NET / CLI 元数据与程序集结构审查
   - `inspect_artifact`: 归档包 (ZIP / MSIX / ASAR / 安装包) 内部资产树图谱
   - `export_evidence_bundle`: 导出结构化分析证据包

4. **证据与假设验证 (Evidence & Ledger)**：
   - `record_unknown`: 登记未确认的技术假设与待验证项
   - `verify_unknown_resolution`: 验证技术推断是否闭环
   - `correlate_static_and_runtime`: 关联静态代码与动态运行时表现

---

## 2. REA 使用原则与合规边界

本项目严格遵循以下分析与工程准则：

1. **合规与只读原则**：
   - 绝不绕过登录限制、授权验证、DRM 防护或安全加固；
   - 绝不提取第三方私密密钥、Token、未公开提示词或私有付费资产；
   - 绝不调用未授权的私有生产 API。
2. **源码优先原则**：
   - 对开源参考项目（如 `novel-studio`, `novel-engine`, `novelforge`），优先基于官方公开仓库的 Git 历史、代码实现、测试套件与设计文档进行架构剖析；
   - 严禁对已有完整源码的开源项目做无意义的重复反编译。
3. **证据分级原则**：
   - **观察到的事实 (Observed Facts)**：在公开界面、可访问页面、正式发行说明中直接录得的真实行为；
   - **源码证据 (Source Evidence)**：有明确文件路径、行号、函数签名与 Commit SHA 的代码实现；
   - **合理技术推断 (Technical Inferences)**：基于公开架构特征、通信协议、行业通用工程实践做出的技术推导，明确标明推断依据；
   - **待验证猜测 (Unverified Hypotheses)**：无法直接证实或缺乏足够证据的内部实现机制，列入待验证清单，严禁作为确定事实。
