import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Hair Gallery | Premium Salon Reservations',
  description: 'Bespoke hair design, precision cuts, balayage artistry, and restorative scalp therapy in New York Soho.',
  icons: {
    icon: [
      { url: '/hair_gallery_logo.png' },
      { url: '/hair_gallery_logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/hair_gallery_logo.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/hair_gallery_logo.png',
    apple: [
      { url: '/hair_gallery_logo.png' },
      { url: '/hair_gallery_logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'The Hair Gallery',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/hair_gallery_logo.png" />
        <link rel="shortcut icon" href="/hair_gallery_logo.png" />
        <link rel="apple-touch-icon" href="/hair_gallery_logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var userAgent = navigator.userAgent.toLowerCase();
                if (userAgent.indexOf('kakaotalk') !== -1 && userAgent.indexOf('android') !== -1) {
                  var targetUrl = window.location.href;
                  window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(targetUrl);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-stone-50 text-stone-900 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}

