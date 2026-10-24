"""簡單嘅記憶體 rate limit（防暴力破解 / 洗信）。

用法：
    limit(request, "login", max_hits=10, window=60)            # 按 IP
    limit_key(f"login:{email}", max_hits=5, window=300)        # 按 email 等自訂 key

只適合單一 instance（Render 一個 web service 冇問題）。重啟會清零。
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_hits: dict[str, deque[float]] = defaultdict(deque)
_lock = threading.Lock()
_MAX_KEYS = 50_000  # 防止 key 太多食爆記憶體


def client_ip(request: Request) -> str:
    """Render 前面係 Cloudflare：客人真 IP 喺 CF-Connecting-IP（由 Cloudflare 設定，
    客人偽造會被 Cloudflare 拒絕）。X-Forwarded-For 最右邊係 Cloudflare 伺服器 IP，
    好多客人共用，唔用得。本機開發冇呢個 header，就用直接連線 IP。"""
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    return request.client.host if request.client else "unknown"


def limit_key(key: str, max_hits: int, window: int) -> None:
    """window 秒內超過 max_hits 次就回 429。"""
    now = time.monotonic()
    with _lock:
        if len(_hits) > _MAX_KEYS:
            _hits.clear()
        q = _hits[key]
        while q and now - q[0] > window:
            q.popleft()
        if len(q) >= max_hits:
            raise HTTPException(status_code=429, detail="試得太多次，請稍後再試")
        q.append(now)


def limit(request: Request, name: str, max_hits: int, window: int) -> None:
    limit_key(f"{name}:{client_ip(request)}", max_hits, window)
