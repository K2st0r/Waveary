# waveary-desktop

`waveary-desktop` packages Waveary into a desktop application shell for end users.

Current goal:

- installable Windows desktop app
- local embedded Waveary runtime
- user only needs to launch the app and connect a model provider

Packaging flow:

1. build `waveary-core`, `waveary-memory`, `waveary-voice`
2. build `waveary-web` static assets and compiled server runtime
3. materialize a standalone `app-runtime/` bundle with the built runtime plus required node modules
4. package Electron and the prepared runtime into a Windows installer through `electron-builder`

Useful commands from the repo root:

```bash
npm run desktop:dev
npm run desktop:pack
npm run desktop:dist
```
