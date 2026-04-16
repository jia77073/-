export interface Question {
  id: string;
  content: string;
  options?: string[];
  answer: string;
  analysis: string;
  knowledgePoint: string;
  difficulty: string;
}

export interface WrongQuestionRecord {
  id: string;
  originalQuestion: Question;
  similarQuestions: Question[];
  timestamp: number;
  tags: string[];
}
