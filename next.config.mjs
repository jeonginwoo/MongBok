/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/chzzk/chat/:path*',
        destination: 'https://comm-api.game.naver.com/:path*',
      },
      {
        source: '/api/chzzk/live/:path*',
        destination: 'https://api.chzzk.naver.com/:path*',
      },
      {
        source: '/api/soop/channel/:path*',
        destination: 'https://chapi.sooplive.co.kr/:path*',
      },
      {
        source: '/api/soop/search/:path*',
        destination: 'https://sch.sooplive.co.kr/:path*',
      },
      {
        source: '/api/soop/live/:path*',
        destination: 'https://live.sooplive.co.kr/:path*',
      },
      {
        source: '/api/soop/station/:path*',
        destination: 'https://bjapi.afreecatv.com/:path*',
      },
    ];
  },
};

export default nextConfig;
