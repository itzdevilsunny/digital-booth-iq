import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Icon } from "./shared";

export function Hero() {
  const heroRef = useRef(null);
  const [glitch, setGlitch] = useState(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  useEffect(() => {
    const timer = setInterval(() => setGlitch(prev => !prev), 3000);
    return () => clearInterval(timer);
  }, []);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.header
      ref={heroRef}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#0c0c0c] pt-20"
      style={{ opacity: heroOpacity }}
    >
      {/* Stunning Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-white/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        className="absolute inset-0 z-0 opacity-10 bg-cover bg-center grayscale mix-blend-overlay scale-110"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')`,
          y: heroY,
          scale: heroScale
        }}
      />
      
      {/* Dynamic Digital Grid */}
      <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)', backgroundSize: '32px 32px' }} 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-8 text-center flex flex-col items-center gap-12">
        {/* Status Chip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-3xl shadow-2xl"
        >
          <div className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500 shadow-[0_0_10px_#10b981]" />
          </div>
          <span className="text-[10px] font-bold text-white uppercase tracking-[4px] antialiased">
            Intelligence Matrix Active
          </span>
        </motion.div>

        {/* Massive Headline */}
        <div className="flex flex-col gap-6">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-7xl md:text-9xl font-black leading-[0.85] tracking-tighter"
          >
            <span className="text-white block uppercase">Analyze.</span>
            <span className="text-white/20 block uppercase">Strategize.</span>
            <motion.span
              animate={glitch ? { skew: [0, -2, 2, 0], opacity: [1, 0.9, 1] } : {}}
              className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 italic inline-block drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              RESOLVE.
            </motion.span>
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-2xl text-lg md:text-xl text-white/40 font-medium leading-relaxed uppercase tracking-tight"
        >
          BoothIQ is the high-fidelity governance operating system for the modern representative. 
          Real-time intelligence, automated grievance management, and sector control at your fingertips.
        </motion.p>

        {/* Premium Action Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-10"
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 60px rgba(16,185,129,0.15)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => scrollTo("cta")}
            className="h-18 px-12 rounded-[2rem] bg-emerald-600 text-white text-xs font-bold uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10">Initialize Portal</span>
            <Icon name="arrow_forward" className="relative z-10 group-hover:translate-x-2 transition-transform duration-500 text-lg" />
          </motion.button>

          <motion.button
            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => scrollTo("capabilities")}
            className="h-18 px-12 rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-xl text-white text-xs font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 group"
          >
            <div className="size-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
              <Icon name="play_arrow" className="text-lg" />
            </div>
            Tactical Briefing
          </motion.button>
        </motion.div>
      </div>

      {/* Modern Scroll Vector */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 cursor-pointer opacity-30 hover:opacity-100 transition-opacity"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        onClick={() => scrollTo("problem")}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/20">
          Sync Stream
        </span>
        <div className="relative w-px h-16 bg-gradient-to-b from-emerald-500 to-transparent">
            <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-0 -left-1 size-2 rounded-full bg-emerald-400 blur-[2px]"
            />
        </div>
      </motion.div>
    </motion.header>
  );
}

