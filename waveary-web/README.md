# waveary-web

`waveary-web` is the official web surface for Project Waveary.

It is responsible for:

- presenting Waveary as a formal open source project
- providing the first official product shell for provider setup and runtime access
- visualizing memory, relationship, and timeline capabilities without moving those systems into the UI layer

Current scope:

- landing page and project homepage
- product positioning and roadmap presentation
- first browser-native provider setup flow
- first browser-native runtime chat shell
- browser session export and import flow with validation diagnostics

Boundary:

- `waveary-web` owns interface and interaction flow
- `waveary-core` remains responsible for runtime orchestration and provider abstractions
- `waveary-memory` remains responsible for memory extraction and storage behavior

Related docs:

- `../docs/session-file-format.md`
- `../docs/examples/session-export.sample.json`
