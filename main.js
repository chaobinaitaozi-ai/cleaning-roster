import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
    });

    // 開発環境と本番環境（ビルド後）で読み込むURLを分ける
    if (app.isPackaged) {
        win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        win.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
