import { useState, useEffect } from "react";
import { OCRPage } from "./components/OCRPage";
import { NotebookPage } from "./components/NotebookPage";
import { WrongQuestionRecord } from "./types";
import { Toaster } from "@/components/ui/sonner";
import { Camera, BookOpen, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function App() {
  const [records, setRecords] = useState<WrongQuestionRecord[]>([]);
  const [activeTab, setActiveTab] = useState("ocr");

  // Load records from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wrong_questions_records");
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved records", e);
      }
    }
  }, []);

  // Save records to localStorage
  useEffect(() => {
    localStorage.setItem("wrong_questions_records", JSON.stringify(records));
  }, [records]);

  const handleSaveRecord = (record: WrongQuestionRecord) => {
    setRecords([record, ...records]);
    setActiveTab("notebook");
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-2xl mx-auto shadow-xl border-x">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">错题举一反三</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">AI 智能学习助手</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="ocr" className="mt-0 focus-visible:outline-none">
            <OCRPage onSave={handleSaveRecord} />
          </TabsContent>
          <TabsContent value="notebook" className="mt-0 focus-visible:outline-none">
            <NotebookPage records={records} onDelete={handleDeleteRecord} />
          </TabsContent>
          
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-2 z-30 max-w-2xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100/50 p-1">
              <TabsTrigger 
                value="ocr" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex flex-col items-center justify-center py-1"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">错题识别</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notebook" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex flex-col items-center justify-center py-1"
              >
                <BookOpen className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">错题本</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </main>
      
      <Toaster position="top-center" />
    </div>
  );
}
