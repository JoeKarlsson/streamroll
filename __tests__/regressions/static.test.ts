// Static regression checks for fixes from the site readiness review; rendered behaviour lives in e2e/.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { isEnterToSubmitNotes } from "@/lib/enterToSubmit";

const root = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

function filesUnder(dir: string, ext: RegExp): string[] {
  return readdirSync(path.join(root, dir), { recursive: true, encoding: "utf8" })
    .filter((f) => ext.test(f))
    .map((f) => path.join(dir, f));
}

describe("readiness review regressions", () => {
  it("R04 no text uses the low-contrast neutral-600/700 greys", () => {
    const offenders = filesUnder("app", /\.tsx$/).flatMap((file) =>
      [...read(file).matchAll(/(?:^|[\s"'`])(?:[a-z-]+:)*text-neutral-(?:600|700)\b/g)].map((m) => `${file}: ${m[0].trim()}`),
    );
    expect(offenders).toEqual([]);
  });

  it("R09 Enter during IME composition does not submit notes", () => {
    const enter = (nativeEvent: { isComposing: boolean; keyCode: number }) => ({ key: "Enter", nativeEvent });
    expect(isEnterToSubmitNotes(enter({ isComposing: true, keyCode: 13 }), "暗い背景")).toBe(false);
    expect(isEnterToSubmitNotes(enter({ isComposing: false, keyCode: 229 }), "暗い背景")).toBe(false);
    expect(isEnterToSubmitNotes(enter({ isComposing: false, keyCode: 13 }), "")).toBe(false);
  });

  it("R21 no server code reads RUNWAYML_API_SECRET (the app is BYOK)", () => {
    const serverFiles = [...filesUnder("app/api", /\.ts$/), ...filesUnder("lib", /\.ts$/), "proxy.ts", "next.config.ts"];
    expect(serverFiles.filter((f) => read(f).includes("RUNWAYML_API_SECRET"))).toEqual([]);
  });

  it("R45 Dependabot watches npm and GitHub Actions", () => {
    const config = read(".github/dependabot.yml");
    expect(config).toMatch(/package-ecosystem:\s*["']?npm/);
    expect(config).toMatch(/package-ecosystem:\s*["']?github-actions/);
  });

  it("R47 CI is read-only and pins every action to a full commit SHA", () => {
    const ci = read(".github/workflows/ci.yml");
    expect(ci).toMatch(/^permissions:\s*\n\s+contents:\s*read/m);
    const uses = [...ci.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.filter((u) => !/@[0-9a-f]{40}$/.test(u))).toEqual([]);
  });
});
