import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { Send, Bot, Loader2, Trash2, Plus, X, ChevronLeft, ChevronRight, Copy, Check, AlertCircle, Cpu } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { copilotApi } from '../api/endpoints';
import type { AiChatRequest, AiChatResponse } from '../types';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
}

export const Copilot: React.FC = () => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: providerInfo } = useQuery({
    queryKey: ['copilot-provider'],
    queryFn: async () => {
      const res = await copilotApi.getProviderInfo();
      return res.data as { name: string; available: boolean; model: string };
    },
  });

  const { data: conversationsData } = useQuery<Array<{ id: string; title: string; updatedAt: string }>>({
    queryKey: ['copilot-conversations'],
    queryFn: async () => {
      const res = await copilotApi.getConversations();
      return res.data as Array<{ id: string; title: string; updatedAt: string }>;
    },
  });

  useEffect(() => {
    if (conversationsData) {
      setConversations(conversationsData);
      if (!activeConversationId && conversationsData.length > 0) {
        setActiveConversationId(conversationsData[0].id);
        loadConversation(conversationsData[0].id);
      }
    }
  }, [conversationsData, activeConversationId]);

  const loadConversation = async (id: string) => {
    try {
      const res = await copilotApi.getConversation(id);
      if (res.data) {
        const msgs = res.data.messages || [];
        setMessages(msgs.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt),
          toolsUsed: m.toolCalls ? JSON.parse(m.toolCalls).map((t: any) => t.name) : [],
        })));
      }
    } catch (error) {
      toast.error('Failed to load conversation');
    }
  };

  const sendMutation = useMutation({
    mutationFn: (data: AiChatRequest) => copilotApi.chat(data),
    onSuccess: (response) => {
      if (response.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: response.data!.message,
            timestamp: new Date(),
            toolsUsed: response.data!.toolsUsed,
          },
        ]);
        if (!activeConversationId && response.data!.conversationId) {
          setActiveConversationId(response.data!.conversationId);
        }
        queryClient.invalidateQueries({ queryKey: ['copilot-conversations'] });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: (title?: string) => copilotApi.createConversation(title),
    onSuccess: (response) => {
      if (response.data) {
        setActiveConversationId(response.data.id);
        setMessages([]);
        queryClient.invalidateQueries({ queryKey: ['copilot-conversations'] });
      }
      setShowNewChat(false);
      setNewChatTitle('');
    },
    onError: () => toast.error('Failed to create conversation'),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id: string) => copilotApi.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copilot-conversations'] });
      if (activeConversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    },
    onError: () => toast.error('Failed to delete conversation'),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      await sendMutation.mutateAsync({
        message: currentInput,
        conversationId: activeConversationId || undefined,
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleNewChat = () => {
    if (newChatTitle.trim()) {
      createConversationMutation.mutate(newChatTitle.trim());
    } else {
      createConversationMutation.mutate();
    }
  };

  const handleDeleteConversation = (id: string) => {
    if (window.confirm('Delete this conversation?')) {
      deleteConversationMutation.mutate(id);
    }
  };

  const suggestedPrompts = [
    "What are my low stock products?",
    "How much did I sell this month?",
    "Which customers have pending payments?",
    "What are my top selling products?",
    "Show my recent sales",
    "Which products are slow moving?",
    "Summarize my business performance",
    "What should I restock?",
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowSidebar(!showSidebar)} aria-label={showSidebar ? 'Hide sidebar' : 'Show sidebar'}>
            {showSidebar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
          <div>
            <h1 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary-600" />
              AI Copilot
            </h1>
            <p className="text-sm text-secondary-500">Ask questions about your business data</p>
          </div>
        </div>
        <Button onClick={() => setShowNewChat(true)} leftIcon={<Plus className="w-4 h-4" />}>
          New Chat
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <aside className="w-72 bg-white border-r border-secondary-200 flex flex-col hidden lg:block">
            <div className="p-4 border-b border-secondary-200">
              <h3 className="font-medium text-secondary-900">Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-secondary-500 text-sm">No conversations yet</div>
              ) : (
                <ul className="divide-y divide-secondary-200">
                  {conversations.map((conv) => (
                    <li key={conv.id}>
                      <button
                        onClick={() => { setActiveConversationId(conv.id); loadConversation(conv.id); }}
                        className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between gap-2 ${
                          activeConversationId === conv.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-secondary-700 hover:bg-secondary-50'
                        }`}
                      >
                        <span className="truncate flex-1">{conv.title || 'Untitled'}</span>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }} className="opacity-0 hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-16 h-16 text-secondary-200 mb-4" />
                <h3 className="text-lg font-medium text-secondary-700 mb-2">Welcome to AI Copilot</h3>
                <p className="text-secondary-500 mb-6 max-w-md">
                  Ask me anything about your business - inventory, sales, customers, payments, and more.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {suggestedPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto py-3"
                      onClick={() => { setInput(prompt); handleSend({ preventDefault: () => {} } as FormEvent); }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`rounded-2xl p-4 ${message.role === 'user' ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-secondary-100 text-secondary-900 rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.toolsUsed && message.toolsUsed.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.toolsUsed.map((tool) => (
                          <span key={tool} className="text-xs px-2 py-1 bg-white/20 rounded-full">{tool}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => navigator.clipboard.writeText(message.content)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-primary-100 text-primary-600' : 'bg-primary-600 text-white'}`}>
                  {message.role === 'user' ? 'U' : <Bot className="w-4 h-4" />}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-secondary-100 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  <span className="text-secondary-600">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-secondary-200 bg-white">
            <form onSubmit={handleSend} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your business..."
                className="flex-1 px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none min-h-[48px] max-h-[120px]"
                rows={1}
                disabled={loading}
              />
              <Button type="submit" loading={loading} disabled={!input.trim() || loading} className="h-12" aria-label="Send message">
                <Send className="w-5 h-5" />
              </Button>
            </form>
            <div className="flex items-center justify-center gap-2 mt-2">
              {providerInfo ? (
                <>
                  <Badge variant={providerInfo.available ? 'success' : 'warning'} className="flex items-center gap-1">
                    {providerInfo.available ? (
                      <Cpu className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {providerInfo.name.toUpperCase()} ({providerInfo.model})
                    {!providerInfo.available && <span className="ml-1">(Mock Mode)</span>}
                  </Badge>
                </>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Detecting provider...
                </Badge>
              )}
            </div>
            <p className="text-xs text-secondary-500 mt-2 text-center">
              {providerInfo?.available
                ? 'Powered by NVIDIA Nemotron AI • Your data stays private'
                : 'Running in DEMO mode with mock AI responses • Data is simulated'}
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showNewChat}
        onClose={() => { setShowNewChat(false); setNewChatTitle(''); }}
        title="New Conversation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">Start a new conversation with the AI Copilot</p>
          <Input
            label="Title (optional)"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="e.g., Inventory Analysis"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
            <Button type="button" variant="secondary" onClick={() => { setShowNewChat(false); setNewChatTitle(''); }}>Cancel</Button>
            <Button type="button" onClick={handleNewChat}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};