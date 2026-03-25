import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Icon } from "./shared";

export function Hero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      ref={heroRef}
      className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-[var(--background-dark)]"
      style={{ opacity: heroOpacity }}
    >
      <motion.div
        className="absolute inset-0 z-0 opacity-25 bg-cover bg-center mix-blend-screen"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')`,
          y: heroY,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background-dark)]/80 via-transparent to-[var(--background-dark)] z-0" />

      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[var(--primary)]/40"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 backdrop-blur-sm"
        >
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-green-400" />
          </span>
          <span className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest">
            Live Election Data Stream
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold leading-[1.08]"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/70">
            Every Voter.
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/70">
            Every Street.
          </span>
          <br />
          <motion.span
            className="text-[var(--primary)] italic inline-block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
          >
            Connected.
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="max-w-2xl text-lg md:text-xl text-[var(--cream)]/80 font-body leading-relaxed"
        >
          The premium AI-driven political intelligence platform for Indian
          democracy. Gain the winning edge with hyper-local data, predictive
          modeling, and real-time booth management.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-4"
        >
          <motion.div
            whileHover={{
              scale: 1.06,
              boxShadow: "0 0 35px rgba(232,118,26,0.5)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollTo("cta")}
            className="inline-flex h-14 px-8 rounded bg-[var(--saffron)] text-white text-base font-bold tracking-wide shadow-[0_0_20px_rgba(232,118,26,0.4)] transition-all duration-300 items-center justify-center gap-2 group cursor-pointer"
          >
            Start Your Campaign
            <Icon
              name="arrow_forward"
              className="group-hover:translate-x-1.5 transition-transform duration-300 text-lg"
            />
          </motion.div>
          <motion.button
            whileHover={{
              scale: 1.06,
              borderColor: "rgba(201,167,74,0.8)",
              backgroundColor: "rgba(201,167,74,0.1)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollTo("capabilities")}
            className="h-14 px-8 rounded border border-[var(--primary)]/40 bg-transparent text-[var(--primary)] text-base font-bold tracking-wide transition-all duration-300 flex items-center gap-2"
          >
            <Icon name="play_circle" className="text-lg" />
            Watch Intelligence Briefing
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 cursor-pointer"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        onClick={() => scrollTo("problem")}
      >
        <span className="text-[10px] text-[var(--primary)]/60 font-mono uppercase tracking-widest">
          Scroll
        </span>
        <Icon name="keyboard_arrow_down" className="text-[var(--primary)]/60 text-2xl" />
      </motion.div>
    </motion.header>
  );
}
