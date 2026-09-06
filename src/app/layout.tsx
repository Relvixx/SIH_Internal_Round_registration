import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SIH Internal Hackathon — MET BKC Polytechnic',
    template: '%s — SIH Internal | MET BKC',
  },
  description:
    'Smart India Hackathon Internal Round portal for MET BKC – Institute of Technology Polytechnic. Register your team, submit your idea, and participate in the internal hackathon.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
