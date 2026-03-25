import { motion } from "framer-motion";
import { Reveal } from "./shared";

export function MultilingualSupport() {
  const languages = ["English", "Hindi", "\u092E\u0930\u093E\u0920\u0940", "\u092C\u093E\u0902\u0917\u094D\u0932\u093E", "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD", "\u0C95\u0CA8\u0CCD\u0ca8\u0ca1", "\u0A97\u0AC1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0"];

  return (
    <section id="multilingual" className="py-32 bg-[#f8f5f0] relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_100%_100%,rgba(212,175,55,0.02),transparent)]" />
      
      <div className="max-w-7xl mx-auto px-8 relative z-10 flex flex-col md:flex-row items-center gap-20">
        <Reveal className="flex-1">
          <div className="flex flex-col gap-6">
            <span className="text-primary font-mono text-[10px] font-black uppercase tracking-[0.5em] opacity-60">
              Native Heritage
            </span>
            <h2 className="text-4xl md:text-6xl font-serif font-black text-navy leading-tight">
              The Many Voices <br />of <span className="text-primary italic">Bharat</span>
            </h2>
            <p className="text-xl text-navy/40 font-serif italic leading-relaxed max-w-lg border-l-4 border-gold/10 pl-8 mt-4">
              BoothIQ is natively localized for every dialect and script. Empower your grassroots deployment in the mother tongue of the electorate.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              {languages.map((lang, i) => (
                <motion.div
                  key={lang}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * i, duration: 0.5 }}
                  whileHover={{ scale: 1.1, borderColor: "rgba(212,175,55,1)", boxShadow: "0 0 15px rgba(212,175,55,0.1)" }}
                  className="px-6 py-2 bg-gold/5 border border-gold/10 rounded-xl text-[10px] font-mono font-black text-navy uppercase tracking-widest transition-all duration-300 cursor-default"
                >
                  {lang}
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal direction="right" className="flex-1 flex justify-center relative">
          <div className="relative w-full max-w-md aspect-square opacity-60">
            {/* India Map Visualization (Abstract) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent)] blur-3xl animate-pulse" />
            <img
              alt="Strategic Territorial Matrix"
              className="w-full h-full object-contain filter invert opacity-20 drop-shadow-[0_0_30px_rgba(212,175,55,0.3)] saturate-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2JMRNjj0sVGQ8GC3cq1NZEz35Vneqgi9XJfz4Z9jmc87Qw3wMCQm6uoj7HynojGZHVtxoo4k6QxvAob-gBifwoV7RYggzS7QtRkW9w7bPz79DAVOuTgdBbLTR6uZoa_OoFmLnGadnL_3VfmOu6YyPdXz0bU-3fQ9wqxCjcP6DENn0MgF2evk2e4BVZPmm5eaXtk2VWJG0F9AsMwtVqDYJwHF61mGuRHXm_XXKHZBwX8o6DXCg8Sd2GtTFu2vV2ua4gET6YbwBOg"
            />
            {[
              { text: "\u0928\u092E\u0938\u094D\u0924\u0947", top: "25%", left: "25%" },
              { text: "\u0C28\u0C2E\u0C38\u0C4D\u0C15\u0C3E\u0C30\u0C02", top: "50%", left: "55%" },
              { text: "\u0BB5\u0BA3\u0B95\u0BCD\u0B95\u0BAE\u0BCD", top: "75%", left: "30%" },
              { text: "\u09A8\u09AE\u09B8\u09CD\u0995\u09BE\u09B0", top: "35%", right: "15%" },
            ].map((tag, i) => (
              <motion.div
                key={tag.text}
                className="absolute bg-white/90 backdrop-blur-xl px-4 py-2 rounded-xl text-xs text-primary border border-primary/20 font-serif font-black italic shadow-2xl"
                style={{ top: tag.top, left: tag.left, right: tag.right }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              >
                {tag.text}
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
