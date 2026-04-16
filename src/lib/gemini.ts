/**
 * 安全版 Gemini 调用（通过 Vercel 后端中转）
 */

export async function analyzeImage(base64: string) {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64 }),
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.result || "识别完成";
  } catch (error) {
    console.error("识别失败:", error);
    return "识别失败，请重试";
  }
}

export async function generateSimilarQuestions(originalQuestion: any) {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `基于以下原题和知识点，生成3道“举一反三”的相似题目。
知识点: ${originalQuestion.knowledgePoint}
原题内容: ${originalQuestion.content}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error("生成题目失败:", error);
    return [];
  }
}
