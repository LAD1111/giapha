
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
      const matches = url.match(/\/d\/(.+?)(\/|$)/);
      if (matches && matches[1]) {
        return `https://docs.google.com/document/d/${matches[1]}/export?format=txt`;
      }
    }
    return url;
  },

  fetchFromCloud: async (url: string): Promise<AppData | null> => {
    try {
      if (!url || !url.startsWith('http')) return null;

      const fetchUrl = PersistenceService.convertGoogleDocUrl(url);
      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      // 1. Loại bỏ BOM (Byte Order Mark) và các ký tự trắng thừa
      const cleanJson = text.trim().replace(/^\uFEFF/, '');
      
      // 2. Kiểm tra nếu chuỗi trống
      if (!cleanJson) {
        console.warn("Dữ liệu từ Google Doc trống.");
        return null;
      }

      // 3. Kiểm tra xem có phải là JSON hay không (tránh trường hợp nhận về trang HTML login)
      if (!cleanJson.startsWith('{') && !cleanJson.startsWith('[')) {
        console.error("Dữ liệu nhận được không phải định dạng JSON. Có thể file chưa được công khai.");
        return null;
      }

      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Lỗi đồng bộ đám mây:", e);
      return null;
    }
  }
};
