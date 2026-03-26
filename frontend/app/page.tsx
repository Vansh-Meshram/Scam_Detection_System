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
        {/* Animated gradient background */}
        <div className="absolute inset-0 gradient-bg opacity-[0.12] dark:opacity-[0.08]" />

        {/* CSS Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${10 + (i * 8) % 80}%`,
                top: `${15 + (i * 12) % 70}%`,
                width: `${3 + (i % 3) * 2}px`,
                height: `${3 + (i % 3) * 2}px`,
                animationDelay: `${i * -0.7}s`,
                animationDuration: `${5 + (i % 4) * 2}s`,
                opacity: 0.2 + (i % 5) * 0.1,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeIn}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium border"
              style={{ background: 'rgba(30,136,229,0.08)', borderColor: 'rgba(30,136,229,0.2)', color: '#1E88E5' }}
            >
              🚀 Powered by RoBERTa AI · v2.0
            </div>
          </motion.div>

          <motion.h1
            custom={1} initial="hidden" animate="visible" variants={fadeIn}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6"
          >
            <span className="text-gradient">Scan. Protect.</span>
            <br />
            <span style={{ color: 'var(--foreground)' }}>Trust.</span>
          </motion.h1>

          <motion.p
            custom={2} initial="hidden" animate="visible" variants={fadeIn}
            className="text-xl sm:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Detect phishing &amp; scams with military-grade AI technology.
            <br className="hidden sm:block" />
            Multi-modal analysis. Real-time results. Self-learning protection.
          </motion.p>

          <motion.div
            custom={3} initial="hidden" animate="visible" variants={fadeIn}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
          >
            <Link href="/analyze">
              <Button size="lg" className="w-full sm:w-auto text-base px-10">
                🔬 Analyze Message
              </Button>
            </Link>
            <Link href="/analytics">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-10">
                📈 View Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            custom={4} initial="hidden" animate="visible" variants={fadeIn}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: '✓', text: '99.7% Accuracy', color: '#10B981' },
              { icon: '⚡', text: 'Real-time Analysis', color: '#1E88E5' },
              { icon: '🧠', text: 'Self-Learning AI', color: '#764ba2' },
            ].map((f) => (
              <motion.div
                key={f.text}
                whileHover={{ scale: 1.05, y: -2 }}
                className="glass px-5 py-2.5 rounded-full flex items-center gap-2 cursor-default"
              >
                <span style={{ color: f.color }} className="font-bold">{f.icon}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {f.text}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section className="relative py-20 border-y" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { value: '1M+', label: 'Scans Analyzed', icon: '🔍' },
              { value: '500K+', label: 'Threats Blocked', icon: '🛡️' },
              { value: '99.7%', label: 'Detection Rate', icon: '🎯' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-4xl sm:text-5xl font-extrabold text-[#1E88E5] mb-1 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
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
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4" style={{ color: 'var(--foreground)' }}>
              How It Works
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
              Three simple steps to protect yourself from online threats
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', icon: '📝', title: 'Input Message', desc: 'Paste suspicious email, SMS, or URL into our analysis engine' },
              { step: '2', icon: '🤖', title: 'AI Analysis', desc: 'Multi-modal RoBERTa model processes text and URL features simultaneously' },
              { step: '3', icon: '🎯', title: 'Get Results', desc: 'Instant risk assessment with detailed threat breakdown and explanations' },
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
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1E88E5] to-[#764ba2] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-sm font-bold text-[#1E88E5] mb-2 uppercase tracking-wider">
                  Step {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
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
            <div className="absolute inset-0 gradient-bg opacity-[0.06]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--foreground)' }}>
                Ready to Protect Yourself?
              </h2>
              <p className="text-lg mb-8" style={{ color: 'var(--muted-foreground)' }}>
                Start analyzing suspicious messages in seconds. No account required.
              </p>
              <Link href="/analyze">
                <Button size="lg" className="text-base px-12">
                  🛡️ Start Scanning Now
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
