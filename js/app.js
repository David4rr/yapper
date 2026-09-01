/**
 * YAPPER — Token Compression & Prompt Translation Engine
 * Main Application Bootstrap (MVC Entry Point)
 */

import { AppState } from './models/AppState.js';
import { StorageModel } from './models/StorageModel.js';
import { HistoryModel } from './models/HistoryModel.js';
import { StudioView } from './views/StudioView.js';
import { SettingsView } from './views/SettingsView.js';
import { HistoryView } from './views/HistoryView.js';
import { ToastView } from './views/ToastView.js';
import { ConfirmDialogView } from './views/ConfirmDialogView.js';
import { AppController } from './controllers/AppController.js';

function bootstrap() {
  const state = new AppState();

  // Resolve storage strategy before constructing HistoryModel so history
  // is loaded from the correct backend on first boot.
  const savedConfig = StorageModel.loadConfig();
  const initialStrategy = savedConfig?.storageStrategy ?? 'local';

  const historyModel = new HistoryModel(30, initialStrategy);

  const studioView = new StudioView();
  const settingsView = new SettingsView();
  const historyView = new HistoryView();
  const toastView = new ToastView();
  const confirmDialogView = new ConfirmDialogView();

  const app = new AppController({
    state,
    historyModel,
    studioView,
    settingsView,
    historyView,
    toastView,
    confirmDialogView
  });

  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
