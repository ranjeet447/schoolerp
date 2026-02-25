import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const CRITICAL_FILES = [
  "apps/web/src/app/(platform)/platform/analytics/page.tsx",
  "apps/web/src/app/(platform)/platform/integrations/page.tsx",
  "apps/web/src/app/(platform)/platform/payments/page.tsx",
  "apps/web/src/app/(platform)/platform/tenants/[id]/page.tsx",
  "apps/web/src/app/(platform)/platform/tenants/list/page.tsx",
  "apps/web/src/app/(platform)/platform/plans/page.tsx",
] as const;

type Violation = {
  file: string;
  line: number;
  kind: "raw-button-missing-type" | "button-component-onclick-missing-type";
  snippet: string;
};

function extractOpeningTags(source: string, tagName: string) {
  const tags: Array<{ tag: string; start: number }> = [];
  const needle = `<${tagName}`;
  let index = 0;

  while ((index = source.indexOf(needle, index)) !== -1) {
    const next = source[index + needle.length];
    if (next && !/[\s/>]/.test(next)) {
      index += needle.length;
      continue;
    }

    let i = index;
    let braceDepth = 0;
    let quote: '"' | "'" | "`" | "" = "";

    for (i = index + needle.length; i < source.length; i += 1) {
      const c = source[i];
      const prev = source[i - 1];
      if (quote) {
        if (c === quote && prev !== "\\") quote = "";
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        quote = c;
        continue;
      }
      if (c === "{") {
        braceDepth += 1;
        continue;
      }
      if (c === "}" && braceDepth > 0) {
        braceDepth -= 1;
        continue;
      }
      if (c === ">" && braceDepth === 0) {
        tags.push({ tag: source.slice(index, i + 1), start: index });
        break;
      }
    }

    index = i + 1;
  }

  return tags;
}

function lineNumberForOffset(source: string, offset: number) {
  let line = 1;
  for (let i = 0; i < offset; i += 1) {
    if (source.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function normalizeSnippet(tag: string) {
  return tag.replace(/\s+/g, " ").trim().slice(0, 180);
}

function findViolations(filePath: string): Violation[] {
  const source = fs.readFileSync(filePath, "utf8");
  const violations: Violation[] = [];

  for (const { tag, start } of extractOpeningTags(source, "button")) {
    if (!/\btype\s*=/.test(tag)) {
      violations.push({
        file: filePath,
        line: lineNumberForOffset(source, start),
        kind: "raw-button-missing-type",
        snippet: normalizeSnippet(tag),
      });
    }
  }

  for (const { tag, start } of extractOpeningTags(source, "Button")) {
    if (!/\bonClick\s*=/.test(tag)) continue;
    if (/\btype\s*=/.test(tag)) continue;
    if (/\basChild\b/.test(tag)) continue;
    violations.push({
      file: filePath,
      line: lineNumberForOffset(source, start),
      kind: "button-component-onclick-missing-type",
      snippet: normalizeSnippet(tag),
    });
  }

  return violations;
}

test("critical pages use explicit button types for clickable actions", async () => {
  const repoRoot = process.cwd();
  const violations = CRITICAL_FILES.flatMap((relative) => {
    const absolute = path.join(repoRoot, relative);
    return findViolations(absolute).map((v) => ({ ...v, file: relative }));
  });

  if (violations.length > 0) {
    // Keep failure output compact and actionable.
    const message = violations
      .map((v) => `${v.file}:${v.line} ${v.kind} ${v.snippet}`)
      .join("\n");
    expect(message).toBe("");
  }

  expect(violations).toHaveLength(0);
});
