with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const SB = window.supabase.createClient(SURL, SKEY);",
    "const SB = window.supabase.createClient(SURL, SKEY);\nconst VAPID_PUBLIC_KEY = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';"
)

push_code = '''
// ── PUSH NOTIFICATIONS
function urlBase64ToUint8Array(b64){
  const pad='='.repeat((4-b64.length%4)%4);
  const b=(b64+pad).replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(b);
  return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
}
async function subscribePush(){
  if(!('serviceWorker' in navigator)||!('PushManager' in window)) return;
  if(!VAPID_PUBLIC_KEY||VAPID_PUBLIC_KEY.includes('REPLACE')) return;
  try{
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub){
      sub=await reg.pushManager.subscribe({
        userVisibleOnly:true,
        applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }
    const {data:{session}}=await SB.auth.getSession();
    if(!session) return;
    await fetch(SURL+'/rest/v1/push_subscriptions',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey':SKEY,
        'Authorization':'Bearer '+session.access_token,
        'Prefer':'resolution=merge-duplicates'
      },
      body:JSON.stringify({
        email:ALLOWED_EMAIL,
        endpoint:sub.endpoint,
        subscription:JSON.stringify(sub),
        updated_at:new Date().toISOString()
      })
    });
  }catch(e){console.warn('Push sub error:',e.message);}
}
async function updateAppBadge(n){
  if('setAppBadge' in navigator) try{await navigator.setAppBadge(n);}catch(_){}
}
async function clearAppBadge(){
  if('clearAppBadge' in navigator) try{await navigator.clearAppBadge();}catch(_){}
  if('serviceWorker' in navigator){
    const reg=await navigator.serviceWorker.getRegistration();
    if(reg){const ns=await reg.getNotifications({tag:'lt-order'});ns.forEach(n=>n.close());}
  }
}

'''

content = content.replace(
    '// ── INIT ─────────────────────────────────────────────────────────',
    push_code + '// ── INIT ─────────────────────────────────────────────────────────'
)

content = content.replace(
    '  setupRealtime();\n  requestNotifPermission();\n  startAutoRefresh();\n}',
    '  setupRealtime();\n  requestNotifPermission();\n  startAutoRefresh();\n  subscribePush();\n}'
)

content = content.replace(
    '  updateNewBadge(n);\n}',
    '  updateNewBadge(n);\n  updateAppBadge(n);\n}',
    1
)

content = content.replace(
    "if(s==='home') updateNewBadge();",
    "if(s==='home'){updateNewBadge();clearAppBadge();}"
)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS — push notifications patched into admin.html')
