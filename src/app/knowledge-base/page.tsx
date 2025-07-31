'use client';

import React, { useState, useEffect } from 'react';
import { KnowledgeBase } from '../../../lib/agent/types';
import KnowledgeBaseList from '../../../components/knowledge-base/KnowledgeBaseList';
import CreateKnowledgeBaseForm from '../../../components/knowledge-base/CreateKnowledgeBaseForm';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';

const KnowledgeBasePage: React.FC = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch knowledge bases
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      try {
        const response = await fetch('/api/knowledge-bases');
        if (response.ok) {
          const data = await response.json();
          setKnowledgeBases(data);
        }
      } catch (error) {
        console.error('Error fetching knowledge bases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnowledgeBases();
  }, []);

  const handleCreateKnowledgeBase = async (name: string, description: string, files: File[]) => {
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/knowledge-bases', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newKb = await response.json();
        setKnowledgeBases(prev => [...prev, newKb]);
      } else {
        console.error('Error creating knowledge base');
      }
    } catch (error) {
      console.error('Error creating knowledge base:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKnowledgeBase = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge-bases/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setKnowledgeBases(prev => prev.filter(kb => kb.id !== id));
      } else {
        console.error('Error deleting knowledge base');
      }
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base Management</h1>
        <p className="mt-2 text-gray-600">
          Create and manage your Qdrant knowledge bases for enhanced research capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card title="Create Knowledge Base">
          <CreateKnowledgeBaseForm 
            onSubmit={handleCreateKnowledgeBase} 
            isLoading={isCreating} 
          />
        </Card>

        <Card title="Existing Knowledge Bases">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <KnowledgeBaseList 
              knowledgeBases={knowledgeBases} 
              onDelete={handleDeleteKnowledgeBase} 
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default KnowledgeBasePage;