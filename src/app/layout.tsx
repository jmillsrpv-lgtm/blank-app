import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Price of Profit — Mammon Video Machine',
  description: 'One topic in. One finished episode out.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
