const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const isMac = process.platform === "darwin";
  const target = isMac ? "http://localhost:5001" : "http://localhost:5000";

  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
};
