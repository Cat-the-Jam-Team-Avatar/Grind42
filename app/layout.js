import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata = {
  title: "42 Tycoon: The LogTime Grind",
  description: "Kampüste geçirdiğin zamanı puana dönüştür.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${pixelFont.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        {children}
      </body>
    </html>
  );
}
