import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const SURL = Deno.env.get("SUPABASE_URL") ?? "";
const SROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SHOP_EMAIL = "tailorlamtuyen@gmail.com";
const SHOP_PHONE = "84935023757";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const body = await req.json();
    const { order_ref, name, email, phone, garment, colour, country, notes, items } = body;

    const firstName = String(name || "Valued Client").split(" ")[0];
    const garmentDisplay = items
      ? (Array.isArray(items) ? items.map((i: any) => `${i.garment||i.name} (${i.colour||""})`.trim()).join(" · ") : String(items))
      : [garment, colour].filter(Boolean).join(" · ") || "Custom Garment";

    const waPhone = String(phone || "").replace(/\D/g, "");
    const waMsg = encodeURIComponent(
      `Hello ${firstName} 🌿\n\nThank you for choosing Lam Tuyen Linen.\n\nYour order reference: ${order_ref}\n\nYour request for ${garment || garmentDisplay} has been received by our master tailor personally.\n\nYou will receive your price quote soon. In the meantime, if you have any questions I am here.\n\nWith gratitude,\nLam Tuyen 🧵\nStall #9, Han Market, Da Nang`
    );
    const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : "";

    const now = new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "long", year: "numeric" });

    const customerHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#1A1208;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto">

<div style="height:3px;background:linear-gradient(90deg,#6B4E26,#B8935A,#D4A96A,#B8935A,#6B4E26)"></div>

<div style="background:#2C1F10;padding:48px 40px 40px;text-align:center">
  <div style="font-family:Georgia,serif;font-size:56px;font-weight:300;color:#EDE4D0;letter-spacing:14px;line-height:1;margin-bottom:4px">LT</div>
  <div style="width:36px;height:1px;background:rgba(184,147,90,.45);margin:16px auto"></div>
  <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:6px;text-transform:uppercase;color:rgba(184,147,90,.65);margin-bottom:5px">Lam Tuyen Linen</div>
  <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(237,228,208,.25)">Private Atelier &nbsp;·&nbsp; Da Nang &nbsp;·&nbsp; Est. 2010</div>
</div>

<div style="background:#B8935A;padding:11px 40px;text-align:center">
  <div style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#2C1F10;font-weight:600">Atelier Confirmation &nbsp;·&nbsp; ${esc(order_ref)}</div>
</div>

