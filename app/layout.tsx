import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#e60067",
};

export const metadata: Metadata = {
  title: "Fit DaLi - Sistema de Gestão",
  description: "Sistema de gestão de pedidos para Fit DaLi - saudável com sabor!",
  keywords: ["marmita", "fit", "gestão", "ERP", "delivery", "comida saudável"],
  authors: [{ name: "Fit DaLi" }],
  creator: "Fit DaLi",
  publisher: "Fit DaLi",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fit DaLi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-200 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
