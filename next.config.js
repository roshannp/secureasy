/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.BUILD_FOR_PAGES === "1"
    ? { output: "export", basePath: "/secureasy" }
    : {}),
};

module.exports = nextConfig;
