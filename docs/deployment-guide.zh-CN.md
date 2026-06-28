# Waveary 部署指南

**简体中文** · [English](./deployment-guide.md)

这份指南写给真正想把 Waveary 跑起来的人，即使你并不熟悉 JavaScript monorepo 也没关系。

内容包括：

- 本地开发启动
- ZIP 下载后的使用方式
- 本地生产预览启动
- Linux 服务器部署
- 反向代理配置说明

## 1. 环境要求

目前运行 Waveary 需要：

- Node.js 20 或更高版本
- npm 10 或更高版本

检查当前环境：

```bash
node -v
npm -v
```

## 2. 获取项目

### 方式 A：Git 克隆

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

### 方式 B：GitHub ZIP 下载

1. 打开 GitHub 仓库页面。
2. 点击 `Code`。
3. 点击 `Download ZIP`。
4. 解压 ZIP。
5. 在终端中打开解压后的项目目录。

## 3. 安装依赖

在项目根目录运行：

```bash
npm install
```

首次安装可能会花一点时间。

## 4. 本地运行 Waveary

### 开发模式

```bash
npm run web:dev
```

这个命令会：

1. 构建 `waveary-core`
2. 构建 `waveary-memory`
3. 构建 `waveary-voice`
4. 启动 `waveary-web` 开发服务器

默认本地地址：

```text
http://127.0.0.1:4173
```

### 本地生产预览模式

```bash
npm run web:preview
```

当你想测试构建后的站点，而不是热更新开发服务器时，这个模式更合适。

## 5. 首次配置模型供应商

Waveary 需要先配置模型供应商，聊天功能才能正常工作。

你可以用两种方式完成配置。

### 方式 A：在网页里配置

1. 启动 Waveary。
2. 打开 `http://127.0.0.1:4173`。
3. 进入控制台。
4. 选择供应商。
5. 输入 `Base URL`。
6. 输入 `API Key`。
7. 获取可用模型。
8. 选择一个模型。

### 方式 B：使用命令行配置助手

```bash
npm run setup:provider
```

这个助手会：

- 显示供应商预设
- 询问你的 API Key
- 从供应商拉取模型
- 让你选择可用模型
- 把结果保存到本地

保存后的供应商配置会写入：

```text
.waveary/provider-config.json
```

## 6. 验证供应商配置

如果页面能打开，但模型调用失败，请运行：

```bash
npm run verify:provider
```

这个命令会验证当前配置是否真的能够：

- 连接供应商
- 拉取模型列表
- 选择模型
- 完成一次真实聊天请求

如果你只是想查看当前 Key 能用哪些模型：

```bash
npm run models:provider
```

## 7. 本地数据与持久化

Waveary 会把本地运行数据保存在：

```text
.waveary/
```

重要文件通常包括：

- `.waveary/provider-config.json`
- `.waveary/chat-sessions.json`
- `.waveary/chat-sessions.db`
- `.waveary/chat-persistence.json`

如果你要迁移项目并保留聊天记录和配置，请一起备份这个文件夹。

## 8. 重置本地测试记忆

如果你想清空聊天记忆，而不是删除整个项目：

```bash
npm run reset:test-memory
```

这是当前支持的标准重置方式。

除非你非常清楚自己在做什么，否则不要在服务仍在运行时手动删除这些文件。

## 9. 部署到 Linux 服务器

推荐部署环境：

- Ubuntu 22.04 或同级别 Linux
- Node.js 20+
- 使用 Nginx 或 Caddy 做反向代理

### 分步流程

#### 1. 安装 Node.js

使用你习惯的方式安装 Node.js 20+。

#### 2. 拉取仓库

```bash
git clone https://github.com/K2st0r/Waveary.git
cd Waveary
```

#### 3. 安装依赖

```bash
npm install
```

#### 4. 启动 Waveary 预览服务

```bash
npm run web:preview
```

默认会启动在：

```text
127.0.0.1:4173
```

#### 5. 持续运行

建议使用 `pm2`、`systemd` 或其他进程管理工具保持服务常驻。

`pm2` 示例：

```bash
npm install -g pm2
pm2 start npm --name waveary -- run web:preview
pm2 save
```

## 10. 反向代理示例

### Nginx 示例

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

修改完 Nginx 后：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 11. 后续更新 Waveary

如果你是通过 Git 部署的：

```bash
git pull
npm install
npm run web:build
pm2 restart waveary
```

如果你没有使用 `pm2`，那就在重新构建后手动重启正在运行的 Waveary 进程。

## 12. 常见问题

### `npm install` 失败

可以尝试：

```bash
npm cache verify
npm install
```

### `4173` 端口已被占用

先停止占用该端口的进程，再重新启动 Waveary。

### 页面能打开，但供应商功能失败

运行：

```bash
npm run verify:provider
```

### 后端修改后页面看起来还是旧的

重启 Waveary 进程。项目里已经明确记录过，本地旧的 dev 或 preview 进程可能会继续提供旧代码。

## 13. 当前最推荐的使用路径

如果你是第一次使用，只想走最简单的路径：

1. 安装 Node.js。
2. 下载 ZIP 或克隆仓库。
3. 运行 `npm install`。
4. 运行 `npm run web:dev`。
5. 打开 `http://127.0.0.1:4173`。
6. 在控制台中配置你的供应商。
7. 开始聊天。
