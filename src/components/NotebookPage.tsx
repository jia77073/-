import { useState, useRef } from "react";
import { Search, FileText, Trash2, Printer, ChevronRight, Calendar, Tag, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MathRenderer } from "./MathRenderer";
import { WrongQuestionRecord } from "@/src/types";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export function NotebookPage({ records, onDelete }: { records: WrongQuestionRecord[], onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingRecord, setViewingRecord] = useState<WrongQuestionRecord | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredRecords = records.filter(r => 
    r.originalQuestion.content.toLowerCase().includes(search.toLowerCase()) ||
    r.originalQuestion.knowledgePoint.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handlePrint = async () => {
    if (selectedIds.size === 0) {
      toast.error("请先选择要打印的错题");
      return;
    }
    setIsPrinting(true);
    toast.info("正在生成 PDF，请稍候...");

    try {
      // Create a hidden container for printing
      const printContainer = document.createElement("div");
      printContainer.style.position = "absolute";
      printContainer.style.left = "-9999px";
      printContainer.style.top = "0";
      printContainer.style.width = "800px"; // Standard A4 width roughly
      printContainer.style.background = "white";
      printContainer.style.padding = "40px";
      document.body.appendChild(printContainer);

      const selectedRecords = records.filter(r => selectedIds.has(r.id));
      
      let html = `<h1 style="text-align: center; font-size: 24px; margin-bottom: 30px;">错题举一反三练习本</h1>`;
      
      selectedRecords.forEach((record, index) => {
        html += `
          <div style="margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
            <h2 style="font-size: 18px; color: #333;">错题 ${index + 1} - 知识点: ${record.originalQuestion.knowledgePoint}</h2>
            <div style="margin: 15px 0; padding: 15px; background: #f9f9f9; border-radius: 8px;">
              <strong>【原题】</strong><br/>
              ${record.originalQuestion.content}
            </div>
            <div style="margin-left: 20px;">
              ${record.similarQuestions.map((q, qIdx) => `
                <div style="margin-top: 20px; border-left: 3px solid #6366f1; padding-left: 15px;">
                  <strong>【变式题 ${qIdx + 1}】</strong><br/>
                  ${q.content}<br/><br/>
                  <div style="font-size: 14px; color: #666;">
                    <strong style="color: #10b981;">答案：</strong> ${q.answer}<br/>
                    <strong style="color: #f59e0b;">解析：</strong> ${q.analysis}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      });

      printContainer.innerHTML = html;

      // Use html2canvas to capture the content
      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`错题本_${new Date().toLocaleDateString()}.pdf`);
      
      document.body.removeChild(printContainer);
      toast.success("PDF 已生成并开始下载");
    } catch (error) {
      console.error(error);
      toast.error("生成 PDF 失败");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col space-y-4 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="搜索题目或知识点..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs">
            {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? (
              <CheckSquare className="w-4 h-4 mr-1 text-primary" />
            ) : (
              <Square className="w-4 h-4 mr-1" />
            )}
            全选 ({selectedIds.size})
          </Button>
          <Button 
            size="sm" 
            onClick={handlePrint} 
            disabled={selectedIds.size === 0 || isPrinting}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            <Printer className="w-4 h-4 mr-1" /> 导出 PDF
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-240px)]">
        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <FileText className="w-12 h-12 mb-2 opacity-20" />
              <p>暂无错题记录</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <Card key={record.id} className={`transition-all ${selectedIds.has(record.id) ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                <CardContent className="p-4 flex items-start space-x-3">
                  <Checkbox 
                    checked={selectedIds.has(record.id)} 
                    onCheckedChange={() => toggleSelect(record.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewingRecord(record)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded flex items-center">
                        <Tag className="w-3 h-3 mr-1" />
                        {record.originalQuestion.knowledgePoint}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(record.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 text-slate-700 font-medium">
                      {record.originalQuestion.content.replace(/\$/g, '')}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-indigo-600 font-medium">
                      <span>包含 {record.similarQuestions.length} 道变式题</span>
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(record.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>错题详情</span>
              <span className="text-sm font-normal text-muted-foreground">
                {viewingRecord && new Date(viewingRecord.timestamp).toLocaleString()}
              </span>
            </DialogTitle>
            <DialogDescription>
              知识点: {viewingRecord?.originalQuestion.knowledgePoint}
            </DialogDescription>
          </DialogHeader>
          
          {viewingRecord && (
            <div className="space-y-6 py-4">
              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 border-b pb-1">原题</h4>
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <MathRenderer content={viewingRecord.originalQuestion.content} />
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="font-bold text-indigo-600 border-b border-indigo-100 pb-1 flex items-center">
                  举一反三变式题
                </h4>
                {viewingRecord.similarQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-3 p-4 border border-indigo-100 rounded-lg bg-indigo-50/30">
                    <div className="text-xs font-bold text-indigo-600">变式题 {idx + 1}</div>
                    <MathRenderer content={q.content} />
                    <div className="pt-2 border-t border-indigo-100 space-y-2">
                      <div className="text-sm"><span className="font-bold text-green-600">答案：</span>{q.answer}</div>
                      <div className="text-sm bg-white/50 p-2 rounded text-slate-600 italic">
                        <span className="font-bold text-amber-600 not-italic">解析：</span>
                        <MathRenderer content={q.analysis} />
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
