import { Tray, Menu, BrowserWindow, shell, app } from 'electron';
import * as path from 'path';
import { clipboardService } from './clipboard-service';
import { store } from './store';

export function createTray(mainWindow: BrowserWindow): Tray {
  const tray = new Tray(path.join(__dirname, '../../resources/icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Hiện ứng dụng',
      click: (): void => {
        mainWindow.show();
      },
    },
    {
      label: 'Lưu Clipboard ngay',
      click: (): void => {
        void clipboardService.saveImageFromClipboard(true);
      },
    },
    { type: 'separator' },
    {
      label: 'Mở thư mục lưu ảnh',
      click: (): void => {
        const savePath = store.get('savePath');
        void shell.openPath(savePath as string);
      },
    },
    { type: 'separator' },
    {
      label: 'Thoát',
      click: (): void => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Clipboard to PNG Saver');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', (): void => {
    mainWindow.show();
  });

  return tray;
}
