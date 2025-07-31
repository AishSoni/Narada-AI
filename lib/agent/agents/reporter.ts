import { Agent, Task, AgentResponse } from '../types';

export class ReporterAgent implements Agent {
  id: string;
  role: 'reporter' = 'reporter';
  name: string;
  description: string;

  constructor() {
    this.id = 'reporter-001';
    this.name = 'Reporter Agent';
    this.description = 'Synthesizes research findings into coherent final answers';
  }

  async execute(task: Task): Promise<AgentResponse> {
    try {
      // For the reporter, the task content is the research topic
      const researchTopic = task.content;
      
      // Extract research results from the task context
      const researchResults = task.context?.results || [];
      
      // Synthesize the research findings into a final report
      const finalReport = this.synthesizeReport(researchTopic, researchResults);
      
      return {
        taskId: task.id,
        agentId: this.id,
        content: finalReport,
        status: 'success',
        data: {
          report: finalReport
        }
      };
    } catch (error: any) {
      return {
        taskId: task.id,
        agentId: this.id,
        content: `Reporter encountered an error: ${error.message || error}`,
        status: 'error'
      };
    }
  }

  private synthesizeReport(topic: string, results: any[]): string {
    // In a full implementation, this would use an LLM to synthesize the findings
    // For now, we'll create a simple synthesized report
    
    if (results.length === 0) {
      return `I've researched "${topic}" but couldn't find specific information. In a full implementation, I would provide a comprehensive answer based on the research findings.`;
    }
    
    let report = `# Research Report: ${topic}\n\n`;
    report += "## Summary\n";
    report += `This report provides an overview of "${topic}" based on research findings.\n\n`;
    
    report += "## Key Findings\n";
    results.forEach((result, index) => {
      report += `${index + 1}. ${result.question}\n`;
      report += `   - ${result.answer}\n\n`;
    });
    
    report += "## Conclusion\n";
    report += "In a full implementation, this section would contain a comprehensive synthesis of all findings with proper citations and follow-up questions.\n";
    
    return report;
  }
}