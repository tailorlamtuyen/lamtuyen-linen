with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_phone = '<div class="field"><label class="field-lbl">WhatsApp Number</label><input type="tel" id="wl-phone" class="field-input" placeholder="+1 234 567 8900"></div>'

new_phone = '''<div class="field"><label class="field-lbl">WhatsApp Number</label>
<div style="display:flex;gap:8px">
<select id="wl-dialcode" class="field-input" style="width:148px;flex-shrink:0;padding-left:10px">
<option value="+84">🇻🇳 VN +84</option>
<option value="+61">🇦🇺 AU +61</option>
<option value="+43">🇦🇹 AT +43</option>
<option value="+32">🇧🇪 BE +32</option>
<option value="+55">🇧🇷 BR +55</option>
<option value="+1_ca">🇨🇦 CA +1</option>
<option value="+86">🇨🇳 CN +86</option>
<option value="+45">🇩🇰 DK +45</option>
<option value="+358">🇫🇮 FI +358</option>
<option value="+33">🇫🇷 FR +33</option>
<option value="+49">🇩🇪 DE +49</option>
<option value="+852">🇭🇰 HK +852</option>
<option value="+36">🇭🇺 HU +36</option>
<option value="+91">🇮🇳 IN +91</option>
<option value="+62">🇮🇩 ID +62</option>
<option value="+353">🇮🇪 IE +353</option>
<option value="+39">🇮🇹 IT +39</option>
<option value="+81">🇯🇵 JP +81</option>
<option value="+60">🇲🇾 MY +60</option>
<option value="+52">🇲🇽 MX +52</option>
<option value="+31">🇳🇱 NL +31</option>
<option value="+64">🇳🇿 NZ +64</option>
<option value="+47">🇳🇴 NO +47</option>
<option value="+63">🇵🇭 PH +63</option>
<option value="+48">🇵🇱 PL +48</option>
<option value="+351">🇵🇹 PT +351</option>
<option value="+65">🇸🇬 SG +65</option>
<option value="+82">🇰🇷 KR +82</option>
<option value="+34">🇪🇸 ES +34</option>
<option value="+46">🇸🇪 SE +46</option>
<option value="+41">🇨🇭 CH +41</option>
<option value="+886">🇹🇼 TW +886</option>
<option value="+66">🇹🇭 TH +66</option>
<option value="+971">🇦🇪 AE +971</option>
<option value="+44">🇬🇧 GB +44</option>
<option value="+1_us">🇺🇸 US +1</option>
<option value="+84">🌍 Other</option>
</select>
<input type="tel" id="wl-phone" class="field-input" placeholder="Phone number" style="flex:1;min-width:0">
</div></div>'''

content = content.replace(old_phone, new_phone)

old_country = '<div class="field"><label class="field-lbl">Country</label><input type="text" id="wl-country" class="field-input" placeholder="e.g. Australia, USA, Vietnam"></div>'

new_country = '''<div class="field"><label class="field-lbl">Country</label>
<select id="wl-country" class="field-input">
<option value="">Select your country...</option>
<option value="Vietnam">🇻🇳 Vietnam</option>
<option value="" disabled>──────────</option>
<option value="Afghanistan">Afghanistan</option>
<option value="Argentina">🇦🇷 Argentina</option>
<option value="Australia">🇦🇺 Australia</option>
<option value="Austria">🇦🇹 Austria</option>
<option value="Belgium">🇧🇪 Belgium</option>
<option value="Brazil">🇧🇷 Brazil</option>
<option value="Cambodia">🇰🇭 Cambodia</option>
<option value="Canada">🇨🇦 Canada</option>
<option value="Chile">🇨🇱 Chile</option>
<option value="China">🇨🇳 China</option>
<option value="Czech Republic">🇨🇿 Czech Republic</option>
<option value="Denmark">🇩🇰 Denmark</option>
<option value="Finland">🇫🇮 Finland</option>
<option value="France">🇫🇷 France</option>
<option value="Germany">🇩🇪 Germany</option>
<option value="Greece">🇬🇷 Greece</option>
<option value="Hong Kong">🇭🇰 Hong Kong</option>
<option value="Hungary">🇭🇺 Hungary</option>
<option value="India">🇮🇳 India</option>
<option value="Indonesia">🇮🇩 Indonesia</option>
<option value="Ireland">🇮🇪 Ireland</option>
<option value="Israel">🇮🇱 Israel</option>
<option value="Italy">🇮🇹 Italy</option>
<option value="Japan">🇯🇵 Japan</option>
<option value="Laos">🇱🇦 Laos</option>
<option value="Malaysia">🇲🇾 Malaysia</option>
<option value="Mexico">🇲🇽 Mexico</option>
<option value="Myanmar">🇲🇲 Myanmar</option>
<option value="Netherlands">🇳🇱 Netherlands</option>
<option value="New Zealand">🇳🇿 New Zealand</option>
<option value="Norway">🇳🇴 Norway</option>
<option value="Philippines">🇵🇭 Philippines</option>
<option value="Poland">🇵🇱 Poland</option>
<option value="Portugal">🇵🇹 Portugal</option>
<option value="Romania">🇷🇴 Romania</option>
<option value="Russia">🇷🇺 Russia</option>
<option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
<option value="Singapore">🇸🇬 Singapore</option>
<option value="South Africa">🇿🇦 South Africa</option>
<option value="South Korea">🇰🇷 South Korea</option>
<option value="Spain">🇪🇸 Spain</option>
<option value="Sweden">🇸🇪 Sweden</option>
<option value="Switzerland">🇨🇭 Switzerland</option>
<option value="Taiwan">🇹🇼 Taiwan</option>
<option value="Thailand">🇹🇭 Thailand</option>
<option value="Turkey">🇹🇷 Turkey</option>
<option value="Ukraine">🇺🇦 Ukraine</option>
<option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
<option value="United Kingdom">🇬🇧 United Kingdom</option>
<option value="United States">🇺🇸 United States</option>
<option value="Other">🌍 Other</option>
</select></div>'''

content = content.replace(old_country, new_country)

content = content.replace(
    "const phone=document.getElementById('wl-phone').value.trim();",
    "const rawCode=document.getElementById('wl-dialcode').value.replace('_ca','').replace('_us','');\n  const phoneRaw=document.getElementById('wl-phone').value.trim();\n  const phone=phoneRaw?(rawCode+' '+phoneRaw):null;"
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS - phone dial code and country dropdowns added')
