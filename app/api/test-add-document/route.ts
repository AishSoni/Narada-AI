import { NextRequest, NextResponse } from 'next/server';
import { knowledgeStackStore } from '@/lib/knowledge-stack-store';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    // Get the first available knowledge stack
    const stacks = knowledgeStackStore.getAllStacks();
    console.log('Available stacks in test endpoint:', stacks.length);
    stacks.forEach(stack => console.log('Stack:', stack.id, stack.name));
    
    if (stacks.length === 0) {
      return NextResponse.json(
        { error: 'No knowledge stacks available. Create a stack first.' },
        { status: 400 }
      );
    }
    
    const firstStack = stacks[0];
    
    // Add a test document for testing search functionality
    const testDocument = {
      id: uuidv4(),
      stackId: firstStack.id,
      name: 'test-document.txt',
      type: 'text/plain',
      size: '1.2 KB',
      uploadedAt: new Date().toISOString(),
      status: 'completed' as const,
      content: `This is a test document about artificial intelligence and machine learning.

Key topics covered:
- Machine Learning fundamentals
- Deep Learning architectures  
- Neural networks and backpropagation
- Natural Language Processing techniques
- AI applications in business and healthcare
- Computer vision and image recognition
- Reinforcement learning algorithms
- Future trends in AI development

This document contains technical information about AI, including supervised learning, unsupervised learning, and deep learning frameworks like TensorFlow and PyTorch. It also discusses natural language processing, computer vision, and the applications of artificial intelligence in various industries.`
    };

    knowledgeStackStore.addDocument(testDocument);
    
    return NextResponse.json({
      success: true,
      message: 'Test document added successfully',
      document: testDocument
    });
  } catch (error) {
    console.error('Error adding test document:', error);
    return NextResponse.json(
      { error: 'Failed to add test document' },
      { status: 500 }
    );
  }
}
