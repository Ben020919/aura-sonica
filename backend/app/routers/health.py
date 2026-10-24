from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok", "service": "aura-sonica-api"}


# TEMP：核實 Render 代理點樣傳客人 IP，測試完即刪
from fastapi import Request  # noqa: E402


@router.get("/api/_ipcheck")
def _ipcheck(request: Request):
    h = request.headers
    return {
        "xff": h.get("x-forwarded-for"),
        "cf": h.get("cf-connecting-ip"),
        "true_client": h.get("true-client-ip"),
        "x_real_ip": h.get("x-real-ip"),
        "client": request.client.host if request.client else None,
    }
