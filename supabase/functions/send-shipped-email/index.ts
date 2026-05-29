// supabase/functions/send-shipped-email/index.ts
// Deploy: supabase functions deploy send-shipped-email --no-verify-jwt

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM = Deno.env.get('RESEND_FROM') ?? 'Lam Tuyen Linen <onboarding@resend.dev>';
const SHOP_EMAIL = 'tailorlamtuyen@gmail.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS });
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  let b: Record<string, string>;
  try { b = await req.json(); }
  catch { return new Response('Bad Request', { status: 400, headers: CORS }); }

  const {
    order_ref = '', name = '', email = '',
    garment = '', tracking_number = '', carrier = 'Vietnam Post (EMS)',
  } = b;

  const firstName = name.split(' ')[0] || name;

  const trackingUrl = (() => {
    const c = carrier.toLowerCase();
    if (c.includes('dhl')) return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(tracking_number)}`;
    if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking_number)}`;
    if (c.includes('ems') || c.includes('vietnam post')) return `https://www.vnpost.vn/vi-vn/buu-gui/tra-cuu?id=${encodeURIComponent(tracking_number)}`;
    return null;
  })();

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF6EE;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">

  <div style="background:#2C1F10;padding:28px 32px 22px">
    <p style="color:#B8935A;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px">Lam Tuyen Linen · Han Market · Da Nang</p>
    <h1 style="color:#EDE4D0;font-size:19px;font-weight:300;margin:0;line-height:1.4">Your garment is on its way. 🎉</h1>
  </div>

  <div style="padding:28px 32px">
    <p style="color:#5A4530;font-size:14px;line-height:1.8;margin:0 0 20px">
      Dear ${esc(firstName)},<br><br>
      Your <strong>${esc(garment)}</strong> has been carefully packed at our workshop in Han Market and is now in the hands of ${esc(carrier)}. It is on its way to you.
    </p>

    <!-- Tracking Box -->
    <div style="background:#2C1F10;border-radius:6px;padding:22px 24px;margin-bottom:24px;text-align:center">
      <p style="color:#B8935A;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Tracking Number</p>
      <p style="color:#EDE4D0;font-size:26px;letter-spacing:4px;font-weight:300;margin:0 0 10px">${esc(tracking_number)}</p>
      <p style="color:rgba(237,228,208,.6);font-size:12px;margin:0 0 14px">${esc(carrier)}</p>
      ${trackingUrl ? `<a href="${esc(trackingUrl)}" style="display:inline-block;background:#B8935A;color:#fff;text-decoration:none;padding:10px 24px;border-radius:4px;font-size:12px;letter-spacing:2px;text-transform:uppercase">Track My Package →</a>` : ''}
    </div>

    <!-- Order Summary -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">
      <tr style="background:#F3EDE0">
        <td colspan="2" style="padding:8px 12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8A7058">Order Details</td>
      </tr>
      <tr>
        <td style="padding:7px 12px;color:#8A7058;font-size:13px">Reference</td>
        <td style="padding:7px 12px;color:#2C1F10;font-size:13px;font-weight:500">${esc(order_ref)}</td>
      </tr>
      <tr>
        <td style="padding:7px 12px;color:#8A7058;font-size:13px">Garment</td>
        <td style="padding:7px 12px;color:#2C1F10;font-size:13px">${esc(garment)}</td>
      </tr>
    </table>

    <p style="color:#5A4530;font-size:14px;line-height:1.8;margin:0 0 14px">
      International parcels typically arrive within <strong>7–21 business days</strong> after dispatch, depending on your country and customs processing times. You can track your parcel at any time using the number above.
    </p>
    <p style="color:#8A7058;font-size:13px;line-height:1.7;margin:0 0 20px">
      If your parcel does not arrive within 25 business days, please contact us — we will open an investigation with ${esc(carrier)} on your behalf.
    </p>

    <!-- WhatsApp -->
    <p style="margin:0 0 20px;padding:14px 20px;background:#2C1F10;border-radius:4px;text-align:center">
      <a href="https://wa.me/84935023757" style="color:#B8935A;font-size:13px;text-decoration:none;letter-spacing:1px">📞 Any questions? WhatsApp us · +84 935 023 757</a>
    </p>

    <!-- Aftercare note -->
    <div style="background:#F3EDE0;border-radius:4px;padding:14px 18px;margin-bottom:20px">
      <p style="color:#8A7058;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Linen Care</p>
      <p style="color:#5A4530;font-size:13px;line-height:1.7;margin:0">
        Wash in cold water on a gentle cycle or by hand. Hang to dry. Iron while slightly damp for a crisp finish, or embrace the natural texture — linen is beautiful either way.
      </p>
    </div>

    <p style="color:#5A4530;font-size:13px;line-height:1.7;margin:0 0 4px">
      Thank you for your trust. We hope your ${esc(garment)} brings you great joy.<br><br>
      <span style="font-style:italic"><strong>Lam Tuyen</strong><br>
      <span style="color:#8A7058;font-size:12px">Master Tailor · Stall #9, Han Market, 119 Trần Phú, Hải Châu I, Đà Nẵng · Since 2010</span></span>
    </p>
  </div>

  <div style="padding:12px 32px;background:#F3EDE0;text-align:center">
    <p style="margin:0;font-size:11px;color:#8A7058;letter-spacing:1px">
      Lam Tuyen Linen · Han Market · Da Nang, Vietnam · lamtuyen-linen.vercel.app
    </p>
  </div>
</div>
</body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        reply_to: SHOP_EMAIL,
        subject: `Your ${garment} has been shipped! Tracking: ${tracking_number} — Lam Tuyen Linen`,
        html,
      }),
    });
    const body = await res.text();
    if (!res.ok) console.error(`send-shipped-email FAILED — ${res.status} — ${order_ref}:`, body);
    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-shipped-email error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
