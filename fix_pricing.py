import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_pricing_tab = '''function renderPricingTab(){
  const o=selectedOrder; if(!o)return;
  const cfg=settings;
  const fm=cfg.fabric_meters||{};
  const sz=cfg.shipping_zones||{};
  const margin=Number(cfg.profit_margin)||2.5;
  const fabricCostDef=Number((cfg.fabric_costs||{}).default)||150000;
  const baseMeters=Number(fm[o.garment])||2.5;
  const shipCost=Number(sz[o.country]||sz['default'])||500000;

  const adj=[];
  const h=Number(o.height||0),ch=Number(o.chest||0);
  const hi=Number(o.hips||0),gl=Number(o.length||o.waist_to_floor||0);
  let extraMeters=0;
  if(h>170){adj.push('height '+h+'cm +0.3m');extraMeters+=0.3;}
  if(ch>100){adj.push('chest '+ch+'cm +0.2m');extraMeters+=0.2;}
  if(hi>105){adj.push('hips '+hi+'cm +0.2m');extraMeters+=0.2;}
  if(gl>120){adj.push('length '+gl+'cm +0.3m');extraMeters+=0.3;}
  const adjMeters=Math.round((baseMeters+extraMeters)*10)/10;
  const adjText=adj.length
    ? 'Base '+baseMeters+'m + adjustments ('+adj.join(', ')+') = '+adjMeters+'m'
    : 'Base '+baseMeters+'m — no size adjustments needed';

  const COMPLEX_G=['Ao Dai','Bespoke Linen Suit'];
  const MEDIUM_G=['Dress','Set','Blouse','Wrap'];
  const lc=cfg.labour_costs||{simple:200000,medium:300000,complex:450000};
  let labourBase=Number(lc.simple)||200000;
  let complexLabel='Simple (shirt / trousers)';
  const g=o.garment||'';
  if(COMPLEX_G.some(x=>g.includes(x.split(' ')[0]))){labourBase=Number(lc.complex)||450000;complexLabel='Complex (suit / ao dai)';}
  else if(MEDIUM_G.some(x=>g.includes(x))){labourBase=Number(lc.medium)||300000;complexLabel='Medium (dress / set / blouse)';}

  const measParts=[
    o.chest?'Chest: '+o.chest+'cm':'',
    o.waist?'Waist: '+o.waist+'cm':'',
    o.hips?'Hips: '+o.hips+'cm':'',
    o.height?'Height: '+o.height+'cm':'',
    o.length?'Length: '+o.length+'cm':'',
  ].filter(Boolean).join(' · ');

  document.getElementById('pane-pricing').innerHTML=
    (measParts?'<div style="background:var(--bg2);border-left:3px solid var(--a1);padding:10px 14px;margin-bottom:12px;border-radius:2px"><span style="display:block;font-size:.52rem;letter-spacing:2px;text-transform:uppercase;color:var(--a1);margin-bottom:4px">Key Measurements</span><span style="font-size:.78rem;color:var(--tb)">'+esc(measParts)+'</span></div>':'')+
    '<div style="background:rgba(184,147,90,.07);border:1px solid var(--bdrw);border-radius:4px;padding:10px 14px;margin-bottom:14px"><span style="display:block;font-size:.52rem;letter-spacing:2px;text-transform:uppercase;color:var(--a1);margin-bottom:4px">Fabric Adjustment</span><span style="font-size:.76rem;color:var(--tm)">'+esc(adjText)+'</span></div>'+
    '<div class="calc-hist" id="calc-hist"></div>'+
    '<div class="calc-wrap">'+
      '<div class="calc-row"><span class="calc-lbl">Garment</span><span style="font-size:.82rem;color:var(--th);font-weight:400">'+esc(g||'—')+'</span></div>'+
      '<div class="calc-row"><span class="calc-lbl">Complexity</span><span style="font-size:.72rem;color:var(--tdim)">'+esc(complexLabel)+'</span></div>'+
      '<div class="calc-row"><span class="calc-lbl">Fabric cost/m (₫)</span><input type="number" id="cp-fabric-cost" class="calc-in" value="'+fabricCostDef+'" oninput="calcLive()"></div>'+
      '<div class="calc-row"><span class="calc-lbl">Fabric meters <span style="font-size:.62rem;color:var(--a1)">(auto-adjusted)</span></span><input type="number" id="cp-meters" class="calc-in" step="0.1" value="'+adjMeters+'" oninput="calcLive()"></div>'+
      '<div class="calc-row"><span class="calc-lbl">Labour (₫)</span><input type="number" id="cp-labour" class="calc-in" value="'+labourBase+'" oninput="calcLive()"></div>'+
      '<div class="calc-row"><span class="calc-lbl">Shipping to '+esc(o.country||'?')+' (₫)</span><input type="number" id="cp-ship" class="calc-in" value="'+shipCost+'" oninput="calcLive()"></div>'+
      '<div class="calc-row"><span class="calc-lbl">Profit margin</span><input type="number" id="cp-margin" class="calc-in" step="0.1" value="'+margin+'" oninput="calcLive()"></div>'+
    '</div>'+
    '<div class="calc-out" id="calc-out">'+
      '<div class="calc-out-row"><span class="calc-out-lbl">Fabric</span><span id="co-fabric">—</span></div>'+
      '<div class="calc-out-row"><span class="calc-out-lbl">Labour</span><span id="co-labour">—</span></div>'+
      '<div class="calc-out-row"><span class="calc-out-lbl">Shipping</span><span id="co-ship">—</span></div>'+
      '<hr style="border:none;border-top:1px solid rgba(184,147,90,.25);margin:8px 0">'+
      '<div class="calc-out-row"><span class="calc-out-lbl">Total Cost</span><span id="co-cost">—</span></div>'+
      '<div class="calc-out-row" style="margin-top:6px"><span class="calc-out-lbl">Suggested Price (×<span id="co-mg">'+margin+'</span>)</span><span class="calc-total-val" id="co-suggested">—</span></div>'+
      '<div class="calc-approx" id="co-approx"></div>'+
      '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(184,147,90,.2)"><div class="calc-out-row"><span class="calc-out-lbl">Est. Profit</span><span id="co-profit" style="color:#6ee7b7">—</span></div><div class="calc-out-row"><span class="calc-out-lbl">Margin %</span><span id="co-margin-pct" style="color:#6ee7b7">—</span></div></div>'+
    '</div>'+
    '<div class="final-price-row"><span class="final-price-lbl">Final Price (₫) — override if needed</span><input type="number" id="cp-final" class="final-price-in" placeholder="Enter final price"></div>'+
    '<button class="send-price-btn" onclick="sendPriceQuote()" id="send-price-btn">'+t('sendPrice')+'</button>';

  calcLive();
  loadHistoricalPrice(o.garment);
}'''

