# Narada AI - Deep Research Agent

Welcome to the repository for the "Narada AI - Deep Research Agent". This project aims to build a powerful, locally-run research agent with a modern web interface.

## Project Vision

The goal is to create a research assistant that combines the power of large language models with real-time web search and the ability to reason over private, local documents. The user experience is inspired by the transparent and detailed research process seen in modern AI tools, showing the user *how* the agent arrives at its conclusions.

## Core Features

*   **Agentic Web Search**: Utilizes the Tavily API for fast and accurate web searches.
*   **Local LLM & Embeddings**: Full support for the Ollama API, allowing users to run their preferred open-source LLMs and embedding models locally.
*   **Local Knowledge Bases**: Powered by a local Qdrant vector database, users can create knowledge bases from their own documents (PDF, TXT, MD) for the agent to use in its research.
*   **Extensible with MCP**: Support for the Model-Context-Protocol, allowing the agent's capabilities to be extended with new tools.
*   **Modern & Responsive UI**: A clean, intuitive, and responsive user interface built with Next.js and Tailwind CSS.

## Architectural Plan & Design Documents

The entire project has been planned in detail. You can find the complete architectural and design documents in the `docs/` directory:

1.  **[High-Level Architecture](docs/architecture.md)**: An overview of the system's components and their interactions.
2.  **[UI/UX Design](docs/ui-ux-design.md)**: A detailed look at the user interface, inspired by Grok's "DeepSearch" mode.
3.  **[Backend API Design](docs/backend-api-design.md)**: The specification for the Next.js API routes that will power the application.
4.  **[Core Agent Workflow](docs/agent-workflow.md)**: A description of the internal logic of the Narada AI agent.
5.  **[Knowledge Base Plan](docs/knowledge-base-plan.md)**: The plan for implementing the local knowledge base feature with Qdrant.
6.  **[Project Setup Guide](docs/project-setup.md)**: Instructions for setting up the development environment and getting the project running.

## Next Steps

This completes the architectural and planning phase. The next step is to begin the implementation based on these plans.