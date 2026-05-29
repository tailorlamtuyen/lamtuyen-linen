with open('supabase/functions/admin-api/index.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "    fabric_meters: Number(fabric_meters),",
    "    measurements: (body as any).measurements || null,\n    fabric_meters: Number(fabric_meters),"
)

with open('supabase/functions/admin-api/index.ts', 'w') as f:
    f.write(content)

print('admin-api updated - measurements will now save to pricing_data')
