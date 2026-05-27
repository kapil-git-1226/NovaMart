import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Sends a fully structured OTP email using a table-based HTML layout
    (Gmail-safe — no flexbox/grid). Returns True on success, False on failure.
    """
    subject = "🔐 Your NovaMart Login Code"

    # ── Plain-text fallback (shown if HTML fails) ─────────────────────
    text_body = f"""\
NovaMart — Secure Login Code
==============================

Hello,

You requested a one-time login code for your NovaMart account.

Your verification code is:

    {otp_code}

This code is valid for 4 minutes and can only be used once.
Do NOT share this code with anyone — NovaMart will never ask for it.

If you did not request this code, please ignore this email.
Your account remains secure.

──────────────────────────────
© 2025 NovaMart · Omnichannel Retail Platform
"""

    # ── HTML body — table-based layout (Gmail / Outlook safe) ─────────
    # Spacing the OTP digits for readability
    spaced_otp = "  ".join(list(otp_code))

    html_body = f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NovaMart Login Code</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:Arial,Helvetica,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#0f0f0f;padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="520" cellpadding="0" cellspacing="0" border="0"
               style="background-color:#1a1a1a;border-radius:16px;
                      border:1px solid #2a2a2a;overflow:hidden;">

          <!-- ── Header banner ── -->
          <tr>
            <td align="center"
                style="background-color:#b45309;padding:28px 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <!-- Cart icon (SVG inline so it renders everywhere) -->
                    <svg width="32" height="32" viewBox="0 0 24 24"
                         fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                            stroke="#ffffff" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round"/>
                      <line x1="3" y1="6" x2="21" y2="6"
                            stroke="#ffffff" stroke-width="2"
                            stroke-linecap="round"/>
                      <path d="M16 10a4 4 0 01-8 0"
                            stroke="#ffffff" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px;font-weight:800;
                                 color:#ffffff;letter-spacing:-0.5px;">
                      NovaMart
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding:36px 44px 28px;">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;
                         color:#f5f5f5;letter-spacing:-0.3px;">
                Verify your identity
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#888888;
                         line-height:1.6;">
                Use the code below to sign in to your NovaMart account.
                This code was requested just now.
              </p>

              <!-- OTP box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="margin-bottom:28px;">
                <tr>
                  <td align="center"
                      style="background-color:#111111;
                             border:2px solid #f59e0b;
                             border-radius:12px;
                             padding:24px 16px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;
                               letter-spacing:2px;color:#888888;
                               text-transform:uppercase;">
                      One-Time Login Code
                    </p>
                    <p style="margin:0;font-size:40px;font-weight:800;
                               letter-spacing:14px;color:#f59e0b;
                               font-family:'Courier New',Courier,monospace;">
                      {spaced_otp}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#1f1a0f;border-left:3px solid #f59e0b;
                              border-radius:4px;padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#d97706;font-weight:600;">
                      ⏱ This code expires in <strong>4 minutes</strong>.
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:#78716c;">
                      It can only be used once. Do not share it with anyone.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Steps guide -->
              <p style="margin:0 0 12px;font-size:13px;font-weight:600;
                         color:#aaaaaa;text-transform:uppercase;letter-spacing:1px;">
                How to use
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="margin-bottom:32px;">
                <tr>
                  <td width="28" valign="top"
                      style="padding-top:1px;">
                    <div style="width:22px;height:22px;background-color:#f59e0b;
                                border-radius:50%;text-align:center;
                                font-size:12px;font-weight:700;color:#000;
                                line-height:22px;">1</div>
                  </td>
                  <td style="padding-left:10px;padding-bottom:10px;
                              font-size:13px;color:#999999;line-height:1.5;">
                    Go back to the NovaMart login page
                  </td>
                </tr>
                <tr>
                  <td width="28" valign="top" style="padding-top:1px;">
                    <div style="width:22px;height:22px;background-color:#f59e0b;
                                border-radius:50%;text-align:center;
                                font-size:12px;font-weight:700;color:#000;
                                line-height:22px;">2</div>
                  </td>
                  <td style="padding-left:10px;padding-bottom:10px;
                              font-size:13px;color:#999999;line-height:1.5;">
                    Enter the 6-digit code shown above
                  </td>
                </tr>
                <tr>
                  <td width="28" valign="top" style="padding-top:1px;">
                    <div style="width:22px;height:22px;background-color:#f59e0b;
                                border-radius:50%;text-align:center;
                                font-size:12px;font-weight:700;color:#000;
                                line-height:22px;">3</div>
                  </td>
                  <td style="padding-left:10px;
                              font-size:13px;color:#999999;line-height:1.5;">
                    Click <strong style="color:#f5f5f5;">Verify &amp; Sign In</strong>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#141414;border-radius:8px;
                              padding:14px 16px;border:1px solid #222;">
                    <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;">
                      🔒 <strong style="color:#666;">Not you?</strong>
                      If you did not request this code, you can safely ignore
                      this email. Your account has not been accessed and
                      no action is required.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="border-top:1px solid #222222;padding:20px 44px;
                        background-color:#141414;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:11px;color:#444444;line-height:1.6;">
                    © 2025 NovaMart &nbsp;·&nbsp; Omnichannel Retail Platform<br/>
                    This is an automated message — please do not reply.
                  </td>
                  <td align="right"
                      style="font-size:11px;color:#555555;font-weight:600;">
                    🛒 NovaMart
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"NovaMart <{settings.SMTP_USER}>"
    msg["To"]      = to_email

    # IMPORTANT: attach plain text FIRST, HTML second.
    # Email clients show the last part they can render — so HTML wins when supported.
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html",  "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()   # second ehlo after starttls is required by some servers
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info(f"[EMAIL] OTP email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"[EMAIL] Failed to send OTP email to {to_email}: {e}")
        return False

