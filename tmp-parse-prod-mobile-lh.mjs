import fs from "fs";

const transcriptPath =
  process.env.USERPROFILE +
  "/.cursor/projects/c-Users-lucas-Desktop-projects-personal-portfolio-project/agent-transcripts/8e2b23c0-f109-4bb5-bb0a-4dd3962c960a/8e2b23c0-f109-4bb5-bb0a-4dd3962c960a.jsonl";

const rows = fs.readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
const targetRow = rows
  .map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .reverse()
  .find((row) => {
    const text = row?.message?.content?.find?.((c) => c.type === "text")?.text ?? "";
    return text.includes("Here is the new lighthouse of the UI");
  });

if (!targetRow) {
  throw new Error("Could not find latest Lighthouse report row");
}

const messageText = targetRow.message.content.find((c) => c.type === "text").text;
const keyPos = messageText.indexOf('"lighthouseVersion"');
const start = messageText.lastIndexOf("{", keyPos);

function extractJson(text, openingIndex) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = openingIndex; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(openingIndex, i + 1);
      }
    }
  }
  throw new Error("Unclosed JSON object");
}

const report = JSON.parse(extractJson(messageText, start));
const c = report.categories;
const audits = report.audits;

const out = {
  url: report.finalUrl,
  fetchTime: report.fetchTime,
  warnings: report.runWarnings,
  scores: {
    performance: c.performance.score * 100,
    accessibility: c.accessibility.score * 100,
    bestPractices: c["best-practices"].score * 100,
    seo: c.seo.score * 100,
  },
  metrics: {
    fcp: audits["first-contentful-paint"].displayValue,
    lcp: audits["largest-contentful-paint"].displayValue,
    speedIndex: audits["speed-index"].displayValue,
    tbt: audits["total-blocking-time"].displayValue,
    cls: audits["cumulative-layout-shift"].displayValue,
    tti: audits["interactive"].displayValue,
  },
  opportunities: report.categories.performance.auditRefs
    .map((ref) => ({ id: ref.id, weight: ref.weight, ...audits[ref.id] }))
    .filter((a) => a.details?.overallSavingsMs || a.details?.overallSavingsBytes)
    .map((a) => ({
      id: a.id,
      title: a.title,
      displayValue: a.displayValue,
      savingsMs: a.details?.overallSavingsMs ?? 0,
      savingsBytes: a.details?.overallSavingsBytes ?? 0,
      score: a.score,
    }))
    .sort((a, b) => (b.savingsMs + b.savingsBytes / 1000) - (a.savingsMs + a.savingsBytes / 1000))
    .slice(0, 10),
  diagnostics: {
    mainThreadWork: audits["mainthread-work-breakdown"]?.displayValue,
    bootupTime: audits["bootup-time"]?.displayValue,
    totalByteWeight: audits["total-byte-weight"]?.displayValue,
    renderBlocking: audits["render-blocking-resources"]?.displayValue,
    usesResponsiveImages: audits["uses-responsive-images"]?.displayValue,
    usesOptimizedImages: audits["uses-optimized-images"]?.displayValue,
    unusedJs: audits["unused-javascript"]?.displayValue,
    unusedCss: audits["unused-css-rules"]?.displayValue,
    legacyJs: audits["legacy-javascript"]?.displayValue,
  },
  lcpElement: audits["largest-contentful-paint-element"]?.details?.items?.[0]?.node?.snippet ?? null,
  largestScripts: (audits["network-requests"]?.details?.items ?? [])
    .filter((r) => r.resourceType === "Script")
    .sort((a, b) => b.transferSize - a.transferSize)
    .slice(0, 8)
    .map((r) => ({
      url: r.url,
      transferSize: r.transferSize,
    })),
  unusedJsItems: (audits["unused-javascript"]?.details?.items ?? [])
    .sort((a, b) => (b.wastedBytes ?? 0) - (a.wastedBytes ?? 0))
    .slice(0, 8)
    .map((r) => ({
      url: r.url,
      totalBytes: r.totalBytes,
      wastedBytes: r.wastedBytes,
    })),
  lcpBreakdown: audits["lcp-breakdown"]?.details?.items ?? [],
  serverResponseTime: audits["server-response-time"]?.displayValue ?? null,
  networkDependencyTree: audits["network-dependency-tree"]?.displayValue ?? null,
  failures: {
    bfCache: audits["bf-cache"]?.scoreDisplayMode,
    errorsInConsole: audits["errors-in-console"]?.score,
    inspectorIssues: audits["inspector-issues"]?.score,
  },
  consoleMessages: audits["errors-in-console"]?.details?.items ?? [],
  bfCacheFailures: audits["bf-cache"]?.details?.failures ?? [],
};

console.log(JSON.stringify(out, null, 2));
