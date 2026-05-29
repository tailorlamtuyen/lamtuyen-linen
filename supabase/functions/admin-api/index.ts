// supabase/functions/admin-api/index.ts
// Secure admin API — all write operations for the owner dashboard.
// Uses SUPABASE_SERVICE_ROLE_KEY (auto-injected, never exposed to client).
// Deploy: npx supabase functions deploy admin-api --no-verify-jwt
//
// Auth model: client sends Supabase user JWT in Authorization header.
// This function verifies it belongs to tailorlamtuyen@gmail.com before acting.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SURL        = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY    = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_KEY  = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM        = Deno.env.get('RESEND_FROM') ?? 'Lam Tuyen Linen <onboarding@resend.dev>';
const SHOP_EMAIL  = 'tailorlamtuyen@gmail.com';
const ALLOWED_EMAIL = 'tailorlamtuyen@gmail.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const adminDb = createClient(SURL, SERVICE_KEY, { auth: { persistSession: false } });

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtVND(n: number): string {
  return new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(n);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── AUTH VERIFICATION ──────────────────────────────────────────────────────
async function verifyAdmin(req: Request): Promise<string> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) throw new Error('No token');

  // Verify token using anon client (respects RLS, validates JWT signature)
  const userClient = createClient(SURL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Error('Invalid token');
  if (user.email !== ALLOWED_EMAIL) throw new Error('Forbidden');
  return user.id;
}

// ── ACTION HANDLERS ────────────────────────────────────────────────────────

async function updateOrder(body: Record<string, unknown>) {
  const { order_ref, updates } = body as { order_ref: string; updates: Record<string, unknown> };
  if (!order_ref || !updates) throw new Error('order_ref and updates required');

  // Add timestamp for status transitions
  const s = updates.status as string;
  if (s === 'awaiting_payment') updates.quoted_at = new Date().toISOString();
  if (s === 'payment_received') updates.paid_at = new Date().toISOString();
  if (s === 'shipped') updates.shipped_at = new Date().toISOString();
  if (s === 'complete') updates.completed_at = new Date().toISOString();

  const { error } = await adminDb.from('orders').update(updates).eq('order_ref', order_ref);
  if (error) throw error;
  return { ok: true };
}

async function savePricingData(body: Record<string, unknown>) {
  const { error } = await adminDb.from('pricing_data').insert(body);
  if (error) throw error;
  return { ok: true };
}

async function updateSetting(body: Record<string, unknown>) {
  const { key, value } = body as { key: string; value: unknown };
  if (!key) throw new Error('key required');
  const { error } = await adminDb.from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
  return { ok: true };
}

async function getPricingCount() {
  const { count } = await adminDb.from('pricing_data')
    .select('*', { count: 'exact', head: true });
  const { count: linCount } = await adminDb.from('linen_club')
    .select('*', { count: 'exact', head: true });
  return { pricing_count: count ?? 0, linen_club_count: linCount ?? 0 };
}

