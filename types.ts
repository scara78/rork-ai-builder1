export enum LogType {
  SYSTEM = 'SYSTEM',
  EDIT = 'EDIT',
  ERROR = 'ERROR',
  USER = 'USER',
  AI = 'AI'
}

export interface LogEntry {
  id: string;
  type: LogType;
  message: string;
  detail?: string;
  timestamp: Date;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
