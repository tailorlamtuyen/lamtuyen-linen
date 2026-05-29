with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Send Confirmation button at end of renderCustomerTab
content = content.replace(
    "${waNum?`<a class=\"wa-btn\" href=\"https://wa.me/${waNum}?text=${waMsg}\" target=\"_blank\">💬 ${t('whatsapp')}</a>`:''}`;",
    """${waNum?`<a class="wa-btn" href="https://wa.me/${waNum}?text=${waMsg}" target="_blank">💬 ${t('whatsapp')}</a>`:''}
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bdr);display:flex;flex-direction:column;gap:8px">
      <button id="send-confirm-btn" onclick="sendOrderConfirmation()" style="width:100%;background:var(--bgd);color:var(--a1);border:none;border-radius:4px;padding:13px;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:background .2s;font-family:inherit">✉️ Send Luxury Confirmation to Customer</button>
      ${waNum?`<button onclick="sendWhatsAppConfirmation()" style="width:100%;background:#25D366;color:#fff;border:none;border-radius:4px;padding:13px;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-family:inherit">💬 Send WhatsApp Confirmation</button>`:''}
    </div>`;"""
)

# 2. Add the JS functions before // ── REALTIME
receipt_js = """
// ── SEND ORDER CONFIRMATION ──────────────────────────────────────────────────
async function sendOrderConfirmation(){
  const o=selectedOrder; if(!o)return;
  if(!o.email){toast('No email address for this customer','error');return;}
  const btn=document.getElementById('send-confirm-btn');
  const orig=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='Sending...';}
  try{
    const {data:{session}}=await SB.auth.getSession();
    const res=await fetch(SURL+'/functions/v1/send-order-email',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey':SKEY,
        'Authorization':'Bearer '+session.access_token
      },
      body:JSON.stringify({
        order_ref:o.order_ref,
        name:o.name,
        email:o.email,
        phone:o.phone||'',
        garment:o.garment||'',
        colour:o.colour||'',
        country:o.country||'',
        notes:o.notes||''
      })
    });
    const data=await res.json();
    if(data.customer_email_sent){
      toast('✉️ Luxury confirmation sent to '+o.email,'success');
      if(btn){btn.textContent='Sent ✓';setTimeout(()=>{btn.textContent=orig;btn.disabled=false;},3000);}
    } else {
      toast('Could not reach customer email — try WhatsApp instead','info');
      if(btn){btn.textContent=orig;btn.disabled=false;}
    }
  }catch(e){
    toast('Failed: '+e.message,'error');
    if(btn){btn.textContent=orig;btn.disabled=false;}
  }
}

function sendWhatsAppConfirmation(){
  const o=selectedOrder; if(!o)return;
  const waNum=(o.phone||'').replace(/\\D/g,'');
  if(!waNum){toast('No phone number for this customer','error');return;}
  const msg=encodeURIComponent(
    'Hello '+o.name+' 🌿\\n\\nThank you for choosing Lam Tuyen Linen.\\n\\nYour order reference: '+o.order_ref+'\\n\\nYour request for '+（o.garment||'your garment')+(o.colour?' in '+o.colour:'')+' has been received by our master tailor personally.\\n\\nYou will receive your price quote soon. In the meantime, any questions — I am here.\\n\\nWith gratitude,\\nLam Tuyen 🧵\\nStall #9, Han Market, Da Nang'
  );
  window.open('https://wa.me/'+waNum+'?text='+msg,'_blank');
}

"""

content = content.replace(
    '// ── REALTIME ─────────────────────────────────────────────────────────────────',
    receipt_js + '// ── REALTIME ─────────────────────────────────────────────────────────────────'
)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS - Send Confirmation button added to admin order view')
