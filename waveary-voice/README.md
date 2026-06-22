# waveary-voice

`waveary-voice` is the first dedicated voice module for Project Waveary.

Current scope:

- text-to-speech request contracts
- browser-friendly speech planning
- emotion-aware voice pacing and pitch hints
- first OpenAI-compatible provider-backed TTS adapter
- first dedicated domestic Doubao TTS adapter
- first generic local HTTP TTS bridge for self-hosted engines

This package does not try to finish full duplex voice in one step.
Its first job is to give `waveary-web` a stable voice layer that can speak replies now and still evolve toward real provider-backed TTS and STT later.
