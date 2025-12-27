
import { GoogleGenAI, Type } from "@google/genai";

// Always initialize with process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateClanHistory = async (clanName: string, location: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy viết một đoạn giới thiệu hào hùng về lịch sử dòng họ ${clanName} tại vùng đất ${location}. Bao gồm các giá trị truyền thống, tinh thần hiếu học và sự đoàn kết. Viết bằng tiếng Việt, phong cách trang trọng, cổ điển.`,
    });
    // Use .text property to get the generated content
    return response.text;
  } catch (error) {
    console.error("Error generating history:", error);
    return "Lịch sử dòng họ đang được cập nhật...";
  }
};

export const getRegulationSummary = async (rawText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy tóm tắt các điểm chính của tộc ước này thành một danh sách các điều khoản dễ hiểu nhưng vẫn giữ được sự trang nghiêm: ${rawText}`,
    });
    // Use .text property to get the generated content
    return response.text;
  } catch (error) {
    console.error("Error summarizing regulations:", error);
    return rawText;
  }
};
