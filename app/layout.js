import './globals.css';

export const metadata = {
  title: 'Merquellantas | Convention Hub',
  description:
    'Meet the Merquellantas team at the convention and unlock the booth prize wheel.',
  icons: {
    icon: 'https://www.merquellantas.com/assets/images/logo/Logo-Merquellantas.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
