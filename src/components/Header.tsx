import { Add } from "iconsax-react";
import { PanelLeftOpen } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  onMenuClick: () => void;
  showSidebar: boolean;
  onNewChat: () => void;
}

const Header = ({ onMenuClick, showSidebar, onNewChat }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center gap-3">
        {!showSidebar && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMenuClick}
            className="text-muted-foreground hover:text-foreground"
          >
            <PanelLeftOpen size={20} />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNewChat}
          className="text-muted-foreground hover:text-foreground"
        >
          <Add size={20} variant="Linear" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
