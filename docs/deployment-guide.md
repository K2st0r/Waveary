# Waveary Deployment Guide | Waveary 部署指南

This guide is for users who want to actually run Waveary, even if they are not used to JavaScript monorepos.  
这份指南写给真正想把 Waveary 跑起来的人，即使你并不熟悉 JavaScript monorepo 也没关系。

It covers:  
内容包括：

- local development startup
- ZIP download usage
- production preview startup
- Linux server deployment
- reverse proxy setup notes

- 本地开发启动
- ZIP 下载后的使用方式
- 本地生产预览启动
- Linux 服务器部署
- 反向代理配置说明

## 1. Requirements | 环境要求

Waveary currently needs:  
目前运行 Waveary 需要：

- Node.js 20 or newer
- npm 10 or newer

- Node.js 20 或更高版本
- npm 10 或更高版本

Check your environment:  
检查当前环境：

```bash
node -v
npm -v
```

## 2. Get The Project | 获取项目

### Option A: Git clone | 方式 A：Git 克隆

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

### Option B: GitHub ZIP download | 方式 B：GitHub ZIP 下载

1. Open the GitHub repository page.
2. Click `Code`.
3. Click `Download ZIP`.
4. Extract the ZIP.
5. Open the extracted folder in your terminal.

1. 打开 GitHub 仓库页面。
2. 点击 `Code`。
3. 点击 `Download ZIP`。
4. 解压 ZIP。
5. 在终端中打开解压后的项目目录。

## 3. Install Dependencies | 安装依赖

Run this in the project root:  
在项目根目录运行：

```bash
npm install
```

This may take a little while on the first run.  
首次安装可能会花一点时间。

## 4. Run Waveary Locally | 本地运行 Waveary

### Development mode | 开发模式

```bash
npm run web:dev
```

This command will:  
这个命令会：

1. build `waveary-core`
2. build `waveary-memory`
3. build `waveary-voice`
4. start the `waveary-web` dev server

1. 构建 `waveary-core`
2. 构建 `waveary-memory`
3. 构建 `waveary-voice`
4. 启动 `waveary-web` 开发服务器

Default local address:  
默认本地地址：

```text
http://127.0.0.1:4173
```

### Production-style local preview | 本地生产预览模式

```bash
npm run web:preview
```

This is useful when you want to test the built site instead of the hot-reload development server.  
当你想测试构建后的站点，而不是热更新开发服务器时，这个模式更合适。

## 5. First-Time Provider Setup | 首次配置模型供应商

Waveary needs a model provider configuration before normal chat works.  
Waveary 需要先配置模型供应商，聊天功能才能正常工作。

You have two ways to do this.  
你可以用两种方式完成配置。

### Option A: Set it up in the web UI | 方式 A：在网页里配置

1. Start Waveary.
2. Open `http://127.0.0.1:4173`.
3. Go to the console.
4. Select a provider.
5. Enter `Base URL`.
6. Enter `API Key`.
7. Fetch available models.
8. Select a model.

1. 启动 Waveary。
2. 打开 `http://127.0.0.1:4173`。
3. 进入控制台。
4. 选择供应商。
5. 输入 `Base URL`。
6. 输入 `API Key`。
7. 获取可用模型。
8. 选择一个模型。

### Option B: Use the CLI setup helper | 方式 B：使用命令行配置助手

```bash
npm run setup:provider
```

This helper will:  
这个助手会：

- show provider presets
- ask for your API key
- fetch models from that provider
- let you choose one
- save the result locally

- 显示供应商预设
- 询问你的 API Key
- 从供应商拉取模型
- 让你选择可用模型
- 把结果保存到本地

Saved provider config is written to:  
保存后的供应商配置会写入：

```text
.waveary/provider-config.json
```

## 6. Verify Your Provider Configuration | 验证供应商配置

If the UI loads but model calls fail, run:  
如果页面能打开，但模型调用失败，请运行：

```bash
npm run verify:provider
```

This verifies that your current provider configuration can:  
这个命令会验证当前配置是否真的能够：

- reach the provider
- list models
- select a model
- complete one real chat turn

- 连接供应商
- 拉取模型列表
- 选择模型
- 完成一次真实聊天请求

If you only want to inspect what models the current key can use:  
如果你只是想查看当前 Key 能用哪些模型：

