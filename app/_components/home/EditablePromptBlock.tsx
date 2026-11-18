import { useEffect, useId, useRef, useState } from "react";

export function EditablePromptBlock({
  label, meta, generated, override, onChange,
}: {
  label: string;
  meta: string;
  generated: string;
  override: string | null;
  onChange: (v: string | null) => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const labelId = useId();
  const active = override ?? generated;
  const isEdited = override !== null && override !== generated;

  // field-sizing: content grows the textarea in CSS; measure by hand only where it's unsupported.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || CSS.supports("field-sizing", "content")) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [active]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(active);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2500);
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: isEdited ? "#3f3f00" : "#262626" }}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 px-3 border-b" style={{ backgroundColor: isEdited ? "#1a1a00" : "#171717", borderColor: isEdited ? "#3f3f00" : "#262626" }}>
        <div className="flex flex-wrap items-center gap-x-2 py-1.5">
          <span id={labelId} className="text-sm text-neutral-200">{label}</span>
          <span className="text-sm text-neutral-400">{meta}</span>
          {isEdited
            ? <span className="text-sm" style={{ color: "#facc15" }}>Edited</span>
            : <span className="text-sm text-neutral-400">Click to edit</span>
          }
        </div>
        <div className="flex items-center gap-1">
          {isEdited && (
            <button type="button" onClick={() => onChange(null)} className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors">
              Reset
            </button>
          )}
          <button type="button" onClick={copy} className="grid min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors">
            <span className={`[grid-area:1/1] transition-opacity duration-150 ${copyState === "copied" ? "opacity-0" : ""}`}>Copy</span>
            <span aria-hidden="true" className={`[grid-area:1/1] transition-opacity duration-150 ${copyState === "copied" ? "" : "opacity-0"}`}>Copied</span>
          </button>
          <span role="status" className={copyState === "failed" ? "text-sm text-red-400" : "sr-only"}>
            {copyState === "copied" ? "Prompt copied" : copyState === "failed" ? "Couldn’t copy; select the text and copy it by hand" : ""}
          </span>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        aria-labelledby={labelId}
        value={active}
        onChange={e => onChange(e.target.value === generated ? null : e.target.value)}
        className="block w-full px-3 py-2.5 text-base sm:text-xs font-mono leading-relaxed bg-neutral-950 text-neutral-300 resize-none [field-sizing:content] focus-visible:outline-2 focus-visible:outline-white focus-visible:-outline-offset-2 focus:text-neutral-100 hover:bg-neutral-900 transition-colors cursor-text"
        style={{ overflow: "hidden", minHeight: "4rem" }}
        spellCheck={false}
      />
    </div>
  );
}
