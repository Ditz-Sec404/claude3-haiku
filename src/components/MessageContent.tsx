import { useState, useEffect, useRef, useMemo, memo, createContext, useContext } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
    atomOneDark,
    atomOneLight,
    dracula,
    github,
    vs2015,
    monokai,
    nord,
    solarizedDark,
    solarizedLight
} from 'react-syntax-highlighter/dist/esm/styles/hljs'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript'
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css'
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import mermaid from 'mermaid'
import { Copy, TickCircle } from 'iconsax-react'
import { useTheme } from 'next-themes'

// Register ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, ChartTooltip, Legend, Filler)

// Register SyntaxHighlighter languages
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('js', javascript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('ts', typescript)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('sh', bash)

// Code theme options
export const CODE_THEMES = {
    'atom-one': { name: 'Atom One', dark: atomOneDark, light: atomOneLight },
    'dracula': { name: 'Dracula', dark: dracula, light: github },
    'github': { name: 'GitHub', dark: vs2015, light: github },
    'monokai': { name: 'Monokai', dark: monokai, light: atomOneLight },
    'nord': { name: 'Nord', dark: nord, light: atomOneLight },
    'solarized': { name: 'Solarized', dark: solarizedDark, light: solarizedLight },
} as const;

export type CodeThemeKey = keyof typeof CODE_THEMES;

// Context for code theme
const CodeThemeContext = createContext<CodeThemeKey>('atom-one');
export const useCodeTheme = () => useContext(CodeThemeContext);
export const CodeThemeProvider = CodeThemeContext.Provider;

const CopyButton = ({ content }: { content: string }) => {
    const [copied, setCopied] = useState(false)
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    const handleCopy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors ${isDark ? 'hover:bg-white/10 text-muted-foreground hover:text-white' : 'hover:bg-black/5 text-muted-foreground hover:text-black'
                }`}
        >
            {copied ? <TickCircle size={14} variant="Bold" /> : <Copy size={14} variant="Linear" />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    )
}

const MermaidDiagram = ({ code }: { code: string }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const { theme } = useTheme()
    const isDark = theme === 'dark'

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
                    } : undefined,
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

const StreamingText = ({ content, onComplete, onUpdate, components }: { content: string, onComplete?: () => void, onUpdate?: () => void, components: any }) => {
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
                onComplete?.()
                return
            }

            const remaining = fullContent.slice(currentLength.current)
            let jump = 1

            const nextPunctuation = remaining.match(/([.,!?\n])/)
            const nextSpace = remaining.indexOf(' ')

            if (nextPunctuation && nextPunctuation.index !== undefined && nextPunctuation.index < 50) {
                jump = nextPunctuation.index + 1
            } else if (nextSpace !== -1 && nextSpace < 40) {
                jump = nextSpace + 1
            } else {
                jump = Math.min(remaining.length, 15)
            }

            currentLength.current += jump
            setDisplayedContent(fullContent.slice(0, currentLength.current))
            onUpdate?.()

            let delay = 5
            const lastChar = fullContent[currentLength.current - 1]
            if (['.', '!', '?', '\n'].includes(lastChar)) delay = 20
            else if ([','].includes(lastChar)) delay = 10
            else delay = 5

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

interface MessageContentProps {
    content: string
    isAnimated?: boolean
    onAnimationComplete?: () => void
    onStreamUpdate?: () => void
    codeTheme?: CodeThemeKey
}

const MessageContent = memo(({ content, isAnimated, onAnimationComplete, onStreamUpdate, codeTheme = 'atom-one' }: MessageContentProps) => {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    // Get the appropriate style based on theme
    const syntaxTheme = useMemo(() => {
        const themeConfig = CODE_THEMES[codeTheme];
        return isDark ? themeConfig.dark : themeConfig.light;
    }, [codeTheme, isDark]);

    const codeComponents = useMemo(() => ({
        code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            const language = match?.[1] || 'text'

            if (language === 'json-chart') {
                try {
                    const contentStr = String(children).replace(/\n$/, '')
                    const chartData = JSON.parse(contentStr)
                    const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE', '#00C7BE', '#FF2D55']
                    const labels = chartData.data.map((d: any) => d.label)
                    const values = chartData.data.map((d: any) => d.value)

                    const chartOptions = {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 800 },
                        plugins: {
                            legend: {
                                display: chartData.type === 'pie' || chartData.type === 'donut',
                                position: 'bottom' as const,
                                labels: { color: isDark ? '#e5e5e5' : '#333' }
                            }
                        },
                        scales: chartData.type !== 'pie' && chartData.type !== 'donut' ? {
                            x: { grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }, ticks: { color: isDark ? '#888' : '#666' } },
                            y: { grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }, ticks: { color: isDark ? '#888' : '#666' } }
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
                            tension: 0.4
                        }]
                    }

                    const pieData = {
                        labels,
                        datasets: [{
                            data: values,
                            backgroundColor: COLORS.slice(0, values.length),
                            borderWidth: 2,
                            borderColor: isDark ? '#1e1e1e' : '#fff'
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
                } catch {
                    return null
                }
            }

            if (language === 'mermaid') {
                return <MermaidDiagram code={String(children).replace(/\n$/, '')} />
            }

            return isInline ? (
                <code {...props} className={`${className} bg-muted px-1 py-0.5 rounded-md text-sm font-mono`}>{children}</code>
            ) : (
                <div className="my-4 rounded-xl overflow-hidden border border-border bg-muted/30">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border">
                        <span className="text-xs font-mono text-muted-foreground">{language}</span>
                        <CopyButton content={String(children).replace(/\n$/, '')} />
                    </div>
                    <SyntaxHighlighter
                        style={syntaxTheme}
                        language={language}
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
            return <img {...props} className="rounded-xl max-w-full my-3" loading="lazy" alt="Generated content" />
        },
        a({ children, ...props }: any) {
            return <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>
        },
        table({ children, ...props }: any) {
            return (
                <div className="overflow-x-auto my-4 rounded-xl border border-border">
                    <table {...props} className="w-full text-left text-sm border-collapse">
                        {children}
                    </table>
                </div>
            )
        },
        thead({ children, ...props }: any) {
            return <thead {...props} className="bg-muted/50">{children}</thead>
        },
        th({ children, ...props }: any) {
            return <th {...props} className="px-4 py-3 font-semibold whitespace-nowrap border-b border-border">{children}</th>
        },
        td({ children, ...props }: any) {
            return <td {...props} className="px-4 py-3 border-b border-border min-w-[140px]">{children}</td>
        }
    }), [isDark, syntaxTheme])

    if (isAnimated) {
        return (
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                <StreamingText
                    content={content}
                    onComplete={onAnimationComplete}
                    onUpdate={onStreamUpdate}
                    components={codeComponents}
                />
            </div>
        )
    }

    return (
        <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={codeComponents}>
                {content.replace(/<!-- end list -->/g, '')}
            </ReactMarkdown>
        </div>
    )
})

export default MessageContent
