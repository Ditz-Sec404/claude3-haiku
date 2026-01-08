import { useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div
        className={cn(
          "relative rounded-2xl border transition-all duration-150",
          isFocused
            ? "border-primary/30 shadow-medium bg-card"
            : "border-border shadow-soft bg-card/80"
        )}
      >
        <div className="flex items-end gap-2 p-3">
          {/* Text input */}
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ketik pesan..."
              disabled={disabled}
              rows={1}
              className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-muted-foreground scrollbar-thin max-h-[200px]"
            />
          </div>

          {/* Send button */}
          <div className="flex gap-1 pb-1">
            <Button
              variant="chat"
              size="icon-sm"
              onClick={handleSubmit}
              disabled={!message.trim() || disabled}
              className="disabled:opacity-30"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <p className="text-xs text-center text-muted-foreground mt-3">
        Claude bisa membuat kesalahan. Harap periksa kembali jawabannya.
      </p>
    </div>
  );
};

export default ChatInput;
