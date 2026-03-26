'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const sidebarItems = [
  { icon: '🔍', label: 'Analyze', href: '/analyze' },
  { icon: '📊', label: 'History', href: '/history' },
  { icon: '📈', label: 'Analytics', href: '/analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-64px)] border-r p-6 space-y-2"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="space-y-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1E88E5] text-white shadow-lg shadow-[#1E88E5]/25'
                    : 'hover:bg-[var(--secondary)]'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebarActive"
                    className="ml-auto w-2 h-2 bg-white rounded-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Quick Tip Card */}
      <div className="mt-auto pt-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#1E88E5]/10 to-[#764ba2]/10 border border-[#1E88E5]/20">
          <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
            🎯 Pro Tip
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Paste the full email headers for more accurate sender analysis and SPF/DKIM verification.
          </p>
        </div>
      </div>
    </aside>
  );
}
