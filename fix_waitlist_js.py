with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_js = """    const {error}=await SB.from('waitlist').upsert({
      name,email,phone:phone||null,country:country||null,
      height,chest,waist,hips,garment_interest:garments||null
    },{onConflict:'email'});
    if(error) throw error;"""

new_js = """    const {error}=await SB.from('waitlist').insert({
      name,email,phone:phone||null,country:country||null,
      height,chest,waist,hips,garment_interest:garments||null
    });
    if(error){
      if(error.code==='23505'||error.message.includes('duplicate')||error.message.includes('unique')){
        document.getElementById('wl-form-wrap').style.display='none';
        document.getElementById('wl-success').classList.add('show');
        return;
      }
      throw error;
    }"""

content = content.replace(old_js, new_js)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS - waitlist JS fixed')
