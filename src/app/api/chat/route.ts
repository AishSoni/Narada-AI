import { NextRequest } from 'next/server';
import { agentOrchestrator } from '@/lib/agent/orchestrator';
import { ChatMessage } from '@/lib/agent/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { query, knowledgeBaseId, chatHistory } = await req.json();
    
    // Validate the query
    if (!query) {
      return new Response(
        JSON.stringify({ error: { message: 'Query is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a TransformStream to stream the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Create a readable stream for SSE
    let controller: ReadableStreamDefaultController;
    const stream = new ReadableStream({
      start(ctrl) {
        controller = ctrl;
      }
    });
    
    // Handle the research request asynchronously
    agentOrchestrator.handleResearchRequest(query)
      .then((response) => {
        // Send the final response
        if (controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'final',
            content: response.content
          })}\n\n`));
          
          // Close the stream
          controller.close();
        }
      })
      .catch((error) => {
        // Send error message
        if (controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            content: error.message || 'An error occurred during research'
          })}\n\n`));
          
          // Close the stream
          controller.close();
        }
      });
    
    // Return the stream as a SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}