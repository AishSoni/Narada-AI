import React, { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '../../lib/agent/types';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    // Add user message to chat
    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // In a real implementation, we would call the API
      // For now, we'll simulate the agent response
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add agent response
      const agentMessage: ChatMessageType = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I've received your query: "${message}". In a full implementation, I would coordinate with other agents to research this topic and provide a comprehensive answer.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: ChatMessageType = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Narada AI - Deep Research Agent</h2>
            <p className="text-gray-600 max-w-md">
              Ask me anything and I'll research the topic using multiple sources to provide you with a comprehensive answer.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 text-gray-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce mr-1"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce mr-1 delay-75"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatView;