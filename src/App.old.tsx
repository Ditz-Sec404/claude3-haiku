import { useState, useEffect, useRef, memo, useMemo, useCallback, useLayoutEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Send2, Category, Trash, Setting2, Message, Moon, Sun1, ArrowLeft2, ArrowUp2, Copy, TickCircle, Edit2, Code, Video, Briefcase, Cpu, MagicStar, Stop } from 'iconsax-reactjs'
import { claude } from './lib/claude'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomOneLight, atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript'
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css'
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import { initDB, saveAllSessionsToDB, getAllSessionsFromDB, clearDB } from './lib/db'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import mermaid from 'mermaid'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, ChartTooltip, Legend, Filler)

SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('js', javascript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('ts', typescript)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('sh', bash)

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    isAnimated?: boolean
}

interface ChatSession {
    id: string
    title: string
    messages: Message[]
    createdAt: number
    aiSessionId: string | null
}

// Ultra-optimized animation variants for smooth & fast performance
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.08 } }
}

const sidebarVariants = {
    hidden: { x: '-100%' },
    visible: {
        x: 0,
        transition: { type: 'tween', duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
    },
    exit: {
        x: '-100%',
        transition: { type: 'tween', duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }
    }
}

const sheetVariants = {
    hidden: { y: '100%' },
    visible: { y: 0, transition: { type: 'tween', duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
    exit: { y: '100%', transition: { type: 'tween', duration: 0.15, ease: [0.25, 0.1, 0.25, 1] } }
}

const alertVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.12 } },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.08 } }
}

const messageVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.15 } }
}

const CopyButton = ({ content, isDark }: { content: string, isDark: boolean }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Kode berhasil disalin!' } }))
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors ${isDark ? 'hover:bg-white/10 text-[#8e8e93] hover:text-white' : 'hover:bg-black/5 text-[#8e8e93] hover:text-black'
                }`}
        >
            {copied ? <TickCircle size={14} variant="Bold" /> : <Copy size={14} variant="Linear" />}
            {copied ? 'Tersalin' : 'Salin'}
        </button>
    )
}

// Mermaid Diagram Component
const MermaidDiagram = ({ code, isDark }: { code: string, isDark: boolean }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const renderDiagram = async () => {
            if (!containerRef.current) return

            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDark ? 'dark' : 'default',
                    themeVariables: isDark ? {
                        primaryColor: '#007AFF',
                        primaryTextColor: '#fff',
                        primaryBorderColor: '#007AFF',
                        lineColor: '#666',
                        secondaryColor: '#2c2c2e',
                        tertiaryColor: '#1e1e1e',
                        background: '#1e1e1e',
                        mainBkg: '#2c2c2e',
                        nodeBorder: '#007AFF',
                        clusterBkg: '#2c2c2e',
                        titleColor: '#fff',
                        edgeLabelBackground: '#2c2c2e'
                    } : {
                        primaryColor: '#007AFF',
                        primaryTextColor: '#fff',
                        primaryBorderColor: '#007AFF',
                        lineColor: '#666',
                        secondaryColor: '#f2f2f7',
                        tertiaryColor: '#fff',
                        background: '#fff',
                        mainBkg: '#f2f2f7',
                        nodeBorder: '#007AFF'
                    },
                    flowchart: {
                        htmlLabels: true,
                        curve: 'basis',
                        padding: 15,
                        nodeSpacing: 50,
                        rankSpacing: 50
                    },
                    securityLevel: 'loose'
                })

                const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                const { svg: renderedSvg } = await mermaid.render(id, code)
                setSvg(renderedSvg)
                setError(null)
            } catch (e: any) {
                console.error('Mermaid render error:', e)
                setError(e.message || 'Failed to render diagram')
            }
        }

        renderDiagram()
    }, [code, isDark])

    if (error) {
        return (
            <div className={`my-4 p-4 rounded-xl border ${isDark ? 'bg-red-900/20 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                <p className="text-sm">Error rendering diagram: {error}</p>
                <pre className="mt-2 text-xs opacity-70 overflow-auto">{code}</pre>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className={`my-4 p-6 rounded-xl border overflow-x-auto ${isDark ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200'}`}
            dangerouslySetInnerHTML={{ __html: svg }}
            style={{ minHeight: svg ? 'auto' : '100px' }}
        />
    )
}

const StreamingText = ({ content, onComplete, onUpdate, components }: { content: string, onComplete: () => void, onUpdate?: () => void, components: any }) => {
    const [displayedContent, setDisplayedContent] = useState('')
    const currentLength = useRef(0)
    const stopAnim = useRef(false)

    useEffect(() => {
        stopAnim.current = false
        const fullContent = content.replace(/<!-- end list -->/g, '')

        const animate = () => {
            if (stopAnim.current) return

            if (currentLength.current >= fullContent.length) {
                setDisplayedContent(fullContent)
                onComplete()
                return
            }

            const remaining = fullContent.slice(currentLength.current)
            // Increased chunk sizes for faster streaming
            let jump = 1

            const nextPunctuation = remaining.match(/([.,!?\n])/)
            const nextSpace = remaining.indexOf(' ')

            if (nextPunctuation && nextPunctuation.index !== undefined && nextPunctuation.index < 50) {
                // If punctuation is near (within 50 chars), finish the clause
                jump = nextPunctuation.index + 1
            } else if (nextSpace !== -1 && nextSpace < 40) {
                // Else take the next word (increased range)
                jump = nextSpace + 1
            } else {
                // Fallback: take a bigger chunk (increased from 5 to 15)
                jump = Math.min(remaining.length, 15)
            }

            currentLength.current += jump
            setDisplayedContent(fullContent.slice(0, currentLength.current))
            onUpdate?.()

            // Reduced delays for faster streaming
            let delay = 5
            const lastChar = fullContent[currentLength.current - 1]
            if (['.', '!', '?', '\n'].includes(lastChar)) delay = 50 // Reduced from 200ms
            else if ([','].includes(lastChar)) delay = 25 // Reduced from 100ms
            else delay = 5 // Reduced from 30ms

            setTimeout(() => requestAnimationFrame(animate), delay)
        }

        requestAnimationFrame(animate)

        return () => {
            stopAnim.current = true
        }
    }, [content, onComplete, onUpdate])

    return (
        <motion.div>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {displayedContent}
            </ReactMarkdown>
        </motion.div>
    )
}

