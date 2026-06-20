import { fileURLToPath } from "node:url";
import { preview } from "vite";

async function main() {
  const server = await preview({
    configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
    preview: {
      host: "127.0.0.1",
      port: 4173
    }
  });

  server.printUrls();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
