with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. ADD TOGGLE CSS
toggle_css = """
/* ── TOGGLE SWITCHES */
.toggle{position:relative;display:inline-block;width:48px;height:27px;flex-shrink:0}
.toggle input{opacity:0;width:0;height:0;position:absolute}
.tslider{position:absolute;cursor:pointer;inset:0;background:#CBD5E0;border-radius:27px;transition:.3s}
.tslider:before{content:"";position:absolute;width:21px;height:21px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
input:checked+.tslider{background:var(--a1)}
input:checked+.tslider:before{transform:translateX(21px)}
input:disabled+.tslider{opacity:.35;cursor:not-allowed}
.toggle-row{display:flex;align-items:center;gap:14px;padding:10px 0}
.toggle-note{font-size:.72rem;color:var(--tdim);line-height:1.6;margin-top:6px;padding:8px 12px;background:var(--bg2);border-radius:3px}
"""
content = content.replace('</style>\n</head>', toggle_css + '</style>\n</head>', 1)

# ── 2. ADD LAUNCH STORE + AUTO-PRICING SECTIONS before save button
new_sections = """
        <div class="set-sec" id="launch-sec" style="border:2px solid rgba(184,147,90,.4)">
          <div class="set-sec-h" style="font-size:.7rem;letter-spacing:3px">🚀 Launch Store</div>
          <div class="toggle-row">
            <label class="toggle">
              <input type="checkbox" id="store-mode-toggle" onchange="toggleStoreMode(this)">
              <span class="tslider"></span>
            </label>
            <div>
              <div class="set-lbl" style="font-weight:500">Store is Live</div>
              <div style="font-size:.72rem;margin-top:2px" id="store-mode-desc">Currently: Coming Soon — customers see the waitlist page</div>
            </div>
          </div>
          <div class="toggle-note">When switched ON → the full store goes live immediately. Customers can browse and order. When OFF → customers see the Coming Soon waitlist page.</div>
        </div>

        <div class="set-sec" id="autoprice-sec">
          <div class="set-sec-h">⚡ Auto-Pricing System</div>
          <div class="auto-box" id="auto-box">
            <div class="auto-title" data-i18n="autoPrice">Auto-Pricing Progress</div>
            <div class="auto-lbl" id="auto-lbl">0 / 350 orders</div>
            <div class="auto-bar-bg"><div class="auto-bar-fill" id="auto-fill" style="width:0%"></div></div>
            <div class="auto-lbl" id="auto-hint" style="margin-top:5px;font-size:.66rem"></div>
          </div>
          <div class="toggle-row" style="margin-top:14px">
            <label class="toggle">
              <input type="checkbox" id="auto-price-toggle" onchange="toggleAutoPricing(this)" disabled>
              <span class="tslider"></span>
            </label>
            <div>
              <div class="set-lbl" id="auto-price-lbl">Auto-Pricing</div>
              <div style="font-size:.72rem;color:var(--tdim);margin-top:2px" id="auto-price-desc">Complete 350 orders to unlock automatic customer pricing</div>
            </div>
          </div>
          <div class="toggle-note">Once active → customers enter their measurements and the system calculates prices automatically. No manual quoting needed.</div>
        </div>

"""

content = content.replace(
    '\n        <div class="set-sec">\n          <div class="set-sec-h" data-i18n="pricingDefaults">Pricing Defaults</div>',
    new_sections + '\n        <div class="set-sec">\n          <div class="set-sec-h" data-i18n="pricingDefaults">Pricing Defaults</div>'
)

# Remove duplicate auto-box that was inside Pricing Defaults
import re
content = re.sub(
    r'\n          <div class="auto-box" id="auto-box">.*?</div>\n        </div>\n\n        <div class="set-sec">\n          <div class="set-sec-h" data-i18n="fabricMeters">',
    '\n        </div>\n\n        <div class="set-sec">\n          <div class="set-sec-h" data-i18n="fabricMeters">',
    content, flags=re.DOTALL
)

