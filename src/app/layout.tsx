import type { Metadata } from 'next';
import { Cormorant_Garamond, Great_Vibes, Jost, Inter } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-great-vibes',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jost',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jaqueline & Lucas · O Nosso Casamento',
  description: 'Convite de casamento de Jaqueline & Lucas. Junte-se a nós para celebrar o nosso amor.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%92%8D%3C/text%3E%3C/svg%3E",
  },
  openGraph: {
    title: 'Jaqueline & Lucas · O Nosso Casamento',
    description: 'Junte-se a nós para celebrar o nosso amor.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${cormorant.variable} ${greatVibes.variable} ${jost.variable} ${inter.variable} scroll-smooth`}
    >
      <body className="font-sans antialiased text-ink bg-cream min-h-screen">
        {children}
      </body>
    </html>
  );
}
