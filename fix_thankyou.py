with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_success = '''      <p class="success-text">Thank you! We will reach out personally when we open.<br>Follow us on Instagram for a preview of what is coming.</p>
      <a href="https://instagram.com/tailor.lamtuyen" target="_blank" style="display:inline-block;margin-top:20px;color:var(--a1);font-size:.68rem;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(184,147,90,.4);padding:11px 28px">Follow @tailor.lamtuyen</a>'''

new_success = '''      <p class="success-text">Thank you! We will reach out personally when we open.<br>Follow us for a preview of what is coming.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:20px">
        <a href="https://instagram.com/tailor.lamtuyen" target="_blank" style="display:inline-flex;align-items:center;gap:7px;color:var(--a1);font-size:.68rem;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(184,147,90,.4);padding:11px 22px;border-radius:2px;transition:all .2s">📷 Instagram</a>
        <a href="https://tiktok.com/@tailor.lamtuyen" target="_blank" style="display:inline-flex;align-items:center;gap:7px;color:var(--a1);font-size:.68rem;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(184,147,90,.4);padding:11px 22px;border-radius:2px;transition:all .2s">🎵 TikTok</a>
      </div>'''

content = content.replace(old_success, new_success)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS - both Instagram and TikTok added to thank you screen')
