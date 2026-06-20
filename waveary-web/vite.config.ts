import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { createProviderApiMiddleware } from "./server/provider-api";

export default defineConfig({
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
