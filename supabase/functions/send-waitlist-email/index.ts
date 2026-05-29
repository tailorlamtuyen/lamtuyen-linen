import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const FROM = Deno.env.get("RESEND_FROM") ?? "Lam Tuyen Linen <onboarding@resend.dev>";
const SURL = Deno.env.get("SUPABASE_URL") ?? "";
const SROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SHOP_EMAIL = "tailorlamtuyen@gmail.com";
const DISCOUNT = 20;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateTicketCode(email: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GT-";
  let n = email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + Date.now();
  for (let i = 0; i < 6; i++) { code += chars[n % chars.length]; n = Math.floor(n / 37) + i * 7919 + 13; }
  return code;
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Lam Tuyen Linen", email: SHOP_EMAIL },
      to: [{ email: to }],
      replyTo: { email: SHOP_EMAIL },
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error("Email failed " + res.status + ": " + await res.text());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { name, email, phone, country, garment_interest } = await req.json();
    if (!name || !email) throw new Error("name and email required");

    const firstName = name.split(" ")[0] || name;
    const ticketCode = generateTicketCode(email);
    const sb = createClient(SURL, SROLE);

    await sb.from("golden_ticket_members").upsert({
      name, email, phone: phone || null, country: country || null,
      ticket_code: ticketCode, garment_interest: garment_interest || null,
      discount_percent: DISCOUNT,
    }, { onConflict: "email" });

    const customerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1A1208;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:580px;margin:0 auto;padding:32px 16px">
  <div style="text-align:center;padding:44px 32px 36px;background:#2C1F10;border:1px solid rgba(184,147,90,.2);border-radius:4px 4px 0 0">
    <p style="color:rgba(184,147,90,.55);font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 18px">Lam Tuyen Linen · Han Market · Da Nang</p>
    <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:300;color:#EDE4D0;margin:0 0 6px;letter-spacing:3px;line-height:1.35">You have been<br>granted access.</h1>
    <div style="width:36px;height:1px;background:rgba(184,147,90,.45);margin:18px auto"></div>
    <p style="color:rgba(184,147,90,.65);font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0">✦ Golden Ticket Member ✦</p>
  </div>
  <div style="background:#FAF6EE;padding:36px 32px">
    <p style="color:#5A4530;font-size:15px;line-height:1.8;margin:0 0 18px">Dear ${esc(firstName)},</p>
    <p style="color:#5A4530;font-size:14px;line-height:1.9;margin:0 0 16px">Before our doors open to the world — you are already inside.</p>
    <p style="color:#5A4530;font-size:14px;line-height:1.9;margin:0 0 16px">You are one of a very select few who believed in us before a single piece was listed. That kind of trust is rare, and it does not go unnoticed. As a founding member of Lam Tuyen Linen, you will receive first access to every garment, every colour drop, and every limited piece we release.</p>
    <p style="color:#5A4530;font-size:14px;line-height:1.9;margin:0 0 30px">And because you were here before everyone else — we have something that cannot be bought.</p>
    <div style="background:#2C1F10;border-radius:6px;padding:32px 24px;margin:0 0 28px;text-align:center">
      <p style="color:rgba(184,147,90,.55);font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 10px">Your Personal Golden Ticket</p>
      <div style="font-family:Georgia,serif;font-size:38px;font-weight:300;color:#B8935A;letter-spacing:8px;margin:10px 0 14px">${esc(ticketCode)}</div>
      <div style="width:50px;height:1px;background:rgba(184,147,90,.3);margin:0 auto 14px"></div>
      <p style="color:#EDE4D0;font-size:24px;font-weight:300;margin:0 0 6px;font-family:Georgia,serif">${DISCOUNT}% Off — Everything</p>
      <p style="color:rgba(237,228,208,.4);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0">Founding member exclusive · No minimum · No restrictions</p>
    </div>
    <p style="color:#5A4530;font-size:14px;line-height:1.9;margin:0 0 16px">When we open, enter your code at checkout and ${DISCOUNT}% will be removed from your entire order automatically. This code is yours alone — it has your name on it.</p>
    <p style="color:#5A4530;font-size:14px;line-height:1.9;margin:0 0 28px">Keep this email somewhere safe. We will remind you when the time comes.</p>
    <div style="background:#F3EDE0;border-left:3px solid #B8935A;padding:16px 20px;margin:0 0 28px;border-radius:2px">
      <p style="color:#8A7058;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">What is coming</p>
      <p style="color:#5A4530;font-size:13px;line-height:1.8;margin:0">Pure linen clothing — dresses, blouses, shirts, trousers, sets, and bespoke áo dài — all cut and sewn to your exact measurements. 10 natural colours. 20+ years of craft. Shipped to ${esc(country || "your door")}.</p>
    </div>
    <p style="color:#5A4530;font-size:14px;line-height:1.8;margin:0 0 18px">Follow our journey as we prepare to open:</p>
    <div style="margin:0 0 32px">
      <a href="https://instagram.com/tailor.lamtuyen" style="display:inline-block;margin:0 8px 8px 0;color:#B8935A;font-size:11px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:10px 18px;border:1px solid rgba(184,147,90,.35);border-radius:2px">📷 Instagram</a>
      <a href="https://tiktok.com/@tailor.lamtuyen" style="display:inline-block;margin:0 8px 8px 0;color:#B8935A;font-size:11px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:10px 18px;border:1px solid rgba(184,147,90,.35);border-radius:2px">🎵 TikTok</a>
      <a href="https://wa.me/84935023757" style="display:inline-block;margin:0 8px 8px 0;color:#B8935A;font-size:11px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:10px 18px;border:1px solid rgba(184,147,90,.35);border-radius:2px">💬 WhatsApp</a>
    </div>
    <p style="color:#2C1F10;font-size:14px;margin:0;line-height:1.8">With deep gratitude,<br><strong>Lam Tuyen</strong><br><span style="color:#8A7058;font-size:12px">Master Tailor · Han Market, 119 Trần Phú, Da Nang · Est. 2010</span></p>
  </div>
  <div style="background:#F3EDE0;padding:14px 32px;border-radius:0 0 4px 4px;text-align:center">
    <p style="margin:0;font-size:10px;color:#A89070;letter-spacing:1px">This code is personal to ${esc(firstName)} · ${esc(ticketCode)} · ${DISCOUNT}% founding member discount</p>
  </div>
</div>
</body></html>`;

    const waPhone = (phone || "").replace(/\D/g, "");
    const waMsg = encodeURIComponent(`Hello ${firstName}! 🌿\n\nThank you for joining the Lam Tuyen Linen waitlist.\n\nYou are one of our very first supporters, and we want to thank you with a Golden Ticket.\n\n✦ YOUR GOLDEN TICKET CODE: ${ticketCode}\n\nThis gives you ${DISCOUNT}% OFF your entire first order when we open.\n\nWe will be in touch soon.\n\nWith gratitude,\nLam Tuyen 🧵\nHan Market, Da Nang`);
    const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : "";

    const ownerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF6EE;padding:20px">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">
  <div style="background:#2C1F10;padding:16px 24px">
    <p style="color:#B8935A;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0">✦ New Golden Ticket Member</p>
  </div>
  <div style="background:#F3EDE0;padding:16px 24px;text-align:center;border-bottom:1px solid #E8D8BC">
    <p style="color:#8A7058;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px">Their Golden Ticket Code</p>
    <div style="font-size:28px;font-weight:bold;color:#B8935A;letter-spacing:6px;font-family:Georgia,serif">${esc(ticketCode)}</div>
    <p style="color:#8A7058;font-size:11px;margin:4px 0 0">${DISCOUNT}% off their first order</p>
  </div>
  ${waLink ? `<div style="padding:14px 24px;text-align:center;background:#fff"><a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:13px;font-weight:bold">💬 Send Golden Ticket via WhatsApp</a><p style="font-size:11px;color:#A89070;margin:8px 0 0">Tap to send the ticket code to ${esc(firstName)} on WhatsApp</p></div>` : ""}
  <div style="padding:22px 24px">
    <p style="color:#2C1F10;font-size:15px;margin:0 0 18px"><strong>${esc(name)}</strong> joined the waitlist before the store opened — they are a Golden Ticket supporter.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#5A4530">
      <tr style="border-bottom:1px solid #EDE4D0"><td style="padding:8px 0;color:#A89070;width:110px">Name</td><td style="padding:8px 0"><strong style="color:#2C1F10">${esc(name)}</strong></td></tr>
      <tr style="border-bottom:1px solid #EDE4D0"><td style="padding:8px 0;color:#A89070">Email</td><td style="padding:8px 0"><a href="mailto:${esc(email)}" style="color:#B8935A">${esc(email)}</a></td></tr>
      ${phone ? `<tr style="border-bottom:1px solid #EDE4D0"><td style="padding:8px 0;color:#A89070">WhatsApp</td><td style="padding:8px 0"><a href="https://wa.me/${phone.replace(/\D/g,"")}" style="color:#B8935A">${esc(phone)}</a></td></tr>` : ""}
      ${country ? `<tr style="border-bottom:1px solid #EDE4D0"><td style="padding:8px 0;color:#A89070">Country</td><td style="padding:8px 0">${esc(country)}</td></tr>` : ""}
      ${garment_interest ? `<tr style="border-bottom:1px solid #EDE4D0"><td style="padding:8px 0;color:#A89070">Interested in</td><td style="padding:8px 0">${esc(garment_interest)}</td></tr>` : ""}
      <tr style="border-bottom:1px solid #EDE4D0"><td style="padding:8px 0;color:#A89070">Ticket Code</td><td style="padding:8px 0;font-weight:bold;color:#B8935A;letter-spacing:3px;font-size:15px">${esc(ticketCode)}</td></tr>
      <tr><td style="padding:8px 0;color:#A89070">Discount</td><td style="padding:8px 0"><strong>${DISCOUNT}%</strong> off when store opens</td></tr>
    </table>
  </div>
  <div style="background:#F3EDE0;padding:12px 24px;text-align:center">
    <p style="margin:0;font-size:11px;color:#A89070">Golden Ticket Member · Lam Tuyen Linen</p>
  </div>
</div>
</body></html>`;

    await Promise.all([
      sendEmail(email, `Your Golden Ticket is here, ${firstName} — Lam Tuyen Linen`, customerHtml),
      sendEmail(SHOP_EMAIL, `✦ New Golden Ticket Member: ${name} (${country || "Unknown"})`, ownerHtml),
    ]);

    return new Response(JSON.stringify({ ok: true, ticket_code: ticketCode }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-waitlist-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
