
import { AppData } from '../types';

// URL mặc định hoặc người dùng có thể cấu hình trong UI
const DEFAULT_DATA_URL = "https://drive.google.com/drive/folders/1XU-B-zFLjhCA3dwJtSplnkuI6vCxaxOL";

export const PersistenceService = {
  saveLocal: (data: AppData) => {
    try {
      localStorage.setItem('giapha_le_data', JSON.stringify(data));
    } catch (e) {
      console.error("Lỗi lưu local:", e);
    }
  },

  loadLocal: (): AppData | null => {
    try {
      const saved = localStorage.getItem('giapha_le_data');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  // Hàm giả lập việc fetch dữ liệu từ link được chỉ định
  // Trong thực tế, người dùng cần cung cấp Direct Link của file JSON trong thư mục GDrive
  fetchFromCloud: async (directLink: string): Promise<AppData | null> => {
    try {
      const response = await fetch(directLink);
      if (!response.ok) throw new Error("Không thể kết nối link dữ liệu");
      const data = await response.json();
      return data;
    } catch (e) {
      console.error("Lỗi đồng bộ đám mây:", e);
      return null;
    }
  }
};
