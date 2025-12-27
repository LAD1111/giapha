
import { GoogleGenAI } from "@google/genai";

export const generateClanHistory = async (clanName: string, location: string) => {
  try {
    // Khởi tạo instance ngay trước khi gọi để đảm bảo lấy được API_KEY mới nhất
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy viết một đoạn giới thiệu hào hùng về lịch sử dòng họ ${clanName} tại vùng đất ${location}. Bao gồm các giá trị truyền thống, tinh thần hiếu học và sự đoàn kết. Viết bằng tiếng Việt, phong cách trang trọng, cổ điển.`,
    });
    return response.text || "Lịch sử dòng họ đang được cập nhật...";
  } catch (error) {
    console.error("Error generating history:", error);
    return "Lịch sử dòng họ Lê là một hành trình dài của sự hiếu học, đoàn kết và cống hiến. Khởi nguồn từ vùng đất linh thiêng, con cháu họ Lê đã không ngừng nỗ lực, đóng góp công sức vào sự nghiệp xây dựng và bảo vệ tổ quốc qua nhiều thế hệ.";
  }
};

export const getRegulationSummary = async (rawText: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy tóm tắt các điểm chính của tộc ước này thành một danh sách các điều khoản dễ hiểu nhưng vẫn giữ được sự trang nghiêm: ${rawText}`,
    });
    return response.text || rawText;
  } catch (error) {
    console.error("Error summarizing regulations:", error);
    return rawText;
  }
};
