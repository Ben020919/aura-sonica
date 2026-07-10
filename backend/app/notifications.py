import json
import smtplib
import socket
import urllib.error
import urllib.request
from email.message import EmailMessage
from html import escape as esc

from .config import settings

# Render / 雲容器解 smtp.gmail.com 常會攞到 IPv6，但容器多數冇 IPv6 路由，
# 一連就 [Errno 101] Network is unreachable。強制 DNS 只回 IPv4 就連得到。
_orig_getaddrinfo = socket.getaddrinfo


def _ipv4_only_getaddrinfo(*args, **kwargs):
    res = _orig_getaddrinfo(*args, **kwargs)
    ipv4 = [r for r in res if r[0] == socket.AF_INET]
    return ipv4 or res  # 冇 IPv4 就用返原本，唔會搞爛其他連線


socket.getaddrinfo = _ipv4_only_getaddrinfo


# ── 寄信 ────────────────────────────────────────
def send_email(to: str, subject: str, text: str, html: str | None = None) -> None:
    """寄信。優先 Brevo HTTP API（雲端唔會封）→ 否則 SMTP（本機）→ 都冇就 log。
    text = 純文字後備；html = 靚版（有就一齊寄，郵件客戶端自動揀 HTML）。永不 raise。"""
    if settings.brevo_api_key:
        _send_via_brevo(to, subject, text, html)
    elif settings.smtp_host and settings.smtp_user:
        _send_via_smtp(to, subject, text, html)
    else:
        print("[notify] 未配置 email（Brevo / SMTP 都冇），唔會寄信。內容如下：")
        print(f"  To: {to}\n  Subject: {subject}\n{text}")


def _send_via_brevo(to: str, subject: str, text: str, html: str | None = None) -> None:
    sender = settings.smtp_from or settings.smtp_user or settings.notify_email
    payload = {
        "sender": {"email": sender, "name": "AURA_Sonica"},
        "to": [{"email": to}],
        "subject": subject,
        "textContent": text,
    }
    if html:
        payload["htmlContent"] = html
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


def _send_via_smtp(to: str, subject: str, text: str, html: str | None = None) -> None:
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from or settings.smtp_user
        msg["To"] = to
        msg.set_content(text)
        if html:
            msg.add_alternative(html, subtype="html")
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as s:
            s.starttls()
            s.login(settings.smtp_user, settings.smtp_password)
            s.send_message(msg)
        print(f"[notify] 已寄通知去 {to}：{subject}")
    except Exception as e:  # noqa: BLE001
        print(f"[notify] 寄信失敗（訂單照樣成立）：{e}")


# ── 品牌化 HTML email ───────────────────────────
def _money(v) -> str:
    """HKD 金額：整數唔顯示 .0，有仙先顯示兩位。"""
    v = float(v or 0)
    return f"{v:,.0f}" if v == int(v) else f"{v:,.2f}"


def _email_html(inner: str) -> str:
    """品牌化 HTML 外殼：海洋漸變 header + 白卡 + footer。"""
    return f"""\
<div style="margin:0;padding:28px 12px;background:#eaf1f2;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,'PingFang HK','Microsoft JhengHei','Heiti TC',sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;margin:0 auto;border-collapse:separate;">
    <tr><td style="background-color:#2f6d7a;background-image:linear-gradient(135deg,#2f6d7a,#57a3ad);padding:32px 24px;text-align:center;border-radius:18px 18px 0 0;">
      <div style="font-size:23px;letter-spacing:5px;color:#ffffff;font-weight:600;">AURA_Sonica</div>
      <div style="font-size:13px;letter-spacing:4px;color:#dcecef;margin-top:9px;">🐚　🌊　🐚</div>
    </td></tr>
    <tr><td style="background:#ffffff;padding:34px 30px;color:#3a4d51;font-size:15px;line-height:1.75;">
{inner}
    </td></tr>
    <tr><td style="background:#ffffff;padding:4px 30px 30px;border-radius:0 0 18px 18px;">
      <div style="border-top:1px solid #eef3f4;padding-top:18px;text-align:center;color:#9fb2b6;font-size:12px;line-height:1.9;">
        AURA_Sonica<br>有任何疑問，直接回覆呢封 email 就得 🌊
      </div>
    </td></tr>
  </table>
</div>"""


