import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/AppProvider';
import RegisterSW from './register-sw';

export const metadata: Metadata = {
  title: '4uStream',
  description: 'Modern live TV, films and drama platform',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon-192.svg', apple: '/icons/icon-192.svg' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ku" suppressHydrationWarning><body><AppProvider><RegisterSW/>{children}</AppProvider></body></html>;
}
