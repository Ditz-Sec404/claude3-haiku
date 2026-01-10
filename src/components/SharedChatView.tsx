import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import MessageContent from "./MessageContent";
import { decodeChat, SharedChat } from "@/lib/share";
import { useTheme } from "./ThemeProvider";

const SharedChatView = () => {
    const [searchParams] = useSearchParams();
    const [chat, setChat] = useState<SharedChat | null>(null);
    const [error, setError] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        const data = searchParams.get("data");
        if (data) {
            const decoded = decodeChat(data);
            if (decoded) {
                setChat(decoded);
            } else {
                setError(true);
            }
        } else {
            setError(true);
        }
    }, [searchParams]);

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={32} className="text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Chat Tidak Ditemukan</h1>
                    <p className="text-muted-foreground mb-6">
                        Link yang Anda akses tidak valid atau chat sudah tidak tersedia.
                    </p>
                    <Link to="/">
                        <Button variant="default">
                            <ArrowLeft size={16} className="mr-2" />
                            Kembali ke Beranda
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Memuat...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/">
                        <Button variant="ghost" size="icon-sm">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-semibold truncate">{chat.title}</h1>
                        <p className="text-xs text-muted-foreground">
                            Dibagikan pada {new Date(chat.sharedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            })}
                        </p>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {chat.messages.map((msg, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`max-w-[85%] md:max-w-[75%]`}>
                            <div
                                className={`rounded-2xl px-4 py-3 ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-card shadow-soft border border-border rounded-bl-md"
                                    }`}
                            >
                                {msg.role === "user" ? (
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                ) : (
                                    <MessageContent content={msg.content} />
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-6 mt-8">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        Ini adalah percakapan yang dibagikan. Mulai percakapan baru Anda sendiri!
                    </p>
                    <Link to="/">
                        <Button variant="default">
                            Mulai Chat Baru
                        </Button>
                    </Link>
                </div>
            </footer>
        </div>
    );
};

export default SharedChatView;
