import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// One variable family for every display role (weight 200–800, width 75–100%, optical size 12–96), self-hosted.
const display = localFont({ src: './fonts/bricolage-grotesque-latin.woff2', variable: '--font-display', weight: '200 800', display: 'swap', adjustFontFallback: 'Arial' });

export const metadata: Metadata = { title: 'The Tea Party', description: 'Spin the pot, put the shared tea timer on, and join today’s line with just a name.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f3f0ea' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={display.variable}><body>{children}</body></html>;
}
