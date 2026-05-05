"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/gallery", label: "Gallery" },
  { href: "/news", label: "News" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-brand/95 backdrop-blur shadow-lg"
        : "bg-brand"
        }`}
    >
      {/* Top utility strip */}
      <div className="hidden md:block bg-brand-dark text-cream/80 text-xs">
        <div className="mx-auto max-w-7xl px-6 py-1.5 flex justify-between">
          <span>📍 North Horr, Marsabit County, Kenya</span>
          <div className="flex gap-4">
            <a href="mailto:info@ntvc.ac.ke" className="hover:text-gold transition">
              info@ntvc.ac.ke
            </a>
            <span>|</span>
            <a href="tel:+254700000000" className="hover:text-gold transition">
              +254 700 000 000
            </a>
            <span>|</span>
            <Link href="/login" className="hover:text-gold transition">
              Student Portal
            </Link>
          </div>
        </div>
      </div>

      <nav className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image src={'/Logo/NorthHorr.png'} width={100} height={100} alt="NorthHorr" />
          {/* <div className="h-12 w-12 rounded-full bg-cream grid place-items-center text-brand font-display font-extrabold text-lg shadow-md group-hover:scale-105 transition">
            NT
          </div> */}
          <div className="text-cream leading-tight">
            <div className="font-display font-bold tracking-tight text-base sm:text-lg">
              North Horr TVC
            </div>
            <div className="text-[10px] sm:text-xs uppercase tracking-widest text-gold/90">
              Igniting a brighter future
            </div>
          </div>
        </Link>

        <ul className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="px-4 py-2 text-sm font-medium text-cream/90 hover:text-gold rounded-md transition relative group"
              >
                {l.label}
                <span className="absolute left-4 right-4 -bottom-0.5 h-0.5 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/courses"
            className="px-5 py-2.5 rounded-full bg-gold text-brand-dark font-semibold text-sm hover:bg-gold-soft transition shadow"
          >
            Apply Now
          </Link>
        </div>

        <button
          onClick={() => setOpen((s) => !s)}
          aria-label="Toggle menu"
          className="lg:hidden text-cream p-2 rounded hover:bg-brand-dark transition"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden bg-brand-dark transition-[max-height] duration-300 ${open ? "max-h-[600px]" : "max-h-0"
          }`}
      >
        <ul className="px-6 py-4 flex flex-col gap-1">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-md text-cream/90 hover:bg-brand hover:text-gold transition"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="mt-2">
            <Link
              href="/courses"
              onClick={() => setOpen(false)}
              className="block text-center px-5 py-2.5 rounded-full bg-gold text-brand-dark font-semibold"
            >
              Apply Now
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
