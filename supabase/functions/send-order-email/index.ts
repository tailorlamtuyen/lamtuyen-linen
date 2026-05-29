// supabase/functions/send-order-email/index.ts
// Deploy: supabase functions deploy send-order-email --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=re_xxxx
//          supabase secrets set RESEND_FROM="Lam Tuyen Linen <orders@lamtuyen-linen.vercel.app>"
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

// ─────────────────────────────────────────────
// 10 ROTATING LUXURY CUSTOMER EMAIL TEMPLATES
// ─────────────────────────────────────────────
function buildCustomerEmail(p: {
  order_ref: string; name: string; email: string; garment: string;
  colour: string; notes: string; shippingFull: string; templateIndex: number;
}): string {
  const { order_ref, name, email, garment, colour, notes, shippingFull, templateIndex } = p;
  const firstName = esc(name.split(' ')[0] || name);
  const garmentRef = esc(garment) || 'your garment';

  const orderSummaryHtml = `
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">
    ${sectionHeader('Your Order')}
    ${row('Reference', order_ref)}
    ${row('Garment', garment)}
    ${colour ? row('Colour', colour) : ''}
    ${shippingFull ? row('Ship to', shippingFull) : ''}
    ${notes ? `<tr><td style="padding:6px 12px;color:#8A7058;font-size:13px;vertical-align:top">Style Notes</td><td style="padding:6px 12px;color:#2C1F10;font-size:13px">${esc(notes)}</td></tr>` : ''}
  </table>`;

  const whatsappCta = `<p style="margin:0 0 20px;padding:16px 20px;background:#2C1F10;border-radius:4px;text-align:center">
    <a href="https://wa.me/84935023757" style="color:#B8935A;font-size:14px;text-decoration:none;letter-spacing:1px">📞 WhatsApp Us · +84 935 023 757</a>
  </p>`;

  const emailFooter = `<p style="color:#8A7058;font-size:12px;line-height:1.6;margin:0 0 6px">
    We will reply to <a href="mailto:${esc(email)}" style="color:#B8935A">${esc(email)}</a> within 24 hours. No payment is required until you confirm your quote.
  </p>
  <p style="color:#C4AE90;font-size:11px;margin:0">If you did not submit this request, you can safely ignore this email.</p>`;

  const pageFooter = `<div style="padding:14px 32px;background:#F3EDE0;text-align:center">
    <p style="margin:0;font-size:11px;color:#8A7058;letter-spacing:1px">Lam Tuyen Linen · Stall #9, Han Market, 119 Trần Phú, Hải Châu I, Đà Nẵng, Vietnam</p>
  </div>`;

  const refBadge = `<div style="background:#F3EDE0;border-left:3px solid #B8935A;padding:12px 18px;margin-bottom:24px;text-align:center">
    <p style="margin:0 0 2px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8A7058">Order Reference</p>
    <p style="margin:0;font-size:20px;color:#2C1F10;letter-spacing:3px;font-weight:500">${esc(order_ref)}</p>
  </div>`;

  function wrap(tagline: string, body: string): string {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF6EE;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">
  <div style="background:#2C1F10;padding:28px 32px 22px">
    <p style="color:#B8935A;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px">Lam Tuyen Linen · Han Market · Da Nang</p>
    <h1 style="color:#EDE4D0;font-size:19px;font-weight:300;margin:0;line-height:1.4;letter-spacing:0.5px">${tagline}</h1>
  </div>
  <div style="padding:28px 32px">
    ${refBadge}
    ${body}
    ${orderSummaryHtml}
    ${whatsappCta}
    ${emailFooter}
  </div>
  ${pageFooter}
</div>
</body></html>`;
  }

  const sig = (closing: string) =>
    `<p style="color:#2C1F10;font-size:13px;margin:0 0 24px;font-style:italic">${closing},<br>
    <strong>Lam Tuyen</strong><br>
    <span style="color:#8A7058;font-size:12px">Master Tailor · Han Market, Da Nang · Since 2010</span></p>`;

  const p14 = (text: string) =>
    `<p style="color:#5A4530;font-size:14px;line-height:1.8;margin:0 0 16px">${text}</p>`;

  const templates: string[] = [

    // 0 — Welcome to the family
    wrap('Welcome to the Lam Tuyen family.',
      p14(`Dear ${firstName},`) +
      p14(`Some things in life are simply right — and choosing handcrafted linen from Han Market is one of them. You have just joined a quietly extraordinary group of people from across the world who wear their garments with the confidence that comes from knowing something was made truly for them.`) +
      p14(`Your <strong style="color:#2C1F10">${garmentRef}</strong> is being reviewed personally by our team. Within 24 hours we will send you the exact price — no payment needed until you approve. You have made a beautiful decision.`) +
      sig('Warmly')
    ),

    // 1 — You have exceptional taste
    wrap('Truly exceptional taste is rare. You have it.',
      p14(`Dear ${firstName},`) +
      p14(`In over fifteen years at Han Market, I have dressed travellers, designers, artists, and connoisseurs from across the world. It takes a particular kind of person to seek out handcrafted linen — someone who values what lasts, what feels alive against the skin, what carries a story worth telling.`) +
      p14(`You are one of those people. Your <strong style="color:#2C1F10">${garmentRef}</strong> request has reached me personally. I will review every detail before we contact you within 24 hours with your exact quote.`) +
      sig('Thank you for trusting us')
    ),

    // 2 — This piece was made for someone like you
    wrap('This piece was made for someone exactly like you.',
      p14(`Dear ${firstName},`) +
      p14(`The moment your order arrived, we began thinking about the cut, the drape, the way the linen will fall. Not every garment finds its person — but yours did the moment you chose it.`) +
      p14(`Your <strong style="color:#2C1F10">${garmentRef}</strong> will be crafted with the full attention of our workshop — pure Vietnamese linen, hands that have shaped thousands of garments, and a commitment to fit that goes far beyond measurements on paper. We will contact you within 24 hours with your personalised quote.`) +
      sig('With anticipation')
    ),

    // 3 — You just made the best decision
    wrap('That was the best decision you made today.',
      p14(`Dear ${firstName},`) +
      p14(`Trust me on this — in a world of fast fashion and forgotten fabrics, choosing a piece of handcrafted Vietnamese linen is something you will not regret. Your <strong style="color:#2C1F10">${garmentRef}</strong> will outlast trends. It will grow more beautiful with every wash. It will feel completely your own from the very first time you wear it.`) +
      p14(`We will reach out within 24 hours with your exact price quote. No payment until you approve. Just sit back and let us do what we do best.`) +
      sig('With pleasure')
    ),

    // 4 — Not everyone chooses pure linen
    wrap('Not everyone chooses pure linen. Those who do, never go back.',
      p14(`Dear ${firstName},`) +
      p14(`Linen is honest. It does not pretend to be something it is not. It breathes, it moves with you, it earns its character with time. Choosing a handcrafted linen <strong style="color:#2C1F10">${garmentRef}</strong> from Han Market is a choice that speaks of someone who appreciates what is real.`) +
      p14(`We are not mass production — we are a family atelier in Da Nang that has been cutting and sewing since 2010. Your request is being reviewed and we will contact you personally within 24 hours with your quote. We cannot wait to show you what is possible.`) +
      sig('Sincerely')
    ),

    // 5 — Master tailor is personally handling your order
    wrap('Your order is on my table. Personally.',
      p14(`Dear ${firstName},`) +
      p14(`Every order that arrives at our workshop in Han Market passes through my hands. Not an assistant, not a system — me, personally. I have reviewed your <strong style="color:#2C1F10">${garmentRef}</strong> request and I am already thinking about the right cut and construction to bring it to life exactly as you imagined.`) +
      p14(`Within 24 hours, I will reach out to you personally with your exact price and production timeline. Nothing is rushed here. Everything is considered. That is the promise of Lam Tuyen.`) +
      sig('Personally yours')
    ),

    // 6 — Your garment will turn heads
    wrap('People will stop and ask where you got it.',
      p14(`Dear ${firstName},`) +
      p14(`There is something about beautifully made linen that people simply cannot ignore — the drape, the texture, the quiet confidence it lends to the person wearing it. It cannot be faked.`) +
      p14(`Your <strong style="color:#2C1F10">${garmentRef}</strong> is going to be one of those pieces. Handcrafted in our workshop at Han Market from pure Vietnamese linen, built to your exact dimensions and style. We will contact you within 24 hours with your personalised quote. Get ready to answer some questions about your tailor.`) +
      sig('With excitement')
    ),

    // 7 — This is the beginning of your linen journey
    wrap('The first piece is always just the beginning.',
      p14(`Dear ${firstName},`) +
      p14(`Every one of our most loyal customers started exactly where you are now — with one piece. A shirt. A dress. A simple pair of trousers. And then they came back. Because once you wear truly well-made linen, nothing else quite measures up.`) +
      p14(`Your <strong style="color:#2C1F10">${garmentRef}</strong> request has been received and we look forward to beginning this journey with you. We will contact you within 24 hours with your exact price quote. No payment until you are happy. Welcome to something you will return to.`) +
      sig('Looking forward')
    ),

    // 8 — You deserve only the finest
    wrap('You deserve only the finest. This is exactly that.',
      p14(`Dear ${firstName},`) +
      p14(`Beautiful clothes are not a luxury reserved for the few. They are for anyone who chooses to demand quality — who refuses to accept that a garment should wear out in a season, scratch the skin, or sag after one wash.`) +
      p14(`Pure Vietnamese linen, hand-cut and hand-sewn at our Da Nang workshop — this is the finest we know how to make. Your <strong style="color:#2C1F10">${garmentRef}</strong> request has been received and our team will contact you within 24 hours with your personalised quote. Because you deserve nothing less.`) +
      sig('With care')
    ),

    // 9 — Han Market has dressed the world
    wrap('Han Market has dressed the world. Now it dresses you.',
      p14(`Dear ${firstName},`) +
      p14(`For over a century, Han Market in Da Nang has been where craftsmanship meets the world. Travellers have come from Japan, France, Australia, the United States — from every corner of the globe — to bring home something made by our hands.`) +
      p14(`Now it is your turn. Your <strong style="color:#2C1F10">${garmentRef}</strong> request has arrived at our workshop and we are honoured to be your tailor. We will contact you within 24 hours with your personalised quote. Thank you for finding us — this is going to be something special.`) +
      sig('Honoured')
    ),

  ];

  return templates[templateIndex] ?? templates[0];
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────
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
    // upper body
    chest = '', waist = '', high_hip = '', hips = '',
    shoulder = '', shoulder_to_shoulder = '', across_chest = '', across_back = '',
    back_width = '', bust_point = '', bust_height = '', under_bust = '',
    // arms
    sleeve = '', arm_length = '', bicep = '', elbow = '', tricep = '',
    wrist = '', armhole = '',
    // neck & head
    neck = '', head = '',
    // lower body
    waist_to_hip = '', rise = '', inseam = '', outseam = '',
    thigh = '', knee = '', calf = '', ankle = '', waist_to_knee = '',
    // full length
    height = '', back_length = '', front_length = '', torso = '',
    waist_to_floor = '', length = '',
    // posture
    posture_notes = '',
    // shipping
    address = '', city = '', postal = '', country = '',
  } = b;

  // WhatsApp link — strip all non-digits
  const waDigits = phone.replace(/\D/g, '');
  const waLink = waDigits ? `https://wa.me/${waDigits}` : '';

  // Build measurement rows — skip any that were left blank
  const measurements: [string, string][] = [
    ['Chest / Bust', chest], ['Natural Waist', waist], ['High Hip', high_hip], ['Full Hips', hips],
    ['Shoulder Width', shoulder], ['Shoulder to Shoulder', shoulder_to_shoulder],
    ['Across Chest', across_chest], ['Across Back', across_back], ['Back Width', back_width],
    ['Bust Point to Bust Point', bust_point], ['Bust Height', bust_height], ['Under Bust', under_bust],
    ['Sleeve Length', sleeve], ['Arm Length (underarm)', arm_length],
    ['Bicep', bicep], ['Elbow', elbow], ['Tricep / Mid-Arm', tricep], ['Wrist', wrist], ['Armhole', armhole],
    ['Neck', neck], ['Head Circumference', head],
    ['Waist to Hip', waist_to_hip], ['Crotch Depth / Rise', rise],
    ['Inseam', inseam], ['Outseam / Leg Length', outseam],
    ['Thigh', thigh], ['Knee', knee], ['Calf', calf], ['Ankle', ankle], ['Waist to Knee', waist_to_knee],
    ['Height (total)', height], ['Back Length', back_length], ['Front Length', front_length],
    ['Torso (shoulder to hip)', torso], ['Waist to Floor', waist_to_floor], ['Desired Garment Length', length],
  ].filter(([, v]) => v.trim() !== '') as [string, string][];

  const measurementRows = measurements
    .map(([k, v]) => row(k, v + ' cm'))
    .join('');

  const shippingFull = [address, city, postal, country].filter(Boolean).join(', ');

  // ─────────────────────────────────────────────
  // SHOP NOTIFICATION EMAIL
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

    ${(measurements.length || posture_notes) ? `
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      ${sectionHeader('Measurements (cm)')}
      ${measurementRows}
      ${posture_notes ? `<tr><td style="padding:6px 12px;color:#8A7058;font-size:13px;vertical-align:top">Posture Notes</td><td style="padding:6px 12px;color:#2C1F10;font-size:13px;font-style:italic">${esc(posture_notes)}</td></tr>` : ''}
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
  // CUSTOMER CONFIRMATION EMAIL (rotating luxury)
  // ─────────────────────────────────────────────
  const templateIndex = parseInt(order_ref.slice(-1), 36) % 10;
  const customerHtml = buildCustomerEmail({
    order_ref, name, email, garment, colour, notes, shippingFull, templateIndex,
  });

  // ─────────────────────────────────────────────
  // Send both emails via Resend
  // ─────────────────────────────────────────────
  const sendEmail = (to: string, subject: string, html: string, replyTo?: string) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

  try {
    const [shopRes, customerRes] = await Promise.all([
      sendEmail(
        SHOP_EMAIL,
        `New Order — ${order_ref} — ${garment} for ${name}`,
        shopHtml,
        email, // reply directly to customer from shop notification
      ),
      sendEmail(
        email,
        `Your Order Request Received — ${order_ref} — Lam Tuyen Linen`,
        customerHtml,
        SHOP_EMAIL, // customer can reply directly to shop
      ),
    ]);

    const shopBody = await shopRes.text();
    const customerBody = await customerRes.text();

    if (!shopRes.ok) {
      console.error(`Resend shop email FAILED — status:${shopRes.status} order:${order_ref}`, shopBody);
    }
    if (!customerRes.ok) {
      console.error(`Resend customer email FAILED — status:${customerRes.status} order:${order_ref} to:${email}`, customerBody);
    }

    // Return 200 as long as we attempted both (DB insert already saved the order)
    return new Response(
      JSON.stringify({
        ok: true,
        order_ref,
        templateIndex,
        shop: shopRes.status,
        shopOk: shopRes.ok,
        customer: customerRes.status,
        customerOk: customerRes.ok,
      }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error(`send-order-email unexpected error — order:${order_ref}:`, err);
    return new Response(
      JSON.stringify({ error: String(err), order_ref }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
