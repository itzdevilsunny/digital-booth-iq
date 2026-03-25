import { motion } from "framer-motion";
import { Reveal } from "./shared";

export function MultilingualSupport() {
  return (
    <section id="multilingual" className="py-28 bg-[#111116] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12">
        <Reveal className="flex-1">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
            Serving the Many Voices of Bharat
          </h2>
          <p className="text-[var(--cream)]/80 text-lg mb-8">
            BoothIQ is natively multilingual. Empower your grassroots workers in their mother tongue.
          </p>
          <div className="flex flex-wrap gap-3">
            {["English", "Hindi", "Telugu", "Tamil", "Marathi", "Bengali", "Kannada", "Gujarati"].map((lang, i) => (
              <motion.span
                key={lang}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                whileHover={{ scale: 1.1, borderColor: "rgba(201,167,74,0.6)" }}
                className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white transition-all duration-300 cursor-default"
              >
                {lang}
              </motion.span>
            ))}
          </div>
        </Reveal>

        <Reveal direction="right" className="flex-1 flex justify-center">
          <div className="relative w-80 h-80 opacity-90">
            <img
              alt="Stylized map of India"
              className="w-full h-full object-contain filter invert opacity-30 drop-shadow-[0_0_15px_rgba(201,167,74,0.5)]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2JMRNjj0sVGQ8GC3cq1NZEz35Vneqgi9XJfz4Z9jmc87Qw3wMCQm6uoj7HynojGZHVtxoo4k6QxvAob-gBifwoV7RYggzS7QtRkW9w7bPz79DAVOuTgdBbLTR6uZoa_OoFmLnGadnL_3VfmOu6YyPdXz0bU-3fQ9wqxCjcP6DENn0MgF2evk2e4BVZPmm5eaXtk2VWJG0F9AsMwtVqDYJwHF61mGuRHXm_XXKHZBwX8o6DXCg8Sd2GtTFu2vV2ua4gET6YbwBOg"
            />
            {[
              { text: "\u0928\u092E\u0938\u094D\u0924\u0947", top: "25%", left: "25%" },
              { text: "\u0C28\u0C2E\u0C38\u0C4D\u0C15\u0C3E\u0C30\u0C02", top: "50%", left: "50%" },
              { text: "\u0BB5\u0BA3\u0B95\u0BCD\u0B95\u0BAE\u0BCD", top: "70%", left: "35%" },
              { text: "\u09A8\u09AE\u09B8\u09CD\u0995\u09BE\u09B0", top: "33%", right: "20%" },
            ].map((tag, i) => (
              <motion.div
                key={tag.text}
                className="absolute bg-[var(--background-dark)]/80 px-2.5 py-1 rounded text-[10px] text-[var(--primary)] border border-[var(--primary)]/30 font-mono"
                style={{ top: tag.top, left: tag.left, right: tag.right }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
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
