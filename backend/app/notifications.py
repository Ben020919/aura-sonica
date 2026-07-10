import json
import smtplib
import socket
import urllib.error
import urllib.request
from email.message import EmailMessage

from .config import settings

# Render / 雲容器解 smtp.gmail.com 常會攞到 IPv6，但容器多數冇 IPv6 路由，
# 一連就 [Errno 101] Network is unreachable。強制 DNS 只回 IPv4 就連得到。
_orig_getaddrinfo = socket.getaddrinfo


def _ipv4_only_getaddrinfo(*args, **kwargs):
    res = _orig_getaddrinfo(*args, **kwargs)
    ipv4 = [r for r in res if r[0] == socket.AF_INET]
    return ipv4 or res  # 冇 IPv4 就用返原本，唔會搞爛其他連線


socket.getaddrinfo = _ipv4_only_getaddrinfo


def format_order_email(order) -> tuple[str, str]:
    """由訂單整封通知信（subject, body）。要喺 DB session 仲開住時叫（會讀 order.items）。"""
    lines = [
        f"有新訂單！ 訂單編號 {order.order_no}",
        "",
        f"客人：{order.contact_name}",
        f"電話：{order.contact_phone}",
        f"Email：{order.contact_email or '—'}",
        f"地址：{order.shipping_address}",
        f"備註：{order.note or '—'}",
        "",
        "商品：",
    ]
    for it in order.items:
        lines.append(f"  · {it.product_name} × {it.quantity} = HKD {it.line_total}")
    lines += [
        "",
        f"商品合計：HKD {order.total}",
        "送貨：順豐到付",
        "",
        f"付款：{order.payment_method}（{order.payment_status}）",
        "",
        "— AURA_Sonica 自動通知",
    ]
    subject = (
        f"【AURA_Sonica】新訂單 {order.order_no} — "
        f"{order.contact_name} HKD {order.total}"
    )
    return subject, "\n".join(lines)


def send_email(to: str, subject: str, body: str) -> None:
    """寄信。優先 Brevo HTTP API（雲端唔會封）→ 否則 SMTP（本機）→ 都冇就 log。
    永不 raise，唔會搞爛落單。"""
    if settings.brevo_api_key:
        _send_via_brevo(to, subject, body)
    elif settings.smtp_host and settings.smtp_user:
        _send_via_smtp(to, subject, body)
    else:
        print("[notify] 未配置 email（Brevo / SMTP 都冇），唔會寄信。內容如下：")
        print(f"  To: {to}\n  Subject: {subject}\n{body}")


def _send_via_brevo(to: str, subject: str, body: str) -> None:
    sender = settings.smtp_from or settings.smtp_user or settings.notify_email
    payload = {
        "sender": {"email": sender, "name": "AURA_Sonica"},
        "to": [{"email": to}],
        "subject": subject,
        "textContent": body,
    }
    try:
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "api-key": settings.brevo_api_key,
                "content-type": "application/json",
                "accept": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            resp.read()
        print(f"[notify] 已寄通知去 {to}：{subject}（Brevo）")
    except urllib.error.HTTPError as e:  # noqa: BLE001
        detail = ""
        try:
            detail = e.read().decode("utf-8")
        except Exception:  # noqa: BLE001
            pass
        print(f"[notify] Brevo 寄信失敗（HTTP {e.code}）：{detail}")
    except Exception as e:  # noqa: BLE001
        print(f"[notify] Brevo 寄信失敗：{e}")


def _send_via_smtp(to: str, subject: str, body: str) -> None:
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from or settings.smtp_user
        msg["To"] = to
        msg.set_content(body)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as s:
            s.starttls()
            s.login(settings.smtp_user, settings.smtp_password)
            s.send_message(msg)
        print(f"[notify] 已寄通知去 {to}：{subject}")
    except Exception as e:  # noqa: BLE001
        print(f"[notify] 寄信失敗（訂單照樣成立）：{e}")


