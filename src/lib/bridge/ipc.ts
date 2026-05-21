import { toast } from "sonner";

import type { IpcError } from "@/lib/bridge/bindings";

/**
 * Error thrown by `unwrap` when a tauri-specta command returns
 * `{ status: "error" }`. Preserves the engine's machine-readable
 * `code` so UI can branch on it (banner vs toast vs modal).
 */
export class IpcCallError extends Error {
  readonly code: string;

  constructor(ipc: IpcError) {
    super(ipc.message);
    this.code = ipc.code;
    this.name = "IpcCallError";
  }
}

/**
 * Unwrap a `Result<T, IpcError>` returned by a tauri-specta command.
 * Returns the payload, or throws `IpcCallError`.
 */
export function unwrap<T>(
  result: { status: "ok"; data: T } | { status: "error"; error: IpcError },
): T {
  if (result.status === "ok") return result.data;
  throw new IpcCallError(result.error);
}

/**
 * Surface an IPC failure as a toast. Designed for `onError` callbacks
 * and `try/catch` blocks in mutations; the error is not re-thrown.
 */
export function reportIpcError(err: unknown, fallback = "Couldn't reach the engine. Try restarting the app.") {
  if (err instanceof IpcCallError) {
    toast.error(err.message || fallback, { description: err.code });
  } else if (err instanceof Error) {
    toast.error(err.message || fallback);
  } else {
    toast.error(fallback);
  }
}
