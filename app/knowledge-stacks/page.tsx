'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Upload, Trash2, Database, FileText } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";

interface KnowledgeStack {
  id: string;
  name: string;
  description: string;
  documentsCount: number;
  lastUpdated: string;
  size: string; // e.g., "2.5 MB"
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
}

export default function KnowledgeStacksPage() {
  const [knowledgeStacks, setKnowledgeStacks] = useState<KnowledgeStack[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedStack, setSelectedStack] = useState<KnowledgeStack | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [stackName, setStackName] = useState('');
  const [stackDescription, setStackDescription] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  useEffect(() => {
    loadKnowledgeStacks();
  }, []);

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

  const loadDocuments = async (stackId: string) => {
    try {
      const response = await fetch(`/api/knowledge-stacks/${stackId}/documents`);
      if (response.ok) {
        const docs = await response.json();
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const createKnowledgeStack = async () => {
    if (!stackName.trim()) {
      toast.error('Please enter a stack name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/knowledge-stacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stackName.trim(),
          description: stackDescription.trim()
        })
      });

      if (response.ok) {
        toast.success('Knowledge stack created successfully');
        setShowCreateDialog(false);
        setStackName('');
        setStackDescription('');
        loadKnowledgeStacks();
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to create knowledge stack');
      }
    } catch {
      toast.error('Failed to create knowledge stack');
    } finally {
      setLoading(false);
    }
  };

  const deleteKnowledgeStack = async (stackId: string) => {
    if (!confirm('Are you sure you want to delete this knowledge stack? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-stacks/${stackId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Knowledge stack deleted successfully');
        loadKnowledgeStacks();
        if (selectedStack?.id === stackId) {
          setSelectedStack(null);
          setDocuments([]);
        }
      } else {
        toast.error('Failed to delete knowledge stack');
      }
    } catch {
      toast.error('Failed to delete knowledge stack');
    }
  };

  const uploadDocuments = async () => {
    if (!selectedStack || uploadingFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      uploadingFiles.forEach(file => {
        formData.append('documents', file);
      });

      const response = await fetch(`/api/knowledge-stacks/${selectedStack.id}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success('Documents uploaded successfully');
        setShowUploadDialog(false);
        setUploadingFiles([]);
        loadDocuments(selectedStack.id);
        loadKnowledgeStacks(); // Refresh stack info
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to upload documents');
      }
    } catch {
      toast.error('Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!selectedStack || !confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-stacks/${selectedStack.id}/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        loadDocuments(selectedStack.id);
        loadKnowledgeStacks(); // Refresh stack info
      } else {
        toast.error('Failed to delete document');
      }
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadingFiles(files);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Search
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Database className="w-8 h-8 text-primary" />
                Knowledge Stacks
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your document collections for enhanced AI search
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Stack
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Knowledge Stacks List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Knowledge Stacks</CardTitle>
                <CardDescription>
                  {knowledgeStacks.length} stack{knowledgeStacks.length !== 1 ? 's' : ''} available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {knowledgeStacks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No knowledge stacks yet</p>
                    <p className="text-sm">Create your first stack to get started</p>
                  </div>
                ) : (
                  knowledgeStacks.map((stack) => (
                    <div
                      key={stack.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedStack?.id === stack.id
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-border/80'
                      }`}
                      onClick={() => {
                        setSelectedStack(stack);
                        loadDocuments(stack.id);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            {stack.name}
                          </h3>
                          {stack.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {stack.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{stack.documentsCount} documents</span>
                            <span>{stack.size}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteKnowledgeStack(stack.id);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documents View */}
          <div className="lg:col-span-2">
            {selectedStack ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedStack.name}</CardTitle>
                      <CardDescription>
                        {documents.length} document{documents.length !== 1 ? 's' : ''} in this stack
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowUploadDialog(true)} 
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Documents
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="font-medium mb-2">No documents in this stack</p>
                      <p className="text-sm mb-4">Upload documents to start building your knowledge base</p>
                      <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Documents
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-foreground">
                                {doc.name}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{doc.type.toUpperCase()}</span>
                                <span>{doc.size}</span>
                                <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                <span className={`px-2 py-1 rounded ${
                                  doc.status === 'completed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : doc.status === 'processing'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {doc.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDocument(doc.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Select a knowledge stack</p>
                    <p className="text-sm">Choose a stack from the left to view and manage its documents</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create Stack Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Knowledge Stack</DialogTitle>
              <DialogDescription>
                Create a new collection to organize your documents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stackName">Stack Name *</Label>
                <Input
                  id="stackName"
                  value={stackName}
                  onChange={(e) => setStackName(e.target.value)}
                  placeholder="e.g., Technical Documentation, Research Papers"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="stackDescription">Description (Optional)</Label>
                <Textarea
                  id="stackDescription"
                  value={stackDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStackDescription(e.target.value)}
                  placeholder="Brief description of what this stack contains..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createKnowledgeStack}
                  disabled={loading || !stackName.trim()}
                >
                  {loading ? 'Creating...' : 'Create Stack'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Documents Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Upload documents to {selectedStack?.name}. Supported formats: PDF, TXT, DOCX, MD, and images.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="documents">Select Files</Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.docx,.md,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>
              {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files:</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadingFiles.map((file, index) => (
                      <div key={index} className="text-sm text-muted-foreground p-2 bg-muted rounded">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowUploadDialog(false);
                    setUploadingFiles([]);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={uploadDocuments}
                  disabled={loading || uploadingFiles.length === 0}
                >
                  {loading ? 'Uploading...' : 'Upload Documents'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
