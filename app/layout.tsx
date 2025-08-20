import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Narada AI - Deep Research Agent",
  description: "Intelligent multi-source research powered by AI. Comprehensive web research using Firecrawl, Tavily, and advanced language models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('narada-theme') || 'auto';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (theme === 'auto') {
                    const hour = new Date().getHours();
                    const isDark = hour >= 18 || hour < 6;
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning={true}
        className={cn(
          "min-h-screen bg-background font-sans antialiased transition-colors duration-300",
          inter.variable
        )}
        style={{
          backgroundColor: 'hsl(var(--background))'
        }}
      >
        <ThemeProvider>
          <main className="">
            {children}
          </main>
          <Toaster 
            theme="system"
            richColors
            closeButton
            className="toaster"
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
              className: 'group toast',
              actionButtonStyle: {
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
              },
              cancelButtonStyle: {
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
