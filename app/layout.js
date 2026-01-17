import { Be_Vietnam_Pro } from "next/font/google";
import Particles from "@/components/Particles";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam-pro",
});

export const metadata = {
  title: "🔥 TUYẾT SƠN XIÊN HỎA LONG - Hội Xuân 2026",
  description: "Đặt món TUYẾT SƠN XIÊN HỎA LONG tại Hội Xuân 2026 - THPT Nguyễn Thị Minh Khai. Mua 3 phần tặng 1 vé mini game!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={beVietnamPro.className}>
        <Particles />
        {children}
      </body>
    </html>
  );
}
