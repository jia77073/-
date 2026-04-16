/**
 * 安全版：通过后端接口调用 Gemini
 * 不会再出现 API Key 错误
 */
export async function performOCR(base64: string) {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });

    const data = await response.json();
    return JSON.parse(data.result || "{}");
  } catch (error) {
    console.error("OCR识别失败", error);
    return null;
  }
}

export async function generateSimilarQuestions(question: any) {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `
基于以下题目，生成3道举一反三的练习题：
原题：${question.content}
知识点：${question.knowledgePoint}
返回纯数组JSON，不要多余内容。
        `,
      }),
    });

    const data = await response.json();
    return JSON.parse(data.result || "[]");
  } catch (error) {
    console.error("生成题目失败", error);
    return [];
  }
}
