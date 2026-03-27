import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ShieldCheck } from "lucide-react";
import ThemeToggle from "../layout/ThemeToggle";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.nav
      className={`fixed top-0 z-[100] w-full transition-all duration-700 ${
        scrolled
          ? "py-4 bg-background/80 backdrop-blur-3xl border-b border-border shadow-2xl"
          : "py-8 bg-transparent border-b border-transparent"
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
        {/* Logo / Identity */}
        <motion.div
          className="flex items-center gap-4 cursor-pointer group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="size-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 group-hover:bg-primary-foreground group-hover:text-primary transition-all">
            <Zap size={22} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-foreground text-2xl font-black leading-none tracking-tighter group-hover:text-primary transition-colors uppercase">
              BoothIQ
            </h2>
            <span className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-[0.4em]">
              Insights Portal
            </span>
          </div>
        </motion.div>

        {/* Tactical Navigation */}
        <div className="hidden lg:flex items-center gap-12">
          {[
            { label: "Capabilities", target: "capabilities" },
            { label: "Operations", target: "how-it-works" },
            { label: "Intelligence", target: "security" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => scrollTo(item.target)}
              className="text-[10px] font-bold uppercase tracking-[3px] text-muted-foreground/60 hover:text-foreground transition-all duration-300 relative group"
            >
              {item.label}
              <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-2" />
          <button
            onClick={() => navigate("/select-role")}
            className="text-[10px] font-bold uppercase tracking-[3px] text-primary hover:text-foreground transition-colors antialiased shadow-sm"
          >
            System Access
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-6">
          <ThemeToggle className="hidden md:flex border-none bg-transparent hover:bg-muted" />

          <motion.button
            whileHover={{ x: -2 }}
            onClick={() => navigate("/select-role")}
            className="hidden md:block text-[10px] font-bold uppercase tracking-[3px] text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            Portal Login
          </motion.button>
          
          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 60px rgba(16,185,129,0.2)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/select-role")}
            className="px-8 py-4 rounded-[2rem] bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[3px] shadow-2xl transition-all cursor-pointer relative overflow-hidden group border border-primary-foreground/5"
          >
             <div className="absolute inset-0 bg-primary-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
             <span className="relative z-10">Login Now</span>
          </motion.button>

          {/* Mobile Access */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle className="border-none bg-transparent" />
            <button onClick={() => navigate("/select-role")} className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
              <ShieldCheck size={22} />
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

