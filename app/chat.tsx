'use client';

import { useState, useEffect, useRef } from 'react';
import { search } from './search';
import { searchWithKnowledge } from './search-with-knowledge';
import { readStreamableValue } from 'ai/rsc';
import { SearchDisplay } from './search-display';
import { SearchEvent, Source } from '@/lib/langgraph-search-engine';
import { KnowledgeStack } from '@/lib/knowledge-stack-store';
import { MarkdownRenderer } from './markdown-renderer';
import { CitationTooltip } from './citation-tooltip';
import Image from 'next/image';
import { getFaviconUrl, getDefaultFavicon, markFaviconFailed } from '@/lib/favicon-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SUGGESTED_QUERIES = [
  "Who are the founders of Firecrawl?",
  "When did NVIDIA release the RTX 4080 Super?",
  "Compare the latest iPhone 16 and Samsung Galaxy S25",
  "Compare Claude 4 to OpenAI's o3"
];

// Helper component for sources list
function SourcesList({ sources }: { sources: Source[] }) {
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<number | null>(null);
  
  return (
    <>
      {/* Sources button with favicon preview */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex -space-x-2">
          {(() => {
            // Get unique domains
            const uniqueDomains = new Map<string, Source>();
            sources.forEach(source => {
              try {
                const domain = new URL(source.url).hostname;
                if (!uniqueDomains.has(domain)) {
                  uniqueDomains.set(domain, source);
                }
              } catch {}
            });
            const uniqueSources = Array.from(uniqueDomains.values());
            
            return (
              <>
                {uniqueSources.slice(0, 5).map((source, i) => (
                  <Image 
                    key={i}
                    src={getFaviconUrl(source.url)} 
                    alt=""
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full border-2 border-background bg-background"
                    style={{ zIndex: 5 - i }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = getDefaultFavicon(24);
                      markFaviconFailed(source.url);
                    }}
                  />
                ))}
                {uniqueSources.length > 5 && (
                  <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                    <span className="text-[10px] font-medium text-muted-foreground">+{uniqueSources.length - 5}</span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
        <button
          onClick={() => setShowSourcesPanel(true)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <span>View {sources.length} sources & page contents</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Click-away overlay */}
      {showSourcesPanel && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setShowSourcesPanel(false)}
        />
      )}
      
      {/* Sources Panel */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-card border-l border-border transform transition-transform duration-300 ease-in-out ${
        showSourcesPanel ? 'translate-x-0' : 'translate-x-full'
      } z-40 overflow-y-auto scrollbar-hide`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-card-foreground">Sources ({sources.length})</h3>
            <button
              onClick={() => setShowSourcesPanel(false)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2">
            {sources.map((source, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
                <div 
                  className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${expandedSourceIndex === i ? '' : 'rounded-lg'}`}
                  onClick={() => setExpandedSourceIndex(expandedSourceIndex === i ? null : i)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-medium text-orange-600 mt-0.5">[{i + 1}]</span>
                    <Image 
                      src={getFaviconUrl(source.url)} 
                      alt=""
                      width={20}
                      height={20}
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = getDefaultFavicon(20);
                        markFaviconFailed(source.url);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400 overflow-hidden text-ellipsis"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {source.title}
                      </a>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {new URL(source.url).hostname}
                      </p>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform ${expandedSourceIndex === i ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {expandedSourceIndex === i && source.content && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {source.content.length.toLocaleString()} characters
                      </span>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto scrollbar-hide">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={source.content} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
    isSearch?: boolean;
    searchResults?: string;
  }>;
  messageCount: number;
  preview: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
    isSearch?: boolean;
    searchResults?: string; // Store search results for context
  }>>([]);
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasShownSuggestions, setHasShownSuggestions] = useState(false);
  const [firecrawlApiKey, setFirecrawlApiKey] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [, setIsCheckingEnv] = useState<boolean>(true);
  const [pendingQuery, setPendingQuery] = useState<string>('');
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [searchProvider, setSearchProvider] = useState<string>('firecrawl');
  const [searchProviderDisplayName, setSearchProviderDisplayName] = useState<string>('FireCrawl');
  const [, setLlmProvider] = useState<string>('openai');
  const [llmProviderDisplayName, setLlmProviderDisplayName] = useState<string>('OpenAI');
  const [hasLlmConfig, setHasLlmConfig] = useState<boolean>(false);
  const [selectedKnowledgeStack, setSelectedKnowledgeStack] = useState<string>('web-only');
  const [knowledgeStacks, setKnowledgeStacks] = useState<Array<{
    id: string;
    name: string;
    description: string;
    documentsCount: number;
  }>>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleSelectSuggestion = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
  };

  // Utility functions for conversation management
  const generateConversationTitle = (firstMessage: string): string => {
    // Take first 60 characters of the first user message as title
    if (firstMessage.length <= 60) return firstMessage;
    return firstMessage.substring(0, 57) + '...';
  };

  const generateConversationPreview = (messages: Array<{
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
    searchResults?: string;
  }>): string => {
    // Find first assistant response with search results
    const firstResponse = messages.find(msg => 
      msg.role === 'assistant' && msg.searchResults
    );
    
    if (firstResponse && firstResponse.searchResults) {
      const preview = firstResponse.searchResults.substring(0, 150);
      return preview.length < firstResponse.searchResults.length ? preview + '...' : preview;
    }
    
    return 'Search conversation';
  };

  const saveConversation = () => {
    if (messages.length < 2) return; // Need at least one exchange
    
    try {
      const conversations = JSON.parse(localStorage.getItem('narada-conversations') || '[]');
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      
      if (!firstUserMessage || typeof firstUserMessage.content !== 'string') return;
      
      const conversation: Conversation = {
        id: currentConversationId || Date.now().toString(),
        title: generateConversationTitle(firstUserMessage.content),
        timestamp: Date.now(),
        messages: messages.map(msg => ({
          ...msg,
          content: typeof msg.content === 'string' ? msg.content : '[Complex content]'
        })),
        messageCount: messages.length,
        preview: generateConversationPreview(messages)
      };
      
      // Check if conversation already exists (update) or create new
      const existingIndex = conversations.findIndex((conv: Conversation) => conv.id === conversation.id);
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.unshift(conversation);
      }
      
      // Keep only the latest 50 conversations
      const trimmedConversations = conversations.slice(0, 50);
      localStorage.setItem('narada-conversations', JSON.stringify(trimmedConversations));
      
      if (!currentConversationId) {
        setCurrentConversationId(conversation.id);
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const restoreConversation = (conversation: Conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
    toast.success('Conversation restored');
  };

  const clearCurrentChat = () => {
    // Save current conversation if it has content
    if (messages.length >= 2) {
      saveConversation();
    }
    
    // Reset chat state
    setMessages([]);
    setCurrentConversationId('');
    setInput('');
    setIsSearching(false);
    setShowSuggestions(false);
    setHasShownSuggestions(false);
  };

  // Check for conversation restoration on mount
  useEffect(() => {
    const restoreData = localStorage.getItem('narada-restore-conversation');
    if (restoreData) {
      try {
        const conversation = JSON.parse(restoreData);
        restoreConversation(conversation);
        localStorage.removeItem('narada-restore-conversation');
      } catch (error) {
        console.error('Failed to restore conversation:', error);
      }
    }
    
    // Load knowledge stacks
    loadKnowledgeStacks();
  }, []);

  // Load knowledge stacks and validate current selection
  const loadKnowledgeStacks = async () => {
    try {
      const response = await fetch('/api/knowledge-stacks');
      if (response.ok) {
        const stacks = await response.json();
        setKnowledgeStacks(stacks);
        
        // Validate current selection
        if (selectedKnowledgeStack !== 'web-only') {
          const currentStackExists = stacks.some((stack: KnowledgeStack) => stack.id === selectedKnowledgeStack);
          if (!currentStackExists) {
            console.warn(`Currently selected knowledge stack ${selectedKnowledgeStack} no longer exists. Resetting to web-only.`);
            setSelectedKnowledgeStack('web-only');
            toast.warning('Selected knowledge stack is no longer available. Reset to web search.');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load knowledge stacks:', error);
    }
  };

  // Save conversation whenever messages change (with debouncing)
  useEffect(() => {
    if (messages.length >= 2) {
      const timeoutId = setTimeout(() => {
        saveConversation();
      }, 1000); // Save after 1 second of no changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentConversationId]);

  // Check for environment variables on mount
  useEffect(() => {
    const checkEnvironment = async () => {
      setIsCheckingEnv(true);
      try {
        const response = await fetch('/api/check-env');
        const data = await response.json();
        
        if (data.environmentStatus) {
          // Set search provider info
          setSearchProvider(data.environmentStatus.SEARCH_API_PROVIDER);
          
          // Set LLM provider info
          setLlmProvider(data.environmentStatus.LLM_PROVIDER);
          
          // Set provider display names
          const providerDetails = data.environmentStatus.SEARCH_PROVIDER_DETAILS;
          if (providerDetails) {
            switch (providerDetails.provider) {
              case 'firecrawl':
                setSearchProviderDisplayName('FireCrawl');
                break;
              case 'tavily':
                setSearchProviderDisplayName('Tavily');
                break;
              case 'serp':
                setSearchProviderDisplayName('SERP API');
                break;
              default:
                setSearchProviderDisplayName(providerDetails.provider);
            }
          }
          
          const llmDetails = data.environmentStatus.LLM_PROVIDER_DETAILS;
          if (llmDetails) {
            switch (llmDetails.provider) {
              case 'openai':
                setLlmProviderDisplayName('OpenAI');
                break;
              case 'ollama':
                setLlmProviderDisplayName('Ollama');
                break;
              case 'openrouter':
                setLlmProviderDisplayName('OpenRouter');
                break;
              default:
                setLlmProviderDisplayName(llmDetails.provider);
            }
          }
          
          // Check if current providers are properly configured
          setHasApiKey(data.environmentStatus.HAS_SEARCH_API_KEY);
          setHasLlmConfig(data.environmentStatus.HAS_LLM_CONFIG);
        }
      } catch (error) {
        console.error('Failed to check environment:', error);
        setHasApiKey(false);
      } finally {
        setIsCheckingEnv(false);
      }
    };

    const loadKnowledgeStacks = async () => {
      try {
        const response = await fetch('/api/knowledge-stacks');
        if (response.ok) {
          const stacks = await response.json();
          setKnowledgeStacks(stacks);
        }
      } catch (error) {
        console.error('Failed to load knowledge stacks:', error);
      }
    };

    checkEnvironment();
    loadKnowledgeStacks();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const saveApiKey = () => {
    if (firecrawlApiKey.trim()) {
      setHasApiKey(true);
      setShowApiKeyModal(false);
      toast.success('API key saved! Starting your search...');
      
      // Continue with the pending query
      if (pendingQuery) {
        performSearch(pendingQuery);
        setPendingQuery('');
      }
    }
  };

  // Listen for follow-up question events
  useEffect(() => {
    const handleFollowUpQuestion = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const question = customEvent.detail.question;
      setInput(question);
      
      // Trigger the search immediately
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 100);
    };

    document.addEventListener('followUpQuestion', handleFollowUpQuestion);
    return () => {
      document.removeEventListener('followUpQuestion', handleFollowUpQuestion);
    };
  }, []);

  const performSearch = async (query: string) => {
    setIsSearching(true);

    // Create assistant message with search display
    const assistantMsgId = (Date.now() + 1).toString();
    const events: SearchEvent[] = [];
    
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: <SearchDisplay events={events} />,
      isSearch: true
    }]);

    try {
      // Build context from previous messages by pairing user queries with assistant responses
      const conversationContext: Array<{ query: string; response: string }> = [];
      
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        // Find user messages followed by assistant messages with search results
        if (msg.role === 'user' && i + 1 < messages.length) {
          const nextMsg = messages[i + 1];
          if (nextMsg.role === 'assistant' && nextMsg.searchResults) {
            conversationContext.push({
              query: msg.content as string,
              response: nextMsg.searchResults
            });
          }
        }
      }
      
      // Get search stream with context
      // Use knowledge stack search if selected, otherwise use regular web search
      let stream;
      if (selectedKnowledgeStack && selectedKnowledgeStack !== 'web-only') {
        // Validate that the selected knowledge stack still exists
        const stackExists = knowledgeStacks.some(stack => stack.id === selectedKnowledgeStack);
        if (!stackExists) {
          console.warn(`Selected knowledge stack ${selectedKnowledgeStack} not found. Falling back to web search.`);
          toast.warning('Selected knowledge stack is no longer available. Using web search instead.');
          const result = await search(query, conversationContext, firecrawlApiKey || undefined);
          stream = result.stream;
        } else {
          const result = await searchWithKnowledge(query, conversationContext, selectedKnowledgeStack, firecrawlApiKey || undefined);
          stream = result.stream;
        }
      } else {
        const result = await search(query, conversationContext, firecrawlApiKey || undefined);
        stream = result.stream;
      }
      let finalContent = '';
      
      // Read stream and update events
      let streamingStarted = false;
      const resultMsgId = (Date.now() + 2).toString();
      
      for await (const event of readStreamableValue(stream)) {
        if (event) {
          events.push(event);
          
          // Handle content streaming
          if (event.type === 'content-chunk') {
            const content = events
              .filter(e => e.type === 'content-chunk')
              .map(e => e.type === 'content-chunk' ? e.chunk : '')
              .join('');
            
            if (!streamingStarted) {
              streamingStarted = true;
              // Add new message for streaming content
              setMessages(prev => [...prev, {
                id: resultMsgId,
                role: 'assistant',
                content: <MarkdownRenderer content={content} streaming={true} />,
                isSearch: false
              }]);
            } else {
              // Update streaming message
              setMessages(prev => prev.map(msg => 
                msg.id === resultMsgId 
                  ? { ...msg, content: <MarkdownRenderer content={content} streaming={true} /> }
                  : msg
              ));
            }
          }
          
          // Capture final result
          if (event.type === 'final-result') {
            finalContent = event.content;
            
            // Update the streaming message with final content and sources
            setMessages(prev => prev.map(msg => 
              msg.id === resultMsgId 
                ? {
                    ...msg,
                    content: (
                      <div className="space-y-4">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <MarkdownRenderer content={finalContent} />
                        </div>
                        <CitationTooltip sources={event.sources || []} />
                        
                        {/* Follow-up Questions */}
                        {event.followUpQuestions && event.followUpQuestions.length > 0 && (
                          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              Follow-up questions
                            </h3>
                            <div className="space-y-2">
                              {event.followUpQuestions.map((question, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    const evt = new CustomEvent('followUpQuestion', { 
                                      detail: { question },
                                      bubbles: true 
                                    });
                                    document.dispatchEvent(evt);
                                  }}
                                  className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors group"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                                      {question}
                                    </span>
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Sources */}
                        <SourcesList sources={event.sources || []} />
                      </div>
                    ),
                    searchResults: finalContent
                  }
                : msg
            ));
          }
          
          // Update research box with new events
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMsgId 
              ? { ...msg, content: <SearchDisplay events={[...events]} />, searchResults: finalContent }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      // Remove the search display message
      setMessages(prev => prev.filter(msg => msg.id !== assistantMsgId));
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during search';
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: (
          <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-700 dark:text-red-300 font-medium">Search Error</p>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errorMessage}</p>
            {(errorMessage.includes('API key') || errorMessage.includes('not set') || errorMessage.includes('required')) && (
              <div className="text-red-600 dark:text-red-400 text-sm mt-2">
                <p>Please ensure your providers are properly configured:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Search Provider: {searchProviderDisplayName} {hasApiKey ? '✓' : '✗'}</li>
                  <li>• LLM Provider: {llmProviderDisplayName} {hasLlmConfig ? '✓' : '✗'}</li>
                </ul>
                <p className="mt-2">
                  Configure providers in the Settings page or set the appropriate environment variables.
                </p>
              </div>
            )}
          </div>
        ),
        isSearch: false
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSearching) return;
    setShowSuggestions(false);

    const userMessage = input;
    setInput('');

    // Check if we have API key (block for any provider without API key)
    if (!hasApiKey) {
      // Store the query and show modal
      setPendingQuery(userMessage);
      setShowApiKeyModal(true);
      
      // Still add user message to show what they asked
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMsgId,
        role: 'user',
        content: userMessage,
        isSearch: true
      }]);
      return;
    }

    // Check if LLM is properly configured
    if (!hasLlmConfig) {
      // Add user message and error message
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMsgId,
        role: 'user',
        content: userMessage,
        isSearch: true
      }]);

      const errorMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: errorMsgId,
        role: 'assistant',
        content: (
          <div className="p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-amber-700 dark:text-amber-300 font-medium">Configuration Required</p>
            <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">
              Your {llmProviderDisplayName} LLM provider is not properly configured. 
              Please configure it in the Settings page before performing searches.
            </p>
          </div>
        ),
        isSearch: false
      }]);
      return;
    }

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: userMessage,
      isSearch: true
    }]);

    // Perform the search
    await performSearch(userMessage);
  };

  return (
    <div className="flex flex-col flex-1">
      {messages.length === 0 ? (
        // Center input when no messages
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-4xl">
            {/* Knowledge Stack Selector */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <label className="text-sm text-gray-600 dark:text-gray-400">Knowledge Stack:</label>
              <Select value={selectedKnowledgeStack} onValueChange={setSelectedKnowledgeStack}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Web Search Only" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-only">Web Search Only</SelectItem>
                  {knowledgeStacks.map((stack) => (
                    <SelectItem key={stack.id} value={stack.id}>
                      {stack.name} ({stack.documentsCount} docs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => {
                    if (!hasShownSuggestions && messages.length === 0) {
                      setShowSuggestions(true);
                      setHasShownSuggestions(true);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Enter query..."
                  className="w-full h-14 rounded-full border border-input bg-background pl-6 pr-16 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                  disabled={isSearching}
                />
                <button
                  type="submit"
                  disabled={isSearching || !input.trim()}
                  className="absolute right-2 top-2 h-10 w-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                >
                  {isSearching ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
                
                {/* Suggestions dropdown - only show on initial load */}
                {showSuggestions && !input && messages.length === 0 && (
                  <div className="absolute top-full mt-2 w-full bg-popover rounded-2xl shadow-lg border border-border overflow-hidden">
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground px-3 py-2 font-medium">Try searching for:</p>
                      {SUGGESTED_QUERIES.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full text-left px-3 py-2.5 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors text-sm text-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{suggestion}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-auto scrollbar-hide px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`${
                    msg.role === 'user' 
                      ? 'flex justify-end' 
                      : 'w-full'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-2xl">
                      <span className="inline-block px-5 py-3 rounded-2xl bg-muted text-foreground">
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full">{msg.content}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
                    {/* Fixed bottom input when messages are present */}
          <div className="bg-background px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Knowledge Stack Selector and New Chat Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Search Mode:</label>
                  <Select value={selectedKnowledgeStack} onValueChange={setSelectedKnowledgeStack}>
                    <SelectTrigger className={`w-[220px] ${selectedKnowledgeStack !== 'web-only' ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20' : ''}`}>
                      <SelectValue placeholder="Web Search Only" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web-only">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                          </svg>
                          Web Search Only
                        </div>
                      </SelectItem>
                      {knowledgeStacks.map((stack) => (
                        <SelectItem key={stack.id} value={stack.id}>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            {stack.name} ({stack.documentsCount} docs)
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedKnowledgeStack !== 'web-only' && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      RAG Active
                    </div>
                  )}
                </div>
                
                {/* New Chat Button */}
                {messages.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={clearCurrentChat}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    Start New Chat
                  </Button>
                )}
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => {
                if (!hasShownSuggestions) {
                  setShowSuggestions(true);
                  setHasShownSuggestions(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Enter query..."
              className="w-full h-14 rounded-full border border-input bg-background pl-6 pr-16 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              disabled={isSearching}
            />
            
            <button
              type="submit"
              disabled={!input.trim() || isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-sm"
            >
              {isSearching ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
            </button>
            
            {/* Suggestions dropdown - positioned to show above input */}
            {showSuggestions && !input && (
              <div className="absolute bottom-full mb-2 w-full bg-popover rounded-2xl shadow-lg border border-border overflow-hidden">
                <div className="p-2">
                  <p className="text-xs text-muted-foreground px-3 py-2 font-medium">Try searching for:</p>
                  {SUGGESTED_QUERIES.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-3 py-2.5 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors text-sm text-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* API Key Modal */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle>{searchProviderDisplayName} API Key Required</DialogTitle>
            <DialogDescription>
              {searchProvider === 'firecrawl' ? (
                <>To use Firesearch, you need a Firecrawl API key. You can get one for free.</>
              ) : searchProvider === 'tavily' ? (
                <>To search the web, you need a Tavily API key. Please set the TAVILY_API_KEY environment variable.</>
              ) : searchProvider === 'serp' ? (
                <>To search Google, you need a SERP API key. Please set the SERP_API_KEY environment variable.</>
              ) : (
                <>To search the web, you need a {searchProviderDisplayName} API key.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {searchProvider === 'firecrawl' ? (
              <>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open('https://www.firecrawl.dev/app/api-keys', '_blank')}
                    className="w-full"
                    variant="code"
                  >
                    Get your free API key from Firecrawl →
                  </Button>
                </div>
                <div className="space-y-2">
                  <label htmlFor="apiKey" className="text-sm font-medium">
                    Enter your API key
                  </label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={firecrawlApiKey}
                    onChange={(e) => setFirecrawlApiKey(e.target.value)}
                    placeholder="fc-..."
                    className="w-full"
                  />
                </div>
              </>
            ) : searchProvider === 'tavily' ? (
              <div className="space-y-2">
                <Button
                  onClick={() => window.open('https://tavily.com/', '_blank')}
                  className="w-full"
                  variant="code"
                >
                  Get your API key from Tavily →
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set the <code>TAVILY_API_KEY</code> environment variable and restart the application.
                </p>
              </div>
            ) : searchProvider === 'serp' ? (
              <div className="space-y-2">
                <Button
                  onClick={() => window.open('https://serpapi.com/', '_blank')}
                  className="w-full"
                  variant="code"
                >
                  Get your API key from SERP API →
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set the <code>SERP_API_KEY</code> environment variable and restart the application.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please configure the API key for {searchProviderDisplayName} in your environment variables.
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="code"
              onClick={() => setShowApiKeyModal(false)}
            >
              Cancel
            </Button>
            {searchProvider === 'firecrawl' ? (
              <Button 
                variant="orange"
                onClick={saveApiKey}
                disabled={!firecrawlApiKey.trim()}
              >
                Save and Continue
              </Button>
            ) : (
              <Button 
                variant="orange"
                onClick={() => {
                  setShowApiKeyModal(false);
                  toast.info('Please set the required environment variable and restart the application.');
                }}
              >
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}