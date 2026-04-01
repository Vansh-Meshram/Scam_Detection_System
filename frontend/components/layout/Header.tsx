'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

export default function Header() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'HOME', icon: '⌂' },
    { href: '/analyze', label: 'SCAN', icon: '⟐' },
    { href: '/history', label: 'LOGS', icon: '☰' },
    { href: '/analytics', label: 'DATA', icon: '◈' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass border-b backdrop-blur-xl'
          : 'bg-transparent'
      }`}
      style={{ borderColor: scrolled ? 'rgba(0, 240, 255, 0.1)' : 'transparent' }}
    >
      {/* Neon line at top */}
      <div className="h-[1px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--neon-cyan), var(--neon-magenta), transparent)' }} />

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(255,0,229,0.15))',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
              }}
            >
              <span className="text-xl">⟁</span>
            </motion.div>
            <div className="hidden sm:flex flex-col">
              <span className="text-base font-bold tracking-wider neon-text-cyan" style={{ fontFamily: 'var(--font-heading)' }}>
                SCAMGUARD
              </span>
              <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Neural Defense v3.0
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-5 py-2 rounded-lg text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-300"
                  style={{
                    color: isActive ? '#00f0ff' : 'var(--muted-foreground)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: 'rgba(0, 240, 255, 0.08)',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(57, 255, 20, 0.05)',
                border: '1px solid rgba(57, 255, 20, 0.2)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14] animate-pulse" />
              <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: '#39ff14', fontFamily: 'var(--font-heading)' }}>
                ONLINE
              </span>
            </div>

            {/* Mobile Menu */}
            <button
              className="md:hidden p-2.5 rounded-xl transition-colors"
              style={{ color: 'var(--neon-cyan)' }}
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle menu"
            >
              <span className="text-xl">{isMobileOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden pb-4"
            >
              <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'rgba(0, 240, 255, 0.1)' }}>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                    style={{
                      background: pathname === item.href ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                      color: pathname === item.href ? '#00f0ff' : 'var(--muted-foreground)',
                      borderLeft: pathname === item.href ? '2px solid #00f0ff' : '2px solid transparent',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    <span>{item.icon}</span>
                    <span className="font-medium tracking-wider text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
