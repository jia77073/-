const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // 配置跨域
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理预检请求
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { image, prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key 未配置" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let result;
    if (image) {
      // 处理图片识别请求
      const response = await model.generateContent([
        {
          inlineData: {
            data: image.split(",")[1],
            mimeType: "image/jpeg",
          },
        },
        "识别这道数学题，返回 JSON 格式，包含 content、answer、analysis、knowledgePoint 字段",
      ]);
      result = response.response.text();
    } else if (prompt) {
      // 处理生成练习题请求
      const response = await model.generateContent(prompt);
      result = response.response.text();
    } else {
      return res.status(400).json({ error: "缺少请求参数" });
    }

    res.status(200).json({ result });
  } catch (error) {
    console.error("Gemini API 调用错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
};
