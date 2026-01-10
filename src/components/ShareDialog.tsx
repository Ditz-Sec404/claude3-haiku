import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, Link2 } from "lucide-react";
import { CloseCircle } from "iconsax-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { generateShareUrl, SharedChat } from "@/lib/share";
import { toast } from "sonner";

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    chat: SharedChat | null;
}

const ShareDialog = ({ isOpen, onClose, chat }: ShareDialogProps) => {
    const [visible, setVisible] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState("");

    useEffect(() => {
        if (isOpen && chat) {
            setVisible(true);
            const url = generateShareUrl(chat);
            setShareUrl(url);
            requestAnimationFrame(() => setAnimating(true));
        } else {
            setAnimating(false);
            const timer = setTimeout(() => setVisible(false), 150);
            return () => clearTimeout(timer);
        }
    }, [isOpen, chat]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Link berhasil disalin!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Gagal menyalin link");
        }
    };

    if (!visible || !chat) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                onClick={onClose}
                className={cn(
                    "absolute inset-0 bg-black/50 transition-opacity duration-150",
                    animating ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Dialog */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: animating ? 1 : 0, scale: animating ? 1 : 0.95 }}
                transition={{ duration: 0.15 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-card rounded-2xl shadow-strong border border-border p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Share2 size={24} className="text-primary" />
                            <h2 className="text-xl font-semibold">Bagikan Chat</h2>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <CloseCircle size={20} variant="Linear" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">
                                Bagikan percakapan ini dengan orang lain menggunakan link di bawah:
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                                ⚠️ Siapa saja dengan link ini dapat melihat isi percakapan.
                            </p>
                        </div>

                        {/* Chat Preview */}
                        <div className="bg-muted/50 rounded-xl p-4 border border-border">
                            <p className="font-medium text-sm mb-1 truncate">{chat.title}</p>
                            <p className="text-xs text-muted-foreground">
                                {chat.messages.length} pesan
                            </p>
                        </div>

                        {/* Share URL */}
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-muted/30 rounded-xl border border-border">
                                <Link2 size={16} className="text-muted-foreground flex-shrink-0" />
                                <p className="text-sm truncate text-muted-foreground">{shareUrl}</p>
                            </div>
                            <Button
                                variant="default"
                                size="icon"
                                onClick={handleCopy}
                                className="flex-shrink-0"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={onClose}
                            >
                                Tutup
                            </Button>
                            <Button
                                variant="default"
                                className="flex-1"
                                onClick={handleCopy}
                            >
                                {copied ? "Disalin!" : "Salin Link"}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ShareDialog;
