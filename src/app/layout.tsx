import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { UIScaleProvider } from "@/contexts/UIScaleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SocketProvider } from "@/contexts/SocketContext";

// Force dynamic rendering for the entire app
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Use system fonts as fallback for better reliability
const fontVariables = {
  sans: "--font-geist-sans",
  mono: "--font-geist-mono",
};

export const metadata: Metadata = {
  title: "Project Manager - Complete Project Management",
  description: "Complete project management platform with file attachments, universal search, activity logging, and intelligent team collaboration tools",
  keywords: ["project management", "task management", "team collaboration", "file sharing", "productivity", "workflow", "search"],
  authors: [{ name: "Project Manager Team" }],
  openGraph: {
    title: "Project Manager - Complete Project Management",
    description: "Complete project management platform with advanced collaboration tools",
    url: "http://localhost:3001",
    siteName: "Project Manager",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PM-App - AI-Powered Project Management",
    description: "Transform ideas into actionable results with AI-assisted workflows",
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "PM-App",
  },
};

function ServiceWorkerRegistration() {
  if (typeof window !== 'undefined') {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(error => {
            console.log('ServiceWorker registration failed: ', error);
          });
      });
    }
  }
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Project Manager" />
      </head>
      <body
        className="font-sans antialiased bg-background text-foreground"
        style={{ 
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          '--font-geist-sans': 'system-ui, -apple-system, sans-serif',
          '--font-geist-mono': 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace'
        } as React.CSSProperties}
      >
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <UIScaleProvider>
                {children}
                <Toaster />
                <ServiceWorkerRegistration />
              </UIScaleProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
