// supabase/functions/send-order-email/index.ts
// Deploy: supabase functions deploy send-order-email --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=re_xxxx
//          supabase secrets set RESEND_FROM="Lam Tuyen Linen <orders@lamtuyenlinen.com>"
//          (RESEND_FROM requires domain verified in Resend — falls back to onboarding@resend.dev)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM = Deno.env.get('RESEND_FROM') ?? 'Lam Tuyen Linen <onboarding@resend.dev>';
const SHOP_EMAIL = 'tailorlamtuyen@gmail.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Escape user-supplied strings before inserting into HTML
function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label: string, value: string, link?: string): string {
  if (!value) return '';
  const cell = link
    ? `<a href="${link}" style="color:#B8935A">${esc(value)}</a>`
    : esc(value);
  return `<tr>
    <td style="padding:6px 12px;color:#8A7058;font-size:13px;white-space:nowrap">${esc(label)}</td>
    <td style="padding:6px 12px;color:#2C1F10;font-size:13px">${cell}</td>
  </tr>`;
}

function sectionHeader(title: string): string {
  return `<tr style="background:#F3EDE0">
    <td colspan="2" style="padding:8px 12px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8A7058;font-weight:500">${esc(title)}</td>
  </tr>`;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS });
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY secret is not set');
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let b: Record<string, string>;
  try {
    b = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400, headers: CORS });
  }

  const {
    order_ref = '', name = '', email = '', phone = '',
    garment = '', colour = '', notes = '',
    // measurements
    chest = '', waist = '', hips = '', shoulder = '', sleeve = '', back_width = '',
    bicep = '', tricep = '', wrist = '', neck = '',
    torso = '', inseam = '', thigh = '', calf = '', knee = '', ankle = '',
    rise = '', outseam = '', height = '', length = '',
    // shipping
    address = '', city = '', postal = '', country = '',
  } = b;

  // WhatsApp link — strip all non-digits
  const waDigits = phone.replace(/\D/g, '');
  const waLink = waDigits ? `https://wa.me/${waDigits}` : '';

  // Build measurement rows — skip any that were left blank
  const measurements: [string, string][] = [
    ['Chest / Bust', chest], ['Natural Waist', waist], ['Hips', hips],
    ['Shoulder Width', shoulder], ['Sleeve Length', sleeve], ['Back Width', back_width],
    ['Bicep', bicep], ['Tricep / Mid-Arm', tricep], ['Wrist', wrist], ['Neck', neck],
    ['Torso / Back Length', torso], ['Inseam', inseam], ['Thigh', thigh],
    ['Calf', calf], ['Knee', knee], ['Ankle', ankle],
    ['Crotch / Rise', rise], ['Outseam / Leg Length', outseam],
    ['Height (total)', height], ['Desired Garment Length', length],
  ].filter(([, v]) => v.trim() !== '') as [string, string][];

  const measurementRows = measurements
    .map(([k, v]) => row(k, v + ' cm'))
    .join('');

  const shippingFull = [address, city, postal, country].filter(Boolean).join(', ');

  // ─────────────────────────────────────────────
  // SHOP NOTIFICATION
  // ─────────────────────────────────────────────
  const shopHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF6EE;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">

  <div style="background:#2C1F10;padding:28px 32px">
    <h1 style="color:#EDE4D0;font-size:18px;font-weight:400;margin:0;letter-spacing:2px;text-transform:uppercase">New Order Request</h1>
    <p style="color:#B8935A;font-size:13px;margin:8px 0 0;letter-spacing:1px">${esc(order_ref)}</p>
  </div>

  <div style="padding:28px 32px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      ${sectionHeader('Customer')}
      ${row('Name', name)}
      ${row('Email', email, `mailto:${email}`)}
      ${row('Phone / WhatsApp', phone, waLink || undefined)}
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      ${sectionHeader('Garment')}
      ${row('Type', garment)}
      ${row('Colour', colour)}
      ${notes ? `<tr><td style="padding:6px 12px;color:#8A7058;font-size:13px;vertical-align:top">Style Notes</td>
        <td style="padding:6px 12px;color:#2C1F10;font-size:13px">${esc(notes)}</td></tr>` : ''}
    </table>

    ${measurements.length ? `
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      ${sectionHeader('Measurements (cm)')}
      ${measurementRows}
    </table>` : ''}

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      ${sectionHeader('Shipping Address')}
      ${row('Address', address)}
      ${row('City', city)}
      ${row('Postal Code', postal)}
      ${row('Country', country)}
    </table>

    <p style="margin:0;padding:16px 20px;background:#F3EDE0;border-radius:4px;text-align:center;font-size:13px;color:#5A4530">
      Reply: <a href="mailto:${esc(email)}" style="color:#B8935A">${esc(email)}</a>
      ${waLink ? `&nbsp;·&nbsp;<a href="${waLink}" style="color:#B8935A">WhatsApp ${esc(phone)}</a>` : ''}
    </p>
  </div>