// ── SEND PRICE QUOTE EMAIL ─────────────────────────────────────────────────
async function sendPriceQuote(body: Record<string, unknown>) {
  const {
    order_ref, name, email, garment, colour, country,
    fabric_cost, labour_cost, shipping_cost, total_cost, final_price,
    profit_margin, fabric_meters,
  } = body as Record<string, string | number>;

  const firstName = String(name).split(' ')[0] || String(name);
  const fp = Number(final_price);
  const tc = Number(total_cost);
  const sc = Number(shipping_cost);
  const usd = Math.round(fp / 25000);
  const eur = Math.round(fp / 27000);
  const aud = Math.round(fp / 16500);

  // Fetch bank transfer details from settings
  const { data: bankRow } = await adminDb.from('settings').select('value').eq('key', 'bank_transfer').single();
  const bank = (bankRow?.value ?? {}) as Record<string, string>;

  const bankHtml = bank.account_number ? `
    <div style="background:#F3EDE0;border-radius:4px;padding:14px 18px;margin-bottom:20px">
      <p style="color:#8A7058;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Bank Transfer Details</p>
      <p style="color:#5A4530;font-size:13px;line-height:1.8;margin:0">
        <strong>Bank:</strong> ${esc(bank.bank_name)}<br>
        <strong>Account Name:</strong> ${esc(bank.account_name)}<br>
        <strong>Account Number:</strong> <strong style="color:#2C1F10;letter-spacing:2px">${esc(bank.account_number)}</strong><br>
        ${bank.branch ? `<strong>Branch:</strong> ${esc(bank.branch)}<br>` : ''}
        <strong>Transfer Reference:</strong> <strong style="color:#2C1F10">${esc(String(order_ref))}</strong>
      </p>
    </div>` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF6EE;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">
  <div style="background:#2C1F10;padding:28px 32px 22px">
    <p style="color:#B8935A;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px">Lam Tuyen Linen · Han Market · Da Nang</p>
    <h1 style="color:#EDE4D0;font-size:20px;font-weight:300;margin:0;line-height:1.4">Your price quote is ready, ${esc(firstName)}.</h1>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#5A4530;font-size:14px;line-height:1.8;margin:0 0 20px">
      Thank you for your patience. I have reviewed your order for a <strong>${esc(String(garment))}</strong> personally and prepared the following price. This quote is valid for <strong>7 days</strong>.
    </p>

    <!-- Price breakdown -->
    <div style="background:#2C1F10;border-radius:6px;padding:20px 24px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="color:#B8935A;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:4px 0">Fabric (${esc(String(fabric_meters))}m)</td>
            <td style="color:#EDE4D0;font-size:13px;text-align:right;padding:4px 0">${esc(fmtVND(Number(fabric_cost)))}</td></tr>
        <tr><td style="color:#B8935A;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:4px 0">Tailoring &amp; Labour</td>
            <td style="color:#EDE4D0;font-size:13px;text-align:right;padding:4px 0">${esc(fmtVND(Number(labour_cost)))}</td></tr>
        <tr><td style="color:#B8935A;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:4px 0">Shipping to ${esc(String(country))}</td>
            <td style="color:#EDE4D0;font-size:13px;text-align:right;padding:4px 0">${esc(fmtVND(sc))}</td></tr>
        <tr><td colspan="2" style="padding:8px 0 4px"><hr style="border:none;border-top:1px solid rgba(184,147,90,.3)"></td></tr>
        <tr><td style="color:#B8935A;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:4px 0">Your Price</td>
            <td style="color:#EDE4D0;font-size:24px;font-weight:300;letter-spacing:2px;text-align:right;padding:4px 0">${esc(fmtVND(fp))}</td></tr>
      </table>
      <p style="color:rgba(237,228,208,.45);font-size:11px;margin:8px 0 0;text-align:right">≈ USD ${usd} · EUR ${eur} · AUD ${aud}</p>
    </div>

    <!-- Order ref -->
    <div style="background:#F3EDE0;border-left:3px solid #B8935A;padding:12px 18px;margin-bottom:20px;text-align:center">
      <p style="margin:0 0 2px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8A7058">Order Reference</p>
      <p style="margin:0;font-size:20px;color:#2C1F10;letter-spacing:3px;font-weight:500">${esc(String(order_ref))}</p>
    </div>

    <p style="color:#5A4530;font-size:14px;line-height:1.8;margin:0 0 16px">
      <strong style="color:#2C1F10">To confirm your order:</strong><br>
      Please transfer the amount below using your order reference as the payment reference. Once we receive your payment, we will begin making your ${esc(String(garment))} immediately.
    </p>

    ${bankHtml}

    <p style="color:#8A7058;font-size:13px;line-height:1.7;margin:0 0 20px">
      Production time: <strong>7–14 days</strong> after payment confirmation, then shipping to ${esc(String(country))} (7–21 days). Any questions — just reply to this email or message us on WhatsApp.
    </p>

    <p style="margin:0 0 20px;padding:14px 20px;background:#2C1F10;border-radius:4px;text-align:center">
      <a href="https://wa.me/84935023757" style="color:#B8935A;font-size:14px;text-decoration:none;letter-spacing:1px">📞 WhatsApp · +84 935 023 757</a>
    </p>

    <p style="color:#2C1F10;font-size:13px;margin:0;font-style:italic">
      <strong>Lam Tuyen</strong><br>
      <span style="color:#8A7058;font-size:12px">Master Tailor · Han Market, 119 Trần Phú, Da Nang · Since 2010</span>
    </p>
  </div>
  <div style="padding:12px 32px;background:#F3EDE0;text-align:center">
    <p style="margin:0;font-size:11px;color:#8A7058;letter-spacing:1px">Quote valid 7 days · Ref: ${esc(String(order_ref))}</p>
  </div>
</div></body></html>`;

  // Send email
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to: [String(email)], reply_to: SHOP_EMAIL,
      subject: `Your Price Quote — ${order_ref} — ${fmtVND(fp)} — Lam Tuyen Linen`,
      html,
    }),
  });
  const resBody = await res.text();
  if (!res.ok) {
    console.error(`send-price-quote FAILED ${res.status} ${order_ref}:`, resBody);
    throw new Error(`Email failed: ${res.status}`);
  }

  // Update order status + save pricing data
  await adminDb.from('orders').update({
    status: 'awaiting_payment',
    quoted_price_vnd: fp,
    final_price: fp,
    quoted_at: new Date().toISOString(),
  }).eq('order_ref', order_ref);

  await adminDb.from('pricing_data').insert({
    order_ref, garment, country,
    measurements: (body as any).measurements || null,
    fabric_meters: Number(fabric_meters),
    fabric_cost_per_meter: Math.round(Number(fabric_cost) / Number(fabric_meters)),
    labour_cost: Number(labour_cost),
    shipping_cost: sc,
    total_cost: tc,
    final_price: fp,
    profit_margin: Number(profit_margin),
  });

  return { ok: true, emailStatus: res.status };
}

// ── MAIN HANDLER ───────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS });

  try {
    await verifyAdmin(req);
  } catch (e) {
    console.error('Auth failed:', e);
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return new Response('Bad Request', { status: 400, headers: CORS }); }

  const { action } = body;

  try {
    switch (action) {
      case 'update_order':      return json(await updateOrder(body));
      case 'save_pricing_data': return json(await savePricingData(body));
      case 'update_setting':    return json(await updateSetting(body));
      case 'get_pricing_count': return json(await getPricingCount());
      case 'send_price_quote':  return json(await sendPriceQuote(body));
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error(`admin-api action=${action} error:`, err);
    return json({ error: String(err) }, 500);
  }
});
