# Narada AI - Deep Research Agent: Knowledge Base Plan

This document outlines the plan for implementing the local knowledge base functionality using Qdrant and Ollama.

## 1. Core Concept

The user will be able to upload documents (PDF, TXT, MD) to create a "knowledge base". The agent can then perform semantic searches against this knowledge base as part of its research process. This is a form of Retrieval-Augmented Generation (RAG).

## 2. Technology Stack

*   **Vector Database**: Qdrant (running locally, likely in a Docker container).
*   **Embedding Models**: An embedding model provided by the user via the Ollama API (e.g., `nomic-embed-text`, `mxbai-embed-large`).
*   **Document Loading & Splitting**: We will use libraries like `langchain` to handle the parsing and chunking of uploaded documents.

## 3. The Process of Creating a Knowledge Base

This process will be triggered by the `POST /api/knowledge-bases` endpoint.

1.  **Receive Files**: The user uploads one or more documents.
2.  **Load Documents**: The backend will load the content of these files.
3.  **Split Documents**: The documents will be split into smaller, semantically meaningful chunks. This is crucial for effective embedding and retrieval. A chunk size of 500-1000 characters with some overlap is a good starting point.
4.  **Generate Embeddings**: For each chunk, we will call the configured Ollama embedding model to get a vector representation.
5.  **Create Qdrant Collection**: A new collection will be created in Qdrant for this knowledge base. The collection name will be based on the knowledge base ID.
6.  **Store Vectors**: The generated vectors, along with their corresponding text chunks as metadata, will be stored in the Qdrant collection.
7.  **Mark as Ready**: Once all documents are processed, the knowledge base is marked as "ready" for use.

## 4. The Process of Searching a Knowledge Base

This will be part of the agent's core workflow.

1.  **Receive Query**: The agent decides to query a knowledge base as part of its research plan.
2.  **Generate Query Embedding**: The agent takes the search query (which could be a question or a topic) and generates an embedding for it using the same Ollama model that was used to create the knowledge base.
3.  **Search Qdrant**: The agent sends this query vector to the appropriate Qdrant collection. Qdrant performs a similarity search and returns the top `k` most relevant text chunks.
4.  **Provide Context to LLM**: These retrieved text chunks are then passed as context to the main Ollama LLM as part of the final prompt for synthesizing an answer.

## 5. Qdrant Setup

*   We will provide a `docker-compose.yml` file to make it easy for the user to run a local Qdrant instance.
*   The application will need to be configured with the Qdrant API endpoint URL.

## 6. Future Considerations

*   **Incremental Updates**: For v1, we will re-process all files if a knowledge base is updated. In the future, we could implement a more sophisticated system for incremental updates.
*   **More Document Types**: We can expand the range of supported document types (e.g., DOCX, CSV).