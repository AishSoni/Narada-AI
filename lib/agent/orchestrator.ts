import { Task, AgentResponse } from './types';
import { CoordinatorAgent } from './agents/coordinator';
import { agentCommunicationSystem } from './communication';

export class AgentOrchestrator {
  private coordinator: CoordinatorAgent;

  constructor() {
    this.coordinator = new CoordinatorAgent();
    
    // Register the coordinator with the communication system
    agentCommunicationSystem.registerAgent(this.coordinator);
  }

  /**
   * Main entry point for the agent system
   * @param userQuery The user's research query
   * @returns The final research report
   */
  async handleResearchRequest(userQuery: string): Promise<AgentResponse> {
    try {
      // Create a task for the coordinator
      const task: Task = {
        id: `research-task-${Date.now()}`,
        type: 'research-request',
        content: userQuery,
        createdAt: new Date(),
        status: 'pending'
      };

      // Delegate to the coordinator agent
      const response = await this.coordinator.execute(task);
      
      return response;
    } catch (error: any) {
      return {
        taskId: 'orchestrator-error',
        agentId: 'orchestrator',
        content: `Orchestrator encountered an error: ${error.message || error}`,
        status: 'error'
      };
    }
  }

  /**
   * Get the coordinator agent
   * @returns The coordinator agent instance
   */
  getCoordinator(): CoordinatorAgent {
    return this.coordinator;
  }
}

// Create a singleton instance of the orchestrator
export const agentOrchestrator = new AgentOrchestrator();