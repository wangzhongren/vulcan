# 🔨 Vulcan

AI-driven local real-time UI canvas - 让 AI (Claude Code) 可以动态部署交互式网页到本地浏览器。

## ✨ 核心能力

- **一键启动**：`vulcan start` 立即拉起本地服务
- **AI 自动发现**：安装 Skills 后，Claude Code 会在需要可视化时自动调用
- **双向交互**：网页可以通过 Bridge API 读写本地文件、执行命令
- **安全防护**：命令白名单，防止危险操作
- **内置库**：Tailwind CSS / ECharts / AntV G6 本地托管，无需 CDN

## 🚀 快速开始

### 1. 克隆并安装

```bash
git clone https://github.com/wangzhongren/vulcan.git
cd vulcan
npm install
npm link    # 全局注册 vulcan 命令
```

安装后会自动下载 Tailwind CSS、ECharts、AntV G6 到 `~/.code-map/lib/`。

> **前提条件**：Node.js >= 18

### 2. 安装 Claude Code Skills

**项目级安装**（只在当前项目生效）：
```bash
cd your-project
vulcan init
```

**全局安装**（所有项目可用）：
```bash
vulcan init --global
```

这会安装两个 Claude Code 斜杠命令：
- `/deploy-view` — 部署交互式页面
- `/vulcan-inspect` — 检查项目结构

### 3. 启动服务

```bash
vulcan start
```

自动打开 `http://localhost:3000` 显示 Dashboard。

### 4. 在 Claude Code 中使用

启动 Claude Code 后，当需要可视化输出时：

**手动调用**：
```
/deploy-view a diff comparison for utils.js refactoring
```

**自动触发**（如果项目有 CLAUDE.md）：
```
帮我重构 utils.js 里的 formatDate 函数，先让我看看 diff
```

Claude Code 会自动：
1. 读取原文件
2. 生成重构代码
3. 部署 Diff 对比页面
4. 告诉你打开 URL 查看
5. 你在网页点击"Apply"按钮完成修改

## 🔌 Claude Code 集成详解

Vulcan 通过**三层机制**与 Claude Code 深度集成，让 AI 能够自主使用可视化能力：

### 1. Claude Code Skills（斜杠命令）

`vulcan init` 会在项目或全局安装两个 Skill 文件：

```
.claude/commands/
├── deploy-view.md      # /deploy-view 命令定义
└── vulcan-inspect.md   # /vulcan-inspect 命令定义
```

**项目级安装**（只在当前项目生效）：
```bash
cd your-project
vulcan init
```

**全局安装**（所有项目可用）：
```bash
vulcan init --global
```

安装后，Claude Code 会识别这些 Skill，你可以：
- **手动调用**：`/deploy-view a dashboard showing API metrics`
- **自然语言**：Claude Code 会根据上下文自动选择合适的 Skill

### 2. CLAUDE.md 自动发现配置

`vulcan init` 还会在项目根目录创建 `CLAUDE.md`，这是 Claude Code 的项目级配置文件。当 Claude Code 启动时会自动读取，知道：

- **何时使用**：需要可视化时（diff 对比、数据图表、交互预览等）
- **如何调用**：API 地址、请求格式、Bridge API 用法
- **安全规则**：命令白名单、文件操作权限
- **最佳实践**：HTML 模板规范、样式建议

`CLAUDE.md` 示例内容：
```markdown
# Vulcan — AI Agent Instructions

## When to Use
Deploy a page whenever you need to:
- Show a diff comparison for code review
- Visualize data, charts, or dashboards
- Build interactive UI for refactoring previews
- Present complex information visually

## How to Deploy
POST to http://localhost:3000/api/view/deploy
{
  "name": "page_name",
  "html": "<!DOCTYPE html>..."
}

## Bridge API (window.Vulcan)
await Vulcan.readFile(path)
await Vulcan.writeFile(path, content)
await Vulcan.execute(cmd, args?)
Vulcan.toast(msg, type)
```

有了 `CLAUDE.md`，你甚至不需要手动调用 Skill，Claude Code 会自动判断何时需要可视化。

