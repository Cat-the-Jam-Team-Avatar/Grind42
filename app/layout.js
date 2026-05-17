import { Pixelify_Sans, Press_Start_2P, Silkscreen } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import themeBootScript from "@/components/theme/themeBootScript";
import "./globals.css";

const pixelify = Pixelify_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-pixelify",
  display: "swap",
});

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-silkscreen",
  display: "swap",
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata = {
  title: "42 Tycoon: The LogTime Grind",
  description: "Kampüste geçirdiğin zamanı puana dönüştür.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="tr"
      className={`${pixelify.variable} ${silkscreen.variable} ${pressStart.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Script
          id="grind42-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootScript() }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
