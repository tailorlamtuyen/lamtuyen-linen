import os, re

fn_dir = 'supabase/functions'

new_fn = '''async function sendEmail(to: string, subject: string, html: string) {
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
}'''

updated = []
for folder in os.listdir(fn_dir):
    fp = os.path.join(fn_dir, folder, 'index.ts')
    if not os.path.exists(fp): continue
    with open(fp, 'r', encoding='utf-8') as f:
        c = f.read()
    if 'resend' not in c.lower(): continue
    orig = c
    c = c.replace('const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";','const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";')
    c = c.replace("const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';", 'const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";')
    c = re.sub(r'async function sendEmail\(to: string, subject: string, html: string\) \{.*?\n\}', new_fn, c, flags=re.DOTALL)
    c = re.sub(r"const res = await fetch\('https://api\.resend\.com/emails'.*?throw new Error\(`Email failed: \$\{res\.status\}`\);", '''const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Lam Tuyen Linen", email: SHOP_EMAIL },
      to: [{ email: String(email) }],
      replyTo: { email: SHOP_EMAIL },
      subject: `Your Price Quote — ${order_ref} — ${fmtVND(fp)} — Lam Tuyen Linen`,
      htmlContent: html,
    }),
  });
  const resBody = await res.text();
  if (!res.ok) {
    console.error(`send-price-quote FAILED ${res.status} ${order_ref}:`, resBody);
    throw new Error(`Email failed: ${res.status}`);
  }''', c, flags=re.DOTALL)
    if c != orig:
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(c)
        updated.append(folder)
        print('Updated:', folder)

print('Done.', len(updated), 'files updated:', ', '.join(updated))
