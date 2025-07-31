import { Agent, Task, AgentResponse, ResearchPlan, SubQuestion } from '../types';

export class PlannerAgent implements Agent {
  id: string;
  role: 'planner' = 'planner';
  name: string;
  description: string;

  constructor() {
    this.id = 'planner-001';
    this.name = 'Planner Agent';
    this.description = 'Breaks down user requests into detailed research plans';
  }

  async execute(task: Task): Promise<AgentResponse> {
    try {
      // For the planner, the task content is the user's query
      const userQuery = task.content;
      
      // Generate a research plan by breaking down the query into sub-questions
      const researchPlan = this.generateResearchPlan(userQuery);
      
      return {
        taskId: task.id,
        agentId: this.id,
        content: `Research plan created for: "${userQuery}"`,
        status: 'success',
        data: {
          plan: researchPlan
        }
      };
    } catch (error: any) {
      return {
        taskId: task.id,
        agentId: this.id,
        content: `Planner encountered an error: ${error.message || error}`,
        status: 'error'
      };
    }
  }

  private generateResearchPlan(query: string): ResearchPlan {
    // In a full implementation, this would use an LLM to intelligently break down the query
    // For now, we'll use a simple heuristic approach
    
    const subQuestions: SubQuestion[] = [];
    
    // Simple heuristic to generate sub-questions
    if (query.toLowerCase().includes('how') || query.toLowerCase().includes('what')) {
      subQuestions.push({
        id: `sub-q-${Date.now()}-1`,
        question: `What is ${query}?`,
        status: 'pending'
      });
      
      subQuestions.push({
        id: `sub-q-${Date.now()}-2`,
        question: `Why is ${query} important?`,
        status: 'pending'
      });
      
      subQuestions.push({
        id: `sub-q-${Date.now()}-3`,
        question: `How does ${query} work?`,
        status: 'pending'
      });
    } else {
      // Default sub-questions
      subQuestions.push({
        id: `sub-q-${Date.now()}-1`,
        question: `What are the key aspects of "${query}"?`,
        status: 'pending'
      });
      
      subQuestions.push({
        id: `sub-q-${Date.now()}-2`,
        question: `What are the recent developments related to "${query}"?`,
        status: 'pending'
      });
      
      subQuestions.push({
        id: `sub-q-${Date.now()}-3`,
        question: `What are the potential future trends for "${query}"?`,
        status: 'pending'
      });
    }
    
    return {
      id: `plan-${Date.now()}`,
      mainQuery: query,
      subQuestions,
      createdAt: new Date()
    };
  }
}