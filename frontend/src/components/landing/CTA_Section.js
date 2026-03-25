import { motion } from "framer-motion";
import { Reveal, Icon } from "./shared";
import { useNavigate } from "react-router-dom";

export function CTA_Section() {
  const navigate = useNavigate();
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Cinematic Testimonial */}
      <section className="py-32 bg-[#f8f5f0] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.05),transparent)] pointer-events-none" />
        <Reveal>
          <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
            <Icon name="format_quote" size={60} className="text-primary/20 mx-auto mb-8" />
            <h3 className="text-2xl md:text-4xl font-serif text-navy/90 font-medium italic leading-relaxed mb-12">
              "BoothIQ gave us the granularity we needed. We flipped 45 critical
              booths by identifying scheme beneficiaries who were undecided. It
              wasn&apos;t just data; it was a roadmap to victory."
            </h3>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-mono font-black text-navy uppercase tracking-[0.4em]">
                Strategic Campaign Manager
              </span>
              <span className="text-saffron text-[10px] font-mono font-bold uppercase tracking-widest opacity-60">
                Major State Assembly, 2024
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Deployment CTA */}
      <section
        id="cta"
        className="py-40 bg-[#f8f5f0] relative overflow-hidden border-t border-gold/10"
      >
        {/* Background Depth */}
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <Reveal>
          <div className="max-w-5xl mx-auto px-8 text-center relative z-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-saffron/30 bg-saffron/5 backdrop-blur-sm mb-10"
            >
              <span className="text-[9px] font-mono font-black text-saffron uppercase tracking-[0.3em]">Authorized Deployment Only</span>
            </motion.div>
            
            <h2 className="text-5xl md:text-7xl font-serif font-black text-navy mb-8 tracking-tight">
              Dominate the Ground.
            </h2>
            <p className="text-lg md:text-xl text-navy/40 font-serif italic mb-12 max-w-2xl mx-auto leading-relaxed">
              Secure your constituency&apos;s data today. Access is strictly limited to
              authorized campaign managers and validated strategic representatives.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(232,118,26,0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/dashboard")}
                className="h-16 px-12 rounded-2xl bg-saffron text-white text-xs font-mono font-black uppercase tracking-[0.2em] shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-3"
              >
                Request Deployment
                <Icon name="shuttle_dispatch" size={18} />
              </motion.button>
              
              <motion.button
                whileHover={{ backgroundColor: "rgba(201,168,76,0.05)", borderColor: "rgba(201,168,76,0.2)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo("capabilities")}
                className="h-16 px-12 rounded-2xl border border-gold/10 bg-transparent text-navy text-xs font-mono font-black uppercase tracking-[0.2em] transition-all"
              >
                Watch Operations
              </motion.button>
            </div>
            
            <p className="mt-12 text-[9px] text-cream/20 font-mono font-bold uppercase tracking-[0.4em]">
              Strictly Confidential &bull; End-to-End Encryption &bull; Strategic Sovereignty
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
