---
description: Deploy an interactive HTML page to the local Vulcan for the user to view in browser
---

You need to deploy an interactive HTML page to the local Vulcan. Follow these steps:

## Step 1: Check Vulcan is Running

Run this command to check:
```bash
curl -s http://localhost:3000/api/health
```

If it fails (connection refused), start Vulcan first:
```bash
vulcan start --no-open
```

Wait for it to confirm "Server running" before continuing.

## Step 2: Build the HTML

Create a **single-file HTML** page. Follow these rules strictly:

1. **Always include bridge.js** in `<head>`:
```html
<script src="/bridge.js"></script>
```

2. **Use ONLY local libraries** (NO external CDNs):
```html
<script src="/lib/tailwind.min.js"></script>   <!-- Tailwind CSS -->
<script src="/lib/echarts.min.js"></script>    <!-- ECharts (charts/dashboards) -->
<script src="/lib/g6.min.js"></script>         <!-- AntV G6 (graphs/topology) -->
```

3. **Styling**: Use Tailwind CSS utility classes. Design should be clean, modern, dark theme (bg-gray-900 text-white), responsive.

4. **All CSS and JS must be inline** in the single HTML file.

5. **Use the Bridge API** for any system interactions from the page:

| Method | What it does |
|--------|-------------|
| `await Vulcan.readFile(path)` | Read a local file, returns `{content}` |
| `await Vulcan.writeFile(path, content)` | Write to a local file |
| `await Vulcan.execute(cmd, args?)` | Run a whitelisted shell command, returns `{stdout}` |
| `await Vulcan.getProjectTree(depth?)` | Get project directory structure |
| `await Vulcan.getProjectInfo()` | Get project metadata |
| `Vulcan.toast(msg, type)` | Show notification (`'success'`/`'error'`/`'info'`) |

## Step 3: Deploy

Use a bash curl command to deploy. The page name should be descriptive, using only letters/numbers/underscores:

```bash
curl -s -X POST http://localhost:3000/api/view/deploy \
  -H "Content-Type: application/json" \
  -d '{"name": "PAGE_NAME_HERE", "html": "ESCAPED_HTML_HERE"}'
```

IMPORTANT: When embedding HTML in JSON, you must properly escape all double quotes and backslashes. Use the heredoc approach for complex HTML:

```bash
cat <<'HTMLEOF' | curl -s -X POST http://localhost:3000/api/view/deploy -H "Content-Type: application/json" -d @-
{"name": "PAGE_NAME_HERE", "html": "<!DOCTYPE html><html>...your html here...</html>"}
HTMLEOF
```

Or write the HTML to a temp file first, then deploy with a small node script:
```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('/tmp/vulcan_page.html', 'utf-8');
fetch('http://localhost:3000/api/view/deploy', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: 'PAGE_NAME', html})
}).then(r => r.json()).then(d => console.log(d.fullUrl));
"
```

## Step 4: Tell the User

After deploying, tell the user:
> "I've deployed the page. Open **http://localhost:3000/view/PAGE_NAME.html** in your browser."

## User Request Context

The user wants to deploy: $ARGUMENTS
