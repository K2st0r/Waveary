import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type {
  PersistedSessionState,
  PersistedSessionStateRecord,
  SessionStateRepository
} from "./session-state.js";

interface SqliteSessionStateRow {
  session_id: string;
  state_json: string;
}

export interface SqliteSessionStateRepositoryOptions {
  filename: string;
}

export class SqliteSessionStateRepository<
  TState extends PersistedSessionState = PersistedSessionState
> implements SessionStateRepository<TState>
{
  private readonly database: DatabaseSync;

  constructor(options: SqliteSessionStateRepositoryOptions) {
    mkdirSync(dirname(options.filename), { recursive: true });
    this.database = new DatabaseSync(options.filename);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS waveary_session_states (
        session_id TEXT PRIMARY KEY,
        state_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  load(sessionId: string): TState | undefined {
    const row = this.database
      .prepare("SELECT state_json FROM waveary_session_states WHERE session_id = ?")
      .get(sessionId) as SqliteSessionStateRow | undefined;

    if (!row) {
      return undefined;
    }

    return JSON.parse(row.state_json) as TState;
  }

  save(sessionId: string, state: TState): void {
    this.database
      .prepare(`
        INSERT INTO waveary_session_states (session_id, state_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          state_json = excluded.state_json,
          updated_at = excluded.updated_at
      `)
      .run(sessionId, JSON.stringify(state), state.updatedAt);
  }

  delete(sessionId: string): void {
    this.database
      .prepare("DELETE FROM waveary_session_states WHERE session_id = ?")
      .run(sessionId);
  }

  list(): PersistedSessionStateRecord<TState>[] {
    const rows = this.database
      .prepare("SELECT session_id, state_json FROM waveary_session_states ORDER BY updated_at DESC")
      .all() as unknown as SqliteSessionStateRow[];

    return rows.map((row) => ({
      sessionId: row.session_id,
      state: JSON.parse(row.state_json) as TState
    }));
  }

  close(): void {
    this.database.close();
  }
}
