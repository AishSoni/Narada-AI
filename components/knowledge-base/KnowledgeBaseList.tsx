import React, { useState, useEffect } from 'react';
import { KnowledgeBase } from '../../lib/agent/types';

interface KnowledgeBaseListProps {
  knowledgeBases: KnowledgeBase[];
  onDelete: (id: string) => void;
}

const KnowledgeBaseList: React.FC<KnowledgeBaseListProps> = ({ knowledgeBases, onDelete }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Knowledge Bases</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {knowledgeBases.length === 0 ? (
          <div className="px-6 py-4 text-center">
            <p className="text-gray-500">No knowledge bases found.</p>
          </div>
        ) : (
          knowledgeBases.map((kb) => (
            <div key={kb.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{kb.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{kb.description}</p>
                  <div className="mt-2 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      kb.status === 'ready' 
                        ? 'bg-green-100 text-green-800' 
                        : kb.status === 'processing' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {kb.status === 'ready' 
                        ? 'Ready' 
                        : kb.status === 'processing' 
                          ? 'Processing' 
                          : 'Error'}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      Created {kb.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(kb.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseList;