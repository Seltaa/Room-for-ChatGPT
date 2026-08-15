const DEFAULTS={enabled:true,preset:"strawberry",accent:"#d986a9",chatWidth:800,roundedBubbles:true,sparkles:true,backgroundImage:"",backgroundOpacity:32,backgroundBlur:2,backgroundPosition:"center",userName:"You",userEmoji:"🌷",userAvatar:"",assistantName:"ChatGPT",assistantEmoji:"✦",assistantAvatar:"",showProfiles:true,showComposerProfile:false,composerPlaceholder:"Write something lovely…",composerStyled:true,composerColor:"#fffafc",composerOpacity:92,composerRadius:28,showClock:true,clockPosition:"top-right",clock24:false};
const PRESETS={
  strawberry:{accent:"#d986a9"},lavender:{accent:"#9c7ac7"},butter:{accent:"#c49546"},rose:{accent:"#cf6f9d"},midnight:{accent:"#6f9fd8"}
};
const ids=Object.keys(DEFAULTS).filter(k=>!['userAvatar','assistantAvatar','backgroundImage'].includes(k));
const $=id=>document.getElementById(id);
let settings={...DEFAULTS};let saveTimer;

async function load(){settings={...DEFAULTS,...await chrome.storage.local.get(DEFAULTS)};for(const id of ids){const el=$(id);if(!el)continue;el.type==='checkbox'?el.checked=!!settings[id]:el.value=settings[id]}
  avatarPreview('user',settings.userAvatar);avatarPreview('assistant',settings.assistantAvatar);syncLabels();markPreset();}
function syncLabels(){$('chatWidthOut').textContent=`${settings.chatWidth}px`;$('backgroundOpacityOut').textContent=`${settings.backgroundOpacity}%`;$('backgroundBlurOut').textContent=`${settings.backgroundBlur}px`;$('composerOpacityOut').textContent=`${settings.composerOpacity}%`;$('composerRadiusOut').textContent=`${settings.composerRadius}px`}
function markPreset(){document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset===settings.preset))}
function queueSave(){clearTimeout(saveTimer);$('status').textContent='Saving…';saveTimer=setTimeout(async()=>{await chrome.storage.local.set(settings);$('status').textContent='Saved locally ♡'},120)}
function readControl(el){return el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value}
ids.forEach(id=>{const el=$(id);if(!el)return;el.addEventListener('input',()=>{settings[id]=readControl(el);if(id==='accent')settings.preset='custom';syncLabels();markPreset();queueSave()})});
document.querySelectorAll('.preset').forEach(button=>button.addEventListener('click',()=>{settings.preset=button.dataset.preset;settings.accent=PRESETS[settings.preset].accent;$('accent').value=settings.accent;markPreset();queueSave()}));
document.querySelectorAll('[data-avatar]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.avatar+'Avatar').click()));
function avatarPreview(kind,data){const img=$(kind+'AvatarPreview');img.src=data||'';img.style.display=data?'block':'none'}
async function imageData(file,maxSize,quality,type='image/webp'){const bitmap=await createImageBitmap(file);const scale=Math.min(1,maxSize/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL(type,quality)}
function rawData(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file)})}
['user','assistant'].forEach(kind=>$(kind+'Avatar').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;settings[kind+'Avatar']=await imageData(file,384,.88);avatarPreview(kind,settings[kind+'Avatar']);queueSave()}));
$('backgroundFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;if(file.type==='image/gif'&&file.size>6*1024*1024){$('status').textContent='GIF must be under 6 MB';e.target.value='';return}$('status').textContent=file.type==='image/gif'?'Saving animated GIF…':'Preparing image…';settings.backgroundImage=file.type==='image/gif'?await rawData(file):await imageData(file,1920,.86,'image/jpeg');queueSave()});
$('removeBackground').addEventListener('click',()=>{settings.backgroundImage='';queueSave()});
$('reset').addEventListener('click',async()=>{await chrome.storage.local.clear();settings={...DEFAULTS};await chrome.storage.local.set(settings);location.reload()});
load();
