import { useState, useEffect } from "react";
import { Moon, Sun, Zap } from "lucide-react";
import { CloseCircle, Setting2, MagicStar } from "iconsax-react";
import { Button } from "./ui/button";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customInstruction: string;
  setCustomInstruction: (val: string) => void;
  jailbreakMode: boolean;
  setJailbreakMode: (val: boolean) => void;
}

const SettingsDialog = ({
  isOpen,
  onClose,
  customInstruction,
  setCustomInstruction,
  jailbreakMode,
  setJailbreakMode
}: SettingsDialogProps) => {
  const { theme, setTheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-150",
          animating ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md transition-all duration-150",
          animating ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      >
        <div className="bg-card rounded-2xl shadow-strong border border-border p-6 max-h-[85vh] overflow-y-auto scrollbar-thin">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Setting2 size={24} variant="Linear" className="text-primary" />
              <h2 className="text-xl font-semibold">Pengaturan</h2>
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

          <div className="space-y-6">
            {/* Jailbreak Mode Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-yellow-500" />
                <h3 className="text-sm font-medium text-muted-foreground">Mode Jailbreak</h3>
              </div>
              <button
                onClick={() => setJailbreakMode(!jailbreakMode)}
                className={cn(
                  "w-full flex items-center justify-between py-4 px-4 rounded-xl border-2 transition-all duration-150",
                  jailbreakMode
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-border hover:border-yellow-500/50"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className={cn(
                    "font-medium",
                    jailbreakMode ? "text-yellow-500" : "text-foreground"
                  )}>
                    {jailbreakMode ? "Aktif" : "Nonaktif"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {jailbreakMode
                      ? "Menggunakan GPT Turbo (tanpa filter)"
                      : "Menggunakan Claude 3 Haiku (default)"}
                  </span>
                </div>
                <div className={cn(
                  "w-12 h-7 rounded-full transition-colors duration-150 relative",
                  jailbreakMode ? "bg-yellow-500" : "bg-muted"
                )}>
                  <div className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-150",
                    jailbreakMode ? "right-1" : "left-1"
                  )} />
                </div>
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                Mode Jailbreak menggunakan model GPT alternatif yang lebih bebas tanpa batasan.
              </p>
            </div>

            {/* Theme Section */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Tampilan</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-colors duration-150",
                    theme === "light"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sun size={20} />
                  <span className="font-medium">Terang</span>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-colors duration-150",
                    theme === "dark"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Moon size={20} />
                  <span className="font-medium">Gelap</span>
                </button>
              </div>
              <button
                onClick={() => setTheme("system")}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-colors duration-150",
                  theme === "system"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="font-medium">Ikuti sistem</span>
              </button>
            </div>

            {/* Custom Instructions Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MagicStar size={18} variant="Linear" className="text-primary" />
                <h3 className="text-sm font-medium text-muted-foreground">Instruksi Kustom</h3>
              </div>
              <textarea
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Contoh: Jawab dalam format Markdown, berikan contoh kode, gunakan bahasa formal..."
                className="w-full h-32 px-4 py-3 rounded-xl border border-border bg-input/50 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none text-sm transition-colors placeholder:text-muted-foreground/50"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Instruksi ini akan ditambahkan ke setiap pesan yang Anda kirim ke Claude.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
