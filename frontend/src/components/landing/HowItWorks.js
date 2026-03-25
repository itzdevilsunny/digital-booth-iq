import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function HowItWorks() {
  const steps = [
    { icon: "upload_file", step: "01. Intake", title: "Data Ingestion", desc: "Securely upload raw voter lists, legacy PDFs, and historic election datasets into the intelligence matrix." },
    { icon: "diversity_3", step: "02. Analysis", title: "Neural Cleansing", desc: "Proprietary AI protocols eliminate redundancy and segment the electorate via multi-dimensional parameters." },
    { icon: "campaign", step: "03. Strategy", title: "Tactical Planning", desc: "Generate high-precision campaign vectors and optimized route mapping for specialized ground units." },
    { icon: "how_to_reg", step: "04. Victory", title: "Live Conversion", desc: "Execute real-time conversion tracking on Polling Day. Secure the booth through absolute data dominance." },
  ];

  return (
    <section id="how-it-works" className="py-32 bg-[#f8f5f0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <Reveal>
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-serif font-black text-navy mb-6">
              Precision Pipeline
            </h2>
            <p className="text-navy/40 font-serif italic text-lg max-w-2xl mx-auto">
              Deployment of the BoothIQ intelligence architecture is optimized for rapid battlefield operationalization.
            </p>
          </div>
        </Reveal>

        <StaggerContainer className="grid md:grid-cols-4 gap-12 relative">
          {/* Connecting Line */}
          <motion.div
            className="hidden md:block absolute top-[60px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {steps.map((item, i) => (
            <motion.div key={item.step} variants={staggerChild} className="flex flex-col items-center text-center group">
              <motion.div
                whileHover={{ scale: 1.1, borderColor: "rgba(201,168,76,1)", boxShadow: "0 0 30px rgba(201,168,76,0.2)" }}
                className="size-28 rounded-full bg-gold/5 backdrop-blur-xl border border-gold/20 flex items-center justify-center mb-8 transition-all duration-500 relative z-10"
              >
                <Icon name={item.icon} className="text-4xl text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                   <span className="text-[10px] font-mono font-black text-white">{i+1}</span>
                </div>
              </motion.div>
              
              <div className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.3em] mb-3 opacity-60">
                {item.step}
              </div>
              <h4 className="text-navy font-serif font-bold mb-3 text-xl group-hover:text-primary transition-colors">{item.title}</h4>
              <p className="text-[11px] text-navy/30 font-serif leading-relaxed italic">{item.desc}</p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