<div style="background:#FAF6EE;padding:48px 40px">
  <p style="font-family:Georgia,serif;font-size:28px;font-weight:300;color:#2C1F10;margin:0 0 4px;letter-spacing:1px">Dear ${esc(firstName)},</p>
  <div style="width:28px;height:1px;background:#B8935A;margin:0 0 26px"></div>

  <p style="font-size:14px;color:#5A4530;line-height:2;margin:0 0 18px">
    Your order has arrived at our atelier and it has been placed in the personal care of our master tailor. From this moment, it exists — waiting to be made into something that belongs entirely to you.
  </p>
  <p style="font-size:14px;color:#5A4530;line-height:2;margin:0 0 32px">
    We do not make garments in bulk. We do not follow trends. Every piece that leaves this studio has been cut and sewn by the same hands that have been perfecting this craft for over 20 years. Yours will be no exception.
  </p>

  <div style="background:#2C1F10;border-radius:5px;padding:30px 32px;margin:0 0 32px">
    <div style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(184,147,90,.55);margin-bottom:18px">Your Order Details</div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:7px 0;border-bottom:1px solid rgba(184,147,90,.1);color:rgba(237,228,208,.35);font-size:10px;letter-spacing:1px;width:110px">Reference</td>
          <td style="padding:7px 0;border-bottom:1px solid rgba(184,147,90,.1);color:#B8935A;font-size:15px;letter-spacing:4px;font-family:Georgia,serif">${esc(order_ref)}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid rgba(184,147,90,.1);color:rgba(237,228,208,.35);font-size:10px;letter-spacing:1px">Date</td>
          <td style="padding:7px 0;border-bottom:1px solid rgba(184,147,90,.1);color:#EDE4D0;font-size:13px">${now}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid rgba(184,147,90,.1);color:rgba(237,228,208,.35);font-size:10px;letter-spacing:1px;vertical-align:top">Garment</td>
          <td style="padding:7px 0;border-bottom:1px solid rgba(184,147,90,.1);color:#EDE4D0;font-size:13px;line-height:1.7">${esc(garmentDisplay)}</td></tr>
      ${country ? `<tr><td style="padding:7px 0;border-bottom:1px solid rgba(184,147,90,.1);color:rgba(237,228,208,.35);font-size:10px;letter-spacing:1px">Destination</td><td style="padding:7px 0;border-bottom:1px solid rgba(184,147,90,.1);color:#EDE4D0;font-size:13px">${esc(country)}</td></tr>` : ""}
      ${notes ? `<tr><td style="padding:7px 0;color:rgba(237,228,208,.35);font-size:10px;letter-spacing:1px;vertical-align:top">Notes</td><td style="padding:7px 0;color:#B8935A;font-size:13px;font-style:italic">${esc(notes)}</td></tr>` : ""}
    </table>
  </div>

  <div style="margin:0 0 32px">
    <div style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#B8935A;margin-bottom:18px">What Happens Next</div>
    <div style="display:flex;gap:16px;padding:14px 0;border-bottom:1px solid rgba(44,31,16,.08)">
      <div style="width:28px;height:28px;background:#2C1F10;border-radius:50%;flex-shrink:0;font-size:11px;color:#B8935A;text-align:center;line-height:28px;font-weight:600">1</div>
      <div><div style="font-size:13px;color:#2C1F10;font-weight:500;margin-bottom:3px">Personal Review &amp; Pricing</div><div style="font-size:12px;color:#8A7058;line-height:1.7">Our master tailor personally reviews your request and prepares a precise price based on your garment, colour, and measurements.</div></div>
    </div>
    <div style="display:flex;gap:16px;padding:14px 0;border-bottom:1px solid rgba(44,31,16,.08)">
      <div style="width:28px;height:28px;background:#2C1F10;border-radius:50%;flex-shrink:0;font-size:11px;color:#B8935A;text-align:center;line-height:28px;font-weight:600">2</div>
      <div><div style="font-size:13px;color:#2C1F10;font-weight:500;margin-bottom:3px">Your Price Quote</div><div style="font-size:12px;color:#8A7058;line-height:1.7">You receive a personal price quote by email. Once you confirm and payment is received, cutting begins immediately.</div></div>
    </div>
    <div style="display:flex;gap:16px;padding:14px 0;border-bottom:1px solid rgba(44,31,16,.08)">
      <div style="width:28px;height:28px;background:#2C1F10;border-radius:50%;flex-shrink:0;font-size:11px;color:#B8935A;text-align:center;line-height:28px;font-weight:600">3</div>
      <div><div style="font-size:13px;color:#2C1F10;font-weight:500;margin-bottom:3px">Handcrafted for You</div><div style="font-size:12px;color:#8A7058;line-height:1.7">Your garment is cut, sewn, and finished entirely by hand. 7–14 days. No shortcuts. No machines for the detail work. Pure linen. Pure craft.</div></div>
    </div>
    <div style="display:flex;gap:16px;padding:14px 0">
      <div style="width:28px;height:28px;background:#B8935A;border-radius:50%;flex-shrink:0;font-size:11px;color:#fff;text-align:center;line-height:28px;font-weight:600">4</div>
      <div><div style="font-size:13px;color:#2C1F10;font-weight:500;margin-bottom:3px">Delivered to Your Door</div><div style="font-size:12px;color:#8A7058;line-height:1.7">Wrapped with care and dispatched to ${esc(country || "you")}. Your tracking number is sent the moment it ships.</div></div>
    </div>
  </div>

  <div style="border-left:3px solid #B8935A;padding:18px 22px;background:#F3EDE0;border-radius:0 4px 4px 0;margin:0 0 30px">
    <p style="font-family:Georgia,serif;font-size:18px;font-weight:300;font-style:italic;color:#2C1F10;margin:0 0 8px;line-height:1.8">"Pure linen does not need to prove its quality. It simply is. And the person who wears it — simply knows."</p>
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#A89070;margin:0">Lam Tuyen &nbsp;·&nbsp; Master Tailor &nbsp;·&nbsp; 20+ Years</p>
  </div>

  <p style="font-size:13px;color:#5A4530;line-height:1.9;margin:0 0 20px">Questions or changes — reply to this email or message us directly on WhatsApp. We respond personally.</p>

  <a href="https://wa.me/${SHOP_PHONE}" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;text-decoration:none;padding:12px 22px;border-radius:3px;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:32px">💬 WhatsApp Us Directly</a>

  <div style="border-top:1px solid rgba(44,31,16,.1);padding-top:22px">
    <p style="font-family:Georgia,serif;font-size:22px;font-weight:300;color:#2C1F10;margin:0 0 3px;font-style:italic">Lam Tuyen</p>
    <p style="font-size:10px;color:#8A7058;margin:0;letter-spacing:2px;text-transform:uppercase">Master Tailor &nbsp;·&nbsp; Stall #9, Han Market &nbsp;·&nbsp; Da Nang</p>
  </div>
