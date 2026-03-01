import { Inter, Fira_Sans, Fira_Code } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';
import { Toaster } from '@/components/shared/toaster';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fira-sans'
});
const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fira-code'
});

export const metadata: Metadata = {
  title: {
    default: 'HMS - Hospital Management System',
    template: '%s | HMS',
  },
  description: 'Multi-tenant Hospital Management System with Pharmacy and Laboratory modules',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, firaSans.variable, firaCode.variable, "font-sans")}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
