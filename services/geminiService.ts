
import { GoogleGenAI } from "@google/genai";

// Hàm an toàn để lấy API Key
const getApiKey = () => {
  try {
    return process?.env?.API_KEY || "";
  } catch {
    return "";
  }
};

export const generateClanHistory = async (clanName: string, location: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return "Vui lòng cấu hình API KEY để sử dụng tính năng AI.";
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy viết một đoạn giới thiệu hào hùng về lịch sử dòng họ ${clanName} tại vùng đất ${location}. Bao gồm các giá trị truyền thống, tinh thần hiếu học và sự đoàn kết. Viết bằng tiếng Việt, phong cách trang trọng, cổ điển.`,
    });
    return response.text || "Lịch sử dòng họ đang được cập nhật...";
  } catch (error) {
    console.error("Error generating history:", error);
    return "Lịch sử dòng họ Lê là một hành trình dài của sự hiếu học, đoàn kết và cống hiến.";
  }
};

// --- Hệ thống đồng bộ đám mây đơn giản qua JSONBin.io (Public API) ---
// Bạn có thể đăng ký tài khoản tại jsonbin.io để lấy API Key riêng nếu muốn bảo mật hơn.
const JSON_BIN_API_KEY = "$2a$10$6m.v9qXz8/Q9.0BqW0fJ.O7V8f/9R8V/X8v8v8v8v8v8v8v8v8v8v"; // Key mẫu (nên thay bằng của bạn)

export const saveToCloud = async (data: any, binId: string) => {
  if (!binId) return null;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSON_BIN_API_KEY
      },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (err) {
    console.error("Cloud save error:", err);
    return false;
  }
};

export const loadFromCloud = async (binId: string) => {
  if (!binId) return null;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: {
        'X-Master-Key': JSON_BIN_API_KEY
      }
    });
    const data = await res.json();
    return data.record;
  } catch (err) {
    console.error("Cloud load error:", err);
    return null;
  }
};
