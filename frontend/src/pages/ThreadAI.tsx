import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { 
  Send, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Cpu, 
  Sparkles,
  MessageSquare,
  Wand2,
  Package,
  CircleDollarSign,
  TrendingUp,
  Boxes,
  Compass,
  Layers,
  ArrowRight,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { copilotApi } from '../api/endpoints';
import { ThreadAICore, ThreadAIState } from '../components/brand/ThreadAICore';
import type { AiChatRequest } from '../types';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
}

const RenderAssistantContent: React.FC<{ content: string }> = ({ content }) => {
  const draftMatch = content.match(/```(?:text)?\s*([\s\S]*?)```/);
  const draftText = draftMatch ? draftMatch[1].trim() : null;
  const hasSafetyNotice = content.includes('> [!IMPORTANT]');

  let displayText = content;
  if (draftMatch) {
    displayText = displayText.replace(/```(?:text)?\s*[\s\S]*?```/, '').trim();
  }
  if (hasSafetyNotice) {
    displayText = displayText.replace(/>\s*\[!IMPORTANT\][\s\S]*?(?=\n\n|$)/, '').trim();
  }

  return (
    <div className="space-y-3 font-sans">
      <div className="whitespace-pre-wrap leading-relaxed text-navy-950 font-sans">
        {displayText}
      </div>

      {draftText && (
        <div className="rounded-xl bg-amber-50/80 border border-amber-200/90 p-3.5 space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
              Suggested Draft Reminder (Pending Human Review)
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(draftText);
                toast.success('Draft copied to clipboard. Review before dispatch.');
              }}
              className="text-[11px] h-6 px-2 text-amber-950 bg-white hover:bg-amber-100 border-amber-300 font-medium"
              leftIcon={<Copy className="w-3 h-3" />}
            >
              Copy Draft
            </Button>
          </div>
          <div className="p-3 rounded-lg bg-white/95 border border-amber-200/80 font-sans text-xs text-navy-900 whitespace-pre-wrap select-all shadow-xs">
            {draftText}
          </div>
        </div>
      )}

      {hasSafetyNotice && (
        <div className="p-3 rounded-xl bg-navy-50 border border-navy-200 text-navy-800 text-xs flex items-start gap-2.5 mt-2">
          <ShieldAlert className="w-4 h-4 text-navy-700 flex-shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong className="block mb-0.5 text-navy-950">Human Authorization Notice</strong>
            This draft is generated for your review. Thread AI does not execute automatic communications or dispatch messages without your explicit confirmation.
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Thread AI — Autonomous Supply Chain & Commercial Intelligence
 * Understated Luxury Editorial Interface for Textile & Hosiery Manufacturing
 */
export const ThreadAI: React.FC = () => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [aiState, setAiState] = useState<ThreadAIState>('idle');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic AI Core state computation
  useEffect(() => {
    if (loading) {
      setAiState('thinking');
    } else if (isFocused && input.trim().length > 0) {
      setAiState('listening');
    } else {
      setAiState('idle');
    }
  }, [loading, isFocused, input]);

  // Provider configuration telemetry
  const { data: providerInfo } = useQuery({
    queryKey: ['copilot-provider'],
    queryFn: async () => {
      try {
        const res = await copilotApi.getProviderInfo();
        return res.data as { name: string; available: boolean; model: string };
      } catch {
        return { name: 'MOCK', available: true, model: 'threadpilot-hosiery-v1' };
      }
    },
  });

  // Conversation history
  const { data: conversationsData } = useQuery<Array<{ id: string; title: string; updatedAt: string }>>({
    queryKey: ['copilot-conversations'],
    queryFn: async () => {
      try {
        const res = await copilotApi.getConversations();
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray((raw as any).content)) return (raw as any).content;
        return [];
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    if (conversationsData && Array.isArray(conversationsData)) {
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
        const msgs = Array.isArray(res.data.messages) ? res.data.messages : [];
        setMessages(msgs.map((m: any) => {
          let parsedTools: string[] = [];
          if (m.toolCalls) {
            try {
              parsedTools = typeof m.toolCalls === 'string' 
                ? JSON.parse(m.toolCalls).map((t: any) => t.name || t) 
                : m.toolCalls.map((t: any) => t.name || t);
            } catch {}
          }
          return {
            id: m.id || Date.now().toString(),
            role: m.role || 'assistant',
            content: m.content || '',
            timestamp: m.createdAt ? new Date(m.createdAt) : new Date(),
            toolsUsed: parsedTools,
          };
        }));
      }
    } catch {
      toast.error('Failed to load thread session');
    }
  };

  const sendMutation = useMutation({
    mutationFn: (data: AiChatRequest) => copilotApi.chat(data),
    onSuccess: (response) => {
      if (response.data) {
        setAiState('responding');
        setTimeout(() => setAiState('idle'), 2500);

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
      setAiState('idle');
      toast.error(err instanceof Error ? err.message : 'Thread AI failed to synthesize response');
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
    onError: () => toast.error('Failed to initialize session'),
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
    onError: () => toast.error('Failed to archive session'),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const messageToSend = (directText !== undefined ? directText : input).trim();
    if (!messageToSend || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      await sendMutation.mutateAsync({
        message: messageToSend,
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
    if (window.confirm('Archive this intelligence session?')) {
      deleteConversationMutation.mutate(id);
    }
  };

  // Structured Domain Prompts for Textile & Hosiery Operations
  const domainPromptGroups = [
    {
      category: 'Textile Velocity & Stock',
      icon: Package,
      prompts: [
        'Analyze textile inventory velocity and critical stock',
        'What are my low stock yarn counts and blends?',
      ],
    },
    {
      category: 'Receivables & Collections',
      icon: CircleDollarSign,
      prompts: [
        'Show verified receivables aging by invoice due dates',
        'Draft payment reminder for overdue accounts',
      ],
    },
    {
      category: 'Prioritized Actions & Credit',
      icon: TrendingUp,
      prompts: [
        'What are my daily prioritized business actions?',
        'Which customer accounts have breached credit limits?',
      ],
    },
  ];

  const safeConversations = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-3.5 select-text">
      {/* Editorial Luxury Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 flex-shrink-0">
        <div className="flex items-center gap-3.5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSidebar(!showSidebar)} 
            aria-label={showSidebar ? 'Hide sessions drawer' : 'Show sessions drawer'}
            className="text-navy-700 hover:text-navy-950 hover:bg-stone-100 h-8 w-8 p-0"
          >
            {showSidebar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>

          {/* Micro Thread AI Presence Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative flex items-center justify-center p-1 rounded-xl bg-navy-950 border border-navy-800 shadow-sm flex-shrink-0">
              <ThreadAICore state={aiState} size="sm" interactive={false} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-bold text-navy-950 tracking-tight font-sans whitespace-nowrap">
                  Thread AI
                </h1>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase bg-brass-50 text-brass-800 border border-brass-200/90 shadow-xs whitespace-nowrap">
                  Autonomous Engine
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-navy-600 font-normal truncate">
                Textile intelligence & commercial supply-chain co-pilot
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry & Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {providerInfo && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100/90 border border-stone-200/80 text-[11px] font-medium text-navy-800 font-mono">
              <Cpu className="w-3.5 h-3.5 text-navy-600" />
              <span>{providerInfo.name.toUpperCase()}</span>
              <span className="text-stone-400">•</span>
              <span className="text-navy-600 truncate max-w-[140px]">{providerInfo.model}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${providerInfo.available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>
          )}

          <Button 
            onClick={() => setShowNewChat(true)} 
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5 text-brass-300" />}
            className="shadow-sm font-medium whitespace-nowrap"
          >
            <span className="hidden sm:inline">New Session</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden border border-stone-200/90 rounded-2xl bg-white shadow-card">
        {/* Sessions Drawer */}
        {showSidebar && (
          <aside className="w-64 bg-stone-50/50 border-r border-stone-200/80 flex flex-col hidden lg:flex flex-shrink-0">
            <div className="p-3.5 border-b border-stone-200/80 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-navy-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-brass-600" />
                Active Threads
              </span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white text-navy-600 border border-stone-200">
                {safeConversations.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {safeConversations.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">
                  No prior sessions recorded
                </div>
              ) : (
                safeConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => { setActiveConversationId(conv.id); loadConversation(conv.id); }}
                    className={`group w-full px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      activeConversationId === conv.id
                        ? 'bg-navy-950 text-white shadow-sm'
                        : 'text-navy-800 hover:bg-stone-200/60'
                    }`}
                  >
                    <span className="truncate flex-1">{conv.title || 'General Inquiries'}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                        activeConversationId === conv.id 
                          ? 'hover:bg-navy-800 text-stone-300' 
                          : 'hover:bg-stone-300 text-navy-600'
                      }`}
                      aria-label="Archive session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Message Canvas & Composer */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F6]">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Cinematic Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[460px] text-center py-6 max-w-2xl mx-auto">
                {/* 3D Animated Intelligence Presence */}
                <div className="relative mb-4">
                  <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-navy-950 via-navy-900 to-navy-950 border border-navy-800/80 flex items-center justify-center shadow-xl shadow-navy-950/15">
                    <ThreadAICore state={aiState} size="lg" interactive={true} />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-navy-950 tracking-tight font-sans">
                  Thread AI Operational Intelligence
                </h2>
                <p className="text-xs sm:text-sm text-navy-600 mt-1 mb-6 max-w-md leading-relaxed font-normal">
                  Autonomous conversational access to your yarn inventory, financial ledger, customer orders, and supply-chain margin analytics.
                </p>

                {/* Domain Quick Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full text-left">
                  {domainPromptGroups.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <div 
                        key={group.category}
                        className="bg-white rounded-xl border border-stone-200/90 p-3.5 shadow-xs flex flex-col justify-between hover:border-brass-300/80 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 mb-2 text-navy-800">
                          <GroupIcon className="w-3.5 h-3.5 text-brass-600 flex-shrink-0" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-700">
                            {group.category}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {group.prompts.map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              className="w-full text-left p-2 rounded-lg text-xs font-medium text-navy-700 bg-stone-50 hover:bg-stone-100 hover:text-navy-950 transition-all flex items-start justify-between group"
                              onClick={() => handleSend(undefined, prompt)}
                            >
                              <span className="leading-snug pr-1.5">{prompt}</span>
                              <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-brass-600 flex-shrink-0 mt-0.5 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conversation Stream */}
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-navy-950 text-brass-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-navy-800">
                    <Sparkles className="w-4 h-4 text-brass-400" />
                  </div>
                )}

                <div className={`max-w-[88%] sm:max-w-[78%] ${message.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                    message.role === 'user' 
                      ? 'bg-navy-950 text-white rounded-tr-xs shadow-md border border-navy-900' 
                      : 'bg-white text-navy-950 border border-stone-200/90 rounded-tl-xs shadow-card'
                  }`}>
                    {message.role === 'assistant' ? (
                      <RenderAssistantContent content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap font-sans">{message.content}</p>
                    )}

                    {/* Live Tools Execution Disclosure */}
                    {message.toolsUsed && message.toolsUsed.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-brass-600" />
                          Ledger Tools:
                        </span>
                        {message.toolsUsed.map((tool) => (
                          <span 
                            key={tool} 
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono bg-stone-100 text-navy-700 border border-stone-200"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] opacity-70">
                      <span className="tabular-nums">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button 
                        type="button"
                        onClick={() => { 
                          navigator.clipboard.writeText(message.content); 
                          toast.success('Response copied to clipboard'); 
                        }}
                        className="hover:opacity-100 transition-opacity p-1 rounded hover:bg-stone-100"
                        aria-label="Copy message text"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-brass-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    U
                  </div>
                )}
              </div>
            ))}

            {/* In-Flight Synthesizing State */}
            {loading && (
              <div className="flex gap-3 items-center animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-navy-950 text-brass-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-navy-800">
                  <Sparkles className="w-4 h-4 text-brass-400 animate-spin-slow" />
                </div>
                <div className="bg-white border border-stone-200/90 rounded-2xl rounded-tl-xs px-4 py-3 text-xs sm:text-sm flex items-center gap-3 shadow-card text-navy-700 font-medium">
                  <ThreadAICore state="thinking" size="sm" interactive={false} />
                  <span>Synthesizing supply chain query & executing ledger tools...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Luxury Elevated Composer */}
          <div className="p-3.5 sm:p-4 border-t border-stone-200/90 bg-white">
            <form onSubmit={handleSend} className="flex items-end gap-2.5">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Inquire about yarn inventory, slow-moving items, customer receivables, or margin..."
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-800 focus:border-navy-800 resize-none min-h-[46px] max-h-[110px] text-xs sm:text-sm text-navy-950 placeholder:text-stone-400 shadow-inner-soft"
                  rows={1}
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                loading={loading} 
                disabled={!input.trim() || loading} 
                className="h-[46px] px-5 shadow-sm font-semibold"
                aria-label="Send message to Thread AI"
              >
                <Send className="w-4 h-4 text-brass-300" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Initialize New Session Modal */}
      <Modal
        isOpen={showNewChat}
        onClose={() => { setShowNewChat(false); setNewChatTitle(''); }}
        title="Initialize New Thread Session"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-navy-600">
            Create an isolated session context for analyzing a specific operational run, seasonal yarn blend, or financial horizon.
          </p>
          <Input
            label="Session Focus Title (optional)"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="e.g. Q4 Combed Cotton Yarn & Receivables Review"
          />
          <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-200">
            <Button type="button" variant="secondary" onClick={() => { setShowNewChat(false); setNewChatTitle(''); }}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleNewChat}>
              Create Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ThreadAI;
