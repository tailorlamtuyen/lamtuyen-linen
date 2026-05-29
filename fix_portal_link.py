with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re

content = re.sub(
    r'<div style="text-align:center;padding:[^"]*"><a href="/admin"[^>]*>© Lam Tuyen Linen</a></div>',
    '',
    content
)

portal = '''<div id="owner-portal-link" style="text-align:center;padding:16px 20px 80px;margin-top:8px">
  <a href="/admin" style="font-size:.65rem;letter-spacing:3px;text-transform:uppercase;color:#8A7058;opacity:0.5;text-decoration:none;-webkit-tap-highlight-color:transparent;display:inline-block;padding:10px 16px">© Lam Tuyen Linen</a>
</div>
<style>
@media(min-width:768px){
  #owner-portal-link{padding-bottom:32px}
}
</style>'''

content = content.replace('</body>', portal + '\n</body>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('done')