</div>

<div style="background:#2C1F10;padding:16px 40px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
  <p style="margin:0;font-size:9px;color:rgba(237,228,208,.25);letter-spacing:1px">Stall #9 · Han Market · 119 Trần Phú · Hải Châu I · Đà Nẵng · Vietnam</p>
  <p style="margin:0;font-size:9px;color:rgba(184,147,90,.35);letter-spacing:1px">${esc(order_ref)}</p>
</div>
<div style="height:3px;background:linear-gradient(90deg,#6B4E26,#B8935A,#D4A96A,#B8935A,#6B4E26)"></div>

</div>
</body></html>`;

    const ownerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF6EE;padding:20px">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">
  <div style="background:#2C1F10;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
    <p style="color:#B8935A;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0">New Order · ${esc(order_ref)}</p>
    <p style="color:rgba(237,228,208,.35);font-size:11px;margin:0">${now}</p>
  </div>
  <div style="padding:20px 24px">
    <p style="font-size:15px;color:#2C1F10;margin:0 0 16px"><strong>${esc(name)}</strong> from ${esc(country||"Unknown")} placed an order.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr style="border-bottom:1px solid #EDE4D0"><td style="padding:7px 0;color:#A89070;width:90px">Reference</td><td style="padding:7px 0;color:#B8935A;font-weight:bold;letter-spacing:2px">${esc(order_ref)}</td></tr>
      <tr style="border-bottom:1px solid #EDE4D0"><td style="padding:7px 0;color:#A89070">Name</td><td style="padding:7px 0;color:#2C1F10"><strong>${esc(name)}</strong></td></tr>
      <tr style="border-bottom:1px solid #EDE4D0"><td style="padding:7px 0;color:#A89070">Email</td><td style="padding:7px 0"><a href="mailto:${esc(email)}" style="color:#B8935A">${esc(email)}</a></td></tr>
      ${waPhone ? `<tr style="border-bottom:1px solid #EDE4D0"><td style="padding:7px 0;color:#A89070">WhatsApp</td><td style="padding:7px 0"><a href="https://wa.me/${waPhone}" style="color:#B8935A">${esc(phone)}</a></td></tr>` : ""}
      <tr style="border-bottom:1px solid #EDE4D0"><td style="padding:7px 0;color:#A89070;vertical-align:top">Garment</td><td style="padding:7px 0;color:#2C1F10">${esc(garmentDisplay)}</td></tr>
      ${notes ? `<tr style="border-bottom:1px solid #EDE4D0"><td style="padding:7px 0;color:#A89070;vertical-align:top">Notes</td><td style="padding:7px 0;color:#5A4530;font-style:italic">${esc(notes)}</td></tr>` : ""}
    </table>
  </div>
  ${waLink ? `<div style="padding:14px 24px;border-top:1px solid #EDE4D0;text-align:center;background:#F9F5EE">
    <a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:3px;font-size:12px;font-weight:bold;letter-spacing:1px">💬 Send WhatsApp Confirmation to ${esc(firstName)}</a>
    <p style="font-size:10px;color:#A89070;margin:8px 0 0">Opens WhatsApp with confirmation message ready to send — one tap</p>
  </div>` : ""}
  <div style="background:#F3EDE0;padding:10px 24px;text-align:center">
    <p style="margin:0;font-size:10px;color:#A89070">Open Admin to set price → <a href="https://lamtuyen-linen.vercel.app/admin" style="color:#B8935A">lamtuyen-linen.vercel.app/admin</a></p>
  </div>
</div>
</body></html>`;

    let customerSent = false;
    if (email) {
      try {
        await sendEmail(String(email), `Your Order is in Our Hands — ${order_ref} · Lam Tuyen Linen`, customerHtml);
        customerSent = true;
      } catch(e: any) { console.error("Customer email failed:", e.message); }
    }

    try {
      await sendEmail(SHOP_EMAIL, `New Order: ${garmentDisplay} — ${name} (${country||"Unknown"}) · ${order_ref}`, ownerHtml);
    } catch(e: any) { console.error("Owner email failed:", e.message); }

    return new Response(JSON.stringify({ ok: true, customer_email_sent: customerSent }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch(err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
