import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Hair Gallery | Premium Salon Reservations',
  description: 'Bespoke hair design, precision cuts, balayage artistry, and restorative scalp therapy in New York Soho.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-stone-50 text-stone-900 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
