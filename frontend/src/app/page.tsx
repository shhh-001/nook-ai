"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  // Floating collage card details
  const floatingCards = [
    {
      title: "Nike Air Force 1",
      subtitle: "Product",
      image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=300&auto=format&fit=crop&q=80",
      x: "-25%", y: "-10%", rotate: -8, delay: 0.1
    },
    {
      title: "Dune: Part Two",
      subtitle: "Movie",
      image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80",
      x: "35%", y: "-35%", rotate: 12, delay: 0.3
    },
    {
      title: "Niacinamide 10%",
      subtitle: "Skincare",
      image: "https://images.unsplash.com/photo-1608248597481-496100c80836?w=300&auto=format&fit=crop&q=80",
      x: "-30%", y: "40%", rotate: -15, delay: 0.5
    },
    {
      title: "Bali Trip Ideas",
      subtitle: "Travel",
      image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&auto=format&fit=crop&q=80",
      x: "25%", y: "45%", rotate: 6, delay: 0.7
    }
  ];

  return (
    <main className="flex-grow flex flex-col justify-between items-center text-center px-6 py-12 max-w-lg mx-auto h-[100vh]">
      {/* Top Header Logotype */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="flex flex-col items-center gap-1 mt-6"
      >
        <div className="w-12 h-12 bg-blueberry rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-plate fill-plate" />
        </div>
        <h1 className="text-xl font-bold text-blueberry uppercase tracking-[0.25em] mt-3">
          Nook AI
        </h1>
        <p className="text-[10px] font-bold text-stem uppercase tracking-wider">
          AI organizes. You inspire.
        </p>
      </motion.div>

      {/* Headline & Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
        className="space-y-3 z-10"
      >
        <h2 className="text-3xl font-bold text-blueberry tracking-tight leading-[1.15]">
          Your AI Second Brain.
        </h2>
        <p className="text-xs font-semibold text-stem max-w-[280px] mx-auto leading-relaxed">
          Turn messy screenshots into beautifully organized, searchable inspiration automatically.
        </p>
      </motion.div>

      {/* Floating Screenshot Collage */}
      <div className="relative w-full h-[32vh] my-4 flex items-center justify-center overflow-visible">
        {floatingCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.6, rotate: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: card.x,
              y: card.y,
              rotate: card.rotate,
            }}
            transition={{
              type: "spring",
              stiffness: 80,
              damping: 15,
              delay: card.delay
            }}
            whileHover={{ scale: 1.1, rotate: 0, zIndex: 30 }}
            className="absolute w-24 h-32 bg-white rounded-2xl border border-silver shadow-[0_8px_30px_rgba(47,58,85,0.06)] overflow-hidden p-1.5 flex flex-col justify-between cursor-pointer"
          >
            <div className="w-full h-[75%] rounded-xl overflow-hidden bg-silver/20">
              <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
            </div>
            <div className="text-left px-1 mt-1">
              <div className="text-[7px] font-bold text-stem uppercase tracking-wider">{card.subtitle}</div>
              <div className="text-[8px] font-semibold text-blueberry truncate">{card.title}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
        className="w-full space-y-4 mb-6"
      >
        <Link href="/login" className="block">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-blueberry text-plate font-bold py-3.5 px-6 rounded-full shadow-[0_8px_30px_rgba(47,58,85,0.15)] flex items-center justify-center gap-2 cursor-pointer hover:bg-berry transition-colors duration-200"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        </Link>

        <Link href="/login?tab=login" className="block">
          <span className="text-xs font-semibold text-stem hover:text-blueberry cursor-pointer transition-colors duration-200">
            I already have an account
          </span>
        </Link>
      </motion.div>
    </main>
  );
}
