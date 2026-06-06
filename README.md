# 🔨 Vulcan

> AI writes disposable web tools on the fly. You confirm, interact, and move on.

Vulcan 是一个本地轻量容器。Claude Code 可以**现场生成一个一次性交互网页**，部署到你的浏览器里。你在网页上确认改动、点按钮执行操作——做完就关掉，不需要保留。

## 这解决了什么问题

传统工作流：AI 改代码 → 你看文本 diff → 你说 OK → AI 写入文件。这个过程缺少**直观的交互确认**。

Vulcan 的工作流：AI 改代码 → **生成一个可视化对比页** → 你在网页上看 diff → 点「确认应用」→ 文件更新。AI 把"要不要改"的决定权还给你，而且用网页交互的形式呈现，比终端里看文本直观得多。

## 快速开始

### 1. 安装

```bash
git clone https://github.com/wangzhongren/vulcan.git
cd vulcan
npm install
npm link
```

安装后自动下载 Tailwind CSS、ECharts、AntV G6 到 `~/.code-map/lib/`。

> 需要 Node.js >= 18

### 2. 注册 Claude Code Skills

```bash
cd your-project
vulcan init          # 当前项目
# 或
vulcan init --global # 所有项目

```

这会安装 `/deploy-view` 和 `/vulcan-inspect` 两个 Skill。

### 3. 启动服务

```bash
vulcan start
```

服务在 `localhost:3000` 运行。打开浏览器看到 vulcan shell（左侧侧边栏 + 右侧内容区）。

## 核心用法

直接用 Claude Code 说人话：

```
帮我重构 utils.js 里的 formatDate，先让我看看 diff
```

AI 会：
1. 自动启动 Vulcan（如果没运行）
2. 读取原文件，生成新代码
3. 现场写一个 Diff 对比 HTML 页面
4. 部署到浏览器 shell 里自动打开
5. 你在网页上看改动，点「Apply Changes」
6. 文件被修改，页面用完即丢

这就是**一次性工具**——AI 随手生成、你直观确认、用完就过。

## 一次性工具 vs 持久应用

| | 一次性工具（Vulcan 正解） | 持久应用（不是 Vulcan 要做的） |
|---|---|---|
| 谁写 | AI 现场生成 | 你提前写好存盘 |
| 生命周期 | 用完即丢 | 长期存在 |
| 文件数 | 单一 HTML | 多文件工程 |
| 典型场景 | Diff 确认、格式化预览、数据图表 | 管理后台、监控面板 |

## 典型场景

### Diff 确认器
> AI 重构代码后，生成左右对比页，你点「Apply」写入文件。

```javascript
// AI 生成页面里的按钮逻辑
async function apply() {
  await Vulcan.writeFile('./src/utils.js', newCode);
  Vulcan.toast('已应用！', 'success');
}
```

### 配置编辑器
> AI 读取 config.json，生成可视化编辑表单。你改完点「Save」写回。

```javascript
async function save() {
  const config = readFormValues();
  await Vulcan.writeFile('./config.json', JSON.stringify(config, null, 2));
  Vulcan.toast('配置已保存', 'success');
}
```

### Git 提交审查器
> AI 读 git log，生成提交列表 + diff 详情。你逐条 review，点「Approve」通过。

### 数据可视化
> AI 读取 CSV/JSON 数据，用 ECharts 画出交互图表。你放大缩小过滤数据。

### 文件浏览器
> AI 渲染项目目录树，点文件名直接看源码语法高亮。

> 💡 这些工具全部是 AI **现场生成**的单文件 HTML，不存在提前开发。

## 示例

仓库 `examples/` 目录下有可直接部署的一次性工具模板：

| 文件 | 说明 |
|------|------|
| [`calculator.html`](examples/calculator.html) | 极简深色计算器 |

部署方式（在 Claude Code 里说一句话就行）：
```
帮我部署一个计算器
```

>
> AI 会现场生成并部署到 Vulcan，浏览器自动弹出。

## Bridge API

每个部署的页面自动注入 `window.Vulcan`，网页内的 JS 可以读写文件、执行命令：

```javascript
// 读文件
const result = await Vulcan.readFile('./src/app.ts');

// 写文件
await Vulcan.writeFile('./config.json', newContent);

// 跑命令（白名单限制）
const output = await Vulcan.execute('git diff --stat');

// 获取项目结构
const tree = await Vulcan.getProjectTree(3);

// 弹出通知
Vulcan.toast('操作完成', 'success');
```

## 命令参考

```bash
vulcan start [--port 3000] [--no-open]  # 启动服务
vulcan status                            # 查看状态
vulcan init [--global] [--force]         # 安装 Skills
```

## 命令白名单

只有以下命令可以通过 `Vulcan.execute()` 执行：
- **git**: status, diff, log, branch, show, add, checkout
- **npm/yarn/pnpm**: run, test, lint, build, start
- **读文件**: ls, cat, head, tail, wc, find, grep, tree
- **开发**: node, python, echo, date, which, curl

## License

MIT

## 致谢

灵感：让 AI 不仅能写代码，还能**现场造一个工具给你用**，用完即走。