### 3. 完整工作流示例

#### 场景 A：代码重构预览

**用户输入**：
```
帮我重构 auth.js 里的登录逻辑，先让我看看改动
```

**Claude Code 自动执行**：
1. 读取 `CLAUDE.md`，知道有 Vulcan 可用
2. 读取 `auth.js` 原文件
3. 生成重构后的代码
4. 调用 `/deploy-view` Skill（或直接用 API）
5. 部署 Diff 对比页面到 `http://localhost:3000/view/refactor_preview.html`
6. 回复用户："打开 http://localhost:3000/view/refactor_preview.html 查看对比"

**用户在网页上操作**：
- 查看左右对比（Before / After）
- 点击「Apply Changes」按钮
- 网页调用 `Vulcan.writeFile('./auth.js', newCode)`
- 文件自动更新，Claude Code 提示"修改已应用"

#### 场景 B：依赖关系可视化

**用户输入**：
```
分析一下这个项目的模块依赖
```

**Claude Code 自动执行**：
1. 读取 `package.json` 和源码
2. 分析模块关系
3. 调用 `/deploy-view` 部署 ECharts 图表
4. 生成可交互的依赖关系图
5. 用户点击节点可查看详情、高亮关联模块

#### 场景 C：Git 提交审查

**用户输入**：
```
review 一下最近的 5 个提交
```

**Claude Code 自动执行**：
1. 执行 `git log -5` 获取提交记录
2. 读取每个提交的 diff
3. 部署审查 Dashboard，包含：
   - 提交列表（可点击展开）
   - 代码变更高亮显示
   - 「Approve」/「Request Changes」按钮
   - 一键生成 Review 报告

### 4. 集成检查清单

确保 Claude Code 集成正常工作：

```bash
# 1. Vulcan 服务正在运行
vulcan status
# 或 vulcan start

# 2. Skills 已安装（二选一）
ls .claude/commands/          # 项目级
ls ~/.claude/commands/        # 全局

# 3. CLAUDE.md 存在（项目级）
ls CLAUDE.md
```

### 5. 调试技巧

**Skill 没被识别？**
- 检查文件是否在正确位置：`.claude/commands/deploy-view.md`
- 重启 Claude Code 让它重新加载 Skills

**Claude Code 没自动使用 Vulcan？**
- 确认 `CLAUDE.md` 存在且包含 Vulcan 配置
- 在提示中明确说"用可视化展示"或"部署一个页面"

**API 调用失败？**
- 检查 Vulcan 服务是否启动：`vulcan status`
- 检查端口是否被占用：`vulcan start --port 8080`

**Bridge API 不工作？**
- 确认 HTML 的 `<head>` 中包含了 `<script src="/bridge.js"></script>`
- 在浏览器控制台检查：`window.Vulcan` 是否存在

## 📖 命令参考

### CLI 命令

```bash
vulcan start [--port 3000] [--no-open]  # 启动服务
vulcan stop                              # 停止服务（目前需 Ctrl+C）
vulcan status                            # 查看服务状态
vulcan init [--global] [--force]         # 安装 Skills
vulcan --help                            # 帮助
vulcan --version                         # 版本号
```

### Claude Code Skills

安装后可用的斜杠命令：

```
/deploy-view <description>      # 部署页面（如：a dashboard for API metrics）
/vulcan-inspect <what>         # 检查项目（如：the router structure）
```

### API 接口

服务启动后提供的 HTTP API：

| 接口 | 方法 | 用途 |
|------|------|------|
| `/api/view/deploy` | POST | 部署 HTML 页面 `{name, html}` |
| `/api/view/list` | GET | 列出所有已部署页面 |
| `/api/fs/read` | POST | 读取本地文件 `{path}` |
| `/api/fs/write` | POST | 写入本地文件 `{path, content}` |
| `/api/sys/exec` | POST | 执行白名单命令 `{cmd, args?}` |
| `/api/project/tree` | GET | 获取项目目录树 |
| `/api/project/info` | GET | 获取项目元信息 |
| `/api/health` | GET | 健康检查 |

### Bridge API (网页内调用)

