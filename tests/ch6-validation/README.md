# CH6 Validation Toolkit

This folder contains reproducible scripts and result artifacts for Chapter 6 ("系统测试与分析") data validation.

## Goals

- Produce traceable, reproducible functional/performance measurements.
- Persist raw evidence and derived summaries per run.
- Generate thesis-ready snippets for Section 6.x tables and analysis text.

## Run

```powershell
cd e:/JavaProgram/Smart-mall
pwsh -File tests/ch6-validation/scripts/run-all.ps1 -Samples 30 -Concurrency 20
```

## Outputs

Each run writes to:

`tests/ch6-validation/results/<timestamp>/`

Key files:

- `env.json`
- `service-health.json`
- `functional-raw.json`
- `functional-summary.csv`
- `functional-summary.json`
- `api-latency-raw.csv`
- `api-latency-summary.csv`
- `api-concurrency-summary.csv`
- `ai-latency-raw.csv`
- `ai-latency-summary.csv`
- `frontend-perf-raw.csv`
- `frontend-perf-summary.csv`
- `summary.json`
- `thesis-tables.md`
- `metrics-dictionary.md`
- `thesis-snippets.md`

## Notes

- This toolkit does not modify business logic.
- If external LLM/network is unstable, failures are recorded as-is (no data beautification).
- Default ports: frontend `5173`, backend `8081`, intelligence `19191`.
