import { fileURLToPath } from "node:url";
import { createServer } from "vite";

async function main() {
  const server = await createServer({
    configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
    server: {
      host: "127.0.0.1",
      port: 4173
    }
  });

  await server.listen();
  server.printUrls();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
