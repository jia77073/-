import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Sparkles, Save, RefreshCw, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MathRenderer } from "./MathRenderer";
// 安全版：通过后端接口调用 Gemini
async function performOCR(base64: string) {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });

    if (!response.ok) throw new Error("请求失败");
    const data = await response.json();
    return JSON.parse(data.result || "{}");
  } catch (error) {
    console.error("识别失败:", error);
    return null;
  }
}

async function generateSimilarQuestions(question: any) {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `基于以下题目生成3道举一反三的练习题：
题目：${question.content}
知识点：${question.knowledgePoint}`,
      }),
    });

    if (!response.ok) throw new Error("请求失败");
    const data = await response.json();
    return JSON.parse(data.result || "[]");
  } catch (error) {
    console.error("生成题目失败:", error);
    return [];
  }
}
import { WrongQuestionRecord, Question } from "@/src/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export function OCRPage({ onSave }: { onSave: (record: WrongQuestionRecord) => void }) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ocrResult, setOcrResult] = useState<Partial<Question> | null>(null);
  const [similarQuestions, setSimilarQuestions] = useState<Question[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        processOCR(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processOCR = async (base64: string) => {
    setIsProcessing(true);
    setOcrResult(null);
    setSimilarQuestions([]);
    try {
      const result = await performOCR(base64);
      setOcrResult(result);
      toast.success("识别成功");
    } catch (error) {
      console.error(error);
      toast.error("识别失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSimilar = async () => {
    if (!ocrResult) return;
    setIsGenerating(true);
    try {
      const questions = await generateSimilarQuestions(ocrResult);
      setSimilarQuestions(questions.map((q: any, i: number) => ({ ...q, id: `sim-${Date.now()}-${i}` })));
      toast.success("举一反三生成成功");
    } catch (error) {
      console.error(error);
      toast.error("生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!ocrResult || similarQuestions.length === 0) return;
    const record: WrongQuestionRecord = {
      id: `rec-${Date.now()}`,
      originalQuestion: {
        id: `orig-${Date.now()}`,
        content: ocrResult.content || "",
        answer: ocrResult.answer || "",
        analysis: ocrResult.analysis || "",
        knowledgePoint: ocrResult.knowledgePoint || "",
        difficulty: "中等",
      },
      similarQuestions,
      timestamp: Date.now(),
      tags: [ocrResult.knowledgePoint || "未分类"],
    };
    onSave(record);
    toast.success("已保存到错题本");
    // Reset
    setImage(null);
    setOcrResult(null);
    setSimilarQuestions([]);
  };

  return (
    <div className="space-y-6 pb-20">
      <Card className="border-dashed border-2 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center p-10 space-y-4">
          {image ? (
            <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden shadow-lg">
              <img src={image} alt="Uploaded" className="w-full h-full object-contain bg-black" />
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute top-2 right-2 rounded-full opacity-80 hover:opacity-100"
                onClick={() => setImage(null)}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center space-y-4 cursor-pointer w-full h-40"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-4 bg-primary/10 rounded-full">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">点击上传或拍摄错题</p>
                <p className="text-sm text-muted-foreground">支持图片识别与知识点提取</p>
              </div>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
          {!image && (
            <Button onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs">
              <Upload className="mr-2 h-4 w-4" /> 选择图片
            </Button>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center p-8 space-x-3 text-primary"
          >
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">正在识别题目并分析知识点...</span>
          </motion.div>
        )}

        {ocrResult && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">原题识别结果</CardTitle>
                  <CardDescription>知识点: <span className="text-primary font-medium">{ocrResult.knowledgePoint}</span></CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? <Check className="w-4 h-4 mr-1" /> : <Edit2 className="w-4 h-4 mr-1" />}
                  {isEditing ? "完成" : "修正"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">题目内容</label>
                      <Textarea 
                        value={ocrResult.content} 
                        onChange={(e) => setOcrResult({...ocrResult, content: e.target.value})}
                        rows={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">知识点</label>
                      <Input 
                        value={ocrResult.knowledgePoint} 
                        onChange={(e) => setOcrResult({...ocrResult, knowledgePoint: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-md border">
                    <MathRenderer content={ocrResult.content || ""} />
                  </div>
                )}
                
                {similarQuestions.length === 0 && (
                  <Button 
                    onClick={handleGenerateSimilar} 
                    disabled={isGenerating} 
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                  >
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    生成举一反三题目
                  </Button>
                )}
              </CardContent>
            </Card>

            {isGenerating && (
              <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="relative">
                  <Sparkles className="w-12 h-12 text-indigo-500 animate-pulse" />
                  <Loader2 className="w-16 h-16 text-indigo-200 animate-spin absolute -top-2 -left-2" />
                </div>
                <p className="text-indigo-600 font-medium animate-bounce">AI 正在为您精心挑选变式题...</p>
              </div>
            )}

            {similarQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
                    举一反三变式题
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleGenerateSimilar} disabled={isGenerating}>
                    <RefreshCw className="w-4 h-4 mr-1" /> 重新生成
                  </Button>
                </div>
                
                {similarQuestions.map((q, idx) => (
                  <Card key={q.id} className="overflow-hidden border-l-4 border-l-indigo-500">
                    <CardHeader className="bg-indigo-50/50 py-3">
                      <CardTitle className="text-sm font-bold text-indigo-700">变式题 {idx + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <MathRenderer content={q.content} />
                      <div className="pt-4 border-t border-dashed space-y-3">
                        <div className="flex items-start space-x-2">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">答案</span>
                          <div className="text-sm font-medium">{q.answer}</div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs font-bold text-amber-600 flex items-center">
                            解析 (侧重易错点)
                          </span>
                          <div className="text-sm text-slate-600 bg-amber-50/50 p-2 rounded border border-amber-100 italic">
                            <MathRenderer content={q.analysis} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={handleSave} className="w-full h-12 text-lg shadow-lg">
                  <Save className="mr-2 h-5 w-5" /> 保存到错题本
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
