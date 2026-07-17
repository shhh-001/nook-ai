"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderHeart, Plus, Bookmark, User } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on landing page and login
  if (pathname === "/" || pathname === "/login") return null;

  const tabs = [
    { name: "Home", icon: Home, href: "/home" },
    { name: "Collections", icon: FolderHeart, href: "/results" },
    { name: "Upload", icon: Plus, href: "/upload", isFab: true },
    { name: "Saved", icon: Bookmark, href: "/home?filter=saved" },
    { name: "Profile", icon: User, href: "/profile" },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-auto flex items-center bg-white/70 backdrop-blur-xl border border-silver/50 shadow-[0_12px_40px_rgba(47,58,85,0.08)] px-3 py-2 rounded-full gap-2 relative"
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href.includes("filter") && pathname === "/home");
          const Icon = tab.icon;

          if (tab.isFab) {
            return (
              <Link href={tab.href} key={tab.name} className="relative mx-1">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-blueberry text-plate rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(47,58,85,0.3)] cursor-pointer"
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link href={tab.href} key={tab.name} className="relative px-3 py-2.5">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-200 ${
                  isActive ? "text-blueberry" : "text-stem hover:text-blueberry"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                {isActive && (
                  <motion.div
                    layoutId="activeTabDot"
                    className="absolute -bottom-1.5 w-1 h-1 bg-blueberry rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