```bash
npm run models:provider
```

## 7. Local Data And Persistence | 本地数据与持久化

Waveary stores local runtime data in:  
Waveary 会把本地运行数据保存在：

```text
.waveary/
```

Important files may include:  
重要文件通常包括：

- `.waveary/provider-config.json`
- `.waveary/chat-sessions.json`
- `.waveary/chat-sessions.db`
- `.waveary/chat-persistence.json`

If you want to keep your local chat and config after moving the project, back up this folder.  
如果你要迁移项目并保留聊天记录和配置，请一起备份这个文件夹。

## 8. Reset Local Test Memory | 重置本地测试记忆

If you want to clear chat memory without deleting the whole project:  
如果你想清空聊天记忆，而不是删除整个项目：

```bash
npm run reset:test-memory
```

This is the supported reset path.  
这是当前支持的标准重置方式。

Do not manually delete files while the server is still running unless you know exactly what you are doing.  
除非你非常清楚自己在做什么，否则不要在服务仍在运行时手动删除这些文件。

## 9. Deploy On A Linux Server | 部署到 Linux 服务器

Recommended target:  
推荐部署环境：

- Ubuntu 22.04 or similar
- Node.js 20+
- Nginx or Caddy as reverse proxy

- Ubuntu 22.04 或同级别 Linux
- Node.js 20+
- 使用 Nginx 或 Caddy 做反向代理

### Step-by-step | 分步流程

#### 1. Install Node.js | 安装 Node.js

Use your preferred Node.js 20+ installation method.  
使用你习惯的方式安装 Node.js 20+。

#### 2. Pull the repository | 拉取仓库

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

#### 3. Install dependencies | 安装依赖

```bash
npm install
```

#### 4. Start Waveary preview | 启动 Waveary 预览服务

```bash
npm run web:preview
```

This launches the app on:  
默认会启动在：

```text
127.0.0.1:4173
```

#### 5. Keep it alive | 持续运行

Use `pm2`, `systemd`, or another process manager.  
建议使用 `pm2`、`systemd` 或其他进程管理工具保持服务常驻。

Example with `pm2`:  
`pm2` 示例：

```bash
npm install -g pm2
pm2 start npm --name waveary -- run web:preview
pm2 save
```

## 10. Reverse Proxy Example | 反向代理示例

### Nginx example | Nginx 示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

After editing Nginx:  
修改完 Nginx 后：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 11. Update Waveary Later | 后续更新 Waveary

If you deployed through Git:  
如果你是通过 Git 部署的：

```bash
git pull
npm install
npm run web:build
pm2 restart waveary
```

If you run without `pm2`, restart your running Waveary process manually after rebuild.  
如果你没有使用 `pm2`，那就在重新构建后手动重启正在运行的 Waveary 进程。

## 12. Troubleshooting | 常见问题

### `npm install` fails | `npm install` 失败

Try:  
可以尝试：

```bash
npm cache verify
npm install
```

### Port `4173` is already in use | `4173` 端口已被占用

Stop the existing process using that port, then start Waveary again.  
先停止占用该端口的进程，再重新启动 Waveary。

### The page loads but provider functions fail | 页面能打开，但供应商功能失败

Run:  
运行：

```bash
npm run verify:provider
```

### The page seems stale after backend changes | 后端修改后页面看起来还是旧的

Restart the Waveary process. The project already documents that stale local dev or preview processes can serve older code.  
重启 Waveary 进程。项目里已经明确记录过，本地旧的 dev 或 preview 进程可能会继续提供旧代码。

## 13. Current Best User Path | 当前最推荐的使用路径

If you are new and just want the simplest path:  
如果你是第一次使用，只想走最简单的路径：

1. Install Node.js.
2. Download the ZIP or clone the repo.
3. Run `npm install`.
4. Run `npm run web:dev`.
5. Open `http://127.0.0.1:4173`.
6. Configure your provider in the console.
7. Start chatting.

1. 安装 Node.js。
2. 下载 ZIP 或克隆仓库。
3. 运行 `npm install`。
4. 运行 `npm run web:dev`。
5. 打开 `http://127.0.0.1:4173`。
6. 在控制台中配置你的供应商。
7. 开始聊天。
