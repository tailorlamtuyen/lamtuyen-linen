with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_js = """    if(error){
      if(error.code==='23505'||error.message.includes('duplicate')||error.message.includes('unique')){
        document.getElementById('wl-form-wrap').style.display='none';
        document.getElementById('wl-success').classList.add('show');
        return;
      }
      throw error;
    }
    document.getElementById('wl-form-wrap').style.display='none';
    document.getElementById('wl-success').classList.add('show');"""

new_js = """    if(error){
      if(error.code==='23505'||error.message.includes('duplicate')||error.message.includes('unique')){
        document.getElementById('wl-form-wrap').style.display='none';
        document.getElementById('wl-success').classList.add('show');
        return;
      }
      throw error;
    }
    try{
      await fetch('https://vyldmdavizedqhihnkwg.supabase.co/functions/v1/send-waitlist-email',{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':'sb_publishable_2Wua7AAvKSTrMHLT35xjVQ_8JuYqS2b'},
        body:JSON.stringify({name,email,phone:phone||null,country:country||null,garment_interest:garments||null})
      });
    }catch(emailErr){console.warn('Email send failed:',emailErr);}
    document.getElementById('wl-form-wrap').style.display='none';
    document.getElementById('wl-success').classList.add('show');"""

content = content.replace(old_js, new_js)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS - waitlist email function connected')
