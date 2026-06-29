import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json";

import { createProviderApiMiddleware } from "./server/provider-api";

export default defineConfig({
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version)
  },
  plugins: [
    react(),
    {
      name: "waveary-provider-api",
      configureServer(server) {
        server.middlewares.use(createProviderApiMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createProviderApiMiddleware());
      }
    }
  ]
});
