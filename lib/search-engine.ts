// Simple text similarity and search utilities
// In production, this would use proper vector embeddings (OpenAI, Cohere, etc.)

export interface SearchResult {
  id: string;
  name: string;
  score: number;
  content: string;
  snippet: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    fileType?: string;
    [key: string]: unknown;
  };
}

// Simple TF-IDF based similarity scoring
export function calculateTextSimilarity(query: string, text: string): number {
  const queryWords = preprocessText(query);
  const textWords = preprocessText(text);
  
  if (queryWords.length === 0 || textWords.length === 0) {
    return 0;
  }
  
  // Calculate word frequencies in text
  const textFreq = new Map<string, number>();
  textWords.forEach(word => {
    textFreq.set(word, (textFreq.get(word) || 0) + 1);
  });
  
  // Calculate query word frequencies
  const queryFreq = new Map<string, number>();
  queryWords.forEach(word => {
    queryFreq.set(word, (queryFreq.get(word) || 0) + 1);
  });
  
  // Calculate cosine similarity
  let dotProduct = 0;
  let queryMagnitude = 0;
  let textMagnitude = 0;
  
  const allWords = new Set([...queryWords, ...textWords]);
  
  for (const word of allWords) {
    const queryWeight = queryFreq.get(word) || 0;
    const textWeight = textFreq.get(word) || 0;
    
    dotProduct += queryWeight * textWeight;
    queryMagnitude += queryWeight * queryWeight;
    textMagnitude += textWeight * textWeight;
  }
  
  if (queryMagnitude === 0 || textMagnitude === 0) {
    return 0;
  }
  
  const similarity = dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(textMagnitude));
  
  // Boost exact phrase matches
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  if (textLower.includes(queryLower)) {
    return Math.min(1.0, similarity + 0.3);
  }
  
  // Boost partial phrase matches
  const queryPhrases = query.toLowerCase().split(/[,.!?;]/).map(p => p.trim()).filter(p => p.length > 3);
  for (const phrase of queryPhrases) {
    if (textLower.includes(phrase)) {
      return Math.min(1.0, similarity + 0.1);
    }
  }
  
  return similarity;
}

// Extract the most relevant snippet from text based on query
export function extractRelevantSnippet(text: string, query: string, maxLength: number = 300): string {
  const queryWords = preprocessText(query);
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  
  if (sentences.length === 0) {
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }
  
  // Score each sentence based on query relevance
  const scoredSentences = sentences.map((sentence, index) => {
    const sentenceWords = preprocessText(sentence);
    let score = 0;
    
    for (const queryWord of queryWords) {
      if (sentenceWords.includes(queryWord)) {
        score += 1;
        // Bonus for exact word boundaries
        const regex = new RegExp(`\\b${queryWord}\\b`, 'i');
        if (regex.test(sentence)) {
          score += 0.5;
        }
      }
    }
    
    return {
      sentence,
      score,
      index
    };
  });
  
  // Sort by score and proximity
  scoredSentences.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.1) {
      // If scores are similar, prefer earlier sentences
      return a.index - b.index;
    }
    return b.score - a.score;
  });
  
  // Build snippet from top sentences
  let snippet = '';
  let currentLength = 0;
  const usedIndices = new Set<number>();
  
  for (const { sentence, index } of scoredSentences) {
    if (currentLength + sentence.length > maxLength) {
      break;
    }
    
    if (!usedIndices.has(index)) {
      if (snippet.length > 0) {
        snippet += ' ';
      }
      snippet += sentence + '.';
      currentLength += sentence.length + 1;
      usedIndices.add(index);
    }
  }
  
  // If no good sentences found, fall back to beginning
  if (snippet.length < 50) {
    snippet = text.substring(0, maxLength);
    if (text.length > maxLength) {
      snippet += '...';
    }
  }
  
  return snippet.trim();
}

// Preprocess text for better matching
function preprocessText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter short words
    .filter(word => !isStopWord(word)); // Filter stop words
}

// Common English stop words
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'the', 'this', 'but', 'they',
  'have', 'had', 'what', 'said', 'each', 'which', 'their', 'time',
  'if', 'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some',
  'her', 'would', 'make', 'like', 'into', 'him', 'two', 'more',
  'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call',
  'who', 'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get',
  'come', 'made', 'may', 'part'
]);

function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}

// Rank documents by relevance to query
export function rankDocuments(documents: Array<{id: string; content?: string; name: string; [key: string]: unknown}>, query: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  for (const doc of documents) {
    if (!doc.content || doc.content.length === 0) {
      continue;
    }
    
    const score = calculateTextSimilarity(query, doc.content);
    
    if (score > 0.05) { // Minimum relevance threshold
      const snippet = extractRelevantSnippet(doc.content, query);
      
      results.push({
        id: doc.id,
        name: doc.name,
        score,
        content: doc.content,
        snippet,
        metadata: (doc.metadata as SearchResult['metadata']) || undefined
      });
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  return results;
}

// Hybrid search that combines keyword and semantic similarity
export function hybridSearch(documents: Array<{id: string; content?: string; name: string; [key: string]: unknown}>, query: string, limit: number = 5): SearchResult[] {
  const rankedResults = rankDocuments(documents, query);
  
  // Apply additional boost for title/filename matches
  const queryLower = query.toLowerCase();
  rankedResults.forEach(result => {
    if (result.name.toLowerCase().includes(queryLower)) {
      result.score = Math.min(1.0, result.score + 0.2);
    }
  });
  
  // Re-sort after boosting
  rankedResults.sort((a, b) => b.score - a.score);
  
  return rankedResults.slice(0, limit);
}