def format_customer_confirmation(order) -> tuple[str, str]:
    """客人落單後嘅確認信。"""
    lines = [
        f"{order.contact_name} 你好，",
        "",
        "多謝你喺 AURA_Sonica 落單！以下係你嘅訂單詳情：",
        "",
        f"訂單編號：{order.order_no}",
        "",
        "商品：",
    ]
    for it in order.items:
        lines.append(f"  · {it.product_name} × {it.quantity}  HKD {it.line_total}")
    lines += [
        "",
        f"商品合計：HKD {order.total}",
        "",
        "收貨資料：",
        f"  {order.contact_name} / {order.contact_phone}",
        f"  {order.shipping_address}",
        "",
        "送貨方式：順豐到付",
        "付款：落單後我哋會聯絡你安排商品付款（FPS／轉數快）",
        "如有疑問，可以直接回覆呢封 email。",
        "",
        "— AURA_Sonica 忘聲海",
    ]
    return f"【AURA_Sonica】訂單確認 {order.order_no}", "\n".join(lines)


STATUS_LABELS = {
    "new": "已收到",
    "paid": "已確認收款",
    "shipped": "已出貨",
    "done": "已完成",
    "cancelled": "已取消",
}
STATUS_MESSAGES = {
    "paid": "我哋已收到你嘅付款，會盡快安排寄送。",
    "shipped": "你嘅寶物已經出貨喇，請留意收件 🐚",
    "done": "訂單已完成，多謝你嘅支持 🌊",
    "cancelled": "你嘅訂單已取消，如有疑問歡迎聯絡我哋。",
}


def format_status_update(order) -> tuple[str, str]:
    """Venus 改訂單狀態後，通知客人。"""
    label = STATUS_LABELS.get(order.status, order.status)
    lines = [
        f"{order.contact_name} 你好，",
        "",
        f"你嘅訂單 {order.order_no} 狀態已更新為：{label}",
    ]
    msg = STATUS_MESSAGES.get(order.status)
    if msg:
        lines += ["", msg]
    lines += ["", f"合計：HKD {order.total}", "", "— AURA_Sonica 忘聲海"]
    return f"【AURA_Sonica】訂單 {order.order_no} 更新：{label}", "\n".join(lines)


def format_return_received_admin(order) -> tuple[str, str]:
    """客人申請退貨 → 通知 Venus。"""
    lines = [
        f"客人 {order.contact_name} 申請退貨。",
        "",
        f"訂單編號：{order.order_no}",
        f"退貨編號：{order.return_no}",
        f"原因：{order.return_reason}",
        f"合計：HKD {order.total}",
        f"聯絡：{order.contact_phone} / {order.contact_email or '—'}",
        "",
        "請入後台（訂單）審批。",
        "",
        "— AURA_Sonica 自動通知",
    ]
    return (
        f"【AURA_Sonica】退貨申請 {order.return_no}（訂單 {order.order_no}）",
        "\n".join(lines),
    )


RETURN_LABELS = {
    "requested": "已收到申請",
    "approved": "已批准",
    "rejected": "未能受理",
    "refunded": "已退款",
}


def format_return_customer(order) -> tuple[str, str]:
    """退貨狀態更新 → 通知客人。"""
    label = RETURN_LABELS.get(order.return_status, order.return_status)
    lines = [
        f"{order.contact_name} 你好，",
        "",
        f"你嘅退貨申請 {order.return_no}（訂單 {order.order_no}）狀態：{label}",
    ]
    if order.return_status == "requested":
        lines += ["", "我哋會喺 1–2 個工作天內審核；通過後會通知你退貨編號同寄件方式。"]
    elif order.return_status == "approved":
        lines += ["", "已批准 ✅ 請將商品保持全新、連同原包裝寄回："]
        lines += [order.return_note or "（我哋會再聯絡你寄件方式）"]
    elif order.return_status == "rejected":
        lines += ["", "很抱歉，未能受理你嘅退貨申請。"]
        if order.return_note:
            lines += [f"原因：{order.return_note}"]
    elif order.return_status == "refunded":
        lines += ["", "已收到退貨並完成退款，款項會退回你原本嘅付款方式。多謝你嘅體諒 🌊"]
    lines += ["", "— AURA_Sonica 忘聲海"]
    return f"【AURA_Sonica】退貨 {order.return_no}：{label}", "\n".join(lines)


def format_password_reset(user, code: str) -> tuple[str, str]:
    """忘記密碼 → 寄重設驗證碼。"""
    lines = [
        f"{user.name or ''} 你好，",
        "",
        "你嘅 AURA_Sonica 密碼重設驗證碼係：",
        "",
        f"        {code}",
        "",
        "15 分鐘內有效。如果唔係你申請,可以直接忽略呢封 email。",
        "",
        "— AURA_Sonica 忘聲海",
    ]
    return "【AURA_Sonica】密碼重設驗證碼", "\n".join(lines)
