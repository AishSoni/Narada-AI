import { NextResponse } from 'next/server';
import { knowledgeStackStore } from '@/lib/knowledge-stack-store';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    // First, create a knowledge stack
    const newStack = {
      id: uuidv4(),
      name: 'AI Research Stack',
      description: 'Knowledge stack for AI and machine learning research',
      documentsCount: 0,
      lastUpdated: new Date().toISOString(),
      size: '0 B',
      createdAt: new Date().toISOString()
    };

    knowledgeStackStore.addStack(newStack);
    console.log('Created stack:', newStack.id);

    // Then add a test document
    const testDocument = {
      id: uuidv4(),
      stackId: newStack.id,
      name: 'ai-fundamentals.txt',
      type: 'text/plain',
      size: '2.1 KB',
      uploadedAt: new Date().toISOString(),
      status: 'completed' as const,
      content: `# Artificial Intelligence Fundamentals

## Introduction to Machine Learning
Machine learning is a subset of artificial intelligence that enables systems to automatically learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves.

## Types of Machine Learning
1. **Supervised Learning**: Uses labeled training data to learn a mapping from inputs to outputs
   - Classification: Predicting discrete categories
   - Regression: Predicting continuous values

2. **Unsupervised Learning**: Finds hidden patterns in data without labeled examples
   - Clustering: Grouping similar data points
   - Dimensionality reduction: Simplifying data while preserving important features

3. **Reinforcement Learning**: Learning through interaction with an environment using rewards and penalties

## Deep Learning
Deep learning is a subset of machine learning that uses artificial neural networks with multiple layers. Key concepts include:
- Neural networks with multiple hidden layers
- Backpropagation for training
- Convolutional Neural Networks (CNNs) for image processing
- Recurrent Neural Networks (RNNs) for sequential data
- Transformers for natural language processing

## Natural Language Processing (NLP)
NLP combines computational linguistics with machine learning to help computers understand human language:
- Text preprocessing and tokenization
- Word embeddings and vector representations
- Named entity recognition
- Sentiment analysis
- Language translation
- Question answering systems

## Applications of AI
- Healthcare: Medical diagnosis, drug discovery
- Finance: Fraud detection, algorithmic trading
- Transportation: Autonomous vehicles, route optimization
- Technology: Search engines, recommendation systems
- Business: Customer service chatbots, process automation

This document provides a comprehensive overview of artificial intelligence and machine learning concepts for research and educational purposes.`,
      metadata: {
        wordCount: 250,
        fileType: 'text'
      }
    };

    knowledgeStackStore.addDocument(testDocument);
    console.log('Added document:', testDocument.id);

    // Test search functionality
    const searchResults = await knowledgeStackStore.searchDocuments(newStack.id, 'machine learning', 5);
    console.log('Search results:', searchResults.length);

    return NextResponse.json({
      success: true,
      message: 'Complete test setup successful',
      stack: newStack,
      document: testDocument,
      searchResults: searchResults
    });
  } catch (error) {
    console.error('Error in complete test:', error);
    return NextResponse.json(
      { error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
