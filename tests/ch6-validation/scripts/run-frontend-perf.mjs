#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) out[key] = true;
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.min(sorted.length, Math.ceil((p / 100) * sorted.length)));
  return Number(sorted[rank - 1].toFixed(2));
}

function avg(values) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2));
}

function min(values) {
  if (!values.length) return 0;
  return Number(Math.min(...values).toFixed(2));
}

function max(values) {
  if (!values.length) return 0;
  return Number(Math.max(...values).toFixed(2));
}

function toCsv(rows, headers) {
  const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function collectPerfMetrics(page, durationMs = 3000) {
  return page.evaluate(async ({ duration }) => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    const fcpEntry = paints.find((e) => e.name === 'first-contentful-paint');
    let lcp = 0;

    try {
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.startTime > lcp) lcp = entry.startTime;
        }
      });
      obs.observe({ type: 'largest-contentful-paint', buffered: true });
      await new Promise((r) => setTimeout(r, 0));
      obs.disconnect();
    } catch (_err) {
      lcp = 0;
    }

    const frameDurations = [];
    let last = performance.now();
    const end = last + duration;
    await new Promise((resolve) => {
      const step = (now) => {
        frameDurations.push(now - last);
        last = now;
        if (now >= end) resolve();
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });

    const fpsValues = frameDurations
      .filter((v) => v > 0)
      .map((frameMs) => 1000 / frameMs);
    const fpsAvg = fpsValues.length
      ? fpsValues.reduce((s, v) => s + v, 0) / fpsValues.length
      : 0;
    const sortedFrames = [...frameDurations].sort((a, b) => a - b);
    const p95Index = sortedFrames.length
      ? Math.max(0, Math.min(sortedFrames.length - 1, Math.ceil(0.95 * sortedFrames.length) - 1))
      : 0;

    const memory = performance.memory || null;
    return {
      dcl_ms: nav ? nav.domContentLoadedEventEnd : 0,
      load_ms: nav ? nav.loadEventEnd : 0,
      fcp_ms: fcpEntry ? fcpEntry.startTime : 0,
      lcp_ms: lcp || 0,
      fps_avg: fpsAvg,
      p95_frame_ms: sortedFrames.length ? sortedFrames[p95Index] : 0,
      heap_used_mb: memory ? memory.usedJSHeapSize / (1024 * 1024) : null
    };
  }, { duration: durationMs });
}

async function tryInteraction(page) {
  const selectors = [
    'button:has-text("Enter Mall")',
    'button:has-text("进入商城")',
    'button:has-text("AI")',
    '[aria-label*="AI"]',
    '[aria-label*="助手"]',
    '[class*="ai"][class*="toggle"]',
    '[class*="assistant"][class*="toggle"]'
  ];

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      if ((await locator.count()) > 0 && (await locator.isVisible())) {
        await locator.click({ timeout: 2000 });
        return selector;
      }
    } catch (_err) {
      // continue
    }
  }
  return '';
}

