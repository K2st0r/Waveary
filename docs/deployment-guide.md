# Waveary Deployment Guide

[简体中文](./deployment-guide.zh-CN.md) · **English**

This guide is for users who want to actually run Waveary, even if they are not used to JavaScript monorepos.

It covers:

- local development startup
- ZIP download usage
- production preview startup
- Linux server deployment
- reverse proxy setup notes

## 1. Requirements

Waveary currently needs:

- Node.js 20 or newer
- npm 10 or newer

Check your environment:

```bash
node -v
npm -v
```

## 2. Get The Project

### Option A: Git clone

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

### Option B: GitHub ZIP download

1. Open the GitHub repository page.
2. Click `Code`.
3. Click `Download ZIP`.
4. Extract the ZIP.
5. Open the extracted folder in your terminal.

## 3. Install Dependencies

Run this in the project root:

```bash
npm install
```

This may take a little while on the first run.

## 4. Run Waveary Locally

### Development mode

```bash
npm run web:dev
```

This command will:

1. build `waveary-core`
2. build `waveary-memory`
3. build `waveary-voice`
4. start the `waveary-web` dev server

Default local address:

```text
http://127.0.0.1:4173
```

### Production-style local preview

```bash
npm run web:preview
```

This is useful when you want to test the built site instead of the hot-reload development server.

## 5. First-Time Provider Setup

Waveary needs a model provider configuration before normal chat works.

You have two ways to do this.

### Option A: Set it up in the web UI

1. Start Waveary.
2. Open `http://127.0.0.1:4173`.
3. Go to the console.
4. Select a provider.
5. Enter `Base URL`.
6. Enter `API Key`.
7. Fetch available models.
8. Select a model.

### Option B: Use the CLI setup helper

```bash
npm run setup:provider
```

This helper will:

- show provider presets
- ask for your API key
- fetch models from that provider
- let you choose one
- save the result locally

Saved provider config is written to:

```text
.waveary/provider-config.json
```

## 6. Verify Your Provider Configuration

If the UI loads but model calls fail, run:

```bash
npm run verify:provider
```

This verifies that your current provider configuration can:

- reach the provider
- list models
- select a model
- complete one real chat turn

If you only want to inspect what models the current key can use:

```bash
npm run models:provider
```

## 7. Local Data And Persistence

Waveary stores local runtime data in:

```text
.waveary/
```

Important files may include:

- `.waveary/provider-config.json`
- `.waveary/chat-sessions.json`
- `.waveary/chat-sessions.db`
- `.waveary/chat-persistence.json`

If you want to keep your local chat and config after moving the project, back up this folder.

## 8. Reset Local Test Memory

If you want to clear chat memory without deleting the whole project:

```bash
npm run reset:test-memory
```

This is the supported reset path.

Do not manually delete files while the server is still running unless you know exactly what you are doing.

## 9. Deploy On A Linux Server

Recommended target:

- Ubuntu 22.04 or similar
- Node.js 20+
- Nginx or Caddy as reverse proxy

### Step-by-step

#### 1. Install Node.js

Use your preferred Node.js 20+ installation method.

#### 2. Pull the repository

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

#### 3. Install dependencies

```bash
npm install
```

#### 4. Start Waveary preview

```bash
npm run web:preview
```

This launches the app on:

```text
127.0.0.1:4173
```

#### 5. Keep it alive

Use `pm2`, `systemd`, or another process manager.

Example with `pm2`:

```bash
npm install -g pm2
pm2 start npm --name waveary -- run web:preview
pm2 save
```

## 10. Reverse Proxy Example

### Nginx example

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

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 11. Update Waveary Later

If you deployed through Git:

```bash
git pull
npm install
npm run web:build
pm2 restart waveary
```

If you run without `pm2`, restart your running Waveary process manually after rebuild.

## 12. Troubleshooting

### `npm install` fails

Try:

```bash
npm cache verify
npm install
```

### Port `4173` is already in use

Stop the existing process using that port, then start Waveary again.

### The page loads but provider functions fail

Run:

```bash
npm run verify:provider
```

### The page seems stale after backend changes

Restart the Waveary process. The project already documents that stale local dev or preview processes can serve older code.

## 13. Current Best User Path

If you are new and just want the simplest path:

1. Install Node.js.
2. Download the ZIP or clone the repo.
3. Run `npm install`.
4. Run `npm run web:dev`.
5. Open `http://127.0.0.1:4173`.
6. Configure your provider in the console.
7. Start chatting.
