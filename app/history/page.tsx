'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Calendar, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
  isSearch?: boolean;
  searchResults?: string;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
  messageCount: number;
  preview: string;
}

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  // Load conversations from localStorage
  useEffect(() => {
    const loadConversations = () => {
      try {
        const stored = localStorage.getItem('narada-conversations');
        if (stored) {
          const parsed = JSON.parse(stored);
          setConversations(parsed.sort((a: Conversation, b: Conversation) => b.timestamp - a.timestamp));
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    loadConversations();
  }, []);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteConversation = (id: string) => {
    try {
      const updatedConversations = conversations.filter(conv => conv.id !== id);
      setConversations(updatedConversations);
      localStorage.setItem('narada-conversations', JSON.stringify(updatedConversations));
      setShowDeleteDialog(false);
      setConversationToDelete(null);
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const clearAllHistory = () => {
    try {
      setConversations([]);
      localStorage.removeItem('narada-conversations');
      setShowClearAllDialog(false);
      toast.success('All chat history cleared');
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Failed to clear history');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const restoreConversation = (conversation: Conversation) => {
    try {
      // Store the conversation to restore in localStorage
      localStorage.setItem('narada-restore-conversation', JSON.stringify(conversation));
      toast.success('Conversation will be restored');
      // Navigate back to chat
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to restore conversation:', error);
      toast.error('Failed to restore conversation');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none rounded-[10px] text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#36322F] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 h-10 px-4 py-2 font-medium gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </Link>
            <h1 className="text-2xl font-semibold text-[#36322F] dark:text-white">
              Chat History
            </h1>
          </div>
          {conversations.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowClearAllDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              Clear All History
            </Button>
          )}
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                No chat history yet
              </h2>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                Start a conversation to see your chat history here
              </p>
              <Link href="/">
                <Button className="bg-[#36322F] text-white hover:bg-[#4a4542]">
                  Start Chatting
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Conversations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{conversations.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {conversations.reduce((sum, conv) => sum + conv.messageCount, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Latest Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {conversations.length > 0 ? formatDate(conversations[0].timestamp) : 'None'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Conversations List */}
              <div className="space-y-4">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No conversations match your search
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                                {conversation.title}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {conversation.messageCount} messages
                              </Badge>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 overflow-hidden" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {conversation.preview}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(conversation.timestamp)}
                              </div>
                              <div>
                                {new Date(conversation.timestamp).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedConversation(conversation)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restoreConversation(conversation)}
                              className="bg-[#36322F] text-white hover:bg-[#4a4542] border-[#36322F]"
                            >
                              Continue
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setConversationToDelete(conversation.id);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conversation View Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedConversation?.title}</DialogTitle>
            <DialogDescription>
              {selectedConversation && formatDate(selectedConversation.timestamp)} at{' '}
              {selectedConversation && new Date(selectedConversation.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedConversation?.messages.map((message, index) => (
              <div key={index} className={`${
                message.role === 'user' 
                  ? 'flex justify-end' 
                  : 'w-full'
              }`}>
                {message.role === 'user' ? (
                  <div className="max-w-2xl">
                    <span className="inline-block px-4 py-2 rounded-2xl bg-[#FBFAF9] dark:bg-zinc-800 text-[#36322F] dark:text-zinc-100 text-sm">
                      {typeof message.content === 'string' ? message.content : '[Complex content]'}
                    </span>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {message.searchResults || '[Search result content]'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedConversation(null)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedConversation) {
                  restoreConversation(selectedConversation);
                }
              }}
              className="bg-[#36322F] text-white hover:bg-[#4a4542]"
            >
              Continue This Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (conversationToDelete) {
                  deleteConversation(conversationToDelete);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All History</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all conversations? This action cannot be undone and will permanently remove all your chat history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearAllDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={clearAllHistory}
            >
              Clear All History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
