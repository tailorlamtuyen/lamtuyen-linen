import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_render = '''function renderMeasurementsTab(){
  const o=selectedOrder; if(!o)return;
  const MSEC=[
    {label:'Upper Body',fields:[
      ['Chest / Bust','chest'],['Natural Waist','waist'],['High Hip','high_hip'],['Full Hips','hips'],
      ['Shoulder Width','shoulder'],['Shoulder to Shoulder','shoulder_to_shoulder'],
      ['Across Chest','across_chest'],['Across Back','across_back'],['Back Width','back_width'],
      ['Bust Point-Point','bust_point'],['Bust Height','bust_height'],['Under Bust','under_bust'],
    ]},
    {label:'Arms',fields:[
      ['Sleeve Length','sleeve'],['Arm Length (underarm)','arm_length'],['Bicep','bicep'],
      ['Elbow','elbow'],['Tricep / Mid-Arm','tricep'],['Wrist','wrist'],['Armhole','armhole'],
    ]},
    {label:'Neck & Head',fields:[['Neck','neck'],['Head','head']]},
    {label:'Lower Body',fields:[
      ['Waist to Hip','waist_to_hip'],['Crotch/Rise','rise'],['Inseam','inseam'],
      ['Outseam','outseam'],['Thigh','thigh'],['Knee','knee'],['Calf','calf'],
      ['Ankle','ankle'],['Waist to Knee','waist_to_knee'],
    ]},
    {label:'Full Length',fields:[
      ['Height','height'],['Back Length','back_length'],['Front Length','front_length'],
      ['Torso','torso'],['Waist to Floor','waist_to_floor'],['Garment Length','length'],
    ]},
  ];
  let html='';
  MSEC.forEach(sec=>{
    html+=`<span class="meas-section-lbl">${sec.label}</span><div class="meas-grid">`;
    html+=sec.fields.map(([lbl,k])=>`<div class="mc"><span class="mc-k">${lbl}</span><input class="mc-edit" data-field="${k}" type="number" value="${o[k]||''}" placeholder="—" style="width:100%;border:1px solid var(--bdr);border-radius:3px;padding:3px 6px;font-size:.85rem;color:var(--th);background:#fff;outline:none;text-align:right"></div>`).join('');
    html+='</div>';
  });
  html+=`<span class="meas-section-lbl">Posture Notes</span>`;
  html+=`<textarea id="edit-posture" style="width:100%;border:1px solid var(--bdr);border-radius:3px;padding:6px 8px;font-size:.8rem;color:var(--tb);background:#fff;outline:none;resize:vertical;min-height:60px;margin-top:4px">${esc(o.posture_notes||'')}</textarea>`;
  html+=`<button class="save-meas-btn" onclick="saveMeasurements()" style="margin-top:16px">Save Updated Measurements</button>`;
  document.getElementById('pane-measurements').innerHTML=html;
}'''

new_save = '''async function saveMeasurements(){
  const o=selectedOrder; if(!o)return;
  const btn=document.querySelector('.save-meas-btn');
  const orig=btn?btn.textContent:'';
  if(btn){btn.textContent='Saving...';btn.disabled=true;}
  const updates={};
  document.querySelectorAll('.mc-edit').forEach(inp=>{
    const f=inp.dataset.field;
    const v=inp.value.trim();
    updates[f]=v!==''?parseFloat(v):null;
  });
  const postureEl=document.getElementById('edit-posture');
  if(postureEl) updates.posture_notes=postureEl.value.trim();
  try{
    await adminAPI('update_order',{order_ref:o.order_ref,updates});
    const idx=orders.findIndex(x=>x.order_ref===o.order_ref);
    if(idx>=0) Object.assign(orders[idx],updates);
    Object.assign(selectedOrder,updates);
    if(btn){btn.textContent='Saved ✓';setTimeout(()=>{btn.textContent=orig;btn.disabled=false;},2000);}
    toast('Measurements saved successfully','success');
  }catch(e){
    if(btn){btn.textContent=orig;btn.disabled=false;}
    toast('Save failed: '+e.message,'error');
  }
}'''

content = re.sub(
    r'function renderMeasurementsTab\(\)\{.*?(?=async function saveMeasurements)',
    new_render + '\n\n',
    content, flags=re.DOTALL
)

content = re.sub(
    r'async function saveMeasurements\(\)\{.*?(?=function renderPricingTab)',
    new_save + '\n\n',
    content, flags=re.DOTALL
)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('admin.html updated successfully')
