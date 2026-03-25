import { motion } from "framer-motion";
import { Reveal } from "./shared";

export function CTA_Section() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Testimonial */}
      <section className="py-28 bg-[var(--background-dark)]">
        <Reveal>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span className="text-7xl text-[var(--primary)]/30 font-serif leading-none block">
              &ldquo;
            </span>
            <h3 className="text-2xl md:text-3xl font-serif text-white font-medium italic leading-relaxed -mt-8 mb-8">
              BoothIQ gave us the granularity we needed. We flipped 45 critical
              booths by identifying scheme beneficiaries who were undecided. It
              wasn&apos;t just data; it was a roadmap to victory.
            </h3>
            <div className="flex flex-col items-center gap-1">
              <span className="font-bold text-white tracking-wide uppercase text-sm">
                Campaign Manager
              </span>
              <span className="text-[var(--saffron)] text-xs font-mono">
                Major State Election, 2024
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Hero-like CTA */}
      <section
        id="cta"
        className="py-28 bg-gradient-to-r from-[var(--saffron)]/20 via-[#0e0e14] to-[var(--background-dark)] border-y border-[var(--saffron)]/20 relative overflow-hidden"
      >
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[var(--saffron)]/10 blur-[100px]" />

        <Reveal>
          <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
              Ready to dominate the ground?
            </h2>
            <p className="text-lg text-[var(--cream)]/80 mb-10 max-w-2xl mx-auto">
              Secure your constituency&apos;s data today. Access is limited to
              authorized campaign managers and representatives.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(232,118,26,0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo("capabilities")}
                className="inline-flex items-center justify-center h-14 px-10 rounded bg-[var(--saffron)] text-white text-lg font-bold tracking-wide shadow-[0_0_25px_rgba(232,118,26,0.4)] transition-all duration-300 cursor-pointer"
              >
                Request Access
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.06, borderColor: "rgba(255,255,255,0.5)", backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.95 }}
                className="h-14 px-10 rounded border border-white/20 bg-transparent text-white text-lg font-bold tracking-wide transition-all duration-300"
              >
                View Demo Video
              </motion.button>
            </div>
            <p className="mt-6 text-xs text-[var(--cream)]/50 font-mono">
              Strictly confidential. Verified political entities only.
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