async function run() {
  const argv = parseArgs(process.argv.slice(2));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const outDir = argv.outDir ? path.resolve(argv.outDir) : '';
  if (!outDir) {
    throw new Error('Missing --outDir');
  }
  fs.mkdirSync(outDir, { recursive: true });

  const configPath = argv.config
    ? path.resolve(argv.config)
    : path.resolve(scriptDir, '../config/perf-cases.json');
  const samples = Number(argv.samples || 30);

  let playwright;
  try {
    playwright = await import('playwright');
  } catch (err) {
    throw new Error(
      'Missing dependency: playwright. Run `pnpm --dir tests/ch6-validation add -D playwright` and `pnpm --dir tests/ch6-validation exec playwright install chromium`.'
    );
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const frontendCases = Array.isArray(config.frontend) ? config.frontend : [];

  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage']
  });

  const uaContext = await browser.newContext();
  const uaPage = await uaContext.newPage();
  const userAgent = await uaPage.evaluate(() => navigator.userAgent);
  await uaContext.close();
  const browserVersion = browser.version();
  const browserMeta = {
    collected_at: new Date().toISOString(),
    browser: 'chromium',
    version: browserVersion,
    user_agent: userAgent,
    host: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch()
    }
  };
  fs.writeFileSync(path.join(outDir, 'frontend-browser.json'), JSON.stringify(browserMeta, null, 2), 'utf8');

  const raw = [];

  for (const c of frontendCases) {
    for (let i = 1; i <= samples; i += 1) {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      const page = await context.newPage();
      let httpCode = 0;
      let error = '';
      let metrics = {
        dcl_ms: 0,
        load_ms: 0,
        fcp_ms: 0,
        lcp_ms: 0,
        fps_avg: 0,
        p95_frame_ms: 0,
        heap_used_mb: null
      };

      try {
        if (c.mode === 'warm_reload') {
          await page.goto(c.url, { waitUntil: 'load', timeout: 120000 });
          await page.waitForTimeout(500);
          const response = await page.reload({ waitUntil: 'load', timeout: 120000 });
          httpCode = response ? response.status() : 200;
          await page.waitForTimeout(200);
          metrics = await collectPerfMetrics(page, 3000);
        } else {
          const response = await page.goto(c.url, { waitUntil: 'load', timeout: 120000 });
          httpCode = response ? response.status() : 200;
          await page.waitForTimeout(200);

          if (c.mode === 'interaction') {
            await tryInteraction(page);
            await page.waitForTimeout(300);
          }
          metrics = await collectPerfMetrics(page, 3000);
        }
      } catch (err) {
        error = err && err.message ? err.message : String(err);
      } finally {
        await context.close();
      }

      const pass = !error && httpCode >= 200 && httpCode < 400;
      raw.push({
        case_id: c.case_id,
        case_name: c.name,
        mode: c.mode,
        iteration: i,
        timestamp: new Date().toISOString(),
        latency_ms: Number((metrics.load_ms || 0).toFixed(2)),
        status: pass ? 'pass' : 'fail',
        http_code: httpCode || 0,
        error,
        dcl_ms: Number((metrics.dcl_ms || 0).toFixed(2)),
        load_ms: Number((metrics.load_ms || 0).toFixed(2)),
        fcp_ms: Number((metrics.fcp_ms || 0).toFixed(2)),
        lcp_ms: Number((metrics.lcp_ms || 0).toFixed(2)),
        fps_avg: Number((metrics.fps_avg || 0).toFixed(2)),
        p95_frame_ms: Number((metrics.p95_frame_ms || 0).toFixed(2)),
        heap_used_mb: metrics.heap_used_mb == null ? '' : Number(metrics.heap_used_mb.toFixed(2))
      });
    }
  }

  await browser.close();

  const summary = [];
  const grouped = new Map();
  for (const row of raw) {
    if (!grouped.has(row.case_id)) grouped.set(row.case_id, []);
    grouped.get(row.case_id).push(row);
  }

  for (const [caseId, rows] of grouped.entries()) {
    const total = rows.length;
    const success = rows.filter((r) => r.status === 'pass').length;
    const dcl = rows.map((r) => Number(r.dcl_ms));
    const load = rows.map((r) => Number(r.load_ms));
    const fcp = rows.map((r) => Number(r.fcp_ms));
    const lcp = rows.map((r) => Number(r.lcp_ms));
    const fps = rows.map((r) => Number(r.fps_avg));
    const frameP95 = rows.map((r) => Number(r.p95_frame_ms));
    const heaps = rows
      .map((r) => Number(r.heap_used_mb))
      .filter((v) => Number.isFinite(v) && v > 0);

    summary.push({
      case_id: caseId,
      case_name: rows[0].case_name,
      mode: rows[0].mode,
      samples: total,
      success,
      failed: total - success,
      success_rate: Number(((success * 100) / Math.max(1, total)).toFixed(2)),
      error_rate: Number((((total - success) * 100) / Math.max(1, total)).toFixed(2)),
      dcl_avg_ms: avg(dcl),
      dcl_p95_ms: percentile(dcl, 95),
      load_avg_ms: avg(load),
      load_p95_ms: percentile(load, 95),
      fcp_avg_ms: avg(fcp),
      fcp_p95_ms: percentile(fcp, 95),
      lcp_avg_ms: avg(lcp),
      lcp_p95_ms: percentile(lcp, 95),
      fps_avg: avg(fps),
      fps_min: min(fps),
      fps_p50: percentile(fps, 50),
      fps_p95: percentile(fps, 95),
      frame_time_p95_ms: percentile(frameP95, 95),
      heap_avg_mb: heaps.length ? avg(heaps) : 0
    });
  }

  const rawPath = path.join(outDir, 'frontend-perf-raw.csv');
  const summaryPath = path.join(outDir, 'frontend-perf-summary.csv');

  fs.writeFileSync(
    rawPath,
    toCsv(raw, [
      'case_id',
      'timestamp',
      'latency_ms',
      'status',
      'http_code',
      'error',
      'case_name',
      'mode',
      'iteration',
      'dcl_ms',
      'load_ms',
      'fcp_ms',
      'lcp_ms',
      'fps_avg',
      'p95_frame_ms',
      'heap_used_mb'
    ]),
    'utf8'
  );
  fs.writeFileSync(
    summaryPath,
    toCsv(summary, [
      'case_id',
      'case_name',
      'mode',
      'samples',
      'success',
      'failed',
      'success_rate',
      'error_rate',
      'dcl_avg_ms',
      'dcl_p95_ms',
      'load_avg_ms',
      'load_p95_ms',
      'fcp_avg_ms',
      'fcp_p95_ms',
      'lcp_avg_ms',
      'lcp_p95_ms',
      'fps_avg',
      'fps_min',
      'fps_p50',
      'fps_p95',
      'frame_time_p95_ms',
      'heap_avg_mb'
    ]),
    'utf8'
  );

  process.stdout.write(`${summaryPath}\n`);
}

run().catch((err) => {
  process.stderr.write(`${err.message || String(err)}\n`);
  process.exit(1);
});
