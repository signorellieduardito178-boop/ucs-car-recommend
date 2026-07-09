import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UCS展车外借推荐系统',
  description: '蔚来展车外借申请平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
