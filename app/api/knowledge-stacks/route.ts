import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { knowledgeStackStore } from '@/lib/knowledge-stack-store';

export async function GET() {
  try {
    const stacks = knowledgeStackStore.getAllStacks();
    return NextResponse.json(stacks);
  } catch (error) {
    console.error('Error fetching knowledge stacks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge stacks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Stack name is required' },
        { status: 400 }
      );
    }

    // Check if stack with same name already exists
    const existingStacks = knowledgeStackStore.getAllStacks();
    const existingStack = existingStacks.find(
      stack => stack.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existingStack) {
      return NextResponse.json(
        { error: 'A stack with this name already exists' },
        { status: 409 }
      );
    }

    const newStack = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || '',
      documentsCount: 0,
      lastUpdated: new Date().toISOString(),
      size: '0 B',
      createdAt: new Date().toISOString()
    };

    knowledgeStackStore.addStack(newStack);

    return NextResponse.json(newStack, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge stack:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge stack' },
      { status: 500 }
    );
  }
}
