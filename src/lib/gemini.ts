import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function performOCR(base64Image: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
          {
            text: `请识别图片中的题目。
提取以下信息并以 JSON 格式返回：
1. content: 题目正文（包含数学公式请使用 LaTeX 格式，例如 $a^2+b^2=c^2$）
2. options: 如果是选择题，提取选项列表
3. answer: 标准答案（如果有）
4. analysis: 题目解析（如果有）
5. knowledgePoint: 核心知识点（例如“一元二次方程”）

注意：数学公式必须使用标准 LaTeX 格式，行内公式用 $ 包裹。`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
          analysis: { type: Type.STRING },
          knowledgePoint: { type: Type.STRING },
        },
        required: ["content", "knowledgePoint"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function generateSimilarQuestions(originalQuestion: any) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            text: `基于以下原题和知识点，生成 3 道“举一反三”的相似题目。
知识点：${originalQuestion.knowledgePoint}
原题内容：${originalQuestion.content}

要求：
1. 覆盖同一知识点的不同角度或变式。
2. 难度与原题相当或略有梯度。
3. 每道题必须包含：题目正文、答案、侧重易错点的解析。
4. 解析中要明确指出“易错点”，例如“注意二次项系数不能为0”。
5. 数学公式必须使用标准 LaTeX 格式，行内公式用 $ 包裹。

以 JSON 数组格式返回，每个对象包含：content, answer, analysis, difficulty。`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            answer: { type: Type.STRING },
            analysis: { type: Type.STRING },
            difficulty: { type: Type.STRING },
          },
          required: ["content", "answer", "analysis"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
}
