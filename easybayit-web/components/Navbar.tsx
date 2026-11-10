"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "#servizi", label: "Servizi" },
    { href: "#chi-siamo", label: "Chi siamo" },
    { href: "#prezzi", label: "Prezzi" },
    { href: "#contatto", label: "Contatto" },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-1 group">
          <span className="text-xl font-black text-[#F5F4F0] tracking-tight">
            easybayit
          </span>
          <span className="w-2 h-2 rounded-full bg-[#E8A87C] group-hover:scale-125 transition-transform" />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[#9B9589] hover:text-[#F5F4F0] transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#contatto"
            className="px-5 py-2 text-sm font-semibold border border-[#E8A87C] text-[#E8A87C] rounded-full hover:bg-[#E8A87C] hover:text-[#0A0A0F] transition-all duration-200"
          >
            Parliamone →
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#F5F4F0] flex flex-col gap-1.5 p-1"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`w-6 h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`w-6 h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`w-6 h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#111118] border-b border-white/5 px-6 py-4 flex flex-col gap-4"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-[#9B9589] hover:text-[#F5F4F0] text-sm transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contatto"
            onClick={() => setMenuOpen(false)}
            className="px-5 py-2 text-sm font-semibold border border-[#E8A87C] text-[#E8A87C] rounded-full text-center hover:bg-[#E8A87C] hover:text-[#0A0A0F] transition-all"
          >
            Parliamone →
          </a>
        </motion.div>
      )}
    </motion.nav>
  );
}
