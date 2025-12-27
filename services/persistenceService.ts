
import { AppData } from '../types';

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

  /**
   * Chuyển đổi link Google Doc thông thường sang link export text/plain
   */
  convertGoogleDocUrl: (url: string): string => {
    if (url.includes('docs.google.com/document/d/')) {
      const matches = url.match(/\/d\/(.+?)\//);
      if (matches && matches[1]) {
        return `https://docs.google.com/document/d/${matches[1]}/export?format=txt`;
      }
    }
    return url;
  },

  fetchFromCloud: async (url: string): Promise<AppData | null> => {
    try {
      const fetchUrl = PersistenceService.convertGoogleDocUrl(url);
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error("Không thể tải dữ liệu từ Cloud. Hãy kiểm tra quyền chia sẻ của Google Doc.");
      
      const text = await response.text();
      // Loại bỏ các ký tự ẩn thường có trong export của Google Doc (BOM, v.v.)
      const cleanJson = text.trim().replace(/^\uFEFF/, '');
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Lỗi đồng bộ đám mây:", e);
      return null;
    }
  }
};
