import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ChatInput from '@/components/ChatInput';
import ChatMessage from '@/components/ChatMessage';
import WelcomeScreen from '@/components/WelcomeScreen';
import { claude } from './lib/claude';
import { initDB, saveAllSessionsToDB, getAllSessionsFromDB, clearDB } from './lib/db';
import { toast } from 'sonner';
import ShareDialog from './components/ShareDialog';
import SharedChatView from './components/SharedChatView';
import { SharedChat } from './lib/share';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isAnimated?: boolean;
    isError?: boolean;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    aiSessionId: string | null;
}

const queryClient = new QueryClient();

function MainApp() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [customInstruction, setCustomInstruction] = useState('');
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [chatToShare, setChatToShare] = useState<SharedChat | null>(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (window.innerWidth >= 1024) {
            setSidebarOpen(true);
        }
    }, []);

    useEffect(() => {
        const loadSessions = async () => {
            try {
                await initDB();
                let loaded = await getAllSessionsFromDB();

                if (!loaded || loaded.length === 0) {
                    const local = localStorage.getItem('shiroko_sessions');
                    if (local) {
                        try {
                            loaded = JSON.parse(local);
                            if (loaded && loaded.length > 0) {
                                await saveAllSessionsToDB(loaded);
                            }
                        } catch { }
                    }
                }

                if (Array.isArray(loaded) && loaded.length > 0) {
                    const valid = loaded.filter((s: any) => s.messages);
                    if (valid.length > 0) {
                        setSessions(valid);
                        const lastId = localStorage.getItem('shiroko_active_session_id');
                        const foundSession = valid.find((s: any) => s.id === lastId);
                        setCurrentSessionId(foundSession ? lastId : valid[0].id);
                        setInitialLoadComplete(true);
                        return;
                    }
                }

                const newSession: ChatSession = {
                    id: Date.now().toString(),
                    title: 'Chat Baru',
                    messages: [],
                    createdAt: Date.now(),
                    aiSessionId: null
                };
                setSessions([newSession]);
                setCurrentSessionId(newSession.id);
                setInitialLoadComplete(true);

            } catch (e) {
                console.error("DB Error", e);
                const newSession: ChatSession = {
                    id: Date.now().toString(),
                    title: 'Chat Baru',
                    messages: [],
                    createdAt: Date.now(),
                    aiSessionId: null
                };
                setSessions([newSession]);
                setCurrentSessionId(newSession.id);
                setInitialLoadComplete(true);
            }
        };
        loadSessions();

        const savedInstruction = localStorage.getItem('shiorko_custom_instruction');
        if (savedInstruction) setCustomInstruction(savedInstruction);

    }, []);

    useEffect(() => {
        if (sessions.length > 0 && initialLoadComplete) {
            saveAllSessionsToDB(sessions);
            localStorage.setItem('shiroko_sessions', JSON.stringify(sessions));
        }
    }, [sessions, initialLoadComplete]);

    useEffect(() => {
        if (currentSessionId) localStorage.setItem('shiroko_active_session_id', currentSessionId);
    }, [currentSessionId]);

    useEffect(() => {
        if (customInstruction !== '') {
            localStorage.setItem('shiorko_custom_instruction', customInstruction);
        }
    }, [customInstruction]);

    const createNewSession = useCallback(() => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'Chat Baru',
            messages: [],
            createdAt: Date.now(),
            aiSessionId: null
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        if (window.innerWidth < 1024) setSidebarOpen(false);
    }, []);

    const handleDeleteChat = useCallback((id: string) => {
        setSessions(prev => {
            const filtered = prev.filter(s => s.id !== id);
            if (filtered.length === 0) {
                const newSession: ChatSession = {
                    id: Date.now().toString(),
                    title: 'New Chat',
                    messages: [],
                    createdAt: Date.now(),
                    aiSessionId: null
                };
                setCurrentSessionId(newSession.id);
                return [newSession];
            }
            if (currentSessionId === id) {
                setCurrentSessionId(filtered[0].id);
            }
            return filtered;
        });
    }, [currentSessionId]);

    const handleClearAll = useCallback(async () => {
        try {
            await clearDB();
            localStorage.removeItem('shiroko_sessions');
        } catch { }
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: Date.now(),
            aiSessionId: null
        };
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
    }, []);

    const handleSend = useCallback(async (content: string) => {
        if (!content.trim() || !currentSessionId || isLoading) return;

        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content };

        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return {
                    ...s,
                    messages: [...s.messages, userMsg],
                    title: s.messages.length === 0 ? content.slice(0, 30) : s.title
                };
            }
            return s;
        }));

        setIsLoading(true);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        try {
            const currentSess = sessions.find(s => s.id === currentSessionId);
            const recentMessages = currentSess?.messages.slice(-10) || [];
            let contextMessage = content;

            if (recentMessages.length > 0) {
                const historyContext = recentMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 500)}`).join('\n\n');
                contextMessage = `[Previous Context]\n${historyContext}\n\n[User Message]\n${content}`;
            }

            const data = await claude({
                message: contextMessage,
                instruction: customInstruction,
                sessionId: currentSess?.aiSessionId,
                signal: abortControllerRef.current.signal
            });

            const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.text, isAnimated: true };

            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    return { ...s, messages: [...s.messages, botMsg], aiSessionId: data.sessionId };
                }
                return s;
            }));
        } catch (e: any) {
            if (e.name !== 'CanceledError' && e.message !== 'canceled' && e.name !== 'AbortError') {
                const errorMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
                    isError: true
                };
                setSessions(prev => prev.map(s => {
                    if (s.id === currentSessionId) return { ...s, messages: [...s.messages, errorMsg] };
                    return s;
                }));
                toast.error('Gagal mendapatkan respons');
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentSessionId, sessions, isLoading, customInstruction]);

    const handleAnimationComplete = useCallback((msgId: string) => {
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return { ...s, messages: s.messages.map(m => m.id === msgId ? { ...m, isAnimated: false } : m) };
            }
            return s;
        }));
    }, [currentSessionId]);

    const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId]);
    const messages = currentSession?.messages || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, isLoading]);

    // Stop generating
    const handleStop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
            toast.info('Generasi dihentikan');
        }
    }, []);

    // Regenerate last response
    const handleRegenerate = useCallback(() => {
        if (!currentSessionId || isLoading) return;

        const currentSess = sessions.find(s => s.id === currentSessionId);
        if (!currentSess || currentSess.messages.length < 2) return;

        // Find last user message
        const lastUserMsg = [...currentSess.messages].reverse().find(m => m.role === 'user');
        if (!lastUserMsg) return;

        // Remove last assistant message
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                const msgs = [...s.messages];
                if (msgs[msgs.length - 1]?.role === 'assistant') {
                    msgs.pop();
                }
                return { ...s, messages: msgs };
            }
            return s;
        }));

        // Resend
        setTimeout(() => handleSend(lastUserMsg.content), 100);
    }, [currentSessionId, sessions, isLoading, handleSend]);

    // Edit user message
    const handleEditMessage = useCallback((msgId: string, newContent: string) => {
        if (!currentSessionId) return;

        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                const msgIndex = s.messages.findIndex(m => m.id === msgId);
                if (msgIndex === -1) return s;

                // Remove all messages after this one
                const newMessages = s.messages.slice(0, msgIndex + 1);
                newMessages[msgIndex] = { ...newMessages[msgIndex], content: newContent };

                return { ...s, messages: newMessages };
            }
            return s;
        }));

        // Resend the edited message
        setTimeout(() => handleSend(newContent), 100);
    }, [currentSessionId, handleSend]);

    // Retry after error
    const handleRetry = useCallback(() => {
        handleRegenerate();
    }, [handleRegenerate]);

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                chatHistory={sessions.map(s => ({
                    id: s.id,
                    title: s.title,
                    date: new Date(s.createdAt).toLocaleDateString()
                }))}
                activeChat={currentSessionId}
                onChatSelect={(id) => { setCurrentSessionId(id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                onNewChat={createNewSession}
                onDeleteChat={handleDeleteChat}
                onClearAll={handleClearAll}
                customInstruction={customInstruction}
                setCustomInstruction={setCustomInstruction}
            />

            <main className="flex-1 flex flex-col min-w-0 relative">
                <Header
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    showSidebar={sidebarOpen}
                    onNewChat={createNewSession}
                    hasMessages={messages.length > 0}
                    onShareChat={() => {
                        if (currentSession) {
                            setChatToShare({
                                title: currentSession.title,
                                messages: currentSession.messages.map(m => ({ role: m.role, content: m.content })),
                                sharedAt: Date.now()
                            });
                            setShareDialogOpen(true);
                        }
                    }}
                />

                <div className="flex-1 overflow-hidden flex flex-col relative z-0">
                    <div className="flex-1 overflow-y-auto scrollbar-thin px-4">
                        {messages.length === 0 ? (
                            <div className="h-full">
                                <WelcomeScreen onSuggestionClick={handleSend} />
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto py-6 space-y-6 pb-4">
                                {messages.map((m, index) => (
                                    <ChatMessage
                                        key={m.id}
                                        id={m.id}
                                        content={m.content}
                                        role={m.role}
                                        isAnimated={m.isAnimated}
                                        isError={m.isError}
                                        onAnimationComplete={handleAnimationComplete}
                                        onRegenerate={m.role === 'assistant' && index === messages.length - 1 ? handleRegenerate : undefined}
                                        onEdit={m.role === 'user' ? handleEditMessage : undefined}
                                        onRetry={m.isError ? handleRetry : undefined}
                                    />
                                ))}
                                {isLoading && (
                                    <ChatMessage
                                        id="loading"
                                        content=""
                                        role="assistant"
                                        isTyping={true}
                                    />
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Footer input area */}
                    <div className="z-10 w-full py-4">
                        <ChatInput
                            onSend={handleSend}
                            onStop={handleStop}
                            disabled={false}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </main>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                />
            )}

            {/* Share Dialog */}
            <ShareDialog
                isOpen={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                chat={chatToShare}
            />
        </div>
    );
}

const App = () => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="claude-ui-theme">
            <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <Routes>
                        <Route path="/share" element={<SharedChatView />} />
                        <Route path="*" element={<MainApp />} />
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

export default App;
