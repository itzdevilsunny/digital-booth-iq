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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      ref={heroRef}
      className="relative w-full min-h-[95vh] flex items-center justify-center overflow-hidden bg-[#f8f5f0] pt-20"
      style={{ opacity: heroOpacity }}
    >
      {/* Cinematic Background */}
      <motion.div
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center grayscale mix-blend-overlay scale-110"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')`,
          y: heroY,
          scale: heroScale
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8f5f0]/95 via-[#f8f5f0]/60 to-[#f8f5f0] z-0" />
      
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 z-[1] opacity-[0.05] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #c9a84c 1px, transparent 0)', backgroundSize: '40px 40px' }} 
      />

      {/* High-Tech Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, i % 2 === 0 ? 2 : 1.5, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 text-center flex flex-col items-center gap-10">
        {/* Technical Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-4 px-6 py-2 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl shadow-[0_0_30px_rgba(212,175,55,0.05)]"
        >
          <div className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75" />
            <span className="relative inline-flex rounded-full size-2.5 bg-saffron" />
          </div>
          <span className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.4em]">
            Strategic Intelligence Stream Active
          </span>
        </motion.div>

        {/* Cinematic Headline */}
        <div className="flex flex-col gap-4">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl lg:text-9xl font-serif font-black leading-[0.95] tracking-tighter"
          >
            <span className="text-navy block">Capture.</span>
            <span className="text-navy block">Optimize.</span>
            <motion.span
              animate={glitch ? { skew: [0, -5, 5, 0], opacity: [1, 0.8, 1] } : {}}
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-saffron to-primary italic inline-block"
            >
              Dominate.
            </motion.span>
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-3xl text-lg md:text-2xl text-navy/40 font-serif leading-relaxed italic"
        >
          Elevating Indian democracy through high-precision AI. BoothIQ delivers hyper-local tactical data, 
          predictive electorate modeling, and real-time field command for the modern campaign.
        </motion.p>

        {/* Global Action Vector */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(212,175,55,0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollTo("cta")}
            className="h-16 px-10 rounded-2xl bg-primary text-white text-xs font-mono font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 group cursor-pointer"
          >
            Initiate Deployment
            <Icon name="arrow_forward" className="group-hover:translate-x-2 transition-transform duration-500 text-lg" />
          </motion.button>

          <motion.button
            whileHover={{ backgroundColor: "rgba(201,168,76,0.05)", borderColor: "rgba(201,168,76,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollTo("capabilities")}
            className="h-16 px-10 rounded-2xl border border-gold/10 bg-transparent text-primary text-xs font-mono font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 group"
          >
            <div className="size-8 rounded-full border border-primary/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Icon name="play_arrow" className="text-lg" />
            </div>
            Tactical Overview
          </motion.button>
        </motion.div>
      </div>

      {/* Environmental Depth */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        onClick={() => scrollTo("problem")}
      >
        <span className="text-[9px] font-mono font-black uppercase tracking-[0.4em] text-primary">
          Explore Matrix
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
      </motion.div>
    </motion.header>
  );
}
