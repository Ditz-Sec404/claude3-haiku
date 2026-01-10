import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, X } from "lucide-react";
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

    useEffect(() => {
        if (isOpen && chat) {
            setVisible(true);
            requestAnimationFrame(() => setAnimating(true));
        } else {
            setAnimating(false);
            const timer = setTimeout(() => setVisible(false), 150);
            return () => clearTimeout(timer);
        }
    }, [isOpen, chat]);

    const handleCopy = async () => {
        if (!chat) return;
        try {
            const url = generateShareUrl(chat);
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Link disalin!");
            setTimeout(() => {
                setCopied(false);
                onClose();
            }, 1000);
        } catch {
            toast.error("Gagal menyalin");
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

            {/* Dialog - Compact */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: animating ? 1 : 0, scale: animating ? 1 : 0.9, y: animating ? 0 : 10 }}
                transition={{ duration: 0.15 }}
                className="relative z-10"
            >
                <div className="bg-card rounded-2xl shadow-strong border border-border p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate max-w-[200px]">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">{chat.messages.length} pesan</p>
                    </div>

                    <Button
                        variant={copied ? "default" : "outline"}
                        size="sm"
                        onClick={handleCopy}
                        className={cn(
                            "gap-2 transition-all",
                            copied && "bg-green-500 hover:bg-green-500"
                        )}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "Disalin!" : "Salin Link"}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onClose}
                        className="text-muted-foreground"
                    >
                        <X size={18} />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default ShareDialog;
