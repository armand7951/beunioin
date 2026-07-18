export interface Mascot {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  quote: string;
  color: string;
  borderColor: string;
  bgColor: string;
  guidelines: { title: string; content: string }[];
  suggestedQuestions: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  timestamp: Date;
}

export interface CaseReport {
  id: string;
  name: string;
  contact: string;
  volunteerType: string;
  organization: string;
  issueType: string;
  description: string;
  status: "pending" | "processing" | "resolved";
  createdAt: string;
  statusMessage: string;
}

export interface ShieldCertificate {
  recipientName: string;
  volunteerType: string;
  score: number;
  date: string;
  certificateId: string;
}