def _items_rows(order) -> str:
    rows = ""
    for it in order.items:
        rows += (
            '<tr><td style="padding:11px 0;border-bottom:1px solid #f0f4f5;">'
            f'{esc(it.product_name)} <span style="color:#9fb2b6;">× {it.quantity}</span></td>'
            '<td style="padding:11px 0;border-bottom:1px solid #f0f4f5;text-align:right;white-space:nowrap;">'
            f'HKD {_money(it.line_total)}</td></tr>'
        )
    return rows


def _status_pill(label: str) -> str:
    return (
        '<div style="text-align:center;margin:0 0 22px;">'
        '<span style="display:inline-block;background:#2f6d7a;color:#ffffff;border-radius:999px;'
        f'padding:10px 26px;font-size:16px;font-weight:600;letter-spacing:1px;">{esc(label)}</span></div>'
    )


# ── 各封信 ──────────────────────────────────────
def format_order_email(order) -> tuple[str, str, str]:
    """新訂單 → 通知 Venus。要喺 DB session 仲開住時叫（會讀 order.items）。"""
    subject = (
        f"【AURA_Sonica】新訂單 {order.order_no} — "
        f"{order.contact_name} HKD {_money(order.total)}"
    )
    tlines = [
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
        tlines.append(f"  · {it.product_name} × {it.quantity} = HKD {_money(it.line_total)}")
    tlines += [
        "",
        f"商品合計：HKD {_money(order.total)}",
        "送貨：順豐到付",
        "",
        f"付款：{order.payment_method}（{order.payment_status}）",
        "",
        "— AURA_Sonica 自動通知",
    ]
    inner = f"""\
<p style="margin:0 0 18px;font-size:16px;"><b style="color:#1f4a54;">🔔 有新訂單</b>　<span style="color:#9fb2b6;">{esc(order.order_no)}</span></p>
<div style="font-size:14px;line-height:2;color:#3a4d51;margin:0 0 18px;">
  <b>客人</b>：{esc(order.contact_name)}<br>
  <b>電話</b>：{esc(order.contact_phone)}<br>
  <b>Email</b>：{esc(order.contact_email or '—')}<br>
  <b>地址</b>：{esc(order.shipping_address)}<br>
  <b>備註</b>：{esc(order.note or '—')}
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3a4d51;border-collapse:collapse;">
  {_items_rows(order)}
  <tr><td style="padding:14px 0 0;font-weight:700;">商品合計</td>
      <td style="padding:14px 0 0;text-align:right;font-weight:700;color:#1f4a54;">HKD {_money(order.total)}</td></tr>
</table>
<p style="margin:18px 0 0;color:#6b8085;font-size:13.5px;">送貨：順豐到付　·　付款：{esc(order.payment_method)}（{esc(order.payment_status)}）</p>"""
    return subject, "\n".join(tlines), _email_html(inner)


def format_customer_confirmation(order) -> tuple[str, str, str]:
    """客人落單後嘅確認信。"""
    subject = f"【AURA_Sonica】訂單確認 {order.order_no}"
    tlines = [
        f"{order.contact_name} 你好，",
        "",
        "多謝你喺 AURA_Sonica 落單！以下係你嘅訂單詳情：",
        "",
        f"訂單編號：{order.order_no}",
        "",
        "商品：",
    ]
    for it in order.items:
        tlines.append(f"  · {it.product_name} × {it.quantity}  HKD {_money(it.line_total)}")
    tlines += [
        "",
        f"商品合計：HKD {_money(order.total)}",
        "",
        "收貨資料：",
        f"  {order.contact_name} / {order.contact_phone}",
        f"  {order.shipping_address}",
        "",
        "送貨方式：順豐到付",
        "付款：落單後我哋會聯絡你安排商品付款（FPS／轉數快）",
        "如有疑問，可以直接回覆呢封 email。",
        "",
        "— AURA_Sonica",
    ]
    inner = f"""\
<p style="margin:0 0 6px;">{esc(order.contact_name)} 你好，</p>
<p style="margin:0 0 22px;color:#6b8085;">多謝你喺 AURA_Sonica 落單！以下係訂單詳情 🐚</p>
<div style="background:#f6fafb;border-radius:12px;padding:15px 18px;margin:0 0 22px;">
  <span style="color:#9fb2b6;font-size:13px;">訂單編號</span><br>
  <span style="font-size:18px;font-weight:700;color:#1f4a54;letter-spacing:1px;">{esc(order.order_no)}</span>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3a4d51;border-collapse:collapse;">
  {_items_rows(order)}
  <tr><td style="padding:14px 0 0;font-weight:700;">商品合計</td>
      <td style="padding:14px 0 0;text-align:right;font-weight:700;color:#1f4a54;">HKD {_money(order.total)}</td></tr>
</table>
<div style="border-top:1px solid #eef3f4;margin:22px 0 0;padding:20px 0 0;font-size:14px;line-height:1.9;">
  <div style="color:#9fb2b6;font-size:13px;margin-bottom:4px;">收貨資料</div>
  {esc(order.contact_name)} · {esc(order.contact_phone)}<br>
  {esc(order.shipping_address)}
</div>
<div style="background:#f6fafb;border-radius:12px;padding:16px 18px;margin:20px 0 0;font-size:13.5px;line-height:1.95;color:#5a6f74;">
  📦 <b style="color:#3a4d51;">送貨</b>：順豐到付<br>
  💳 <b style="color:#3a4d51;">付款</b>：我哋會盡快聯絡你安排商品付款（FPS／轉數快）
</div>"""
    return subject, "\n".join(tlines), _email_html(inner)


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


def format_status_update(order) -> tuple[str, str, str]:
    """Venus 改訂單狀態後，通知客人。"""
    label = STATUS_LABELS.get(order.status, order.status)
    subject = f"【AURA_Sonica】訂單 {order.order_no} 更新：{label}"
    msg = STATUS_MESSAGES.get(order.status)
    tlines = [
        f"{order.contact_name} 你好，",
        "",
        f"你嘅訂單 {order.order_no} 狀態已更新為：{label}",
    ]
    if msg:
        tlines += ["", msg]
    tlines += ["", f"合計：HKD {_money(order.total)}", "", "— AURA_Sonica"]
    msg_html = f'<p style="margin:0 0 22px;color:#6b8085;">{esc(msg)}</p>' if msg else ""
    inner = f"""\
<p style="margin:0 0 20px;">{esc(order.contact_name)} 你好，</p>
<p style="margin:0 0 18px;">你嘅訂單 <b style="color:#1f4a54;">{esc(order.order_no)}</b> 狀態已更新：</p>
{_status_pill(label)}
{msg_html}
<p style="margin:0;color:#9fb2b6;font-size:14px;">訂單合計：HKD {_money(order.total)}</p>"""
    return subject, "\n".join(tlines), _email_html(inner)


def format_return_received_admin(order) -> tuple[str, str, str]:
    """客人申請退貨 → 通知 Venus。"""
    subject = f"【AURA_Sonica】退貨申請 {order.return_no}（訂單 {order.order_no}）"
    tlines = [
        f"客人 {order.contact_name} 申請退貨。",
        "",
        f"訂單編號：{order.order_no}",
        f"退貨編號：{order.return_no}",
        f"原因：{order.return_reason}",
        f"合計：HKD {_money(order.total)}",
        f"聯絡：{order.contact_phone} / {order.contact_email or '—'}",
        "",
        "請入後台（訂單）審批。",
        "",
        "— AURA_Sonica 自動通知",
    ]
    inner = f"""\
<p style="margin:0 0 18px;font-size:16px;"><b style="color:#1f4a54;">↩️ 退貨申請</b>　<span style="color:#9fb2b6;">{esc(order.return_no)}</span></p>
<div style="font-size:14px;line-height:2;color:#3a4d51;margin:0 0 18px;">
  <b>客人</b>：{esc(order.contact_name)}<br>
  <b>訂單編號</b>：{esc(order.order_no)}<br>
  <b>原因</b>：{esc(order.return_reason or '—')}<br>
  <b>合計</b>：HKD {_money(order.total)}<br>
  <b>聯絡</b>：{esc(order.contact_phone)} / {esc(order.contact_email or '—')}
</div>
<p style="margin:0;color:#6b8085;font-size:13.5px;">請入後台（訂單）審批。</p>"""
    return subject, "\n".join(tlines), _email_html(inner)


RETURN_LABELS = {
    "requested": "已收到申請",
    "approved": "已批准",
    "rejected": "未能受理",
    "refunded": "已退款",
}


def format_return_customer(order) -> tuple[str, str, str]:
    """退貨狀態更新 → 通知客人。"""
    label = RETURN_LABELS.get(order.return_status, order.return_status)
    subject = f"【AURA_Sonica】退貨 {order.return_no}：{label}"
    tlines = [
        f"{order.contact_name} 你好，",
        "",
        f"你嘅退貨申請 {order.return_no}（訂單 {order.order_no}）狀態：{label}",
    ]
    extra_html = ""
    if order.return_status == "requested":
        note = "我哋會喺 1–2 個工作天內審核；通過後會通知你退貨編號同寄件方式。"
        tlines += ["", note]
        extra_html = f'<p style="margin:0;color:#6b8085;">{esc(note)}</p>'
    elif order.return_status == "approved":
        addr = order.return_note or "（我哋會再聯絡你寄件方式）"
        tlines += ["", "已批准 ✅ 請將商品保持全新、連同原包裝寄回：", addr]
        extra_html = (
            '<p style="margin:0 0 10px;color:#6b8085;">已批准 ✅ 請將商品保持全新、連同原包裝寄回：</p>'
            f'<div style="background:#f6fafb;border-radius:10px;padding:13px 16px;color:#3a4d51;">{esc(addr)}</div>'
        )
    elif order.return_status == "rejected":
        tlines += ["", "很抱歉，未能受理你嘅退貨申請。"]
        extra_html = '<p style="margin:0;color:#6b8085;">很抱歉，未能受理你嘅退貨申請。</p>'
        if order.return_note:
            tlines += [f"原因：{order.return_note}"]
            extra_html += f'<p style="margin:10px 0 0;color:#6b8085;">原因：{esc(order.return_note)}</p>'
    elif order.return_status == "refunded":
        note = "已收到退貨並完成退款，款項會退回你原本嘅付款方式。多謝你嘅體諒 🌊"
        tlines += ["", note]
        extra_html = f'<p style="margin:0;color:#6b8085;">{esc(note)}</p>'
    tlines += ["", "— AURA_Sonica"]
    inner = f"""\
<p style="margin:0 0 20px;">{esc(order.contact_name)} 你好，</p>
<p style="margin:0 0 16px;">退貨申請 <b style="color:#1f4a54;">{esc(order.return_no)}</b>（訂單 {esc(order.order_no)}）狀態：</p>
{_status_pill(label)}
{extra_html}"""
    return subject, "\n".join(tlines), _email_html(inner)


def format_password_reset(user, code: str) -> tuple[str, str, str]:
    """忘記密碼 → 寄重設驗證碼。"""
    hello = f"{user.name} 你好，" if user.name else "你好，"
    subject = "【AURA_Sonica】密碼重設驗證碼"
    tlines = [
        hello,
        "",
        "你嘅 AURA_Sonica 密碼重設驗證碼係：",
        "",
        f"        {code}",
        "",
        "15 分鐘內有效。如果唔係你申請，可以直接忽略呢封 email。",
        "",
        "— AURA_Sonica",
    ]
    inner = f"""\
<p style="margin:0 0 18px;">{esc(hello)}</p>
<p style="margin:0 0 26px;">我哋收到你嘅密碼重設要求，請用以下驗證碼完成重設：</p>
<div style="text-align:center;margin:0 0 24px;">
  <span style="display:inline-block;background:#eef5f6;border:1px solid #d6e6e9;border-radius:12px;padding:16px 30px;font-size:34px;letter-spacing:12px;font-weight:700;color:#1f4a54;font-family:'SF Mono',Menlo,Consolas,monospace;">{esc(code)}</span>
</div>
<p style="margin:0;text-align:center;color:#9fb2b6;font-size:13px;line-height:1.7;">15 分鐘內有效 · 唔係你申請可以忽略呢封 email</p>"""
    return subject, "\n".join(tlines), _email_html(inner)


def format_note(alias: str, message: str) -> tuple[str, str, str]:
    """首頁留言 → 通知 Venus。"""
    subject = f"🐚 AURA_Sonica 留言 — 來自 {alias}"
    text = f"簡稱：{alias}\n\n{message}\n\n— 由 AURA_Sonica 送出"
    inner = f"""\
<p style="margin:0 0 20px;font-size:16px;"><b style="color:#1f4a54;">💌 有人留低咗一句說話</b></p>
<div style="background:#f6fafb;border-radius:12px;padding:14px 18px;margin:0 0 20px;">
  <span style="color:#9fb2b6;font-size:13px;">簡稱</span><br>
  <span style="font-size:16px;font-weight:600;color:#1f4a54;">{esc(alias)}</span>
</div>
<div style="white-space:pre-wrap;line-height:1.95;color:#3a4d51;font-size:15px;">{esc(message)}</div>"""
    return subject, text, _email_html(inner)
