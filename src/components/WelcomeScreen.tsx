import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import {
  Code1,
  Edit,
  Diagram,
  DocumentText1,
  Magicpen,
  Teacher
} from "iconsax-react";

interface SuggestionCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const WelcomeScreen = ({ onSuggestionClick }: WelcomeScreenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }

    // Update greeting based on local time
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting("Selamat pagi");
      } else if (hour >= 12 && hour < 15) {
        setGreeting("Selamat siang");
      } else if (hour >= 15 && hour < 18) {
        setGreeting("Selamat sore");
      } else {
        setGreeting("Selamat malam");
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const suggestions: SuggestionCard[] = [
    {
      icon: <Code1 size={20} variant="Linear" />,
      title: "Tulis kode",
      description: "Bantu saya membuat komponen React"
    },
    {
      icon: <Edit size={20} variant="Linear" />,
      title: "Edit & perbaiki",
      description: "Tinjau dan tingkatkan tulisan saya"
    },
    {
      icon: <Diagram size={20} variant="Linear" />,
      title: "Analisis data",
      description: "Bantu interpretasi informasi kompleks"
    },
    {
      icon: <DocumentText1 size={20} variant="Linear" />,
      title: "Ringkasan",
      description: "Rangkum dokumen panjang"
    },
    {
      icon: <Magicpen size={20} variant="Linear" />,
      title: "Buat konten",
      description: "Hasilkan tulisan kreatif"
    },
    {
      icon: <Teacher size={20} variant="Linear" />,
      title: "Belajar & jelaskan",
      description: "Pahami konsep yang sulit"
    }
  ];

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center px-4 pb-20 pt-12">
      {/* Claude Logo */}
      <div className="mb-6">
        <img
          src="https://api.deline.web.id/4bMp58QdoQ.png"
          alt="Claude"
          className="w-16 h-16 object-contain"
        />
      </div>

      {/* Title - Realtime Greeting */}
      <h1 className="text-3xl md:text-4xl font-semibold text-center mb-3">
        {greeting}
      </h1>

      {/* Subtitle */}
      <div className="text-center mb-12 max-w-md">
        <p className="text-muted-foreground font-medium">
          Gratis & Tanpa Limit.
        </p>
        <p className="text-muted-foreground text-sm">
          Eksplorasi AI tanpa batas, kapanpun Anda butuh.
        </p>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl w-full">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-card p-4 rounded-2xl bg-card border border-border shadow-soft text-left group hover:shadow-medium hover:border-primary/30 transition-all duration-150"
            onClick={() => onSuggestionClick(suggestion.description)}
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors duration-150">
              {suggestion.icon}
            </div>
            <h3 className="font-medium text-sm mb-1">{suggestion.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {suggestion.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
