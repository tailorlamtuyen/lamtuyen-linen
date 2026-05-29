with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add honeypot hidden field to form (bots fill it, humans never see it)
content = content.replace(
    '<button class="submit-btn" id="wl-btn" onclick="submitWaitlist()">Notify Me When We Open</button>',
    '<input type="text" id="wl-hp" name="website" autocomplete="off" style="display:none;position:absolute;left:-9999px" tabindex="-1" aria-hidden="true">\n<button class="submit-btn" id="wl-btn" onclick="submitWaitlist()">Notify Me When We Open</button>'
)

# Add honeypot check at start of submitWaitlist function
content = content.replace(
    "  const name=document.getElementById('wl-name').value.trim();",
    "  if(document.getElementById('wl-hp')&&document.getElementById('wl-hp').value){document.getElementById('wl-form-wrap').style.display='none';document.getElementById('wl-success').classList.add('show');return;}\n  const name=document.getElementById('wl-name').value.trim();"
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Honeypot added to index.html')