# ── 3. ADD JS FUNCTIONS before // ── REALTIME
toggle_js = """
// ── STORE LAUNCH + AUTO-PRICING TOGGLES ──────────────────────────────────
async function toggleStoreMode(el){
  const isLive=el.checked;
  if(isLive&&!confirm('Launch the store? Customers will see the full website immediately.')){
    el.checked=false; return;
  }
  try{
    await adminAPI('update_setting',{key:'store_mode',value:isLive?'live':'coming_soon'});
    const desc=document.getElementById('store-mode-desc');
    if(desc){
      desc.textContent=isLive?'Currently: LIVE — customers can shop now':'Currently: Coming Soon — customers see the waitlist page';
      desc.style.color=isLive?'#059669':'';
    }
    toast(isLive?'🎉 Store is now LIVE! Customers can shop.':'Store switched back to Coming Soon','success');
  }catch(e){el.checked=!isLive;toast('Failed: '+e.message,'error');}
}

async function toggleAutoPricing(el){
  const isOn=el.checked;
  if(isOn&&!confirm('Enable auto-pricing? Customers will see prices based on their measurements automatically.')){
    el.checked=false; return;
  }
  try{
    await adminAPI('update_setting',{key:'auto_pricing_enabled',value:String(isOn)});
    const desc=document.getElementById('auto-price-desc');
    if(desc){
      desc.textContent=isOn?'ACTIVE — customers see prices automatically':'Off — you set prices manually';
      desc.style.color=isOn?'#059669':'';
    }
    toast(isOn?'✨ Auto-pricing is now ACTIVE!':'Auto-pricing turned off',isOn?'success':'info');
  }catch(e){el.checked=!isOn;toast('Failed: '+e.message,'error');}
}

"""
content = content.replace(
    '// ── REALTIME ─────────────────────────────────────────────────────────────────',
    toggle_js + '// ── REALTIME ─────────────────────────────────────────────────────────────────'
)

# ── 4. UPDATE renderSettings to load toggle states
content = content.replace(
    "  renderAutoBar();\n}",
    """  renderAutoBar();
  // Load store mode toggle
  const sm=s.store_mode||'coming_soon';
  const sTog=document.getElementById('store-mode-toggle');
  if(sTog){
    sTog.checked=sm==='live';
    const desc=document.getElementById('store-mode-desc');
    if(desc){desc.textContent=sm==='live'?'Currently: LIVE — customers can shop now':'Currently: Coming Soon — customers see the waitlist page';if(sm==='live')desc.style.color='#059669';}
  }
}""",
    1
)

# ── 5. UPDATE renderAutoBar to control the auto-pricing toggle
content = content.replace(
    """  if(el('auto-hint')){
    if(n>=target){
      el('auto-hint').textContent='✓ Auto-pricing is active!';
      el('auto-box').classList.add('auto-unlocked');
    } else {
      el('auto-hint').textContent=`${target-n} more completed orders until auto-pricing is available`;
    }
  }
}""",
    """  if(el('auto-hint')){
    if(n>=target){
      el('auto-hint').textContent='✓ Unlocked! Flip the switch below to activate.';
      el('auto-box')?.classList.add('auto-unlocked');
    } else {
      el('auto-hint').textContent=`${target-n} more completed orders to unlock auto-pricing`;
    }
  }
  // Control auto-pricing toggle availability
  const apTog=document.getElementById('auto-price-toggle');
  if(apTog){
    const isEnabled=settings.auto_pricing_enabled==='true'||settings.auto_pricing_enabled===true;
    apTog.disabled=n<target&&!isEnabled;
    apTog.checked=isEnabled;
    const apDesc=document.getElementById('auto-price-desc');
    if(apDesc){
      if(isEnabled){apDesc.textContent='ACTIVE — customers see prices automatically';apDesc.style.color='#059669';}
      else if(n>=target){apDesc.textContent='Unlocked! Flip the switch to activate auto-pricing';apDesc.style.color='var(--a1)';}
      else{apDesc.textContent='Complete '+（target-n)+' more orders to unlock';apDesc.style.color='';}
    }
  }
}"""
)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS - both switches added to admin.html')