const MessageItem = memo(({ msg, isDark, onAnimationComplete, onStreamUpdate }: { msg: Message; isDark: boolean; onAnimationComplete: (id: string) => void, onStreamUpdate?: () => void }) => {

    const codeComponents = useMemo(() => ({
        code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            const language = match?.[1] || 'text'

            if (language === 'json-chart') {
                try {
                    const content = String(children).replace(/\n$/, '')
                    const chartData = JSON.parse(content)

                    const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE', '#00C7BE', '#FF2D55']

                    const labels = chartData.data.map((d: any) => d.label)
                    const values = chartData.data.map((d: any) => d.value)

                    const chartOptions = {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                            duration: 800,
                            easing: 'easeInOutQuart' as const
                        },
                        plugins: {
                            legend: {
                                display: chartData.type === 'pie' || chartData.type === 'donut',
                                position: 'bottom' as const,
                                labels: {
                                    color: isDark ? '#e5e5e5' : '#333',
                                    padding: 15,
                                    font: { size: 12 }
                                }
                            },
                            tooltip: {
                                backgroundColor: isDark ? '#1e1e1e' : '#fff',
                                titleColor: isDark ? '#fff' : '#000',
                                bodyColor: isDark ? '#ccc' : '#666',
                                borderColor: isDark ? '#333' : '#e5e5e5',
                                borderWidth: 1,
                                padding: 12,
                                cornerRadius: 8
                            }
                        },
                        scales: chartData.type !== 'pie' && chartData.type !== 'donut' ? {
                            x: {
                                grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                                ticks: { color: isDark ? '#888' : '#666' }
                            },
                            y: {
                                grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                                ticks: { color: isDark ? '#888' : '#666' }
                            }
                        } : undefined
                    }

                    const barLineData = {
                        labels,
                        datasets: [{
                            label: chartData.title || 'Data',
                            data: values,
                            backgroundColor: chartData.type === 'bar'
                                ? 'rgba(0, 122, 255, 0.8)'
                                : chartData.type === 'area'
                                    ? 'rgba(0, 122, 255, 0.2)'
                                    : 'transparent',
                            borderColor: '#007AFF',
                            borderWidth: 2,
                            borderRadius: chartData.type === 'bar' ? 6 : 0,
                            fill: chartData.type === 'area',
                            tension: 0.4,
                            pointBackgroundColor: '#007AFF',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }]
                    }

                    const pieData = {
                        labels,
                        datasets: [{
                            data: values,
                            backgroundColor: COLORS.slice(0, values.length),
                            borderColor: isDark ? '#1e1e1e' : '#fff',
                            borderWidth: 2,
                            hoverOffset: 8
                        }]
                    }

                    return (
                        <div className="my-4 p-4 rounded-xl border bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-white/10" style={{ minHeight: '320px' }}>
                            {chartData.title && <h3 className="text-center mb-4 font-semibold text-gray-700 dark:text-gray-200">{chartData.title}</h3>}
                            <div className="h-[280px] w-full">
                                {chartData.type === 'bar' && <Bar data={barLineData} options={chartOptions} />}
                                {(chartData.type === 'line' || chartData.type === 'area') && <Line data={barLineData} options={chartOptions} />}
                                {chartData.type === 'pie' && <Pie data={pieData} options={chartOptions} />}
                                {chartData.type === 'donut' && <Doughnut data={pieData} options={chartOptions} />}
                            </div>
                        </div>
                    )
                } catch (e) {
                    console.error("Chart Render Error", e)
                    // Fallback to normal JSON view
                }
            }

            // Handle Mermaid diagrams
            if (language === 'mermaid') {
                const content = String(children).replace(/\n$/, '')
                return <MermaidDiagram code={content} isDark={isDark} />
            }

            return isInline ? (
                <code {...props}>{children}</code>
            ) : (
                <div className="my-4 rounded-xl overflow-hidden group border" style={{
                    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'
                }}>
                    <div className="flex items-center justify-between px-4 py-2" style={{
                        backgroundColor: isDark ? '#252526' : '#fafafa',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'}`
                    }}>
                        <span className="text-xs font-mono text-[#8e8e93]">{match?.[1] || 'text'}</span>
                        <CopyButton content={String(children).replace(/\n$/, '')} isDark={isDark} />
                    </div>
                    <SyntaxHighlighter
                        style={isDark ? atomOneDark : atomOneLight}
                        language={match?.[1] || 'text'}
                        customStyle={{
                            margin: 0,
                            borderRadius: 0,
                            fontSize: '13.5px',
                            lineHeight: '1.6',
                            padding: '16px',
                            background: 'transparent'
                        }}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </div>
            )
        },
        img({ ...props }: any) {
            return <img {...props} className="rounded-xl max-w-full my-3" loading="lazy" />
        },
        a({ children, ...props }: any) {
            return <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#007AFF' }}>{children}</a>
        },
        table({ children, ...props }: any) {
            return (
                <div className="overflow-x-auto my-4 rounded-xl border border-gray-200/20" style={{ maxWidth: '100%' }}>
                    <table {...props} className="w-full text-left text-sm border-collapse">
                        {children}
                    </table>
                </div>
            )
        },
        thead({ children, ...props }: any) {
            return <thead {...props} className={isDark ? 'bg-white/5' : 'bg-black/5'}>{children}</thead>
        },
        th({ children, ...props }: any) {
            return <th {...props} className={`px-4 py-3 font-semibold whitespace-nowrap ${isDark ? 'border-white/10' : 'border-black/10'} border-b`}>{children}</th>
        },
        td({ children, ...props }: any) {
            return <td {...props} className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-black/10'} min-w-[140px]`}>{children}</td>
        }
    }), [isDark])

    const streamingComponents = useMemo(() => ({
        ...codeComponents,
        code: ({ inline, className, children, ...props }: any) => {
            if (inline) return <code className={`${className} ${isDark ? 'bg-white/10' : 'bg-black/5'} rounded px-1 py-0.5`} {...props}>{children}</code>

            return (
                <div className="my-4 rounded-xl overflow-hidden border" style={{
                    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'
                }}>
                    <div className="flex items-center justify-between px-4 py-2" style={{
                        backgroundColor: isDark ? '#252526' : '#fafafa',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'}`
                    }}>
                        <span className="text-xs font-mono text-[#8e8e93]">generating...</span>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <pre className={`font-mono text-[13.5px] leading-[1.6] whitespace-pre-wrap ${isDark ? 'text-[#abb2bf]' : 'text-[#383a42]'}`}>
                            {children}
                        </pre>
                    </div>
                </div>
            )
        }
    }), [codeComponents, isDark])

    return (
        <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1 min-w-0">
                <div
                    className={`${msg.role === 'user'
                        ? 'bubble inline-block text-left bubble-user rounded-2xl px-4 py-3'
                        : `block w-full text-left leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-900'}`
                        }`}
                    style={{
                        boxShadow: 'none',
                        float: msg.role === 'user' ? 'right' : 'none'
                    }}
                >
                    {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap text-[15px] md:text-[17px]">{msg.content}</p>
                    ) : (
                        <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                            {msg.isAnimated ? (
                                <StreamingText
                                    content={msg.content}
                                    onComplete={() => onAnimationComplete(msg.id)}
                                    onUpdate={onStreamUpdate}
                                    components={streamingComponents}
                                />
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={codeComponents}>
                                    {msg.content.replace(/<!-- end list -->/g, '')}
                                </ReactMarkdown>
                            )}
                        </div>
                    )}
                </div>
                <div className="clear-both" />
            </div>
        </div>
    )
})

function App() {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [customInstruction, setCustomInstruction] = useState('')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isDark, setIsDark] = useState(false)
    const [showClearConfirm, setShowClearConfirm] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const scrollContainerRef = useRef<HTMLDivElement>(null)
    // Toast State
    const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' })

    useEffect(() => {
        const handleToast = (e: any) => {
            setToast({ show: true, message: e.detail.message })
            setTimeout(() => setToast({ show: false, message: '' }), 3000)
        }
        window.addEventListener('show-toast', handleToast)
        return () => window.removeEventListener('show-toast', handleToast)
    }, [])

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const sheetRef = useRef<HTMLDivElement>(null)
    const dragControls = useDragControls()
    const didInitRef = useRef(false)

    const [initialLoadComplete, setInitialLoadComplete] = useState(false)

    const scrollToBottom = useCallback(() => {
        if (!initialLoadComplete) return
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [initialLoadComplete])



    useEffect(() => {
        if (didInitRef.current) return
        didInitRef.current = true

        const loadSessions = async () => {
            try {
                // Initialize DB
                await initDB()
                let loadedSessions = await getAllSessionsFromDB()

                // Fallback/Migration from localStorage if DB is empty
                if (!loadedSessions || loadedSessions.length === 0) {
                    const localSessions = localStorage.getItem('shiroko_sessions') || localStorage.getItem('gemini_sessions')
                    if (localSessions) {
                        try {
                            const parsed = JSON.parse(localSessions)
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                loadedSessions = parsed
                                // Save to DB for future
                                await saveAllSessionsToDB(loadedSessions)
                            }
                        } catch (e) {
                            console.error("Migration error", e)
                        }
                    }
                }

                if (Array.isArray(loadedSessions) && loadedSessions.length > 0) {
                    // Filter session kosong (cleanup empty chats)
                    const nonEmptySessions = loadedSessions.filter((s: any) => s.messages && s.messages.length > 0)

                    if (nonEmptySessions.length > 0) {
                        // Reset animations
                        const cleaned = nonEmptySessions.map((s: any) => ({
                            ...s,
                            messages: s.messages.map((m: any) => ({ ...m, isAnimated: false }))
                        }))
                        setSessions(cleaned)

                        // Restore last active session ID
                        const lastId = localStorage.getItem('shiroko_active_session_id') || localStorage.getItem('gemini_active_session_id')
                        if (lastId && cleaned.find((s: any) => s.id === lastId)) {
                            setCurrentSessionId(lastId)
                        } else {
                            setCurrentSessionId(cleaned[0].id)
                        }
                    } else {
                        // Jika semua session kosong, buat baru
                        createNewSession()
                    }
                } else {
                    createNewSession()
                }
            } catch (e) {
                console.error("DB Load error", e)
                createNewSession()
            } finally {
                setInitialLoadComplete(true)
            }
        }

        loadSessions()

        const savedTheme = localStorage.getItem('shiroko_theme') || localStorage.getItem('gemini_theme')

        // Hapus instruksi lama dari localStorage (one-time cleanup)
        localStorage.removeItem('shiroko_instruction')
        localStorage.removeItem('gemini_instruction')

        if (savedTheme === 'dark') setIsDark(true)
    }, [])

    // Save sessions to DB + localStorage (backup) whenever they change
    useEffect(() => {
        if (sessions.length > 0 && initialLoadComplete) {
            saveAllSessionsToDB(sessions).catch(console.error)
            localStorage.setItem('shiroko_sessions', JSON.stringify(sessions)) // Keep for backup
        }
    }, [sessions, initialLoadComplete])

    // Save Active Session ID
    useEffect(() => {
        if (currentSessionId) {
            localStorage.setItem('shiroko_active_session_id', currentSessionId)
        }
    }, [currentSessionId])

    // Scroll Persistence Logic
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || !currentSessionId) return
        const scrollTop = scrollContainerRef.current.scrollTop
        localStorage.setItem(`shiroko_scroll_${currentSessionId}`, scrollTop.toString())
    }, [currentSessionId])

    // Restore scroll on session change or initial load
    useLayoutEffect(() => {
        if (!initialLoadComplete || !currentSessionId || !scrollContainerRef.current) return

        const savedScroll = localStorage.getItem(`shiroko_scroll_${currentSessionId}`)
        if (savedScroll) {
            scrollContainerRef.current.scrollTop = parseInt(savedScroll)
        } else {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
    }, [currentSessionId, initialLoadComplete]) // Triggers when session changes

    useEffect(() => { localStorage.setItem('shiroko_theme', isDark ? 'dark' : 'light') }, [isDark])

    const createNewSession = useCallback(() => {
        // Cek apakah session saat ini sudah kosong (new chat)
        const currentSess = sessions.find(s => s.id === currentSessionId)
        if (currentSess && currentSess.messages.length === 0) {
            // Session sudah kosong, tidak perlu buat baru
            setIsSidebarOpen(false)
            return
        }

        const newSession: ChatSession = {
            id: Date.now().toString(), title: 'Chat baru', messages: [],
            createdAt: Date.now(), aiSessionId: null
        }
        setSessions(prev => [newSession, ...prev])
        setCurrentSessionId(newSession.id)
        setIsSidebarOpen(false)
        setInitialLoadComplete(true)
    }, [sessions, currentSessionId])


    const deleteSession = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setConfirmDelete(id)
    }, [])

    const confirmDeleteSession = useCallback(() => {
        if (!confirmDelete) return
        setSessions(prev => {
            const newSessions = prev.filter(s => s.id !== confirmDelete)
            if (newSessions.length === 0) {
                const newSession: ChatSession = {
                    id: Date.now().toString(), title: 'Chat baru', messages: [],
                    createdAt: Date.now(), aiSessionId: null
                }
                setCurrentSessionId(newSession.id)
                return [newSession]
            }
            if (currentSessionId === confirmDelete) setCurrentSessionId(newSessions[0].id)
            return newSessions
        })
        setConfirmDelete(null)
    }, [confirmDelete, currentSessionId])

    const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId])
    const messages = currentSession?.messages || []

    // Removed automatic scroll on messages change to let the user control via manual scroll unless sending a message
    // but we can keep it for new messages if at bottom. For now, let's trust the restore scroll for init.
    // If user sends message, we scroll.
    useEffect(() => {
        if (isLoading) scrollToBottom() // Only auto scroll if loading new message
    }, [messages, isLoading, scrollToBottom])

    const handleAnimationComplete = useCallback((id: string) => {
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return {
                    ...s,
                    messages: s.messages.map(m => m.id === id ? { ...m, isAnimated: false } : m)
                }
            }
            return s
        }))
    }, [currentSessionId])

    const handleStop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setIsLoading(false)
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                // If last message is empty model message (loading), remove it
                const msgs = [...s.messages]
                const last = msgs[msgs.length - 1]
                if (last && last.role === 'assistant' && last.content === '') {
                    msgs.pop()
                }
                return { ...s, messages: msgs }
            }
            return s
        }))
    }, [currentSessionId])

    const handleSend = useCallback(async () => {
        if (!input.trim() || !currentSessionId || isLoading) return

        if (abortControllerRef.current) abortControllerRef.current.abort()
        abortControllerRef.current = new AbortController()
        const currentSess = sessions.find(s => s.id === currentSessionId)
        if (!currentSess) return

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
        setSessions(prev => prev.map(session => {
            if (session.id === currentSessionId) {
                return { ...session, messages: [...session.messages, userMsg], title: session.messages.length === 0 ? input.slice(0, 40) : session.title }
            }
            return session
        }))
        setInput('')
        setIsLoading(true)
        if (textareaRef.current) textareaRef.current.style.height = 'auto'

        try {
            const recentMessages = currentSess.messages.slice(-10)
            let contextMessage = userMsg.content
            if (recentMessages.length > 0) {
                const historyContext = recentMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 500)}`).join('\n\n')
                contextMessage = `[Konteks Percakapan Sebelumnya]\n${historyContext}\n\n[Pesan Terbaru dari User]\n${userMsg.content}`
            }
            const data = await claude({
                message: contextMessage,
                instruction: customInstruction,
                sessionId: currentSess.aiSessionId,
                signal: abortControllerRef.current?.signal // Pass signal
            })
            const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.text, isAnimated: true }
            setSessions(prev => prev.map(session => {
                if (session.id === currentSessionId) {
                    return { ...session, messages: [...session.messages, botMsg], aiSessionId: data.sessionId }
                }
                return session
            }))
        } catch {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Maaf, terjadi kesalahan. Silakan coba lagi.' }
            setSessions(prev => prev.map(session => {
                if (session.id === currentSessionId) return { ...session, messages: [...session.messages, errorMsg] }
                return session
            }))
        } finally { setIsLoading(false) }
    }, [input, currentSessionId, isLoading, sessions, customInstruction])

    const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
    }, [])

    const clearChat = useCallback(() => {
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) return { ...s, messages: [], aiSessionId: null, title: 'Chat baru' }
            return s
        }))
        setShowSettings(false)
    }, [currentSessionId])

    const clearAllSessions = useCallback(() => {
        setShowClearConfirm(true)
    }, [])

    const performClearAll = useCallback(async () => {
        createNewSession()
        const newSession: ChatSession = {
            id: Date.now().toString(), title: 'Chat baru', messages: [],
            createdAt: Date.now(), aiSessionId: null
        }
        setSessions([newSession])
        setCurrentSessionId(newSession.id)
        setIsSidebarOpen(false)
        setShowClearConfirm(false)

        try {
            await clearDB()
            localStorage.removeItem('shiroko_sessions')
            localStorage.removeItem('gemini_sessions')
            localStorage.removeItem('shiroko_active_session_id')
            localStorage.removeItem('gemini_active_session_id')
        } catch (e) {
            console.error(e)
        }
    }, [createNewSession])



    return (
        <div className={`h-screen flex overflow-hidden ${isDark ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}>
            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/30 z-40"
                    />
                )}
            </AnimatePresence>

            {/* iOS Sidebar with Framer Motion */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.aside
                        variants={sidebarVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed z-50 w-[300px] h-full flex flex-col"
                        style={{
                            background: isDark ? '#1c1c1e' : '#ffffff',
                            boxShadow: '4px 0 20px rgba(0,0,0,0.12)',
                            willChange: 'transform',
                            transform: 'translateZ(0)'
                        }}
                    >
                        <div className="px-4 py-3 flex items-center justify-between"
                            style={{ borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsSidebarOpen(false)}
                                className="text-[#007AFF] text-[17px] flex items-center gap-1"
                            >
                                <ArrowLeft2 size={20} variant="Linear" />Kembali
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={createNewSession} className="text-[#007AFF] text-[17px] font-medium">
                                Baru
                            </motion.button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-4">
                            <div className={`mx-4 rounded-xl overflow-hidden ${isDark ? 'bg-[#2c2c2e]/50' : 'bg-white/60'}`}>
                                {sessions.map((session, idx) => (
                                    <div
                                        key={session.id}
                                        onClick={() => { setCurrentSessionId(session.id); setIsSidebarOpen(false) }}
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-100 active:bg-white/5 ${idx !== sessions.length - 1 ? 'border-b' : ''} ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                                        style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSessionId === session.id ? 'bg-[#007AFF]' : isDark ? 'bg-[#3c3c3e]' : 'bg-[#e5e5ea]'
                                            }`}>
                                            <Message size={16} variant="Bold" color={currentSessionId === session.id ? 'white' : isDark ? '#9ca3af' : '#6b7280'} />
                                        </div>
                                        <span className={`flex-1 text-[17px] truncate ${currentSessionId === session.id ? 'font-medium' : ''}`}>
                                            {session.title}
                                        </span>
                                        <button onClick={(e) => { e.stopPropagation(); deleteSession(e, session.id) }} className="p-2 -mr-2 text-[#8e8e93] active:scale-90 transition-transform">
                                            <Trash size={18} variant="Linear" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200/10 space-y-1">
                            <motion.button
                                whileTap={{ scale: 0.98, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                onClick={() => { setShowSettings(true); setIsSidebarOpen(false) }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isDark ? 'text-gray-200 hover:bg-[#2c2c2e]' : 'text-gray-700 hover:bg-[#f2f2f7]'}`}
                            >
                                <Setting2 size={20} variant="Linear" />
                                <span className="font-medium">Pengaturan</span>
                            </motion.button>

                            <motion.button
                                whileTap={sessions.filter(s => s.messages.length > 0).length > 0 ? { scale: 0.98, backgroundColor: 'rgba(239,68,68,0.1)' } : {}}
                                onClick={sessions.filter(s => s.messages.length > 0).length > 0 ? clearAllSessions : undefined}
                                disabled={sessions.filter(s => s.messages.length > 0).length === 0}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${sessions.filter(s => s.messages.length > 0).length > 0
                                    ? 'text-red-500 hover:bg-red-500/10 cursor-pointer'
                                    : 'text-gray-400 cursor-not-allowed opacity-50'
                                    }`}
                            >
                                <Trash size={20} variant="Linear" />
                                <span className="font-medium">Hapus Semua Chat</span>
                            </motion.button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <header className="absolute top-0 w-full z-10 px-4 py-3 flex items-center justify-between pointer-events-none" style={{ background: 'transparent' }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsSidebarOpen(true)}
                        className={`p-2.5 rounded-full pointer-events-auto shadow-lg transition-colors will-change-transform transform-gpu ${isDark ? 'bg-[#2c2c2e] border border-white/10 text-white hover:bg-[#3a3a3c]' : 'bg-white border border-gray-200 text-black hover:bg-gray-50'}`}
                    >
                        <Category size={22} variant="Bold" />
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={createNewSession}
                        className={`p-2.5 rounded-full pointer-events-auto shadow-lg transition-colors will-change-transform transform-gpu ${isDark ? 'bg-[#2c2c2e] border border-white/10 text-white hover:bg-[#3a3a3c]' : 'bg-white border border-gray-200 text-black hover:bg-gray-50'}`}
                    >
                        <Edit2 size={22} variant="Linear" />
                    </motion.button>
                </header>

                {/* Global Toast Notification */}
                <AnimatePresence>
                    {toast.show && (
                        <motion.div
                            initial={{ opacity: 0, y: -50, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: -50, x: '-50%' }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className={`fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border ${isDark ? 'bg-black/80 border-white/10 text-white' : 'bg-white/90 border-black/5 text-black'}`}
                        >
                            <TickCircle size={20} variant="Bold" className="text-[#30d158]" />
                            <span className="font-medium text-sm">{toast.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* iOS-style Action Sheet for Delete All */}
                <AnimatePresence>
                    {showClearConfirm && (
                        <div className="fixed inset-0 z-[60] flex items-end justify-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.1 }}
                                className="absolute inset-0 bg-black/40"
                                onClick={() => setShowClearConfirm(false)}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'tween', duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                                className="relative w-full max-w-sm px-3 pb-8 z-10"
                            >
                                {/* Action Sheet Content */}
                                <div
                                    className="rounded-2xl overflow-hidden mb-2"
                                    style={{
                                        background: isDark ? 'rgba(44, 44, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(20px)',
                                        WebkitBackdropFilter: 'blur(20px)'
                                    }}
                                >
                                    <div className="px-4 py-4 text-center" style={{ borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                                        <h3 className={`text-[13px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Hapus Semua Chat?</h3>
                                        <p className={`text-[12px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Tindakan ini tidak dapat dibatalkan
                                        </p>
                                    </div>
                                    <motion.button
                                        whileTap={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                        onClick={performClearAll}
                                        className="w-full py-4 text-[20px] font-normal text-[#ff3b30]"
                                    >
                                        Hapus Semua
                                    </motion.button>
                                </div>

                                {/* Cancel Button */}
                                <motion.button
                                    whileTap={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                    onClick={() => setShowClearConfirm(false)}
                                    className="w-full py-4 rounded-2xl text-[20px] font-semibold text-[#007AFF]"
                                    style={{
                                        background: isDark ? 'rgba(44, 44, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(20px)',
                                        WebkitBackdropFilter: 'blur(20px)'
                                    }}
                                >
                                    Batal
                                </motion.button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto"
                >
                    <div className="w-full px-3 md:px-5 pt-20 pb-6 mx-auto">
                        {messages.length === 0 ? (
                            <div className="h-[70vh] flex flex-col items-center justify-center relative">
                                {/* Decorative Glow Background */}
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none ${isDark ? 'bg-blue-500' : 'bg-blue-400'}`} />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="text-center mb-8 relative z-10"
                                >
                                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4">
                                        <img
                                            src="https://api.deline.web.id/4bMp58QdoQ.png"
                                            alt="Claude 3"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    <h2 className="text-2xl md:text-4xl font-bold mb-2 tracking-tight">
                                        <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-white via-blue-200 to-blue-400' : 'from-gray-900 via-blue-600 to-blue-800'}`}>
                                            Claude 3
                                        </span>
                                    </h2>

                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className={`text-xs md:text-sm max-w-sm mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                                    >
                                        Gratis & Tanpa Limit. <br />Eksplorasi AI tanpa batas, kapanpun Anda butuh.
                                    </motion.p>
                                </motion.div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto px-4 relative z-10">
                                    {[
                                        { title: 'Buat Kode Python', subtitle: 'Untuk analisis csv', Icon: Code, color: 'text-[#30d158]' },
                                        { title: 'Ide Youtube', subtitle: 'Tema teknologi', Icon: Video, color: 'text-[#ff3b30]' },
                                        { title: 'Tips Interview', subtitle: 'Posisi engineer', Icon: Briefcase, color: 'text-[#0a84ff]' },
                                        { title: 'Quantum Computing', subtitle: 'Jelaskan simpel', Icon: Cpu, color: 'text-[#bf5af2]' }
                                    ].map((item, i) => (
                                        <motion.button
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            whileHover={{ scale: 1.02, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)' }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setInput(item.title + " " + item.subtitle)}
                                            style={{ backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }}
                                            className={`text-left p-2 md:p-4 rounded-lg md:rounded-2xl border transition-all duration-200 flex flex-col justify-between h-auto gap-1.5 md:gap-3 ${isDark
                                                ? 'border-[#2c2c2e]'
                                                : 'border-[#e5e5ea] shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between w-full">
                                                <div className={`p-1.5 md:p-2 rounded-md md:rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                                    <item.Icon size={24} className={`w-4 h-4 md:w-6 md:h-6 ${item.color}`} variant="Bulk" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className={`font-semibold mb-0.5 md:mb-1 text-xs md:text-[15px] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{item.title}</div>
                                                <div className="text-[10px] md:text-[13px] text-[#8e8e93] line-clamp-1 font-medium leading-tight">{item.subtitle}</div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {messages.map((msg) => (
                                        <motion.div key={msg.id} variants={messageVariants} initial="hidden" animate="visible">
                                            <MessageItem
                                                msg={msg}
                                                isDark={isDark}
                                                onStreamUpdate={scrollToBottom}
                                                onAnimationComplete={handleAnimationComplete}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`inline-block rounded-2xl px-4 py-3 ${isDark ? 'bg-[#2c2c2e]' : 'bg-white'}`}
                                    >
                                        <div className="flex gap-1.5">
                                            {[0, 1, 2].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                    className="w-2 h-2 rounded-full bg-[#8e8e93]"
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="p-4"
                    style={{
                        background: 'transparent',
                    }}
                >
                    <div className="w-full max-w-4xl px-3 md:px-5 mx-auto">
                        <div className={`flex items-end gap-3 rounded-[26px] p-2.5 backdrop-blur-md transition-all duration-300 will-change-transform transform-gpu ${isDark ? 'bg-[#1e1e1e] border border-white/10' : 'bg-white border border-black/5'}`}
                            style={{
                                boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            }}>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleTextareaChange}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                                placeholder="Ketik pesan..."
                                className={`flex-1 max-h-[120px] md:max-h-[180px] py-2 px-4 bg-transparent border-none outline-none resize-none text-[16px] leading-6 overflow-y-auto ${isDark ? 'text-white placeholder:text-[#8e8e93]' : 'text-black placeholder:text-[#8e8e93]'}`}
                                rows={1}
                            />
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={isLoading ? handleStop : handleSend}
                                disabled={!input.trim() && !isLoading}
                                className={`p-2 rounded-full transition-all duration-200 ${input.trim() || isLoading
                                    ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                                    : 'bg-transparent text-[#8e8e93] opacity-50'
                                    }`}
                                style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {isLoading ? (
                                    <Stop size={20} variant="Bold" />
                                ) : (
                                    <ArrowUp2 size={20} variant="Bold" />
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Sheet with Framer Motion */}
            <AnimatePresence>
                {showSettings && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center">
                        <motion.div
                            variants={overlayVariants} initial="hidden" animate="visible" exit="hidden"
                            onClick={() => setShowSettings(false)}
                            className="absolute inset-0 bg-black/30"
                        />
                        <motion.div
                            ref={sheetRef}
                            variants={sheetVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            drag="y"
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={{ top: 0 }}
                            dragElastic={{ top: 0, bottom: 0.5 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 100) setShowSettings(false)
                            }}
                            className="w-full max-w-lg rounded-t-3xl relative z-10 pb-8"
                            style={{
                                background: isDark ? 'rgba(44, 44, 46, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                                backdropFilter: 'blur(4px)',
                                WebkitBackdropFilter: 'blur(4px)',
                                boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
                                willChange: 'transform'
                            }}
                        >
                            <div
                                className="flex justify-center pt-3 pb-4 cursor-grab active:cursor-grabbing touch-none select-none"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-[#5c5c5e]' : 'bg-[#c7c7cc]'}`} />
                            </div>
                            <div className="grid grid-cols-3 items-center px-4 pb-4">
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowSettings(false)} className="text-[#007AFF] text-[17px] text-left">Batal</motion.button>
                                <span className="text-[17px] font-semibold text-center">Pengaturan</span>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowSettings(false)} className="text-[#007AFF] text-[17px] font-semibold text-right">Simpan</motion.button>
                            </div>
                            <div className="px-4 space-y-4">
                                <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1c1c1e]/80' : 'bg-white/80'}`}>
                                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#2c2c2e]' : 'bg-[#e5e5ea]'}`} style={{ color: isDark ? 'white' : 'black' }}>
                                                {isDark ? <Moon size={18} variant="Bold" /> : <Sun1 size={18} variant="Bold" />}
                                            </div>
                                            <span className="text-[17px]">Mode {isDark ? 'Malam' : 'Siang'}</span>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setIsDark(!isDark)}
                                            className={`w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-300 ${isDark ? 'bg-[#30d158]' : 'bg-[#e9e9ea]'}`}
                                        >
                                            <motion.div
                                                className="w-[27px] h-[27px] bg-white rounded-full shadow-md"
                                                animate={{ x: isDark ? 20 : 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        </motion.button>
                                    </div>
                                </div>

                                <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1c1c1e]/80' : 'bg-white/80'}`}>
                                    <div className="px-4 py-3" style={{ borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                                        <label className="text-[13px] font-medium uppercase tracking-wide text-[#8e8e93]">Instruksi Sistem</label>
                                    </div>
                                    <textarea
                                        value={customInstruction}
                                        onChange={(e) => setCustomInstruction(e.target.value)}
                                        className={`w-full p-4 bg-transparent border-none outline-none resize-none text-[17px] min-h-[120px] ${isDark ? 'text-white' : 'text-black'}`}
                                        placeholder="Tentukan cara AI merespons..."
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Alert with Framer Motion */}
            <AnimatePresence>
                {confirmDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            variants={overlayVariants} initial="hidden" animate="visible" exit="hidden"
                            onClick={() => setConfirmDelete(null)}
                            className="absolute inset-0 bg-black/30"
                        />
                        <motion.div
                            variants={alertVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="w-[270px] rounded-2xl overflow-hidden relative z-10"
                            style={{
                                background: isDark ? 'rgba(44, 44, 46, 0.85)' : 'rgba(255, 255, 255, 0.75)',
                                backdropFilter: 'saturate(180%) blur(40px)',
                                WebkitBackdropFilter: 'saturate(180%) blur(40px)',
                                boxShadow: '0 8px 40px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div className="p-4 text-center">
                                <h3 className="text-[17px] font-semibold mb-1">Hapus Chat?</h3>
                                <p className="text-[13px] text-[#8e8e93]">Chat ini akan dihapus permanen.</p>
                            </div>
                            <div style={{ borderTop: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                                <motion.button whileTap={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                    onClick={confirmDeleteSession}
                                    className="w-full py-3 text-[17px] font-medium text-[#ff3b30]"
                                    style={{ borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}
                                >Hapus</motion.button>
                                <motion.button whileTap={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                    onClick={() => setConfirmDelete(null)}
                                    className="w-full py-3 text-[17px] font-semibold text-[#007AFF]"
                                >Batal</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default App
