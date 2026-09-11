# OpenCode × OpenESG：桌面交互技术验证

基线：OpenCode `v1.18.30` / `3104c1428ec91f809e5ab86631300de41eb6952e`。

这是隔离的技术原型，目标是验证已评审 HTML 与真实 OpenCode 原生会话的衔接，不是生产 ESG 客户端。业务数据均为虚构；默认不提供可用模型，不自动发送上下文。

当前布局已修订：OpenCode 原生标题栏为外层，内部“ESG 工作台”入口打开业务内容；讨论对象时可在同一工作区展开原生会话，不再使用双应用切换壳。工具栏可选“底部 / 右侧 / 浮动窗口”，默认会话在右，记住本机模式。浮窗是可拖动、缩放、重新停靠的应用内面板，不能移出主窗口到另一显示器；三个模式共用同一原生草稿。三种嵌入式新草稿均采用紧凑排版，工作环境默认收起、可展开；对象名称、类型与所属报告优先于编号显示。最新类型检查和 56 项定向测试通过；最终浮窗缩放、三模式草稿保持及全屏往返的真实窗口验证见宿主关系记录第 9 节。完整业务链与 iframe 焦点下快捷键尚未验收。

本机已构建，可在 `packages/desktop` 执行：

```text
node scripts/launch-esg.cjs
```

已实测修订版 P08 选中 ENV-001 → ContextPack 预览 → 原生未发送草稿 → 收起/展开返回 ESG 工作现场；普通会话和 P02 未发布输入在工作区切换中保持。此次使用 computer-use 真实窗口复验发现并推动了短面板空态布局适配，未改动原生会话实现。模型结果候选回带、报告级自动查找/创建关联会话、任意旧对象定位、关联信息重启恢复及文件操作尚未完成。Windows x64 内部评审安装包已于 2026-09-11 生成，见下节。

详细验证记录：
[第一轮技术验证](C:/work/code/esg/docs/opencode-desktop-prototype-validation-20260911.md)。
[宿主关系修订与复验](C:/work/code/esg/docs/opencode-desktop-host-review-20260911.md)。

不要提交 `.esg-prototype-runtime`、运行日志、凭据、会话数据库或客户资料。原型资源最初从 `charlieqf/openesg` 的 `public/` 复制，现已作为桌面运行资源提交；原 HTML 仓库未修改。提交资源不能作为已经完成十五页桌面交互验收的证据。

开发时通过原生菜单 View → Reload 加载 renderer-only 新构建；无需重启健康的本地服务。桥接脚本采用版本化资源入口，以免运行中的旧缓存遗漏新增显示元数据。当前上下文仍是完整正文预填，不是已实现的可折叠附件；紧凑编辑区的填满高度规则仅适用于新草稿，不修改真实消息时间线。

## Windows 团队评审安装包

内部版本 **OpenESG Review 0.1.0**，Windows x64、NSIS 当前用户安装，未签名。交付文件在 `C:/work/code/esg/releases/`；安装后不需要 Node、Bun、Git、源码或开发服务器。安装本地验证 exit 0，安装后的 `app.asar` 与构建目录 SHA-256 一致。验证边界见宿主关系记录第 10 节，不声称干净虚拟机或所有 Windows/DPI 已验收。

应用 ID `com.openesg.review`，数据目录 `%APPDATA%/OpenESGReview`；与开发原型、普通 OpenCode 分开，不注册 `opencode` 协议、不启用官方自动更新。安装包不含本机凭据、会话或日志。默认无可用 provider，评审范围仍是视觉和交互。

HTML、样式、虚构数据及桌面桥接已经提交在 `packages/desktop/resources/esg`，无需另外克隆网页原型仓库。来源和筛选边界见 `packages/desktop/prototype/ESG-ASSETS.md`。在已有 Bun 1.3.14 依赖及 `resources/icons` 的开发环境中，从 `packages/desktop` 执行：

```text
bun scripts/package-esg-review.ts
bun scripts/verify-esg-review.ts
bun test prototype/review-package.test.ts
```

独立构建入口在 `prototype/review-entry.ts`，输出到 `out-review`，不覆盖正在使用的开发输出 `out`。打包配置为 `prototype/electron-builder.review.config.ts`，安装说明为 `prototype/REVIEW-README.md`。只分发 Setup EXE 和说明，不分发 `builder-debug.yml`、整个源码目录或本机运行数据。
