with open('supabase/functions/send-waitlist-email/index.ts', 'r') as f:
    content = f.read()

old_owner = '''    const ownerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF6EE;padding:20px">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #E8D8BC;border-radius:4px;overflow:hidden">
  <div style="background:#2C1F10;padding:16px 24px;display:flex;align-items:center;justify-content:space-between">
    <p style="color:#B8935A;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0">✦ New Golden Ticket Member</p>
  </div>'''

new_owner = '''    const waPhone = (phone || "").replace(/\\D/g, "");
    const waMsg = encodeURIComponent(`Hello ${firstName}! 🌿\\n\\nThank you for joining the Lam Tuyen Linen waitlist.\\n\\nYou are one of our very first supporters, and we want to thank you with a Golden Ticket.\\n\\n✦ YOUR GOLDEN TICKET CODE: ${ticketCode}\\n\\nThis gives you ${DISCOUNT}% OFF your entire first order when we open.\\n\\nWe will be in touch soon.\\n\\nWith gratitude,\\nLam Tuyen 🧵\\nHan Market, Da Nang`);
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
  ${waLink ? `<div style="padding:14px 24px;text-align:center;background:#fff"><a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:13px;font-weight:bold">💬 Send Golden Ticket via WhatsApp</a><p style="font-size:11px;color:#A89070;margin:8px 0 0">Tap to send the ticket code to ${esc(firstName)} on WhatsApp</p></div>` : ""}'''

content = content.replace(old_owner, new_owner)

with open('supabase/functions/send-waitlist-email/index.ts', 'w') as f:
    f.write(content)

print('SUCCESS - owner email now includes golden ticket + WhatsApp button')
