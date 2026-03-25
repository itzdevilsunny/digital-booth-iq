import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-[var(--background-dark)]">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              From Chaos to Clarity
            </h2>
            <p className="text-[var(--cream)]/70">
              Deploying BoothIQ takes days, not months.
            </p>
          </div>
        </Reveal>

        <StaggerContainer className="grid md:grid-cols-4 gap-8 relative">
          <motion.div
            className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3 }}
          />

          {[
            { icon: "upload_file", step: "1. Import", desc: "Upload your raw voter lists, PDFs, and previous election data securely." },
            { icon: "diversity_3", step: "2. Segment", desc: "AI automatically cleans duplicates and segments voters by caste, age, and loyalty." },
            { icon: "campaign", step: "3. Create", desc: "Generate targeted campaigns and route maps for your ground workers." },
            { icon: "how_to_reg", step: "4. Deliver", desc: "Track conversion in real-time on polling day. Win the booth." },
          ].map((item) => (
            <motion.div key={item.step} variants={staggerChild} className="flex flex-col items-center text-center group">
              <motion.div
                whileHover={{ scale: 1.12, borderColor: "rgba(201,167,74,0.9)", boxShadow: "0 0 25px rgba(201,167,74,0.3)" }}
                className="w-24 h-24 rounded-full bg-[#1a1a22] border-2 border-[var(--primary)]/30 flex items-center justify-center mb-6 transition-all duration-300 relative z-10"
              >
                <Icon name={item.icon} className="text-4xl text-[var(--primary)]" />
              </motion.div>
              <h4 className="text-white font-bold mb-2 text-lg">{item.step}</h4>
              <p className="text-sm text-[var(--cream)]/60">{item.desc}</p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
