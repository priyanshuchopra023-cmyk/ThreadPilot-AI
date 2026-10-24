import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { 
  Send, 
  Bot, 
  Loader2, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Cpu, 
  Sparkles,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { copilotApi } from '../api/endpoints';
import type { AiChatRequest } from '../types';
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
    } catch {
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
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
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
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-navy-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSidebar(!showSidebar)} 
            aria-label={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
            className="text-navy-600 hover:text-navy-900 h-8 w-8 p-0"
          >
            {showSidebar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
                <Bot className="w-5 h-5 text-brass-600" />
                AI Copilot
              </h1>
              <Badge variant="brass" size="sm" dot>Enterprise AI</Badge>
            </div>
            <p className="text-xs text-navy-500 mt-0.5">
              Natural language intelligence for supply chain, stock levels, and commercial ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {providerInfo && (
            <Badge variant={providerInfo.available ? 'success' : 'secondary'} size="sm" className="hidden sm:inline-flex">
              <Cpu className="w-3 h-3 mr-1" />
              {providerInfo.name.toUpperCase()} ({providerInfo.model})
            </Badge>
          )}
          <Button 
            onClick={() => setShowNewChat(true)} 
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Session
          </Button>
        </div>
      </div>

      {/* Main Copilot Shell */}
      <div className="flex-1 flex overflow-hidden border border-navy-100 rounded-xl bg-white shadow-card">
        {/* Conversations History Sidebar */}
        {showSidebar && (
          <aside className="w-64 bg-navy-50/40 border-r border-navy-100 flex flex-col hidden lg:flex flex-shrink-0">
            <div className="p-3.5 border-b border-navy-100 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-navy-500 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-navy-400" />
                Saved Sessions
              </span>
              <span className="font-mono text-[11px] text-navy-400">{conversations.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-navy-400 text-xs">No prior sessions recorded</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => { setActiveConversationId(conv.id); loadConversation(conv.id); }}
                    className={`group w-full px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      activeConversationId === conv.id
                        ? 'bg-navy-900 text-white shadow-sm'
                        : 'text-navy-700 hover:bg-navy-100/70'
                    }`}
                  >
                    <span className="truncate flex-1">{conv.title || 'General Inquiries'}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                        activeConversationId === conv.id ? 'hover:bg-navy-800 text-navy-300' : 'hover:bg-navy-200 text-navy-500'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Message Stream & Composer */}
        <div className="flex-1 flex flex-col min-w-0 bg-canvas/30">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-navy-900 to-navy-800 text-brass-400 flex items-center justify-center shadow-brass mb-4">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-navy-900 tracking-tight">ThreadPilot Copilot Advisor</h3>
                <p className="text-xs text-navy-500 mt-1 mb-6 max-w-md leading-relaxed">
                  Direct natural language access to your wholesale database. Inquire about yarns, overdue invoices, production runs, and customer receivable risk.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="p-3 bg-white border border-navy-100 hover:border-navy-300 hover:shadow-card transition-all rounded-xl text-left text-xs font-medium text-navy-800 flex items-center justify-between group"
                      onClick={() => { setInput(prompt); handleSend({ preventDefault: () => {} } as FormEvent); }}
                    >
                      <span className="truncate pr-2">{prompt}</span>
                      <Sparkles className="w-3.5 h-3.5 text-navy-300 group-hover:text-brass-600 flex-shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-navy-900 text-brass-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className={`max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`rounded-xl p-4 text-xs leading-relaxed ${
                    message.role === 'user' 
                      ? 'bg-navy-900 text-white rounded-tr-xs shadow-sm' 
                      : 'bg-white text-navy-900 border border-navy-100 rounded-tl-xs shadow-card'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {message.toolsUsed && message.toolsUsed.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-navy-100/60 flex flex-wrap gap-1">
                        {message.toolsUsed.map((tool) => (
                          <Badge key={tool} variant="secondary" size="sm" className="font-mono text-[10px]">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[10px] opacity-70">
                      <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button 
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(message.content); toast.success('Copied to clipboard'); }}
                        className="hover:opacity-100 transition-opacity p-0.5"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-brass-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    U
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-lg bg-navy-900 text-brass-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-navy-100 rounded-xl rounded-tl-xs p-3 text-xs flex items-center gap-2 shadow-sm text-navy-600 font-medium">
                  <Loader2 className="w-4 h-4 text-navy-700 animate-spin" />
                  Synthesizing business analytics...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="p-3.5 border-t border-navy-100 bg-white">
            <form onSubmit={handleSend} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask about inventory, receivables, customer trends, or order status..."
                className="flex-1 px-3.5 py-2.5 border border-navy-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600 resize-none min-h-[44px] max-h-[100px] text-xs text-navy-900 placeholder:text-navy-400"
                rows={1}
                disabled={loading}
              />
              <Button 
                type="submit" 
                variant="primary" 
                loading={loading} 
                disabled={!input.trim() || loading} 
                className="h-11 px-4 shadow-sm"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      <Modal
        isOpen={showNewChat}
        onClose={() => { setShowNewChat(false); setNewChatTitle(''); }}
        title="Start New Copilot Session"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-navy-600">
            Create an isolated session context for analyzing a specific operational or financial topic.
          </p>
          <Input
            label="Session Title (optional)"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="e.g. Q4 Yarn Allocation & Margin Review"
          />
          <div className="flex justify-end gap-2.5 pt-4 border-t border-navy-100">
            <Button type="button" variant="secondary" onClick={() => { setShowNewChat(false); setNewChatTitle(''); }}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleNewChat}>
              Initialize Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Copilot;
