import os

NEW_ADDR_LONG = "Stall #9, Han Market, 119 Trần Phú, Hải Châu I, Đà Nẵng, Vietnam"
NEW_ADDR_SHORT = "Stall #9 · Han Market · 119 Trần Phú · Hải Châu I · Đà Nẵng · Vietnam"
NEW_SIG = "Master Tailor · Stall #9, Han Market, 119 Trần Phú, Hải Châu I, Đà Nẵng · Est. 2010"

files = [
    'supabase/functions/send-waitlist-email/index.ts',
    'supabase/functions/admin-api/index.ts',
    'supabase/functions/send-order-email/index.ts',
    'supabase/functions/send-shipped-email/index.ts',
    'index.html',
]

replacements = [
    ("Stall #9 , Han Market, 119 Tran Phu, Hai Chau I, Da Nang", NEW_ADDR_LONG),
    ("119 Trần Phú · Han Market · Hải Châu · Đà Nẵng · Vietnam", NEW_ADDR_SHORT),
    ("119 Trần Phú · Han Market · Đà Nẵng · Vietnam", NEW_ADDR_SHORT),
    ("Han Market · 119 Trần Phú · Da Nang", NEW_ADDR_SHORT),
    ("119 Trần Phú, Hải Châu, Đà Nẵng, Vietnam", NEW_ADDR_LONG),
    ("119 Trần Phú, Hải Châu, Đà Nẵng", NEW_ADDR_LONG),
    ("Han Market, 119 Trần Phú, Da Nang · Est. 2010", NEW_SIG),
    ("Han Market, 119 Trần Phú, Da Nang", "Stall #9, Han Market, 119 Trần Phú, Hải Châu I, Đà Nẵng"),
    ("119 Trần Phú · Han Market · Da Nang", NEW_ADDR_SHORT),
    ("Hải Châu, Đà Nẵng", "Hải Châu I, Đà Nẵng"),
]

updated = []
for fp in files:
    if not os.path.exists(fp): continue
    with open(fp, 'r', encoding='utf-8') as f:
        c = f.read()
    orig = c
    for old, new in replacements:
        c = c.replace(old, new)
    if c != orig:
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(c)
        updated.append(fp)
        print('Updated:', fp)

print('Done.', len(updated), 'files updated')
