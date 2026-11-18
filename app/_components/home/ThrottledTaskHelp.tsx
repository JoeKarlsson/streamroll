import { useState } from "react";
import { INPUT_CLASS } from "./classes";

/** Shown while Runway throttles the task: cancel another task by ID, or give up on this one. */
export function ThrottledTaskHelp({ cancelRunwayTask, onStartOver }: {
  cancelRunwayTask: (taskId: string) => Promise<void>;
  onStartOver: () => void;
}) {
  const [cancelTaskId, setCancelTaskId] = useState("");
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 bg-neutral-900 border-t border-neutral-800">
      <p className="text-sm text-neutral-300 text-center max-w-sm">
        Another task is still running on your Runway account (concurrency limit: 1).
        Copy a task ID from your{" "}
        <span className="text-white">Runway dev portal, Request History</span>
        {" "}and cancel it here, or cancel this queued task and try again later.
      </p>

      {/* Cancel-by-ID input */}
      <div className="flex gap-2 w-full max-w-sm">
        <input
          type="text"
          value={cancelTaskId}
          onChange={e => { setCancelTaskId(e.target.value); setCancelMsg(null); }}
          placeholder="Paste task ID to cancel…"
          aria-label="Runway task ID to cancel"
          className={`${INPUT_CLASS} flex-1 min-w-0`}
        />
        <button
          type="button"
          disabled={!cancelTaskId.trim()}
          onClick={async () => {
            setCancelMsg("Cancelling…");
            try {
              await cancelRunwayTask(cancelTaskId.trim());
              setCancelMsg("Cancelled. Polling will resume shortly.");
              setCancelTaskId("");
            } catch (e) {
              setCancelMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
            }
          }}
          className="min-h-11 text-sm px-3 rounded-lg border border-amber-700 text-amber-400 hover:bg-amber-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          Cancel task
        </button>
      </div>
      {cancelMsg && (
        <p role="status" className="text-sm" style={{ color: cancelMsg.startsWith("Error") ? "#EF4444" : "#22C55E" }}>
          {cancelMsg}
        </p>
      )}

      <button
        type="button"
        onClick={onStartOver}
        className="min-h-11 text-sm text-neutral-300 hover:text-white transition-colors"
      >
        Cancel this queued task and start over
      </button>
    </div>
  );
}
