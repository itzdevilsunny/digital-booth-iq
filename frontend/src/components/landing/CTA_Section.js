import { motion } from "framer-motion";
import { Reveal, Icon } from "./shared";
import { useNavigate } from "react-router-dom";

export function CTA_Section() {
  const navigate = useNavigate();
  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Cinematic Testimonial */}
      <section className="py-32 bg-[#0c0c0c] relative border-y border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent)] pointer-events-none" />
        <Reveal>
          <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
            <Icon name="format_quote" size={60} className="text-emerald-500/20 mx-auto mb-8" />
            <h3 className="text-2xl md:text-4xl font-display text-white font-medium italic leading-relaxed mb-12 uppercase tracking-tight">
              "BoothIQ gave us the granularity we needed. We flipped 45 critical
              booths by identifying scheme beneficiaries who were undecided. It
              wasn&apos;t just data; it was a roadmap to victory."
            </h3>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">
                Strategic Campaign Manager
              </span>
              <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest opacity-60">
                Major State Assembly, 2024
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Deployment CTA */}
      <section
        id="cta"
        className="py-40 bg-[#0c0c0c] relative overflow-hidden"
      >
        {/* Background Depth */}
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <Reveal>
          <div className="max-w-5xl mx-auto px-8 text-center relative z-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm mb-10"
            >
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-[0.4em]">Authorized Deployment Only</span>
            </motion.div>
            
            <h2 className="text-5xl md:text-7xl font-display font-black text-white mb-8 tracking-tight uppercase">
              Dominate the Ground.
            </h2>
            <p className="text-lg md:text-xl text-white/40 font-display italic mb-12 max-w-2xl mx-auto leading-relaxed uppercase tracking-tight">
              Secure your constituency&apos;s data today. Access is strictly limited to
              authorized campaign managers and validated strategic representatives.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(16,185,129,0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/select-role")}
                className="h-16 px-12 rounded-[2rem] bg-emerald-600 text-white text-xs font-bold uppercase tracking-[0.3em] shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-4 group border border-white/5"
              >
                Request Deployment
                <Icon name="shuttle_dispatch" size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo("capabilities")}
                className="h-16 px-12 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl text-white text-xs font-bold uppercase tracking-[0.3em] transition-all"
              >
                Watch Operations
              </motion.button>
            </div>
            
            <p className="mt-12 text-[9px] text-white/20 font-bold uppercase tracking-[0.5em]">
              Strictly Confidential &bull; End-to-End Encryption &bull; Strategic Sovereignty
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}

