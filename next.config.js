/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.BUILD_FOR_PAGES === "1"
    ? { output: "export", basePath: "/secureasy" }
    : {}),
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Accept" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
