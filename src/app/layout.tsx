import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Orbitron } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/components/UserProvider';
import Providers from './providers';
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/LanguageToggle"
import { Toaster } from "@/components/ui/toaster"
import { TranslationProvider } from '@/contexts/TranslationContext';

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-plus-jakarta'
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Recrea Rackets Calendar Admin',
  description: 'Admin panel for Recrea Rackets Calendar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link href="https://fonts.cdnfonts.com/css/ds-digital" rel="stylesheet" />
      </head>
      <body className={`${plusJakarta.variable} ${orbitron.variable} font-sans antialiased`}>
        <TranslationProvider>
          <Providers>
            <div className="fixed top-4 right-4 z-50 flex flex-col items-center gap-3">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            
            <UserProvider>
              {children}
            </UserProvider>
            <Toaster />
          </Providers>
        </TranslationProvider>
      </body>
    </html>
  );
}