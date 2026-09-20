import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
import RegisterSW from './register-sw';

export const metadata: Metadata = {
  title: '4uStream',
  description: 'Modern live TV, films and drama platform',
  manifest: '/manifest.webmanifest',

  icons: {
    icon: [
      {
        url: '/IMG_6501.jpeg',
        type: 'image/jpeg',
      },
    ],
    apple: [
      {
        url: '/IMG_6501.jpeg',
        type: 'image/jpeg',
      },
    ],
  },

  openGraph: {
    title: '4uStream',
    description: 'Modern live TV, films and drama platform',
    images: [
      {
        url: '/IMG_6501.jpeg',
        alt: '4uStream',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ku" suppressHydrationWarning>
      <body>
        <ClientProviders>
          <RegisterSW />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
