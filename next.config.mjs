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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nng-phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'st.afreecatv.com',
      },
      {
        protocol: 'https',
        hostname: 'profile.img.afreecatv.com',
      },
      {
        protocol: 'https',
        hostname: 'stimg.afreecatv.com',
      },
      {
        protocol: 'https',
        hostname: 'res.afreecatv.com',
      },
      {
        protocol: 'https',
        hostname: 'static.file.sooplive.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'ogq-sticker-global-cdn-z01.sooplive.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'profile.img.sooplive.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'ssl.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
