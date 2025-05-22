import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  // build: {
  //   rollupOptions: {
  //     output: {
  //       manualChunks(id) {
  //         if (id.includes("node_modules")) {
  //           if (id.includes("react")) return "react";
  //           if (id.includes("@chakra-ui")) return "chakra";
  //           if (id.includes("lodash")) return "lodash";
  //           return "vendor";
  //         }
  //       },
  //     },
  //   },
  // },
  plugins: [react()],
  preview: {
    port: 5173,
    strictPort: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    origin: "http://0.0.0.0:5173",
    proxy: {
      "/api": {
        // target for local deployment and NGINX and reverse proxy to /api
        target: "http://localhost:5051",
        // target: "https://siq-api.onrender.com",

        // target for docker deployment with standard deployment
        //     // target: "http://api:5051",
        changeOrigin: true,
        rewrite: (path) => path.replace("/^/api/", ""),
      },
    },
  },
  define: {
    BUILD_DATE: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
});
