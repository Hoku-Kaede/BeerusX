"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["KYOKO", "crimson", "current", "still"];

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => {
        if (i >= WORDS.length - 1) {
          clearInterval(t);
          setTimeout(() => {
            setVisible(false);
            setTimeout(onDone, 600);
          }, 700);
          return i;
        }
        return i + 1;
      });
    }, 520);
    return () => clearInterval(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
        >
          <div className="relative">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-7xl font-semibold tracking-tight"
            >
              {WORDS[index]}
              <span className="text-amber-400">.</span>
            </motion.div>
            <motion.div
              className="absolute -bottom-6 left-0 h-px bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />
          </div>
          <motion.div
            className="absolute bottom-10 text-xs tracking-[0.3em] text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            LOADING EXPERIENCE
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}