import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Copy, Refresh, Edit2 } from "iconsax-react";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import MessageContent from "./MessageContent";
import { toast } from "sonner";

interface ChatMessageProps {
  id: string;
  content: string;
  role: "user" | "assistant";
  isTyping?: boolean;
  isAnimated?: boolean;
  isError?: boolean;
  onAnimationComplete?: (id: string) => void;
  onRegenerate?: () => void;
  onEdit?: (id: string, content: string) => void;
  onRetry?: () => void;
}

const ChatMessage = ({
  id,
  content,
  role,
  isTyping,
  isAnimated,
  isError,
  onAnimationComplete,
  onRegenerate,
  onEdit,
  onRetry
}: ChatMessageProps) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  useEffect(() => {
    if (messageRef.current && role === "assistant" && !isTyping) {
      gsap.fromTo(
        messageRef.current,
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [role, isTyping]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    if (isEditing && editContent.trim() !== content) {
      onEdit?.(id, editContent.trim());
      toast.success("Pesan diperbarui");
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const isUser = role === "user";

  return (
    <motion.div
      ref={messageRef}
      initial={isUser ? { opacity: 0, y: 10 } : false}
      animate={isUser ? { opacity: 1, y: 0 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} group`}
    >
      <div className={`max-w-[85%] md:max-w-[75%]`}>
        <div
          className={`relative rounded-2xl px-4 py-3 ${isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : isError
              ? "bg-destructive/10 border border-destructive/50 rounded-bl-md"
              : "bg-card shadow-soft border border-border rounded-bl-md"
            }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1.5 py-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-muted-foreground/60"
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          ) : isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-transparent text-sm leading-relaxed resize-none outline-none min-h-[60px]"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  Batal
                </Button>
                <Button variant="default" size="sm" onClick={handleEdit}>
                  Simpan
                </Button>
              </div>
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <MessageContent
              content={content}
              isAnimated={isAnimated}
              onAnimationComplete={() => onAnimationComplete?.(id)}
            />
          )}

          {/* Error with retry button */}
          {isError && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs text-destructive hover:underline flex items-center gap-1"
            >
              <Refresh size={12} variant="Linear" />
              Coba lagi
            </button>
          )}
        </div>

        {/* Action buttons */}
        {!isTyping && !isEditing && (
          <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? "justify-end mr-1" : "ml-1"}`}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check size={14} /> : <Copy size={14} variant="Linear" />}
            </Button>

            {isUser && onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsEditing(true)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Edit2 size={14} variant="Linear" />
              </Button>
            )}

            {!isUser && onRegenerate && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRegenerate}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Refresh size={14} variant="Linear" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
