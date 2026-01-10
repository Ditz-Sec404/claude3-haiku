import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Add,
  Message,
  Setting2,
  Clock,
  Star1,
  Trash
} from "iconsax-react";
import { Trash2, PanelLeftClose, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import SettingsDialog from "./SettingsDialog";
import { CodeThemeKey } from "./MessageContent";

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  starred?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chatHistory: ChatHistory[];
  activeChat: string | null;
  onChatSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onClearAll: () => void;
  customInstruction: string;
  setCustomInstruction: (val: string) => void;
  jailbreakMode: boolean;
  setJailbreakMode: (val: boolean) => void;
  codeTheme: CodeThemeKey;
  setCodeTheme: (val: CodeThemeKey) => void;
  onShareChat: () => void;
}

const Sidebar = ({
  isOpen,
  onToggle,
  chatHistory,
  activeChat,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onClearAll,
  customInstruction,
  setCustomInstruction,
  jailbreakMode,
  setJailbreakMode,
  codeTheme,
  setCodeTheme,
  onShareChat
}: SidebarProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "h-screen bg-sidebar border-r border-sidebar-border flex-shrink-0",
          "transition-all duration-200 ease-out",
          "fixed lg:relative z-[60]",
          isOpen
            ? "w-[280px] translate-x-0"
            : "w-[280px] -translate-x-full lg:w-0 lg:translate-x-0 lg:border-0 lg:overflow-hidden"
        )}
      >
        <div className="flex flex-col h-full p-4 w-[280px]">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-sidebar-border">
            <h2 className="text-base font-semibold text-sidebar-foreground">
              Claude 3 Haiku
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary"
            >
              <PanelLeftClose size={18} />
            </Button>
          </div>

          {/* New Chat Button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 mb-4 border-sidebar-border hover:bg-sidebar-accent"
            onClick={onNewChat}
          >
            <Add size={18} variant="Linear" />
            <span>Chat Baru</span>
          </Button>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2 mb-2 flex items-center gap-2">
                <Clock size={14} variant="Linear" />
                Terbaru
              </p>
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors duration-100 cursor-pointer",
                    "hover:bg-sidebar-accent group",
                    activeChat === chat.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground"
                  )}
                >
                  <Message size={16} variant="Linear" className="flex-shrink-0" />
                  <span className="truncate flex-1">{chat.title}</span>
                  {chat.starred && (
                    <Star1 size={14} variant="Bold" className="text-primary flex-shrink-0" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash size={14} variant="Linear" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer with gradient fade at top */}
          <div className="relative pt-4 mt-4 space-y-1">
            {/* Gradient fade overlay */}
            <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-sidebar to-transparent pointer-events-none" />

            <div className="border-t border-sidebar-border pt-4 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={onShareChat}
                disabled={!activeChat}
              >
                <Share2 size={18} />
                <span>Bagikan Chat</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setSettingsOpen(true)}
              >
                <Setting2 size={18} variant="Linear" />
                <span>Pengaturan</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmClearAll(true)}
              >
                <Trash2 size={18} />
                <span>Hapus Semua Chat</span>
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        customInstruction={customInstruction}
        setCustomInstruction={setCustomInstruction}
        jailbreakMode={jailbreakMode}
        setJailbreakMode={setJailbreakMode}
        codeTheme={codeTheme}
        setCodeTheme={setCodeTheme}
      />

      {/* Confirm Clear All Dialog */}
      <AnimatePresence>
        {confirmClearAll && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setConfirmClearAll(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="relative z-10 bg-card rounded-2xl shadow-strong border border-border p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Hapus semua chat?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ini akan menghapus semua riwayat percakapan Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setConfirmClearAll(false)}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => { onClearAll(); setConfirmClearAll(false); }}
                >
                  Hapus Semua
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
