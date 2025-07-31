// Types and interfaces for the Narada AI agent system

export type AgentRole = 'coordinator' | 'planner' | 'researcher' | 'reporter' | 'coder';

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  execute: (task: Task) => Promise<AgentResponse>;
}

export interface Task {
  id: string;
  type: string;
  content: string;
  context?: any;
  createdAt: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface SubTask extends Task {
  parentId: string;
  dependencies?: string[];
}

export interface ResearchTask extends Task {
  subQuestions: string[];
  sources: string[];
  findings: string[];
}

export interface AgentResponse {
  taskId: string;
  agentId: string;
  content: string;
  status: 'success' | 'error' | 'needs-human-input';
  nextAction?: string;
  data?: any;
}

export interface ResearchPlan {
  id: string;
  mainQuery: string;
  subQuestions: SubQuestion[];
  createdAt: Date;
}

export interface SubQuestion {
  id: string;
  question: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  sources?: string[];
  findings?: string;
}

export interface SearchResult {
  query: string;
  urls: string[];
  snippets: string[];
  content: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  status: 'processing' | 'ready' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sources?: string[];
    subTasks?: SubTask[];
  };
}

export interface ChatHistory extends Array<ChatMessage> {}