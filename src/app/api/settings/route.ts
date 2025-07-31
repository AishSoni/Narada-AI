import { NextRequest } from 'next/server';

// In-memory storage for settings (in a real implementation, this would be a database or file)
let settings = {
  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  ollama: {
    apiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
    llm: process.env.OLLAMA_LLM || 'llama3'
  },
  mcpServers: []
};

// GET /api/settings
// Retrieve all current settings
export async function GET() {
  try {
    // In a real implementation, we might want to hide sensitive information
    // For now, we'll return all settings
    return new Response(
      JSON.stringify(settings),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/settings
// Update the settings
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const newSettings = await req.json();
    
    // Update settings (in a real implementation, we would validate and sanitize)
    settings = {
      ...settings,
      ...newSettings,
      ollama: {
        ...settings.ollama,
        ...newSettings.ollama
      }
    };
    
    // In a real implementation, we would:
    // 1. Validate the settings
    // 2. Sanitize sensitive information
    // 3. Persist to a database or file
    // 4. Apply the new settings to the running application
    
    return new Response(
      JSON.stringify({ message: 'Settings updated successfully', settings }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}