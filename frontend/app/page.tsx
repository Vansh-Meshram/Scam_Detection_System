'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/common/Button';
import Footer from '@/components/layout/Footer';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' as const },
  }),
};


export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* ====== HERO ====== */}
      <section className="relative min-h-[92vh] flex items-center justify-center">
        {/* Neon gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.3), transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(255,0,229,0.3), transparent 70%)', filter: 'blur(60px)' }} />
        </div>

        {/* CSS Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${10 + (i * 7) % 80}%`,
                top: `${15 + (i * 11) % 70}%`,
                width: `${2 + (i % 3) * 2}px`,
                height: `${2 + (i % 3) * 2}px`,
                animationDelay: `${i * -0.7}s`,
                animationDuration: `${5 + (i % 4) * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeIn}>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-xs font-semibold tracking-[0.15em] uppercase"
              style={{
                background: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                color: '#00f0ff',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.08)',
              }}
            >
              ⟐ Powered by DistilBERT × URLNet Co-Attention
            </div>
          </motion.div>

          <motion.h1
            custom={1} initial="hidden" animate="visible" variants={fadeIn}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <span className="text-gradient-cyber">SCAN.</span>
            <br />
            <span className="neon-text-cyan">PROTECT.</span>
            <br />
            <span style={{ color: 'var(--foreground)' }}>TRUST.</span>
          </motion.h1>

          <motion.p
            custom={2} initial="hidden" animate="visible" variants={fadeIn}
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Hyper-optimized neural scam detection engine.
            <br className="hidden sm:block" />
            Multi-modal analysis. Zero-latency verdicts. Self-learning defense.
          </motion.p>

          <motion.div
            custom={3} initial="hidden" animate="visible" variants={fadeIn}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
          >
            <Link href="/analyze">
              <Button size="lg" className="w-full sm:w-auto text-sm px-10">
                ⟐ INITIATE SCAN
              </Button>
            </Link>
            <Link href="/analytics">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-sm px-10">
                ◈ VIEW DASHBOARD
              </Button>
            </Link>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            custom={4} initial="hidden" animate="visible" variants={fadeIn}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: '✓', text: '99.7% Accuracy', color: '#39ff14' },
              { icon: '⚡', text: 'Zero-Latency', color: '#00f0ff' },
              { icon: '⟁', text: 'Self-Learning AI', color: '#b14eff' },
            ].map((f) => (
              <motion.div
                key={f.text}
                whileHover={{ scale: 1.05, y: -2 }}
                className="glass px-5 py-2.5 rounded-full flex items-center gap-2 cursor-default"
                style={{ border: `1px solid ${f.color}25` }}
              >
                <span style={{ color: f.color }} className="font-bold">{f.icon}</span>
                <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
                  {f.text}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section className="relative py-20 border-y" style={{ borderColor: 'rgba(0, 240, 255, 0.06)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { value: '1M+', label: 'Scans Analyzed', color: '#00f0ff' },
              { value: '500K+', label: 'Threats Blocked', color: '#ff073a' },
              { value: '99.7%', label: 'Detection Rate', color: '#39ff14' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-black mb-2 tabular-nums"
                  style={{ color: stat.color, fontFamily: 'var(--font-heading)', textShadow: `0 0 30px ${stat.color}40` }}
                >
                  {stat.value}
                </div>
                <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="relative py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-wider" style={{ fontFamily: 'var(--font-heading)', color: 'var(--foreground)' }}>
              PROTOCOL SEQUENCE
            </h2>
            <div className="neon-line max-w-xs mx-auto mt-4" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '⟐', title: 'INPUT DATA', desc: 'Feed suspicious email, SMS, or URL into the neural scan engine' },
              { step: '02', icon: '⟁', title: 'NEURAL ANALYSIS', desc: 'DistilBERT × URLNet Co-Attention fusion processes all signals simultaneously' },
              { step: '03', icon: '◈', title: 'GET VERDICT', desc: 'Instant threat assessment with calibrated confidence and detailed breakdown' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="card-base p-8 text-center relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00f0ff] to-[#ff00e5] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                <div className="text-3xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold mb-2 tracking-[0.2em]" style={{ color: '#00f0ff', fontFamily: 'var(--font-heading)' }}>
                  STEP {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-wider" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="relative py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card-base p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.04]" style={{ background: 'linear-gradient(-45deg, #00f0ff, #ff00e5, #00f0ff)' }} />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-black mb-4 tracking-wider" style={{ fontFamily: 'var(--font-heading)', color: 'var(--foreground)' }}>
                INITIALIZE DEFENSE PROTOCOL
              </h2>
              <p className="text-base mb-8" style={{ color: 'var(--muted-foreground)' }}>
                Start analyzing suspicious messages in seconds. No authentication required.
              </p>
              <Link href="/analyze">
                <Button size="lg" className="text-sm px-12">
                  ⟐ START SCANNING NOW
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
