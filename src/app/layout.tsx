import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';

export const metadata: Metadata = {
  title: 'The ARC — Turn Your Life Into Your Arc',
  description: 'Turn everyday goals into meaningful actions. Build habits, develop skills, and see your real-world progress become a journey.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="neon-obsidian">
      <body className="font-sans antialiased min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30 selection:text-cyan-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