new_calc_live = '''function calcLive(){
  const fc=parseFloat(document.getElementById('cp-fabric-cost')?.value)||0;
  const m=parseFloat(document.getElementById('cp-meters')?.value)||0;
  const l=parseFloat(document.getElementById('cp-labour')?.value)||0;
  const s=parseFloat(document.getElementById('cp-ship')?.value)||0;
  const mg=parseFloat(document.getElementById('cp-margin')?.value)||2.5;

  const fabric=Math.round(fc*m);
  const totalCost=fabric+l+s;
  const suggested=Math.round((fabric+l)*mg+s);
  const profit=suggested-totalCost;
  const marginPct=totalCost>0?Math.round((profit/suggested)*100):0;

  set('co-fabric',fmtVND(fabric)+' ('+m+'m × '+fmtVND(fc)+'/m)');
  set('co-labour',fmtVND(l));
  set('co-ship',fmtVND(s));
  set('co-cost',fmtVND(totalCost));
  set('co-suggested',fmtVND(suggested));
  set('co-profit',fmtVND(profit));
  set('co-margin-pct',marginPct+'%');
  const mgEl=document.getElementById('co-mg');
  if(mgEl) mgEl.textContent=mg;

  const usd=Math.round(suggested/25000);
  const eur=Math.round(suggested/27000);
  const aud=Math.round(suggested/16500);
  set('co-approx','≈ USD '+usd+' · EUR '+eur+' · AUD '+aud);

  const fin=document.getElementById('cp-final');
  if(fin&&!fin.value) fin.value=suggested;
  const btn=document.getElementById('send-price-btn');
  if(btn) btn.disabled=suggested<=0;
}'''

content = re.sub(
    r'function renderPricingTab\(\)\{.*?(?=function calcLive)',
    new_pricing_tab + '\n\n',
    content, flags=re.DOTALL
)

content = re.sub(
    r'function calcLive\(\)\{.*?(?=async function loadHistoricalPrice)',
    new_calc_live + '\n\n',
    content, flags=re.DOTALL
)

old_complete = "if(['payment_received','shipped'].includes(s)) actions.push({label:t('markComplete'),cls:'succ',fn:\"updateOrderStatus('complete')\"});"
new_complete = """const isPaid=s==='payment_received'||!!o.paid_at;
  if(s==='shipped'&&!isPaid){
    actions.push({label:'⚠️ Confirm Payment First',cls:'sec',fn:"toast('Payment not confirmed — use Confirm Payment Received before marking complete','error')"});
  } else if(isPaid&&['payment_received','shipped'].includes(s)){
    actions.push({label:t('markComplete'),cls:'succ',fn:"updateOrderStatus('complete')"});
  }"""

content = content.replace(old_complete, new_complete)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS — pricing calculator + payment block fixed')
