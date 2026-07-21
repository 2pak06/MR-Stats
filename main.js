const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const appUserModelId = "com.mrstats.app";
const appIconPath = path.join(__dirname, "build", "icon.ico");

autoUpdater.autoDownload = false;
app.setAppUserModelId(appUserModelId);

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
    icon: appIconPath,
    backgroundColor: "#0f1115",
    title: "MR Stats",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

function checkForUpdates() {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.checkForUpdates().catch((error) => {
    logUpdaterError("checkForUpdates", error);
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

  logUpdaterError("autoUpdater error event", error);
  showUpdateError("Не вдалося перевірити оновлення.");
});

function handleUpdateDownloadError(error) {
  logUpdaterError("downloadUpdate", error);

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

function logUpdaterError(context, error) {
  console.error(`Updater error: ${context}`);
  console.error("Updater app.isPackaged:", app.isPackaged);
  console.error("Updater app version:", app.getVersion());
  console.error("Updater resourcesPath:", process.resourcesPath);
  console.error("Updater execPath:", process.execPath);
  console.error("Updater feedURL:", autoUpdater.getFeedURL?.());
  console.error("Updater error message:", error?.message);
  console.error("Updater error stack:", error?.stack);
  console.error("Updater error code:", error?.code);
  console.error("Updater error statusCode:", error?.statusCode);
  console.error("Updater error url:", error?.url);
  console.error("Updater error response statusCode:", error?.response?.statusCode);
  console.error("Updater error response statusMessage:", error?.response?.statusMessage);
  console.error("Updater error response url:", error?.response?.url);
  console.error("Updater error response:", error?.response);
  console.error("Updater error object:", error);
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
