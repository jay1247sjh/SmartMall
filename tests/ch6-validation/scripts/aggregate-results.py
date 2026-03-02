#!/usr/bin/env python3
import argparse
import csv
import json
import math
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8-sig") as f:
        return json.load(f)


def read_csv(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def to_float(v: Any, default: float = 0.0) -> float:
    try:
        if v is None or v == "":
            return default
        return float(v)
    except Exception:
        return default


def to_int(v: Any, default: int = 0) -> int:
    try:
        if v is None or v == "":
            return default
        return int(float(v))
    except Exception:
        return default


def weighted_rate(rows: List[Dict[str, Any]], success_key: str = "success", total_key: str = "samples") -> float:
    success = sum(to_float(r.get(success_key, 0.0)) for r in rows)
    total = sum(to_float(r.get(total_key, 0.0)) for r in rows)
    if total <= 0:
        return 0.0
    return round(success * 100.0 / total, 2)


def build_summary(out_dir: Path) -> Dict[str, Any]:
    env = read_json(out_dir / "env.json", {})
    health = read_json(out_dir / "service-health.json", {})
    functional = read_json(out_dir / "functional-summary.json", {})

    api_seq_rows = read_csv(out_dir / "api-latency-summary.csv")
    api_conc_rows = read_csv(out_dir / "api-concurrency-summary.csv")
    ai_rows = read_csv(out_dir / "ai-latency-summary.csv")
    fe_rows = read_csv(out_dir / "frontend-perf-summary.csv")

    api_cases = []
    for r in api_seq_rows:
        api_cases.append(
            {
                "case_id": r.get("case_id", ""),
                "case_name": r.get("case_name", ""),
                "samples": to_int(r.get("samples")),
                "success": to_int(r.get("success")),
                "failed": to_int(r.get("failed")),
                "success_rate": to_float(r.get("success_rate")),
                "error_rate": to_float(r.get("error_rate")),
                "avg_ms": to_float(r.get("avg_ms")),
                "p50_ms": to_float(r.get("p50_ms")),
                "p95_ms": to_float(r.get("p95_ms")),
                "min_ms": to_float(r.get("min_ms")),
                "max_ms": to_float(r.get("max_ms")),
                "throughput_req_s": to_float(r.get("throughput_req_s")),
            }
        )

    ai_cases = []
    for r in ai_rows:
        ai_cases.append(
            {
                "case_id": r.get("case_id", ""),
                "case_name": r.get("case_name", ""),
                "samples": to_int(r.get("samples")),
                "success": to_int(r.get("success")),
                "failed": to_int(r.get("failed")),
                "success_rate": to_float(r.get("success_rate")),
                "error_rate": to_float(r.get("error_rate")),
                "avg_ms": to_float(r.get("avg_ms")),
                "p50_ms": to_float(r.get("p50_ms")),
                "p95_ms": to_float(r.get("p95_ms")),
                "min_ms": to_float(r.get("min_ms")),
                "max_ms": to_float(r.get("max_ms")),
                "type_text": to_int(r.get("type_text")),
                "type_confirmation_required": to_int(r.get("type_confirmation_required")),
                "type_error": to_int(r.get("type_error")),
            }
        )

    fe_cases = []
    for r in fe_rows:
        fe_cases.append(
            {
                "case_id": r.get("case_id", ""),
                "case_name": r.get("case_name", ""),
                "mode": r.get("mode", ""),
                "samples": to_int(r.get("samples")),
                "success_rate": to_float(r.get("success_rate")),
                "error_rate": to_float(r.get("error_rate")),
                "dcl_avg_ms": to_float(r.get("dcl_avg_ms")),
                "dcl_p95_ms": to_float(r.get("dcl_p95_ms")),
                "load_avg_ms": to_float(r.get("load_avg_ms")),
                "load_p95_ms": to_float(r.get("load_p95_ms")),
                "fcp_avg_ms": to_float(r.get("fcp_avg_ms")),
                "fcp_p95_ms": to_float(r.get("fcp_p95_ms")),
                "lcp_avg_ms": to_float(r.get("lcp_avg_ms")),
                "lcp_p95_ms": to_float(r.get("lcp_p95_ms")),
                "fps_avg": to_float(r.get("fps_avg")),
                "fps_p95": to_float(r.get("fps_p95")),
                "frame_time_p95_ms": to_float(r.get("frame_time_p95_ms")),
                "heap_avg_mb": to_float(r.get("heap_avg_mb")),
            }
        )

    api_p95 = max((c["p95_ms"] for c in api_cases), default=0.0)
    ai_p95 = max((c["p95_ms"] for c in ai_cases), default=0.0)
    fe_fps_avg = round(
        sum(c["fps_avg"] for c in fe_cases) / len(fe_cases), 2
    ) if fe_cases else 0.0
    fe_frame_p95 = max((c["frame_time_p95_ms"] for c in fe_cases), default=0.0)

    cold_case = next((c for c in fe_cases if c["case_id"] == "FE01"), fe_cases[0] if fe_cases else None)
    init_load_ms = cold_case["load_avg_ms"] if cold_case else 0.0

    nfr = {
        "NFR-001": {
            "name": "渲染流畅度",
            "target": "FPS >= 30",
            "actual": {"fps_avg": fe_fps_avg, "frame_time_p95_ms": fe_frame_p95},
            "met": fe_fps_avg >= 30.0,
        },
        "NFR-002": {
            "name": "初始化时间",
            "target": "初始化 <= 3000ms",
            "actual": {"cold_load_avg_ms": init_load_ms},
            "met": init_load_ms <= 3000.0,
        },
        "NFR-003": {
            "name": "API 延迟",
            "target": "API P95 <= 500ms",
            "actual": {"api_p95_ms": api_p95},
            "met": api_p95 <= 500.0,
        },
    }

    concurrency_obj = {}
    if api_conc_rows:
        row = api_conc_rows[0]
        concurrency_obj = {
            "case_id": row.get("case_id", ""),
            "case_name": row.get("case_name", ""),
            "concurrency": to_int(row.get("concurrency")),
            "total_requests": to_int(row.get("total_requests")),
            "success": to_int(row.get("success")),
            "failed": to_int(row.get("failed")),
            "success_rate": to_float(row.get("success_rate")),
            "error_rate": to_float(row.get("error_rate")),
            "avg_ms": to_float(row.get("avg_ms")),
            "p50_ms": to_float(row.get("p50_ms")),
            "p95_ms": to_float(row.get("p95_ms")),
            "min_ms": to_float(row.get("min_ms")),
            "max_ms": to_float(row.get("max_ms")),
            "throughput_req_s": to_float(row.get("throughput_req_s")),
        }

    summary = {
        "generated_at": datetime.now().isoformat(),
        "run_dir": str(out_dir),
        "environment": env,
        "health": health,
        "functional": {
            "total_samples": to_int(functional.get("total_samples")),
            "passed": to_int(functional.get("passed")),
            "failed": to_int(functional.get("failed")),
            "pass_rate": to_float(functional.get("pass_rate")),
            "cases": functional.get("cases", []),
        },
        "api": {
            "p95_ms": round(api_p95, 2),
            "sequential": {
                "success_rate": weighted_rate(api_cases),
                "cases": api_cases,
            },
            "concurrency": concurrency_obj,
        },
        "ai": {
            "p95_ms": round(ai_p95, 2),
            "success_rate": weighted_rate(ai_cases),
            "cases": ai_cases,
        },
        "frontend": {
            "fps_avg": fe_fps_avg,
            "frame_time_p95_ms": round(fe_frame_p95, 2),
            "cold_load_avg_ms": round(init_load_ms, 2),
            "cases": fe_cases,
        },
        "nfr_alignment": nfr,
        "sources": {
            "functional_summary": "functional-summary.json",
            "api_latency_summary": "api-latency-summary.csv",
            "api_concurrency_summary": "api-concurrency-summary.csv",
            "ai_latency_summary": "ai-latency-summary.csv",
            "frontend_perf_summary": "frontend-perf-summary.csv",
        },
    }
    return summary


def render_thesis_tables(summary: Dict[str, Any]) -> str:
    env = summary.get("environment", {})
    functional = summary.get("functional", {})
    api_cases = summary.get("api", {}).get("sequential", {}).get("cases", [])
    ai_cases = summary.get("ai", {}).get("cases", [])
    fe_cases = summary.get("frontend", {}).get("cases", [])
    nfr = summary.get("nfr_alignment", {})

    lines: List[str] = []
    lines.append("# 第6章数据表（自动生成）")
    lines.append("")
    lines.append("## 6.1 环境表")
    lines.append("")
    lines.append("| 项目 | 实测值 |")
    lines.append("|---|---|")
    lines.append(f"| 操作系统 | {env.get('os', {}).get('caption', '-') } |")
    lines.append(f"| CPU | {env.get('cpu', {}).get('name', '-') } |")
    lines.append(f"| 内存(GB) | {env.get('memory_gb', '-') } |")
    lines.append(f"| Node | {env.get('versions', {}).get('node', '-') } |")
    lines.append(f"| pnpm | {env.get('versions', {}).get('pnpm', '-') } |")
    lines.append(f"| Java | {env.get('versions', {}).get('java', '-') } |")
    lines.append(f"| Maven | {env.get('versions', {}).get('maven', '-') } |")
    lines.append(f"| Python | {env.get('versions', {}).get('python', '-') } |")
    lines.append(f"| Chromium | {env.get('browser', {}).get('version', '-') } |")
    lines.append(f"| Browser UA | {env.get('browser', {}).get('user_agent', '-') } |")
    lines.append("")

    lines.append("## 6.2 功能测试表")
    lines.append("")
    lines.append("| Case | 样本数 | 通过 | 失败 | 通过率(%) | 平均延迟(ms) |")
    lines.append("|---|---:|---:|---:|---:|---:|")
    for c in functional.get("cases", []):
        lines.append(
            f"| {c.get('case_id','')} | {c.get('samples',0)} | {c.get('passed',0)} | "
            f"{c.get('failed',0)} | {c.get('pass_rate',0)} | {c.get('avg_latency_ms',0)} |"
        )
    lines.append(
        f"| 汇总 | {functional.get('total_samples',0)} | {functional.get('passed',0)} | "
        f"{functional.get('failed',0)} | {functional.get('pass_rate',0)} | - |"
    )
    lines.append("")

    lines.append("## 6.3.1 API 顺序延迟")
    lines.append("")
    lines.append("| 接口 | 样本 | 成功率(%) | avg(ms) | p50(ms) | p95(ms) | min(ms) | max(ms) | 吞吐(req/s) |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|---:|")
    for c in api_cases:
        lines.append(
            f"| {c['case_id']} {c['case_name']} | {c['samples']} | {c['success_rate']} | {c['avg_ms']} | "
            f"{c['p50_ms']} | {c['p95_ms']} | {c['min_ms']} | {c['max_ms']} | {c['throughput_req_s']} |"
        )
    lines.append("")

    lines.append("## 6.3.2 前端性能")
    lines.append("")
    lines.append("| 场景 | 样本 | 成功率(%) | DCL avg(ms) | Load avg(ms) | FCP avg(ms) | LCP avg(ms) | FPS avg | P95帧时间(ms) | Heap avg(MB) |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for c in fe_cases:
        lines.append(
            f"| {c['case_id']} {c['case_name']} | {c['samples']} | {c['success_rate']} | {c['dcl_avg_ms']} | "
            f"{c['load_avg_ms']} | {c['fcp_avg_ms']} | {c['lcp_avg_ms']} | {c['fps_avg']} | "
            f"{c['frame_time_p95_ms']} | {c['heap_avg_mb']} |"
        )
    lines.append("")

    lines.append("## 6.3.3 AI 延迟与响应类型")
    lines.append("")
    lines.append("| 场景 | 样本 | 成功率(%) | avg(ms) | p50(ms) | p95(ms) | text | confirmation\\_required | error |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|---:|")
    for c in ai_cases:
        lines.append(
            f"| {c['case_id']} {c['case_name']} | {c['samples']} | {c['success_rate']} | {c['avg_ms']} | "
            f"{c['p50_ms']} | {c['p95_ms']} | {c['type_text']} | {c['type_confirmation_required']} | {c['type_error']} |"
        )
    lines.append("")

    lines.append("## 6.4 NFR 对齐")
    lines.append("")
    lines.append("| 指标 | 目标 | 实测 | 是否达标 |")
    lines.append("|---|---|---|---|")
    for key, obj in nfr.items():
        actual = json.dumps(obj.get("actual", {}), ensure_ascii=False)
        lines.append(f"| {key} {obj.get('name','')} | {obj.get('target','')} | {actual} | {'达标' if obj.get('met') else '未达标'} |")
    lines.append("")

    return "\n".join(lines)


def render_metrics_dictionary() -> str:
    return """# 指标口径字典

- `samples`: 每个 case 的采样次数。功能测试固定 3 次，性能测试默认 30 次。
- `avg_ms`: 算术平均延迟（毫秒）。
- `p50_ms`: 50 分位（中位）延迟，按 nearest-rank 计算。
- `p95_ms`: 95 分位延迟，按 nearest-rank 计算。
- `fps_avg`: 3 秒观测窗口内逐帧 FPS 的平均值。
- `frame_time_p95_ms`: 3 秒观测窗口内帧间隔的 95 分位（毫秒），用于衡量卡顿尾部风险。
- `success_rate`: `success / samples * 100%`。
- `error_rate`: `failed / samples * 100%`。
- `throughput_req_s`: `总请求数 / 实测总时长(秒)`。

统计窗口与规则：
- API 顺序延迟：每接口顺序执行 30 次。
- API 并发：固定并发 20，总请求 100。
- AI 延迟：3 个场景，每场景 30 次。
- 前端性能：3 个场景，每场景 30 次，1920x1080 视口，Chromium 无头模式。
"""


def render_metrics_dictionary_dynamic(out_dir: Path) -> str:
    run_meta = read_json(out_dir / "run-meta.json", {})
    params = run_meta.get("params", {}) if isinstance(run_meta, dict) else {}
    functional_rep = params.get("functional_repetitions", 3)
    perf_rep = params.get("samples", 30)
    concurrency = params.get("concurrency", 20)
    return f"""# 指标口径字典

- `samples`: 每个 case 的采样次数。功能测试固定 {functional_rep} 次，性能测试固定 {perf_rep} 次。
- `avg_ms`: 算术平均延迟（毫秒）。
- `p50_ms`: 50 分位（中位）延迟，按 nearest-rank 计算。
- `p95_ms`: 95 分位延迟，按 nearest-rank 计算。
- `fps_avg`: 3 秒观测窗口内逐帧 FPS 的平均值。
- `frame_time_p95_ms`: 3 秒观测窗口内帧间隔的 95 分位（毫秒），用于衡量卡顿尾部风险。
- `success_rate`: `success / samples * 100%`。
- `error_rate`: `failed / samples * 100%`。
- `throughput_req_s`: `总请求数 / 实测总时长(秒)`。

统计窗口与规则：
- 功能测试：每条用例执行 {functional_rep} 次。
- API 顺序延迟：每接口顺序执行 {perf_rep} 次。
- API 并发：固定并发 {concurrency}，总请求 100。
- AI 延迟：3 个场景，每场景 {perf_rep} 次。
- 前端性能：3 个场景，每场景 {perf_rep} 次，1920x1080 视口，Chromium 无头模式。
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Aggregate CH6 validation results.")
    parser.add_argument("--out-dir", required=True, help="Result directory path.")
    args = parser.parse_args()

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    summary = build_summary(out_dir)

    summary_path = out_dir / "summary.json"
    tables_path = out_dir / "thesis-tables.md"
    dict_path = out_dir / "metrics-dictionary.md"

    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    tables_path.write_text(render_thesis_tables(summary), encoding="utf-8")
    dict_path.write_text(render_metrics_dictionary_dynamic(out_dir), encoding="utf-8")

    print(str(summary_path))


if __name__ == "__main__":
    main()
