# Narada AI - Deep Research Agent: Backend API Design

This document details the backend API endpoints, which will be implemented as Next.js API Routes.

## 1. API Design Principles

*   **Stateless**: The API will be stateless. All necessary context will be passed in each request.
*   **Clear Naming**: Endpoints will have clear, descriptive names.
*   **Standard HTTP Methods**: We will use standard HTTP methods (GET, POST, PUT, DELETE) appropriately.
*   **JSON for Communication**: All data exchange will use the JSON format.
*   **Streaming for Real-time Updates**: For the main research endpoint, we will use streaming to send real-time updates of the agent's progress to the frontend.

## 2. API Endpoints

### a. Main Research Endpoint

This is the primary endpoint for handling user queries.

*   **Route**: `POST /api/chat`
*   **Description**: Initiates a research task. This endpoint will stream the agent's progress back to the client.
*   **Request Body**:
    ```json
    {
      "query": "What are the latest trends in AI?",
      "knowledgeBaseId": "optional-kb-id",
      "chatHistory": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
      ]
    }
    ```
*   **Response**: A streaming response of Server-Sent Events (SSE). Each event will be a JSON object representing a step in the agent's process.
    *   `{ "type": "subtask", "content": "Searching for 'latest trends in AI'" }`
    *   `{ "type": "sources", "content": ["url1", "url2"] }`
    *   `{ "type": "final", "content": "The final synthesized answer..." }`

### b. Knowledge Base Management

Endpoints for managing Qdrant knowledge bases.

*   **Route**: `GET /api/knowledge-bases`
    *   **Description**: Get a list of all available knowledge bases.
*   **Route**: `POST /api/knowledge-bases`
    *   **Description**: Create a new knowledge base. The request will be `multipart/form-data` to handle file uploads.
    *   **Request**: `name` (string), `description` (string), `files` (array of files).
*   **Route**: `DELETE /api/knowledge-bases/{id}`
    *   **Description**: Delete a specific knowledge base.

### c. Configuration / Settings

Endpoints for managing application settings. These will interact with a simple configuration store (e.g., a JSON file or a simple DB).

*   **Route**: `GET /api/settings`
    *   **Description**: Retrieve all current settings (API keys, Ollama config, etc.).
*   **Route**: `POST /api/settings`
    *   **Description**: Update the settings.
    *   **Request Body**:
        ```json
        {
          "tavilyApiKey": "...",
          "ollama": {
            "apiUrl": "...",
            "embeddingModel": "...",
            "llm": "..."
          },
          "mcpServers": [
            { "name": "server1", "url": "..." }
          ]
        }
        ```

## 3. Authentication & Authorization

For this initial version, we will not implement user authentication. The agent will be accessible to anyone who can access the application. This can be added in a future iteration if needed.

## 4. Error Handling

The API will use standard HTTP status codes to indicate success or failure. Error responses will have a consistent JSON format:

```json
{
  "error": {
    "message": "A descriptive error message."
  }
}