import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import NavbarLarge from "../components/navbar-large";
import { Toaster } from "../components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SlideGen - Generate Presentations from YouTube",
  description: "Convert educational YouTube videos into engaging presentations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <NavbarLarge />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
