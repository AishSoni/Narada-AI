import React from 'react';
import DeepSearchReport from './DeepSearchReport';
import { ChatMessage as ChatMessageType, SubQuestion, SubTask } from '../../lib/agent/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-4xl ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg p-4`}>
        {isUser ? (
          // User message
          <div>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          // Assistant message
          <div>
            {message.metadata?.subTasks ? (
              // Research process message with DeepSearchReport
              <DeepSearchReport
                mainTask={message.content}
                subTasks={message.metadata.subTasks as unknown as SubQuestion[]}
                sources={[]}
                finalAnswer={message.content}
                status="completed"
              />
            ) : (
              // Regular assistant message
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;