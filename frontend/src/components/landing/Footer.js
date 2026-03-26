import { motion } from "framer-motion";
import { Icon } from "./shared";

export function Footer() {
  return (
    <footer className="bg-[#0c0c0c] pt-20 pb-10 border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.03),transparent)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-10 mb-16 relative z-10">
        {/* Brand */}
        <div className="col-span-2">
          <div className="flex items-center gap-4 mb-6 group cursor-pointer">
            <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:bg-white group-hover:text-black transition-all">
              <Icon name="how_to_vote" size={20} />
            </div>
            <h2 className="text-white text-2xl font-black leading-none tracking-tighter uppercase">BoothIQ</h2>
          </div>
          <p className="text-white/40 text-[11px] max-w-xs mb-6 font-medium italic uppercase tracking-[2px]">
            The premium intelligence platform for modern political warfare.
          </p>
          <div className="flex gap-4">
            {["alternate_email", "call", "feed"].map((icon) => (
              <motion.div key={icon} whileHover={{ scale: 1.1, color: "#10b981" }}>
                <span className="text-white/20 hover:text-emerald-500 transition-colors duration-300 cursor-pointer">
                  <Icon name={icon} />
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Links */}
        {[
          { title: "Platform", links: ["Knowledge Graph", "Voter Analytics", "Booth App", "Security"] },
          { title: "Company", links: ["About Us", "Careers", "Ethics Policy", "Contact"] },
          { title: "Resources", links: ["Blog", "Case Studies", "Help Center", "API Docs"] },
        ].map((col) => (
          <div key={col.title} className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-[10px] uppercase tracking-[0.3em] opacity-80">{col.title}</h4>
            {col.links.map((link) => (
              <span
                key={link}
                className="text-white/30 text-[10px] font-medium hover:text-emerald-400 hover:translate-x-1 transition-all duration-300 inline-block cursor-pointer uppercase tracking-wider"
              >
                {link}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.3em]">
          &copy; 2024 BoothIQ Intelligence Private Limited. All rights reserved.
        </p>
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/5">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          <span className="text-[9px] text-white/40 uppercase tracking-[0.4em] font-bold">
            Made for Bharat Mandapam 2026
          </span>
        </div>
      </div>
    </footer>
  );
}

