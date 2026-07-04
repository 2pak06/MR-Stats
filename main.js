const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

autoUpdater.autoDownload = false;

let mainWindow;
let updatePromptShown = false;
let updateDownloadStarted = false;
let updateDownloadFailedShown = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 430,
    height: 820,
    minWidth: 360,
    minHeight: 620,
    backgroundColor: "#0f1115",
    title: "MR Stats",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

function checkForUpdates() {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.checkForUpdates().catch((error) => {
    console.error("Update check failed:", error);
    showUpdateError("Не вдалося перевірити оновлення.");
  });
}

autoUpdater.on("update-available", async () => {
  if (updatePromptShown || updateDownloadStarted) {
    return;
  }

  updatePromptShown = true;

  const result = await dialog.showMessageBox(mainWindow, {
    type: "info",
    buttons: ["Оновити зараз", "Нагадати пізніше"],
    defaultId: 0,
    cancelId: 1,
    title: "Оновлення MR Stats",
    message: "Оновлення доступне. Завантажити зараз?"
  });

  if (result.response !== 0) {
    return;
  }

  updateDownloadStarted = true;
  updateDownloadFailedShown = false;

  if (mainWindow) {
    mainWindow.setProgressBar(0);
  }

  autoUpdater.downloadUpdate().catch((error) => {
    handleUpdateDownloadError(error);
  });
});

autoUpdater.on("download-progress", (progress) => {
  if (!mainWindow || !Number.isFinite(progress.percent)) {
    return;
  }

  mainWindow.setProgressBar(Math.max(0, Math.min(1, progress.percent / 100)));
});

autoUpdater.on("update-downloaded", async () => {
  if (mainWindow) {
    mainWindow.setProgressBar(-1);
  }

  const result = await dialog.showMessageBox(mainWindow, {
    type: "info",
    buttons: ["Перезапустити", "Пізніше"],
    defaultId: 0,
    cancelId: 1,
    title: "Оновлення MR Stats",
    message: "Оновлення готове. Перезапустити MR Stats зараз?"
  });

  if (result.response === 0) {
    autoUpdater.quitAndInstall();
  }
});

autoUpdater.on("error", (error) => {
  if (updateDownloadStarted) {
    handleUpdateDownloadError(error);
    return;
  }

  console.error("Auto updater error:", error);
  showUpdateError("Не вдалося перевірити оновлення.");
});

function handleUpdateDownloadError(error) {
  console.error("Update download failed:", error);

  updateDownloadStarted = false;

  if (mainWindow) {
    mainWindow.setProgressBar(-1);
  }

  if (updateDownloadFailedShown) {
    return;
  }

  updateDownloadFailedShown = true;

  dialog.showMessageBox(mainWindow, {
    type: "error",
    buttons: ["OK"],
    title: "Оновлення MR Stats",
    message: "Помилка оновлення. Не вдалося завантажити оновлення."
  });
}

function showUpdateError(message) {
  dialog.showMessageBox(mainWindow, {
    type: "error",
    buttons: ["OK"],
    title: "Оновлення MR Stats",
    message: `Помилка оновлення. ${message}`
  });
}

app.whenReady().then(() => {
  createWindow();
  checkForUpdates();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
