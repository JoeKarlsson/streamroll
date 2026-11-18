// Enter in a notes field starts a paid Runway generation, so it only counts when
// the user typed notes and isn't confirming an IME composition (keyCode 229 is
// Safari's composition-commit Enter, which reports isComposing: false).
export function isEnterToSubmitNotes(
  e: { key: string; nativeEvent: { isComposing: boolean; keyCode: number } },
  notes: string,
): boolean {
  return e.key === "Enter" && !e.nativeEvent.isComposing && e.nativeEvent.keyCode !== 229 && notes.trim() !== "";
}
