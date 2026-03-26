import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "./shared";
import { Zap, ShieldCheck } from "lucide-react";

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
          ? "py-4 bg-[#0c0c0c]/80 backdrop-blur-3xl border-b border-white/5 shadow-2xl"
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
          <div className="size-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:bg-white group-hover:text-black transition-all">
            <Zap size={22} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-white text-2xl font-black leading-none tracking-tighter group-hover:text-emerald-400 transition-colors">
              BoothIQ
            </h2>
            <span className="text-[9px] text-stone-500 font-bold uppercase tracking-[0.4em]">
              Intelligence Hub
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
              className="text-[10px] font-bold uppercase tracking-[3px] text-stone-500 hover:text-white transition-all duration-300 relative group"
            >
              {item.label}
              <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
          <div className="w-px h-5 bg-white/10 mx-2" />
          <button
            onClick={() => navigate("/select-role")}
            className="text-[10px] font-bold uppercase tracking-[3px] text-emerald-500 hover:text-white transition-colors antialiased"
          >
            System Access
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-8">
          <motion.button
            whileHover={{ x: -2 }}
            onClick={() => navigate("/select-role")}
            className="hidden md:block text-[10px] font-bold uppercase tracking-[3px] text-stone-500 hover:text-white transition-colors"
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
            className="px-8 py-4 rounded-[2rem] bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-[3px] shadow-2xl transition-all cursor-pointer relative overflow-hidden group"
          >
             <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
             <span className="relative z-10">Initialize Portal</span>
          </motion.button>

          {/* Mobile Access */}
          <button onClick={() => navigate("/select-role")} className="lg:hidden size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-emerald-600 transition-all">
            <ShieldCheck size={22} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
