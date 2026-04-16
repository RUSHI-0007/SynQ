import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'SYNQ — Multiplayer Cloud IDE for Hackathon Teams',
  description: 'Full visibility across your team\'s code, containers, and merges — with zero environment setup required.',
  applicationName: 'SYNQ',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SYNQ',
  },
};

// Separate viewport export — required in Next.js 14 App Router
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents accidental pinch-zoom in the IDE
  viewportFit: 'cover', // Required for iOS safe-area-inset CSS env vars
  themeColor: '#010409',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
