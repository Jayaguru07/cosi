import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI-Enhanced CoSiCoSt | Adaptive Traffic Signal Control for Indian Mixed Traffic',
  description:
    'Reverse engineering study and intelligent adaptive enhancement of CoSiCoSt traffic signal control featuring vehicle classification, weighted demand, anti-starvation protection, and real-time simulation.',
  keywords: [
    'CoSiCoSt',
    'Adaptive Traffic Control',
    'C-DAC',
    'Indian Mixed Traffic',
    'Traffic Simulation',
    'Intelligent Transportation Systems',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
