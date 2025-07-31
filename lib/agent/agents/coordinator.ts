import { Agent, Task, AgentResponse, ChatMessage, ChatHistory } from '../types';
import { PlannerAgent } from './planner';
import { ReporterAgent } from './reporter';
import { ResearcherAgent } from './researcher';

export class CoordinatorAgent implements Agent {
  id: string;
  role: 'coordinator' = 'coordinator';
  name: string;
  description: string;

  constructor() {
    this.id = 'coordinator-001';
    this.name = 'Coordinator Agent';
    this.description = 'Manages user interaction and overall conversation flow';
  }

  async execute(task: Task): Promise<AgentResponse> {
    try {
      // For the coordinator, the task content is the user's query
      const userQuery = task.content;
      
      // Create a planner agent to break down the query
      const planner = new PlannerAgent();
      
      // Create a task for the planner
      const plannerTask: Task = {
        id: `planner-task-${Date.now()}`,
        type: 'plan-research',
        content: userQuery,
        createdAt: new Date(),
        status: 'pending'
      };
      
      // Get the research plan from the planner
      const planResponse = await planner.execute(plannerTask);
      
      if (planResponse.status === 'error') {
        return {
          taskId: task.id,
          agentId: this.id,
          content: `Error in planning research: ${planResponse.content}`,
          status: 'error'
        };
      }
      
      // Extract the research plan from the response
      const researchPlan = planResponse.data?.plan;
      
      if (!researchPlan) {
        return {
          taskId: task.id,
          agentId: this.id,
          content: 'Failed to generate research plan',
          status: 'error'
        };
      }
      
      // Create researcher agents to execute the research
      const researcher = new ResearcherAgent();
      
      // For now, we'll simulate the research process with a single researcher
      // In a full implementation, we would hand off to multiple Researcher agents
      const researchResults = [];
      
      // Research each sub-question
      for (const subQuestion of researchPlan.subQuestions) {
        const researcherTask: Task = {
          id: `research-task-${Date.now()}-${subQuestion.id}`,
          type: 'research-subquestion',
          content: subQuestion.question,
          context: {
            parentId: researchPlan.id
          },
          createdAt: new Date(),
          status: 'pending'
        };
        
        const researchResponse = await researcher.execute(researcherTask);
        
        if (researchResponse.status === 'success') {
          researchResults.push({
            question: subQuestion.question,
            answer: researchResponse.content,
            sources: researchResponse.data?.result?.urls || []
          });
        } else {
          researchResults.push({
            question: subQuestion.question,
            answer: `Research failed: ${researchResponse.content}`,
            sources: []
          });
        }
      }
      
      // Create a reporter agent to synthesize the results
      const reporter = new ReporterAgent();
      
      // Create a task for the reporter
      const reporterTask: Task = {
        id: `reporter-task-${Date.now()}`,
        type: 'synthesize-research',
        content: `Research the topic: ${userQuery}`,
        context: {
          plan: researchPlan,
          results: researchResults
        },
        createdAt: new Date(),
        status: 'pending'
      };
      
      // Get the final report from the reporter
      const reportResponse = await reporter.execute(reporterTask);
      
      if (reportResponse.status === 'error') {
        return {
          taskId: task.id,
          agentId: this.id,
          content: `Error in generating report: ${reportResponse.content}`,
          status: 'error'
        };
      }
      
      return {
        taskId: task.id,
        agentId: this.id,
        content: reportResponse.content,
        status: 'success',
        data: {
          plan: researchPlan,
          report: reportResponse.content
        }
      };
    } catch (error: any) {
      return {
        taskId: task.id,
        agentId: this.id,
        content: `Coordinator encountered an error: ${error.message || error}`,
        status: 'error'
      };
    }
  }
}