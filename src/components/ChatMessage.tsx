import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Copy, TickCircle } from "iconsax-react";
import { Button } from "./ui/button";
import MessageContent from "./MessageContent";

interface ChatMessageProps {
  id: string;
  content: string;
  role: "user" | "assistant";
  isTyping?: boolean;
  isAnimated?: boolean;
  onAnimationComplete?: (id: string) => void;
}

const ChatMessage = ({ id, content, role, isTyping, isAnimated, onAnimationComplete }: ChatMessageProps) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (messageRef.current && role === "assistant" && !isTyping) {
      gsap.fromTo(
        messageRef.current,
        {
          opacity: 0,
          y: 20,
          scale: 0.98
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "power3.out"
        }
      );
    }
  }, [role, isTyping]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === "user";

  return (
    <motion.div
      ref={messageRef}
      initial={isUser ? { opacity: 0, y: 10 } : false}
      animate={isUser ? { opacity: 1, y: 0 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] md:max-w-[75%]`}>
        <div
          className={`relative rounded-2xl px-4 py-3 ${isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card shadow-soft border border-border rounded-bl-md"
            }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1 py-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-muted-foreground/50"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
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
        </div>

        {/* Copy button for assistant messages - below bubble */}
        {!isUser && !isTyping && (
          <div className="mt-1 ml-1">
            {/* Copy logic is handled inside MessageContent's code blocks often, but for the whole message: */}
            {/* Optional: Add message action buttons here if needed */}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
