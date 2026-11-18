/** The download name for an intro: `<slug>-<style>-<YYYY-MM-DD>-<HHMM>.<ext>`, with "intro" when the name has no letters or digits. */
export function introFilename(name: string, style: string, ext: string, now = new Date()): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "intro";
  const date = now.toLocaleDateString("en-CA"); // YYYY-MM-DD, local like the time
  const time = now.toTimeString().slice(0, 5).replace(":", "");
  return `${slug}-${style}-${date}-${time}.${ext}`;
}
