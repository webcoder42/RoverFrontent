import { motion } from "motion/react";

export function BackgroundBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-violet-300/50 to-indigo-300/40 blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-sky-300/50 to-cyan-300/40 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-24 left-1/3 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-fuchsia-300/50 to-pink-300/40 blur-3xl animate-blob animation-delay-4000" />
    </div>
  );
}

export function Particles({ count = 18 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-primary/40"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0,
          }}
          animate={{
            y: ["0%", "-20%", "0%"],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
