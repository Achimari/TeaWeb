import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const display = localFont({ src: './fonts/young-serif-latin.woff2', variable: '--font-display', display: 'swap' });
const label = localFont({ src: './fonts/barlow-condensed-600-latin.woff2', variable: '--font-label', weight: '600', display: 'swap' });

export const metadata: Metadata = { title: 'The Tea Party', description: 'A teapot to turn, a tea timer, and a daily line to join.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f3f0ea' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${display.variable} ${label.variable}`}><body>{children}</body></html>;
}