所有部署的页面自动注入 `window.Vulcan`：

```javascript
// 读取文件
const result = await Vulcan.readFile('./src/app.ts');
console.log(result.content);

// 写入文件
await Vulcan.writeFile('./output.txt', 'Hello!');

// 执行命令（白名单）
const output = await Vulcan.execute('git status');
console.log(output.stdout);

// 获取项目树
const tree = await Vulcan.getProjectTree(3);

// 显示通知
Vulcan.toast('操作成功！', 'success');
```

## 🔒 命令白名单

为安全起见，`/api/sys/exec` 只允许以下命令：

- **git**: status, diff, log, branch, show, tag, remote, add, checkout
- **npm/yarn/pnpm**: run, test, lint, build, start
- **只读命令**: ls, cat, head, tail, wc, find, grep, tree, pwd
- **开发工具**: node, python, echo, date, which, curl

其他命令会返回 403 错误。

## 📂 文件结构

```
vulcan/
├── assets/
│   ├── bridge.js              # 前端 Bridge API
│   ├── welcome.html           # Dashboard 欢迎页
│   ├── CLAUDE.md.template     # AI 自动发现配置模板
│   └── skills/
│       ├── deploy-view.md     # /deploy-view Skill
│       └── vulcan-inspect.md # /vulcan-inspect Skill
├── src/
│   ├── server.js              # Express 服务器
│   ├── routes/
│   │   ├── views.js           # 页面部署 API
│   │   ├── fs.js              # 文件读写 API
│   │   ├── sys.js             # 命令执行 API（带白名单）
│   │   └── project.js         # 项目检查 API
│   ├── commands/              # CLI 子命令实现
│   └── config.js              # 配置管理
├── bin/
│   └── vulcan.js        # CLI 入口
└── package.json
```

## 🎯 典型使用场景

### 场景 1：代码重构预览

```
用户：帮我重构 utils.js，先让我看看改动
AI：[读取文件] → [生成新代码] → [/deploy-view diff comparison]
    → "打开 http://localhost:3000/view/refactor_preview.html"
用户：[在网页上看 Diff，点 Apply] → 文件自动更新
```

### 场景 2：数据可视化

```
用户：分析一下这个项目的依赖关系
AI：[读取 package.json] → [/deploy-view dependency graph with echarts]
    → "打开 http://localhost:3000/view/deps.html"
用户：[在网页上看交互式图表，点击节点查看详情]
```

### 场景 3：代码审查

```
用户：review 一下最近的 git 提交
AI：[执行 git log] → [分析 diff] → [/deploy-view code review dashboard]
    → "打开 http://localhost:3000/view/review.html"
用户：[在网页上逐条 review，点按钮 approve/request changes]
```

## 🛠️ 高级配置

### 自定义端口

```bash
vulcan start --port 8080
```

记得在 Claude Code 里也更新 URL（默认是 3000）。

### 不自动打开浏览器

```bash
vulcan start --no-open
```

### 强制重新安装 Skills

```bash
vulcan init --force        # 项目级
vulcan init --global --force  # 全局
```

### 手动部署页面（不通过 Claude Code）

```bash
curl -X POST http://localhost:3000/api/view/deploy \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "html": "<h1>Hello</h1>"}'
```

## ❓ FAQ

**Q: 页面部署后在哪里？**  
A: 存储在 `~/.code-map/views/` 目录，可以通过 `http://localhost:3000/view/<name>.html` 访问。

**Q: 如何删除已部署的页面？**  
A: `curl -X DELETE http://localhost:3000/api/view/<name>` 或直接删除 `~/.code-map/views/<name>.html` 文件。

**Q: 为什么某些命令执行失败？**  
A: 出于安全考虑，只有白名单内的命令可以执行。可以用 `GET /api/sys/allowed` 查看允许的命令列表。

**Q: 可以多人同时使用吗？**  
A: 可以，但每个人需要用不同端口启动（`--port`）。

## 📝 License

MIT

## 🤝 Contributing

欢迎提交 Issue 和 PR！

## 🎉 致谢

灵感来源：让 AI 不仅能写代码，还能直接展示效果。
