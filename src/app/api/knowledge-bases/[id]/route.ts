import { NextRequest } from 'next/server';
import { KnowledgeBase } from '../../../../../lib/agent/types';

// In-memory storage for knowledge bases (in a real implementation, this would be a database)
// We'll import this from the main route file in a real implementation
let knowledgeBases: KnowledgeBase[] = [];

// DELETE /api/knowledge-bases/{id}
// Delete a specific knowledge base
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate the ID
    if (!id) {
      return new Response(
        JSON.stringify({ error: { message: 'Knowledge base ID is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Find the knowledge base
    const kbIndex = knowledgeBases.findIndex(kb => kb.id === id);
    
    // If not found, return 404
    if (kbIndex === -1) {
      return new Response(
        JSON.stringify({ error: { message: 'Knowledge base not found' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Remove the knowledge base
    const deletedKb = knowledgeBases.splice(kbIndex, 1)[0];
    
    // In a real implementation, we would also:
    // 1. Delete the associated Qdrant collection
    // 2. Clean up any stored files
    
    return new Response(
      JSON.stringify({ message: 'Knowledge base deleted successfully', deletedKb }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}