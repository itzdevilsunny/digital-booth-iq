import { motion } from "framer-motion";
import { Reveal } from "./shared";

export function MultilingualSupport() {
  const languages = ["English", "Hindi", "मराठी", "বাংলা", "తెలుగు", "தமிழ்", "ಕನ್ನಡ", "ગુજરાતી"];

  return (
    <section id="multilingual" className="py-32 bg-[#0c0c0c] relative overflow-hidden border-y border-white/5">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.02),transparent)]" />
      
      <div className="max-w-7xl mx-auto px-8 relative z-10 flex flex-col md:flex-row items-center gap-20">
        <Reveal className="flex-1">
          <div className="flex flex-col gap-6">
            <span className="text-emerald-500 font-bold text-[10px] font-mono uppercase tracking-[0.5em] opacity-60">
              Native Heritage
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-black text-white leading-tight uppercase tracking-tight">
              The Many Voices <br />of <span className="text-emerald-500 italic lowercase">bharat</span>
            </h2>
            <p className="text-xl text-white/40 font-display italic leading-relaxed max-w-lg border-l-4 border-white/5 pl-8 mt-4 uppercase tracking-tight">
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
                  whileHover={{ scale: 1.1, borderColor: "rgba(16,185,129,1)", boxShadow: "0 0 15px rgba(16,185,129,0.1)", backgroundColor: "rgba(16,185,129,0.05)" }}
                  className="px-6 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-white/60 uppercase tracking-widest transition-all duration-300 cursor-default"
                >
                  {lang}
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal direction="right" className="flex-1 flex justify-center relative">
          <div className="relative w-full max-w-md aspect-square">
            {/* India Map Visualization (Abstract) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent)] blur-3xl animate-pulse" />
            <img
              alt="Strategic Territorial Matrix"
              className="w-full h-full object-contain filter invert opacity-10 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)] saturate-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2JMRNjj0sVGQ8GC3cq1NZEz35Vneqgi9XJfz4Z9jmc87Qw3wMCQm6uoj7HynojGZHVtxoo4k6QxvAob-gBifwoV7RYggzS7QtRkW9w7bPz79DAVOuTgdBbLTR6uZoa_OoFmLnGadnL_3VfmOu6YyPdXz0bU-3fQ9wqxCjcP6DENn0MgF2evk2e4BVZPmm5eaXtk2VWJG0F9AsMwtVqDYJwHF61mGuRHXm_XXKHZBwX8o6DXCg8Sd2GtTFu2vV2ua4gET6YbwBOg"
            />
            {[
              { text: "नमस्ते", top: "25%", left: "25%" },
              { text: "నమస్కారం", top: "50%", left: "55%" },
              { text: "வணக்கம்", top: "75%", left: "30%" },
              { text: "নমস্কার", top: "35%", right: "15%" },
            ].map((tag, i) => (
              <motion.div
                key={tag.text}
                className="absolute bg-[#141414]/90 backdrop-blur-xl px-4 py-2 rounded-xl text-xs text-white border border-white/5 font-display font-black italic shadow-2xl uppercase tracking-wider"
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

