import { motion } from "framer-motion";

export function Icon({ name, className = "", size }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={size ? { fontSize: size } : undefined}
    >
      {name}
    </span>
  );
}

export function Reveal({ children, className = "", delay = 0, direction = "up" }) {
  const offsets = {
    up: { x: 0, y: 60 },
    down: { x: 0, y: -60 },
    left: { x: 60, y: 0 },
    right: { x: -60, y: 0 },
    none: { x: 0, y: 0 },
  };
  const { x, y } = offsets[direction];
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.12, delayChildren: 0.15 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const staggerChild = {
  hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: "easeOut" },
  },
};
