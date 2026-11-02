import { Tracking, TrackingNoScript } from "@/components/Tracking";
import "../globals.css";

// English lives at the root. Each language has its own root layout so <html lang> is right.
export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TrackingNoScript />
        {children}
        <Tracking />
      </body>
    </html>
  );
}
