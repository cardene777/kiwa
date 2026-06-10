import './globals.css';

export const metadata = {
  title: 'kiwa WalletConnect v2 Level B example',
  description: 'In-memory WalletConnect v2 mock for kiwa e2e tests',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
