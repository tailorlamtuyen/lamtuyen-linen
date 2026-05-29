with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<div style="text-align:center;padding:16px 0 28px"><a href="/admin" style="font-size:.58rem;letter-spacing:2px;color:var(--tdim);opacity:0.25;text-decoration:none;cursor:default;-webkit-user-select:none;user-select:none">© Lam Tuyen Linen</a></div>',
    '<div style="text-align:center;padding:20px 0 32px"><a href="/admin" style="font-size:.7rem;letter-spacing:3px;color:var(--tdim);opacity:0.45;text-decoration:none;cursor:default;-webkit-user-select:none;user-select:none">© Lam Tuyen Linen</a></div>'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('done')
