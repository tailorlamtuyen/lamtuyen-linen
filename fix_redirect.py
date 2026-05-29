with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

redirect_check = """
// Check if store has launched and redirect to full store
(async function(){
  try{
    const r=await SB.from('settings').select('value').eq('key','store_mode').single();
    if(r.data&&r.data.value==='live') window.location.replace('/store');
  }catch(_){}
})();
"""

content = content.replace(
    "async function submitWaitlist(){",
    redirect_check + "\nasync function submitWaitlist(){"
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS - store launch redirect added to coming soon page')
