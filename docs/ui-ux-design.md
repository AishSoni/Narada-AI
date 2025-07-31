# Narada AI - Deep Research Agent: UI/UX Design (v2)

This document outlines the UI/UX design and component structure for the "Narada AI - Deep Research Agent", inspired by the Grok "DeepSearch" interface.

## 1. UI/UX Goals

*   **Transparent & Trustworthy**: Show the agent's work, including search queries and sources, to build user trust.
*   **Modern & Clean**: Aesthetically pleasing and easy to navigate.
*   **Responsive**: Fully functional on all screen sizes.
*   **Configurable**: Separate, clear pages for setting up the agent's dependencies (APIs, models).

## 2. Key Screens / Views

### a. Main Research Interface (Chat View)

This is the primary interaction screen.

*   **Layout**: A single, clean chat interface.
*   **Header**: Simple header with a menu icon (leading to settings/knowledge base) and the agent's name.
*   **Chat Input**: A fixed input bar at the bottom with a text area and a "send" button. It could also feature toggles for different modes, like "DeepSearch" vs. a simple "Think" mode.
*   **Message Display**:
    *   User queries are displayed simply.
    *   Agent responses will have a special, expandable component that shows the research process, similar to the screenshot.

### b. Agent's "DeepSearch" Response Component

This is the core of the UI. When the agent performs research, it won't just return text. It will display an interactive component that shows:

1.  **Main Task**: The overall goal (e.g., "Understanding GenAI role").
2.  **Sub-tasks**: A list of steps the agent is taking. Each step will have an icon (e.g., a search icon).
    *   "Searching for 'skills for generative AI software engineer'"
3.  **Sources**: Underneath a search sub-task, a list of clickable source links (e.g., `www.cio.com`, `www.coursera.org`) that the agent is consulting.
4.  **Progress Indicator**: A subtle loading animation or progress bar while the agent works.
5.  **Final Synthesized Answer**: Once the research is complete, the component will populate with the final, well-formatted answer.
6.  **Expand/Collapse**: The entire component will be expandable and collapsible to keep the chat history clean.

### c. Configuration & Setup Pages

Instead of a single settings page, we'll have dedicated pages accessible from a main menu/sidebar.

*   **/settings/tavily**: A page with a single input for the Tavily API key and instructions.
*   **/settings/ollama**: A page to configure the Ollama connection.
    *   Input for the Ollama API endpoint URL.
    *   Dropdowns to select and test available embedding and LLM models.
*   **/settings/mcp**: A page to manage MCP server connections (add, view, remove).
*   **/knowledge-base**: The dedicated page for creating and managing Qdrant knowledge bases.

## 3. Component Breakdown (React)

*   `layout/`:
    *   `AppLayout.tsx`: Main layout with header and navigation logic.
*   `chat/`:
    *   `ChatInput.tsx`: The bottom input bar.
    *   `ChatMessage.tsx`: A generic message component.
    *   `DeepSearchReport.tsx`: **(New)** The main component for displaying the agent's research process and results.
    *   `ChatView.tsx`: The main component that orchestrates the chat interface.
*   `pages/`:
    *   `settings/tavily.tsx`
    *   `settings/ollama.tsx`
    *   `settings/mcp.tsx`
    *   `knowledge-base/index.tsx`
*   `knowledge-base/`:
    *   `KnowledgeBaseList.tsx`
    *   `CreateKnowledgeBaseForm.tsx`
*   `common/`:
    *   `Button.tsx`, `Input.tsx`, `Spinner.tsx`, `Card.tsx`

## 4. Styling

We will use **Tailwind CSS** for a utility-first approach to styling, which is perfect for creating this kind of modern, clean interface.