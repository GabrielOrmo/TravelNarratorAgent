
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'TravelNarrator',
  description: 'Your personal AI-powered travel tour guide.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} 
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
