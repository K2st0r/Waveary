const { app, BrowserWindow, Notification, dialog, ipcMain, shell } = require("electron");
const path = require("node:path");
const { spawn } = require("node:child_process");
const fs = require("node:fs");

let mainWindow = null;
let serverProcess = null;
let shutdownRequested = false;

const desktopRoot = path.resolve(__dirname, "..");
const runtimeRoot = path.join(desktopRoot, "app-runtime");
const serverScriptPath = path.join(runtimeRoot, "waveary-web", "server", "standalone-server.mjs");
const preloadPath = path.join(__dirname, "preload.cjs");
const windowIconPath = path.join(
  runtimeRoot,
  "waveary-web",
  "dist",
  "brand",
  "waveary-logo-final-draft-11.png"
);

app.setName("Waveary");
app.setPath("userData", path.join(app.getPath("appData"), "Waveary"));
app.disableHardwareAcceleration();

app.whenReady()
  .then(async () => {
    ensureRuntimeExists();
    const loadingWindow = createWindow();
    mainWindow = loadingWindow;
    loadingWindow.loadURL(buildLoadingPageUrl());

    const port = await startRuntimeServer();
    const appUrl = `http://127.0.0.1:${port}/#chat`;

    loadingWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url).catch(() => {});
      return { action: "deny" };
    });

    loadingWindow.once("ready-to-show", () => {
      loadingWindow.show();
    });

    await loadingWindow.loadURL(appUrl);
  })
  .catch((error) => {
    dialog.showErrorBox(
      "Waveary Desktop Startup Failed",
      error instanceof Error ? error.message : "Unknown startup failure."
    );
    app.quit();
  });

app.on("window-all-closed", () => {
  shutdownRequested = true;
  stopRuntimeServer();
  app.quit();
});

app.on("before-quit", () => {
  shutdownRequested = true;
  stopRuntimeServer();
});

function createWindow() {
  return new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1080,
    minHeight: 760,
    show: false,
    backgroundColor: "#f6f1e8",
    title: "Waveary",
    autoHideMenuBar: true,
    icon: fs.existsSync(windowIconPath) ? windowIconPath : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
      spellcheck: false
    }
  });
}

ipcMain.handle("waveary:notifications:get-state", () => {
  return {
    available: Notification.isSupported(),
    permission: Notification.isSupported() ? "granted" : "unsupported"
  };
});

ipcMain.handle("waveary:notifications:request-permission", () => {
  return Notification.isSupported() ? "granted" : "unsupported";
});

ipcMain.handle("waveary:notifications:show", (_event, payload) => {
  if (!Notification.isSupported()) {
    return { delivered: false, reason: "unsupported" };
  }

  const title = normalizeNotificationText(payload?.title, "Waveary");
  const body = normalizeNotificationText(payload?.body, "");

  const notification = new Notification({
    title,
    body,
    icon: fs.existsSync(windowIconPath) ? windowIconPath : undefined,
    silent: false
  });

  notification.on("click", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }
  });

  notification.show();
  return { delivered: true };
});

function normalizeNotificationText(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 320) : fallback;
}

function ensureRuntimeExists() {
  if (!fs.existsSync(serverScriptPath)) {
    throw new Error(
      "Waveary desktop runtime is not prepared. Run `npm run desktop:prepare` before launching the desktop app."
    );
  }
}

function startRuntimeServer() {
  return new Promise((resolvePromise, rejectPromise) => {
    if (serverProcess) {
      rejectPromise(new Error("Waveary desktop runtime is already running."));
      return;
    }

    const dataDir = path.join(app.getPath("userData"), "waveary-data");
    fs.mkdirSync(dataDir, { recursive: true });

    const child = spawn(process.execPath, [serverScriptPath], {
      cwd: runtimeRoot,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        WAVEARY_DATA_DIR: dataDir,
        WAVEARY_HOST: "127.0.0.1",
        WAVEARY_PORT: "0"
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });

    serverProcess = child;
    let resolved = false;
    let stderrBuffer = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk) => {
      const text = String(chunk);
      const readyMatch = text.match(/__WAVEARY_SERVER_READY__:(\d+)/);

      if (readyMatch) {
        resolved = true;
        resolvePromise(Number.parseInt(readyMatch[1], 10));
      }
    });

    child.stderr.on("data", (chunk) => {
      stderrBuffer += String(chunk);
    });

    child.on("exit", (code) => {
      serverProcess = null;

      if (!resolved && !shutdownRequested) {
        rejectPromise(
          new Error(
            `Waveary desktop runtime exited before becoming ready (code ${code ?? "unknown"}). ${stderrBuffer.trim()}`
          )
        );
      }
    });

    child.on("error", (error) => {
      serverProcess = null;
      if (!resolved) {
        rejectPromise(error);
      }
    });
  });
}

function stopRuntimeServer() {
  if (!serverProcess) {
    return;
  }

  try {
    serverProcess.kill();
  } catch (_) {
  } finally {
    serverProcess = null;
  }
}

function buildLoadingPageUrl() {
  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Waveary</title>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #f6f1e8;
          color: #111;
          font-family: "Segoe UI", sans-serif;
        }
        .wrap {
          text-align: center;
        }
        .name {
          font-size: 2rem;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
        }
        .line {
          font-size: 0.95rem;
          opacity: 0.72;
        }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="name">Waveary</div>
        <div class="line">Preparing your local companion runtime...</div>
      </div>
    </body>
  </html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}
