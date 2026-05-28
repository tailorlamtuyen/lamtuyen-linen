// supabase/functions/send-quote-email/index.ts
// Deploy: supabase functions deploy send-quote-email --no-verify-jwt

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

function fmtVND(n: number): string {
  return new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(n);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS });
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  let b: Record<string, string | number>;
  try { b = await req.json(); }
  catch { return new Response('Bad Request', { status: 400, headers: CORS }); }

  const {
    order_ref = '', name = '', email = '', garment = '', colour = '', country = '',
    garment_price_vnd = 0, shipping_vnd = 0, total_vnd = 0,
  } = b as Record<string, string | number>;

  const firstName = String(name).split(' ')[0] || String(name);
  const garmentPriceNum = Number(garment_price_vnd);
  const shippingNum = Number(shipping_vnd);
  const totalNum = Number(total_vnd);

  const usd = Math.round(totalNum / 25000);
  const eur = Math.round(totalNum / 27000);
  const aud = Math.round(totalNum / 16500);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF6EE;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">

  <div style="background:#2C1F10;padding:28px 32px 22px">
    <p style="color:#B8935A;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px">Lam Tuyen Linen · Han Market · Da Nang</p>
    <h1 style="color:#EDE4D0;font-size:19px;font-weight:300;margin:0;line-height:1.4">Your personalised price quote is ready.</h1>
  </div>

  <div style="padding:28px 32px">
    <p style="color:#5A4530;font-size:14px;line-height:1.8;margin:0 0 20px">
      Dear ${esc(firstName)},<br><br>
      Thank you for your patience. I have reviewed your order personally and prepared the following price for your <strong>${esc(String(garment))}</strong>.
      This quote is valid for <strong>7 days</strong> from today.
    </p>

    <!-- Price Box -->
    <div style="background:#2C1F10;border-radius:6px;padding:20px 24px;margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="color:#B8935A;font-size:11px;letter-spacing:2px;text-transform:uppercase">Garment (incl. fabric + tailoring)</span>
        <span style="color:#EDE4D0;font-size:13px">${esc(fmtVND(garmentPriceNum))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="color:#B8935A;font-size:11px;letter-spacing:2px;text-transform:uppercase">Shipping to ${esc(String(country))}</span>
        <span style="color:#EDE4D0;font-size:13px">${esc(fmtVND(shippingNum))}</span>
      </div>
      <div style="border-top:1px solid rgba(184,147,90,.3);padding-top:12px;display:flex;justify-content:space-between;align-items:baseline">
        <span style="color:#B8935A;font-size:11px;letter-spacing:2px;text-transform:uppercase">Total</span>
        <span style="color:#EDE4D0;font-size:24px;font-weight:300;letter-spacing:2px">${esc(fmtVND(totalNum))}</span>
      </div>
      <p style="color:rgba(237,228,208,.5);font-size:11px;margin:8px 0 0;text-align:right">≈ USD ${usd} · EUR ${eur} · AUD ${aud}</p>
    </div>

    <!-- Order Summary -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">
      <tr style="background:#F3EDE0">
        <td colspan="2" style="padding:8px 12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8A7058">Order Reference</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:10px 12px;font-size:18px;color:#2C1F10;letter-spacing:3px;font-weight:500">${esc(String(order_ref))}</td>
      </tr>
      <tr style="background:#F3EDE0">
        <td colspan="2" style="padding:8px 12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8A7058">Garment & Colour</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#5A4530;font-size:13px">${esc(String(garment))}</td>
        <td style="padding:8px 12px;color:#8A7058;font-size:13px">${esc(String(colour))}</td>
      </tr>
    </table>

    <!-- How to Confirm -->
    <p style="color:#5A4530;font-size:14px;line-height:1.8;margin:0 0 14px">
      <strong style="color:#2C1F10">To confirm this order:</strong><br>
      Simply reply to this email or message us on WhatsApp to say you're happy with the quote.
      We will then send you bank transfer details and begin production immediately upon payment receipt.
    </p>
    <p style="color:#8A7058;font-size:13px;line-height:1.7;margin:0 0 20px">
      No payment is taken until you explicitly confirm. If you have any questions about the price, colour, fabric, or timeline — just ask.
    </p>

    <!-- WhatsApp -->
    <p style="margin:0 0 24px;padding:16px 20px;background:#2C1F10;border-radius:4px;text-align:center">
      <a href="https://wa.me/84935023757" style="color:#B8935A;font-size:14px;text-decoration:none;letter-spacing:1px">📞 WhatsApp Us · +84 935 023 757</a>
    </p>

    <!-- Production Timeline -->
    <div style="background:#F3EDE0;border-radius:4px;padding:14px 18px;margin-bottom:20px">
      <p style="color:#8A7058;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Production & Shipping Timeline</p>
      <p style="color:#5A4530;font-size:13px;line-height:1.7;margin:0">
        After confirmation and payment: <strong>7–14 days production</strong> + shipping time to ${esc(String(country))} (7–21 days depending on service selected).
      </p>
    </div>

    <p style="color:#2C1F10;font-size:13px;margin:0 0 4px;font-style:italic">
      <strong>Lam Tuyen</strong><br>
      <span style="color:#8A7058;font-size:12px">Master Tailor · Han Market, 119 Trần Phú, Da Nang · Since 2010</span>
    </p>
  </div>

  <div style="padding:12px 32px;background:#F3EDE0;text-align:center">
    <p style="margin:0;font-size:11px;color:#8A7058;letter-spacing:1px">
      This quote is valid for 7 days · Quote ref: ${esc(String(order_ref))}
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
        to: [String(email)],
        reply_to: SHOP_EMAIL,
        subject: `Your Price Quote — ${order_ref} — ${fmtVND(totalNum)} — Lam Tuyen Linen`,
        html,
      }),
    });
    const body = await res.text();
    if (!res.ok) console.error(`send-quote-email FAILED — ${res.status} — ${order_ref}:`, body);
    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-quote-email error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
