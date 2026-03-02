# 指标口径字典

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
