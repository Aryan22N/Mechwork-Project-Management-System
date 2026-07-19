import { Inter } from "next/font/google";
import "./globals.css";
import CameraPermissionModal from "@/components/CameraPermissionModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Solar Portal — Login",
  description: "Role-based enterprise portal for Solar projects",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <CameraPermissionModal />
      </body>
    </html>
  );
}
