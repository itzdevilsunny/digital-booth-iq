import { motion } from "framer-motion";
import { Icon } from "./shared";

export function Footer() {
  return (
    <footer className="bg-background pt-20 pb-10 border-t border-border relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,hsla(var(--primary),0.03),transparent)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-10 mb-16 relative z-10">
        {/* Brand */}
        <div className="col-span-2">
          <div className="flex items-center gap-4 mb-6 group cursor-pointer">
            <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 group-hover:bg-primary-foreground group-hover:text-primary transition-all">
              <Icon name="how_to_vote" size={20} />
            </div>
            <h2 className="text-foreground text-2xl font-black leading-none tracking-tighter uppercase">BoothIQ</h2>
          </div>
          <p className="text-muted-foreground/40 text-[11px] max-w-xs mb-6 font-medium italic uppercase tracking-[2px]">
            The premium intelligence platform for modern political warfare.
          </p>
          <div className="flex gap-4">
            {["alternate_email", "call", "feed"].map((icon) => (
              <motion.div key={icon} whileHover={{ scale: 1.1, color: "hsl(var(--primary))" }}>
                <span className="text-muted-foreground/20 hover:text-primary transition-colors duration-300 cursor-pointer">
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
            <h4 className="text-foreground font-bold text-[10px] uppercase tracking-[0.3em] opacity-80">{col.title}</h4>
            {col.links.map((link) => (
              <span
                key={link}
                className="text-muted-foreground/30 text-[10px] font-medium hover:text-primary hover:translate-x-1 transition-all duration-300 inline-block cursor-pointer uppercase tracking-wider"
              >
                {link}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <p className="text-muted-foreground/20 text-[9px] font-bold uppercase tracking-[0.3em]">
          &copy; 2024 BoothIQ Intelligence Private Limited. All rights reserved.
        </p>
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-muted/40 border border-border">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          <span className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.4em] font-bold">
            Made for Bharat Mandapam 2026
          </span>
        </div>
      </div>
    </footer>
  );
}

