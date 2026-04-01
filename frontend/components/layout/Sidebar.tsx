'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const sidebarItems = [
  { icon: '⟐', label: 'Scan', href: '/analyze' },
  { icon: '☰', label: 'Logs', href: '/history' },
  { icon: '◈', label: 'Data', href: '/analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-64px)] border-r p-6 space-y-2"
      style={{
        background: 'rgba(6, 11, 24, 0.9)',
        borderColor: 'rgba(0, 240, 255, 0.06)',
      }}
    >
      <div className="space-y-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                style={{
                  background: isActive ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 240, 255, 0.2)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 20px rgba(0, 240, 255, 0.08)' : 'none',
                  color: isActive ? '#00f0ff' : 'var(--muted-foreground)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold tracking-wider text-sm uppercase">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebarActive"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#00f0ff', boxShadow: '0 0 8px #00f0ff' }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Cyber Tip Card */}
      <div className="mt-auto pt-6">
        <div className="p-4 rounded-xl"
          style={{
            background: 'rgba(0, 240, 255, 0.03)',
            border: '1px solid rgba(0, 240, 255, 0.1)',
          }}
        >
          <p className="text-xs font-bold mb-1.5 tracking-wider uppercase" style={{ color: '#00f0ff', fontFamily: 'var(--font-heading)' }}>
            ⟐ INTEL
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Paste full email headers for deeper sender analysis and SPF/DKIM verification.
          </p>
        </div>
      </div>
    </aside>
  );
}
