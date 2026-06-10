import './globals.css';

export const metadata = {
  title: 'kiwa Safe multi-sig Level B example',
  description: 'In-memory Safe multi-sig mock for kiwa e2e tests',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
