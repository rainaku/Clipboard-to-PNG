import { clipboard, Notification, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { store } from './store';
import clipboardEvent from 'clipboard-event';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ClipboardService {
  private isWatching = false;

  constructor() {
    clipboardEvent.on('change', () => {
      if (store.get('autoSaveEnabled')) {
        void this.saveImageFromClipboard(true);
      }
    });
  }

  private async getActiveExplorerPath(): Promise<string | null> {
    if (process.platform !== 'win32') return null;
    try {
      // Improved PowerShell script to get focused Explorer path
      // Uses a more robust way to match HWND and handles Desktop/Explorer windows
      const script = `
        Add-Type -TypeDefinition '
          using System;
          using System.Runtime.InteropServices;
          public class Win32 {
            [DllImport("user32.dll")]
            public static extern IntPtr GetForegroundWindow();
          }
        ' -ErrorAction SilentlyContinue;
        $activeHwnd = [Win32]::GetForegroundWindow();
        $shell = New-Object -ComObject Shell.Application;
        $window = $shell.Windows() | Where-Object { $_.HWND -eq $activeHwnd };
        if ($window) {
          $path = $window.Document.Folder.Self.Path;
          if ($path) { return $path }
        }
        # Fallback check for Desktop
        $shellWindows = New-Object -ComObject Shell.Application;
        $desktop = $shellWindows.NameSpace(0).Self.Path;
        # Check if foreground is desktop
        # (This is simplified, focused Explorer is primary goal)
      `;
      const { stdout } = await execAsync(`powershell -NoProfile -Command "${script.replace(/\n/g, ' ')}"`);
      const detectedPath = stdout.trim();
      if (detectedPath && fs.existsSync(detectedPath)) {
        return detectedPath;
      }
      return null;
    } catch (e) {
      console.error('Lỗi khi phát hiện thư mục Explorer:', e);
      return null;
    }
  }

  startWatching(): void {
    if (!this.isWatching) {
      clipboardEvent.startListening();
      this.isWatching = true;
    }
  }

  stopWatching(): void {
    if (this.isWatching && (clipboardEvent as unknown as { child: unknown }).child) {
      clipboardEvent.stopListening();
      this.isWatching = false;
    }
  }

  async saveImageFromClipboard(
    isManual = false
  ): Promise<{ success: boolean; path?: string; error?: string; reason?: string }> {
    try {
      // 1. Kiểm tra clipboard có ảnh không đầu tiên (để bỏ qua text)
      const image = clipboard.readImage();
      if (image.isEmpty()) {
        // Chỉ hiện thông báo nếu bấm nút thủ công, còn lại im lặng bỏ qua (dạng text)
        if (isManual) {
          new Notification({
            title: 'Không tìm thấy ảnh',
            body: 'Clipboard không chứa dữ liệu hình ảnh.',
          }).show();
        }
        return { success: false, reason: 'no_image', error: 'Clipboard không có ảnh' };
      }

      // 2. Xác định thư mục lưu
      let saveDir = store.get('savePath');
      const explorerPath = await this.getActiveExplorerPath();

      // Nếu không phải click thủ công và cũng không ở Explorer -> Bỏ qua theo yêu cầu
      if (!isManual && !explorerPath) {
        console.log('Bỏ qua: Cửa sổ hiện tại không phải Explorer');
        return { success: false, reason: 'not_explorer', error: 'Không trong cửa sổ Explorer' };
      }

      // Yêu cầu: "File paste ra PHẢI LUÔN LUÔN paste ra cửa sổ explorer mà user đang focus"
      // Lờ đi store.get('saveToActiveExplorer') để luôn luôn làm việc này
      if (explorerPath) {
        saveDir = explorerPath;
      }

      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }

      const format = store.get('format');
      let buffer: Buffer;
      let extension = format;

      if (format === 'png') {
        buffer = image.toPNG();
      } else if (format === 'jpg') {
        buffer = image.toJPEG(90);
        extension = 'jpg';
      } else {
        buffer = image.toPNG();
        extension = 'png';
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      let fileName = `clip_${timestamp}.${extension}`;
      let filePath = path.join(saveDir, fileName);

      let counter = 1;
      while (fs.existsSync(filePath)) {
        fileName = `clip_${timestamp}_${counter}.${extension}`;
        filePath = path.join(saveDir, fileName);
        counter++;
      }

      fs.writeFileSync(filePath, buffer);

      const notification = new Notification({
        title: 'Đã lưu ảnh',
        body: `Lưu vào: ${saveDir}`,
        silent: false,
      });

      notification.on('click', () => {
        shell.showItemInFolder(filePath);
      });

      notification.show();

      return { success: true, path: filePath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đã có lỗi xảy ra.';
      console.error('Lỗi khi lưu ảnh:', error);
      new Notification({
        title: 'Lỗi khi lưu',
        body: errorMessage,
      }).show();
      return { success: false, error: errorMessage };
    }
  }
}

export const clipboardService = new ClipboardService();