</div>
</body></html>`;

  // ─────────────────────────────────────────────
  // CUSTOMER CONFIRMATION
  // ─────────────────────────────────────────────
  const customerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF6EE;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">

  <div style="background:#2C1F10;padding:28px 32px">
    <h1 style="color:#EDE4D0;font-size:18px;font-weight:400;margin:0;letter-spacing:2px;text-transform:uppercase">Lam Tuyen Linen</h1>
    <p style="color:#B8935A;font-size:13px;margin:8px 0 0;letter-spacing:1px">Han Market · Da Nang · Since 2010</p>
  </div>

  <div style="padding:28px 32px">
    <h2 style="color:#2C1F10;font-size:17px;font-weight:400;margin:0 0 16px">Thank you, ${esc(name)}.</h2>
    <p style="color:#5A4530;font-size:14px;line-height:1.7;margin:0 0 20px">
      We have received your order request and will contact you within <strong>24 hours</strong>
      with your exact price quote. No payment is needed until you approve.
    </p>

    <div style="background:#F3EDE0;border-left:3px solid #B8935A;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8A7058">Your Order Reference</p>
      <p style="margin:0;font-size:22px;color:#2C1F10;letter-spacing:3px;font-weight:500">${esc(order_ref)}</p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      ${sectionHeader('Order Summary')}
      ${row('Garment', garment)}
      ${row('Colour', colour)}
      ${row('Ship to', shippingFull)}
      ${notes ? `<tr><td style="padding:6px 12px;color:#8A7058;font-size:13px;vertical-align:top">Style Notes</td>
        <td style="padding:6px 12px;color:#2C1F10;font-size:13px">${esc(notes)}</td></tr>` : ''}
    </table>

    <p style="color:#5A4530;font-size:14px;line-height:1.7;margin:0 0 20px">
      We will reply to <a href="mailto:${esc(email)}" style="color:#B8935A">${esc(email)}</a>.
      You can also reach us directly:
    </p>
    <p style="margin:0 0 24px;padding:16px 20px;background:#2C1F10;border-radius:4px;text-align:center">
      <a href="https://wa.me/84935023757" style="color:#B8935A;font-size:14px;text-decoration:none">📞 WhatsApp: +84 935 023 757</a>
    </p>

    <p style="color:#8A7058;font-size:12px;line-height:1.6;margin:0">
      Please keep your order reference handy when contacting us. If you did not submit this request, you can ignore this email.
    </p>
  </div>

  <div style="padding:14px 32px;background:#F3EDE0;text-align:center">
    <p style="margin:0;font-size:11px;color:#8A7058;letter-spacing:1px">
      Lam Tuyen Linen · Han Market, 119 Trần Phú, Da Nang, Vietnam
    </p>
  </div>
</div>
</body></html>`;

  // ─────────────────────────────────────────────
  // Send both emails via Resend
  // ─────────────────────────────────────────────
  const sendEmail = (to: string, subject: string, html: string) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });

  try {
    const [shopRes, customerRes] = await Promise.all([
      sendEmail(
        SHOP_EMAIL,
        `New Order — ${order_ref} — ${garment} for ${name}`,
        shopHtml,
      ),
      sendEmail(
        email,
        `Your Order Request Received — ${order_ref} — Lam Tuyen Linen`,
        customerHtml,
      ),
    ]);

    const shopBody = await shopRes.text();
    const customerBody = await customerRes.text();

    if (!shopRes.ok) console.error('Resend shop email failed:', shopRes.status, shopBody);
    if (!customerRes.ok) console.error('Resend customer email failed:', customerRes.status, customerBody);

    // Return 200 as long as at least one succeeded (DB insert already saved the order)
    return new Response(
      JSON.stringify({ ok: true, order_ref, shop: shopRes.status, customer: customerRes.status }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('send-order-email unexpected error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
