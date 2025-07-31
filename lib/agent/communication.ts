import { Agent, Task, AgentResponse } from './types';

// Simple in-memory store for tasks
const taskStore = new Map<string, Task>();

// Simple in-memory store for agent responses
const responseStore = new Map<string, AgentResponse>();

export class AgentCommunicationSystem {
  private agents: Map<string, Agent> = new Map();

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  async sendTask(agentId: string, task: Task): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return {
        taskId: task.id,
        agentId: agentId,
        content: `Agent with ID ${agentId} not found`,
        status: 'error'
      };
    }

    try {
      // Store the task
      taskStore.set(task.id, task);
      
      // Execute the task
      const response = await agent.execute(task);
      
      // Store the response
      responseStore.set(response.taskId, response);
      
      return response;
    } catch (error: any) {
      return {
        taskId: task.id,
        agentId: agentId,
        content: `Error executing task: ${error.message || error}`,
        status: 'error'
      };
    }
  }

  getTask(taskId: string): Task | undefined {
    return taskStore.get(taskId);
  }

  getResponse(taskId: string): AgentResponse | undefined {
    return responseStore.get(taskId);
  }

  // Method to simulate inter-agent communication
  async coordinateAgents(tasks: Task[]): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];
    
    // Execute tasks concurrently
    const promises = tasks.map(task => {
      const agent = this.agents.get(task.context?.agentId);
      if (agent) {
        return agent.execute(task);
      } else {
        return Promise.resolve({
          taskId: task.id,
          agentId: task.context?.agentId || 'unknown',
          content: `Agent not found for task ${task.id}`,
          status: 'error' as const
        });
      }
    });
    
    try {
      const results = await Promise.all(promises);
      responses.push(...results);
    } catch (error: any) {
      responses.push({
        taskId: 'coordination-error',
        agentId: 'communication-system',
        content: `Error coordinating agents: ${error.message || error}`,
        status: 'error'
      });
    }
    
    return responses;
  }
}

// Create a singleton instance of the communication system
export const agentCommunicationSystem = new AgentCommunicationSystem();