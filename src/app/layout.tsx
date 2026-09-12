import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';

export const metadata: Metadata = {
  title: 'Entropy Engine — Life RPG',
  description: "Your stats don't just grow — they decay. Fight the void.",
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
