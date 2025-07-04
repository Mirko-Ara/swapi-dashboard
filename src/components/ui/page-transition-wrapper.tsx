import { motion } from 'framer-motion';
import React from "react";

const variants = {
    initial: { opacity: 0.125 },
    animate: { opacity: 1 },
    exit: { opacity: 0.125 },
} as const;

export const PageTransitionWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="h-full w-full"
    >
        {children}
    </motion.div>
);