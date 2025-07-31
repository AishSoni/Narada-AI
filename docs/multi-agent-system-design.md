# Narada AI - Multi-Agent System Design

This document outlines the high-level, multi-agent system design for the "Narada AI - Deep Research Agent", based on a "Supervisor + Handoffs" pattern.

## 1. Core Philosophy

The system is designed as a team of specialized AI agents that collaborate to fulfill a user's research request. A supervising agent orchestrates the workflow, handing off tasks to different specialist agents as needed. This creates a more robust, modular, and transparent research process.

## 2. The Team of Agents

*   **Coordinator**: This is the user-facing agent. Its primary responsibility is to engage with the user, understand their problem, clarify requirements, and manage the overall conversation. It is the entry and exit point of the system.
*   **Planner**: This agent takes the user's request from the Coordinator and breaks it down into a detailed, step-by-step research plan. It identifies the sub-questions that need to be answered and the strategies to answer them.
*   **Research Team**: This is a sub-team of one or more specialist agents responsible for executing the research plan.
    *   **Researcher**: The primary worker agent. It executes search queries using the available tools (e.g., Tavily API), scrapes web pages, and extracts relevant information.
    *   **Coder**: A specialist agent that can write and execute code. This is useful for tasks that require data analysis, visualization, or interaction with APIs that don't have a dedicated tool. (Note: The Coder is a future extension point).
*   **Reporter**: This agent takes the raw, verified information from the Research Team and synthesizes it into a coherent, well-written, and properly cited final answer for the user.
*   **Human Feedback**: This is not an agent, but a crucial component of the system. At any point, the system can pause and ask the user for clarification or feedback, which is then fed back to the Planner to adjust the research plan.

## 3. System Architecture Diagram

The following diagram illustrates the interaction between these agents:

```mermaid
graph TD
    Start --> A[Coordinator];
    A -- "User Request" --> B[Planner];
    B -- "Research Plan" --> C{Research Team};
    C -- "Execute Searches" --> D[Researcher];
    C -- "Execute Code" --> E[Coder];
    B -- "Request Feedback" --> F[Human Feedback];
    F -- "User Input" --> B;
    D --> C;
    E --> C;
    C -- "Raw Findings" --> G[Reporter];
    G -- "Synthesized Report" --> A;
    A -- "Final Answer" --> End;