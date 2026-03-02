#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from typing import Any, Dict, List


def find_case(cases: List[Dict[str, Any]], case_id: str) -> Dict[str, Any]:
    for c in cases:
        if c.get("case_id") == case_id:
            return c
    return {}


def fmt(v: Any, digits: int = 2) -> str:
    try:
        f = float(v)
        return f"{f:.{digits}f}"
    except Exception:
        return str(v)


def build_snippets(summary: Dict[str, Any]) -> Dict[str, str]:
    env = summary.get("environment", {})
    functional = summary.get("functional", {})
    api = summary.get("api", {})
    ai = summary.get("ai", {})
    fe = summary.get("frontend", {})
    nfr = summary.get("nfr_alignment", {})

    api_cases = api.get("sequential", {}).get("cases", [])
    ai_cases = ai.get("cases", [])
    fe_cases = fe.get("cases", [])
    func_cases = functional.get("cases", [])
    func_rep = find_case(func_cases, "F01").get("samples", 0) if func_cases else 0
    perf_rep = ai_cases[0].get("samples", 0) if ai_cases else 0
    fe_cold = find_case(fe_cases, "FE01")
    fe_warm = find_case(fe_cases, "FE02")
    fe_inter = find_case(fe_cases, "FE03")

    s61 = (
        "统计口径说明：本章所有指标均来自 tests/ch6-validation 工具链实测，"
        f"功能用例每项执行 {func_rep} 次，性能用例每项执行 {perf_rep} 次；"
        "分位数采用 nearest-rank 统计，API 与 AI 延迟单位为 ms，"
        "前端帧率基于 3 秒观测窗口计算平均 FPS 与 P95 帧时间。"
        f"本次实测环境为 {env.get('os', {}).get('caption', '-')}"
        f"，CPU {env.get('cpu', {}).get('name', '-')}"
        f"，内存 {env.get('memory_gb', '-')} GB，"
        f"Node {env.get('versions', {}).get('node', '-')}"
        f"，Java {env.get('versions', {}).get('java', '-')}"
        f"，Python {env.get('versions', {}).get('python', '-')}"
        f"，浏览器 Chromium {env.get('browser', {}).get('version', '-')}"
        "。"
    )

    s62 = (
        f"功能测试共执行 {functional.get('total_samples', 0)} 次，"
        f"通过 {functional.get('passed', 0)} 次，失败 {functional.get('failed', 0)} 次，"
        f"总体通过率为 {fmt(functional.get('pass_rate', 0))}\\%。"
        "对认证、鉴权、动态路由、AI 健康检查与 AI 确认链路的覆盖结果均来自同一轮完整实测目录，"
        "未进行挑选或人工修正。"
    )

    api_p95 = fmt(api.get("p95_ms", 0))
    ai_p95 = fmt(ai.get("p95_ms", 0))
    fe_fps = fmt(fe.get("fps_avg", 0))
    fe_frame_p95 = fmt(fe.get("frame_time_p95_ms", 0))

    s631 = (
        f"API 性能采用顺序 {perf_rep} 次采样与关键接口并发压测。"
        f"本轮顺序测试最差 P95 为 {api_p95} ms；"
        f"并发压测结果见表格行（固定并发 20，总请求 100）。"
    )

    s632 = (
        "前端性能覆盖冷启动、缓存重载与关键交互三种场景。"
        f"综合平均 FPS 为 {fe_fps}，P95 帧时间为 {fe_frame_p95} ms。"
        f"冷启动 Load 平均 {fmt(fe_cold.get('load_avg_ms', 0))} ms，"
        f"缓存重载 Load 平均 {fmt(fe_warm.get('load_avg_ms', 0))} ms，"
        f"关键交互场景 FPS 平均 {fmt(fe_inter.get('fps_avg', 0))}。"
    )

    s633 = (
        "AI 端到端延迟覆盖普通问答、检索倾向问答与确认型高风险意图三类场景。"
        f"本轮最差 P95 为 {ai_p95} ms，"
        "并统计了 text / confirmation_required / error 三种响应类型分布。"
    )

    nfr1 = nfr.get("NFR-001", {})
    nfr2 = nfr.get("NFR-002", {})
    nfr3 = nfr.get("NFR-003", {})
    s64 = (
        f"NFR-001（FPS $\\geq$ 30）实测为 {fe_fps}，"
        f"{'达标' if nfr1.get('met') else '未达标'}；"
        f"NFR-002（初始化 $\\leq$ 3s）冷启动平均 "
        f"{fmt(fe.get('cold_load_avg_ms', 0))} ms，"
        f"{'达标' if nfr2.get('met') else '未达标'}；"
        f"NFR-003（API P95 $\\leq$ 500ms）实测最差 P95 为 {api_p95} ms，"
        f"{'达标' if nfr3.get('met') else '未达标'}。"
        "对于未达标项，均按实测值披露，并在章节中给出可执行优化方向（缓存策略、查询索引、接口拆分与前端渲染负载治理）。"
    )

    return {
        "section_6_1_text": s61,
        "section_6_2_text": s62,
        "section_6_3_1_text": s631,
        "section_6_3_2_text": s632,
        "section_6_3_3_text": s633,
        "section_6_4_text": s64,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Export thesis snippets from summary.json.")
    parser.add_argument("--out-dir", required=True, help="Result directory path.")
    args = parser.parse_args()

    out_dir = Path(args.out_dir).resolve()
    summary_path = out_dir / "summary.json"
    if not summary_path.exists():
        raise FileNotFoundError(f"summary.json not found: {summary_path}")

    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    snippets = build_snippets(summary)

    json_path = out_dir / "thesis-snippets.json"
    md_path = out_dir / "thesis-snippets.md"

    json_path.write_text(json.dumps(snippets, ensure_ascii=False, indent=2), encoding="utf-8")

    md_lines = ["# 第6章回填片段（自动生成）", ""]
    for key, text in snippets.items():
        md_lines.append(f"## {key}")
        md_lines.append("")
        md_lines.append(text)
        md_lines.append("")
    md_path.write_text("\n".join(md_lines), encoding="utf-8")

    print(str(md_path))


if __name__ == "__main__":
    main()
