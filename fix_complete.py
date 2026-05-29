import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# FIX 1: Pre-fill final price when reopening an order that already has a price
content = re.sub(
    r'(  calcLive\(\);\n)(  loadHistoricalPrice)',
    r'\1  if(o.final_price){const _f=document.getElementById(\'cp-final\');if(_f&&!_f.value)_f.value=o.final_price;}\n\2',
    content
)

# FIX 2: Use labour_by_garment from settings in pricing tab
content = content.replace(
    "const lc=cfg.labour_costs||{simple:200000,medium:300000,complex:450000};\n  const lbg=cfg.labour_by_garment||{};\n  let labourBase=Number(lbg[g])||Number(lc.simple)||200000;",
    "const lc=cfg.labour_costs||{simple:200000,medium:300000,complex:450000};\n  const lbg=cfg.labour_by_garment||{};\n  let labourBase=Number(lbg[g])||Number(lc.simple)||200000;"
)
# In case Fix 2 already applied, also handle original state
content = content.replace(
    "const lc=cfg.labour_costs||{simple:200000,medium:300000,complex:450000};\n  let labourBase=Number(lc.simple)||200000;",
    "const lc=cfg.labour_costs||{simple:200000,medium:300000,complex:450000};\n  const lbg=cfg.labour_by_garment||{};\n  let labourBase=Number(lbg[g])||Number(lc.simple)||200000;"
)

# FIX 3: Load labour_by_garment into garment grid inputs in renderSettings
content = content.replace(
    "    <input type=\"number\" class=\"g-in\" data-g=\"${esc(name)}\" data-f=\"labour\" value=\"${Math.round(Number(meters)*85000)}\" step=\"10000\">`;",
    "    <input type=\"number\" class=\"g-in\" data-g=\"${esc(name)}\" data-f=\"labour\" value=\"${Number((settings.labour_by_garment||{})[name])||Math.round(Number(meters)*85000)}\" step=\"10000\">`;",
)

# FIX 4: Save labour_by_garment in saveSettings
content = content.replace(
    "      adminAPI('update_setting',{key:'bank_transfer',value:bank}),\n    ]);",
    "      adminAPI('update_setting',{key:'bank_transfer',value:bank}),\n      adminAPI('update_setting',{key:'labour_by_garment',value:(()=>{const r={};document.querySelectorAll('.g-in[data-f=\\\"labour\\\"]').forEach(i=>{if(i.dataset.g)r[i.dataset.g]=parseFloat(i.value)||200000;});return r;})()}),\n    ]);"
)

# FIX 5: Add measurements to sendPriceQuote so they save to pricing_data
content = content.replace(
    "      profit_margin:mg, fabric_meters:m,\n    });",
    "      profit_margin:mg, fabric_meters:m,\n      measurements:(()=>{const r={};['chest','waist','hips','height','length','shoulder','sleeve','thigh','waist_to_floor','back_length','front_length'].forEach(k=>{if(selectedOrder&&selectedOrder[k])r[k]=selectedOrder[k];});return r;})()\n    });"
)

# FIX 6: Mobile and iPad CSS
mobile_css = """
/* ── MOBILE + IPAD IMPROVEMENTS */
@media(max-width:600px){
  .set-row{flex-direction:column;align-items:flex-start;gap:4px}
  .set-in{width:100%;text-align:left}
  .set-textarea{font-size:.8rem}
  .g-row{grid-template-columns:1fr 75px 90px;padding:7px 8px;gap:5px}
  .g-name{font-size:.74rem}
  .g-in{padding:4px 5px;font-size:.75rem}
  .z-row{flex-wrap:wrap}
  .z-in{width:100%;margin-top:3px}
  .calc-wrap{padding:12px}
  .calc-row{flex-wrap:wrap;gap:4px}
  .calc-in{width:110px;font-size:.8rem}
  .calc-out-row{font-size:.78rem}
  .calc-total-val{font-size:1.1rem}
  .final-price-in{font-size:.95rem}
  .sf-btn{min-width:100px;font-size:.6rem;padding:10px 6px}
  .om-tab{padding:8px 9px;font-size:.56rem;letter-spacing:1px}
  .stat-val{font-size:1.5rem}
  .sec-title{font-size:1.2rem}
  .tb-title{font-size:.85rem;letter-spacing:2px}
  .tb-clock{display:none}
  .topbar{padding:0 10px}
  .section{padding:14px 12px 10px}
  .om-body{padding:14px}
  .ds-row{font-size:.8rem}
  .ds-k{min-width:85px;font-size:.72rem}
}
@media(min-width:601px) and (max-width:1023px){
  .stats-grid{grid-template-columns:repeat(4,1fr)}
  .rev-stats{grid-template-columns:repeat(2,1fr)}
  .om-inner{max-width:600px;border-radius:10px;max-height:88vh}
  .g-row{grid-template-columns:1fr 90px 110px}
  .calc-in{width:130px}
  .section{padding:18px 20px 10px}
  .sf-btn{min-width:130px}
}
@media(min-width:768px) and (max-width:1023px){
  .adm-body{overflow:auto}
  .main-content{padding-bottom:70px}
}
"""

content = content.replace('</style>\n</head>', mobile_css + '</style>\n</head>', 1)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS - all fixes applied to admin.html')
