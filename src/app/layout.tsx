import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Orbitron } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/components/UserProvider';
import Providers from './providers';
import { ThemeToggle } from "@/components/theme-toggle"

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
  title: 'Matchly Admin',
  description: 'Panel administrativo de Matchly - Sistema integral de gestión deportiva',
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
        <Providers>
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          
          <UserProvider>
            {children}
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}
