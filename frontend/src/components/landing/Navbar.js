import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "./shared";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      className={`fixed top-0 z-[100] w-full transition-all duration-700 ${
        scrolled
          ? "py-3 bg-[#f8f5f0]/80 backdrop-blur-2xl border-b border-gold/10 shadow-lg"
          : "py-6 bg-transparent border-b border-transparent"
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
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all">
            <Icon name="how_to_vote" size={24} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-navy text-2xl font-serif font-black leading-none tracking-tight group-hover:text-primary transition-colors">
              BoothIQ
            </h2>
            <span className="text-[8px] text-primary font-mono font-black uppercase tracking-[0.4em] opacity-60">
              Intelligence Unit
            </span>
          </div>
        </motion.div>

        {/* Tactical Navigation */}
        <div className="hidden lg:flex items-center gap-10">
          {[
            { label: "Capabilities", target: "capabilities" },
            { label: "Operations", target: "how-it-works" },
            { label: "Intelligence", target: "security" },
            { label: "Deployment", target: "cta" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => scrollTo(item.target)}
              className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-navy/60 hover:text-primary transition-all duration-300 relative group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
          <div className="w-px h-4 bg-gold/20 mx-2" />
          <button
            onClick={() => navigate("/dashboard")}
            className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-saffron hover:text-navy transition-colors"
          >
            Citizen Access
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ x: -2 }}
            onClick={() => navigate("/dashboard")}
            className="hidden md:block text-[10px] font-mono font-black uppercase tracking-[0.2em] text-navy/60 hover:text-navy transition-colors"
          >
            Log In
          </motion.button>
          
          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 25px rgba(232,118,26,0.5)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-xl bg-saffron text-white text-[10px] font-mono font-black uppercase tracking-[0.2em] shadow-lg shadow-saffron/20 transition-all cursor-pointer"
          >
            Executive Briefing
          </motion.button>

          {/* Mobile Access */}
          <button onClick={() => navigate("/dashboard")} className="lg:hidden p-2 text-primary hover:text-white transition-colors">
            <Icon name="menu" size={24} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
