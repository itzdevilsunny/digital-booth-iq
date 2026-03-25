import { motion } from "framer-motion";
import { Icon } from "./shared";

export function Footer() {
  return (
    <footer className="bg-[#f8f5f0] pt-20 pb-10 border-t border-gold/10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
        {/* Brand */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Icon name="how_to_vote" size={24} className="text-primary" />
            <h2 className="text-navy text-lg font-serif font-bold">BoothIQ</h2>
          </div>
          <p className="text-navy/60 text-sm max-w-xs mb-6">
            The premium intelligence platform for modern political warfare.
          </p>
          <div className="flex gap-4">
            {["alternate_email", "call", "feed"].map((icon) => (
              <motion.div key={icon} whileHover={{ scale: 1.2, color: "#c9a74a" }}>
                <span className="text-navy/60 hover:text-primary transition-colors duration-300 cursor-pointer">
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
            <h4 className="text-navy font-bold text-sm uppercase tracking-wider">{col.title}</h4>
            {col.links.map((link) => (
              <span
                key={link}
                className="text-navy/60 text-sm hover:text-primary hover:translate-x-1 transition-all duration-300 inline-block cursor-pointer"
              >
                {link}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gold/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-navy/40 text-xs">
          &copy; 2024 BoothIQ Intelligence Private Limited. All rights reserved.
        </p>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-gold/5 border border-gold/10">
          <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
          <span className="text-[10px] text-navy/60 uppercase tracking-widest font-mono">
            Made for Bharat Mandapam 2026
          </span>
        </div>
      </div>
    </footer>
  );
}
