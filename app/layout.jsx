import { StrictMode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Roboto } from 'next/font/google';
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import "../css/index.css";

const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: '스트림퓨전(StreamFusion) - 멀티 스트림, 멀티 뷰어',
  description: '스트림퓨전(StreamFusion)은 여러 플랫폼의 방송을 한 화면에서 동시에 시청할 수 있는 멀티 스트림, 멀티 뷰어 서비스입니다. 숲, 치지직 등 다양한 스트리밍 플랫폼을 지원하여 여러 방송을 편리하게 시청하세요.',
  keywords: ['멀티 스트림', '멀티 뷰', '숲', '치지직', '동시 시청', '스트림퓨전', 'StreamFusion'],
  openGraph: {
    title: '스트림퓨전(StreamFusion) - 멀티 스트림, 멀티 뷰어',
    description: '여러 플랫폼의 방송을 한 화면에서 동시에 시청할 수 있는 멀티 스트림, 멀티 뷰어 서비스입니다.',
    url: 'https://hapche.vercel.app/',
    images: [
      {
        url: '/og-image.svg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '스트림퓨전(StreamFusion) - 멀티 스트림, 멀티 뷰어',
    description: '여러 플랫폼의 방송을 한 화면에서 동시에 시청할 수 있는 멀티 스트림, 멀티 뷰어 서비스입니다.',
    images: ['/og-image.svg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={roboto.className}>
      <body>
        <ThemeRegistry options={{ key: 'mui' }}>
          <StrictMode>
            {children}
            <Analytics />
            <SpeedInsights />
          </StrictMode>
        </ThemeRegistry>
      </body>
    </html>
  );
}
