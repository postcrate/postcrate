/**
 * Mailbox recording export + replay.
 *
 * Wraps the `exportRecording` / `replayRecording` engine commands with
 * the file-IO sandwich the UI needs:
 *   - Export: engine returns the `Recording` JSON → ask the user where
 *     to save → write the file via `@tauri-apps/plugin-fs`.
 *   - Replay: ask the user to pick a file → read it → parse → hand to
 *     the engine command.
 *
 * Both actions are surfaced as toast-driven promises so the user gets
 * pending → success → error feedback without any per-call boilerplate.
 */

import { toast } from "sonner";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  save as dialogSave,
  open as dialogOpen,
} from "@tauri-apps/plugin-dialog";

import { unwrap, IpcCallError } from "@/lib/bridge/ipc";
import {
  commands,
  type Recording,
} from "@/lib/bridge/bindings";

export type { Recording };

/**
 * Export every captured email in `mailboxId` as a JSON recording file.
 * Cancelling the save dialog is a no-op (no toast).
 *
 * `suggestedName` is used to pre-fill the save dialog and as the
 * recording's stored `label` so the file is self-identifying.
 */
export async function exportMailboxRecording(
  mailboxId: string,
  suggestedName: string,
): Promise<void> {
  const stamp = recordingStamp();
  const defaultPath = `${slugify(suggestedName)}-${stamp}.postcrate.json`;

  const path = await dialogSave({
    title: "Save recording",
    defaultPath,
    filters: [{ name: "Postcrate recording", extensions: ["json"] }],
  });
  if (!path) return; // user cancelled

  const work = (async () => {
    const recording = unwrap(
      await commands.exportRecording(mailboxId, suggestedName),
    );
    await writeTextFile(path, JSON.stringify(recording, null, 2));
    return recording.messages.length;
  })();

  toast.promise(work, {
    loading: "Exporting recording…",
    success: (count) =>
      count === 0
        ? "Exported an empty recording"
        : `Exported ${count} ${count === 1 ? "message" : "messages"}`,
    error: (err) => toastError(err, "Couldn't export recording"),
  });
}

/**
 * Pick a recording file and replay it into the chosen mailbox. The
 * engine accepts the parsed `Recording` directly — no streaming, so
 * very large recordings show as a single in-flight toast.
 */
export async function replayRecordingFromFile(mailboxId: string): Promise<void> {
  const path = await dialogOpen({
    title: "Replay recording",
    multiple: false,
    filters: [{ name: "Postcrate recording", extensions: ["json"] }],
  });
  if (!path || Array.isArray(path)) return; // cancelled or multiple

  const work = (async () => {
    const raw = await readTextFile(path);
    let recording: Recording;
    try {
      recording = JSON.parse(raw) as Recording;
    } catch {
      throw new Error("File isn't a valid recording (couldn't parse JSON)");
    }
    if (
      !recording ||
      typeof recording.version !== "number" ||
      !Array.isArray(recording.messages)
    ) {
      throw new Error("File isn't a Postcrate recording");
    }
    return unwrap(await commands.replayRecording(mailboxId, recording));
  })();

  toast.promise(work, {
    loading: "Replaying messages…",
    success: (count) =>
      `Replayed ${count} ${count === 1 ? "message" : "messages"}`,
    error: (err) => toastError(err, "Couldn't replay recording"),
  });
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function toastError(err: unknown, fallback: string): string {
  if (err instanceof IpcCallError) {
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message || fallback;
  }
  return fallback;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "mailbox"
  );
}

function recordingStamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`
  );
}
