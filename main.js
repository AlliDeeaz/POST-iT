// Social Post Studio – Vanilla JS MVP
// Utilities
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function mulberry32(seed) {
  let t = seed || 0x9e3779b9;
  return function() {
    t |= 0; t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

// Platform limits & styles
const PLATFORM = {
  instagram: { max: 2200, linebreak: "\n\n", tagPrefix: "#", tagJoin: " ", handlePos: "end" },
  facebook:  { max: 63206, linebreak: "\n\n", tagPrefix: "#", tagJoin: " ", handlePos: "end" },
  linkedin:  { max: 3000, linebreak: "\n\n", tagPrefix: "#", tagJoin: " ", handlePos: "end" },
  x:         { max: 280,  linebreak: "\n",   tagPrefix: "#", tagJoin: " ", handlePos: "end" },
};

// Simple templates per language
const TEMPLATES = {
  de: [
    ({topic, tone, voice}) => `🔹 ${topic}\n\n${leadLineDE(tone)}\n${valueBulletsDE(topic)}\n\n${ctaLineDE(voice)}`,
    ({topic, tone}) => `🎯 ${hookDE(topic, tone)}\n\n${threeTipsDE(topic)}\n\n${ctaSaveShareDE()}`,
    ({topic, tone}) => `💡 ${topic}: ${oneLinerDE(tone)}\n\n${microStepsDE(topic)}`
  ],
  en: [
    ({topic, tone, voice}) => `🔹 ${topic}\n\n${leadLineEN(tone)}\n${valueBulletsEN(topic)}\n\n${ctaLineEN(voice)}`,
    ({topic, tone}) => `🎯 ${hookEN(topic, tone)}\n\n${threeTipsEN(topic)}\n\n${ctaSaveShareEN()}`,
    ({topic, tone}) => `💡 ${topic}: ${oneLinerEN(tone)}\n\n${microStepsEN(topic)}`
  ]
};

// Micro copy helpers (DE)
function leadLineDE(tone){
  const map = {
    informativ:"Kurz erklärt:",
    locker:"Kurz & knackig:",
    motivational:"Du packst das:",
    expert:"Best Practice:"
  }; return map[tone] || "Kurz erklärt:";
}
function valueBulletsDE(topic){ return `• Warum wichtig: ${topic} bringt dir echte Reichweite.\n• So startest du: 1) planen 2) umsetzen 3) messen.`; }
function ctaLineDE(voice){ return `Dein Move: ${voice ? voice + " – " : ""}Kommentare auf! 👇`; }
function hookDE(topic, tone){ return `${topic} – ${tone === 'locker' ? 'ohne Bullshit' : 'in 60 Sekunden'}`; }
function threeTipsDE(t){ return `1) Fokus: Ein Kerngedanke\n2) Klarheit: kurze Sätze\n3) Konsistenz: Poste regelmäßig`; }
function ctaSaveShareDE(){ return `Speichere für später & teile mit deinem Team. 📌`; }
function oneLinerDE(tone){
  const map = {informativ:"Wissen skaliert, wenn es verstanden wird.",
               locker:"Mehr Value, weniger Fluff.",
               motivational:"Konstanz schlägt Perfektion.",
               expert:"Strategie > Taktik."};
  return map[tone] || map.informativ;
}
function microStepsDE(t){ return `Schritt 1: Ziel definieren\nSchritt 2: Botschaft schärfen\nSchritt 3: Format wählen`; }

// EN helpers
function leadLineEN(tone){ const m={informativ:"In short:",locker:"No fluff:",motivational:"You’ve got this:",expert:"Best practice:"}; return m[tone]||m.informativ; }
function valueBulletsEN(t){ return `• Why it matters: ${t} drives real reach.\n• How to start: 1) plan 2) execute 3) measure.`; }
function ctaLineEN(v){ return `Your move: ${v ? v + " – " : ""}drop your thoughts below. 👇`; }
function hookEN(t, tone){ return `${t} — ${tone==='locker'?'no fluff':'in 60 seconds'}`; }
function threeTipsEN(){ return `1) Focus one idea\n2) Keep it clear\n3) Be consistent`; }
function ctaSaveShareEN(){ return `Save for later & share with your team. 📌`; }
function oneLinerEN(){ return "Consistency beats perfection."; }
function microStepsEN(){ return `Step 1: Set the goal\nStep 2: Sharpen the message\nStep 3: Pick the format`; }

// Hashtag generator
function genHashtags(keywords, max, platform){
  const clean = keywords
    .map(k => k.trim().toLowerCase())
    .filter(Boolean)
    .map(k => k.replace(/\s+/g,''));
  const uniq = Array.from(new Set(clean));
  const enrich = uniq.flatMap(k => [k, `${k}tips`, `on${k}`, `${k}101`]);
  const tags = Array.from(new Set([...uniq, ...enrich])).slice(0, max);
  const prefix = PLATFORM[platform].tagPrefix;
  return tags.map(t => `${prefix}${t}`).join(PLATFORM[platform].tagJoin);
}

// Caption composer
function composeCaption({platform, lang, tone, voice, topic, cta, keywords, maxChars, rng}) {
  const tpl = pick(TEMPLATES[lang], rng);
  let base = tpl({topic, tone, voice});
  if (cta?.trim()) base += `\n\n${cta.trim()}`;
  const tags = genHashtags(keywords, clamp(parseInt($("#maxTags").value,10)||0,0,30), platform);
  const br = PLATFORM[platform].linebreak;
  let caption = [base, tags].filter(Boolean).join(br);
  if (caption.length > maxChars){
    caption = caption.slice(0, maxChars-1) + "…";
  }
  // Append handle at end if present
  const handle = $("#handle").value.trim();
  if (handle){
    caption += `${br}${handle}`;
  }
  return caption;
}

// Canvas rendering
async function renderImage({text, handle, size, gradA, gradB, logo, logoAlpha}) {
  const [w, h] = size === 1080 ? [1080,1080]
    : size === 1350 ? [1080,1350] : [1080,1920];

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0, gradA); g.addColorStop(1, gradB);
  ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

  // Subtle noise
  const noise = ctx.createImageData(64, 64);
  for(let i=0;i<noise.data.length;i+=4){
    const n = 235 + Math.random()*20;
    noise.data[i]=n; noise.data[i+1]=n; noise.data[i+2]=n; noise.data[i+3]=8;
  }
  const off = document.createElement('canvas'); off.width=64; off.height=64; off.getContext('2d').putImageData(noise,0,0);
  const p = ctx.createPattern(off,'repeat'); ctx.globalCompositeOperation='overlay'; ctx.fillStyle=p; ctx.fillRect(0,0,w,h); ctx.globalCompositeOperation='source-over';

  // Text
  if (text?.trim()){
    const pad = Math.round(w*0.08);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur = 10;
    let fontSize = Math.round(w*0.11);
    ctx.font = `700 ${fontSize}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const maxWidth = w - pad*2;
    const lines = wrapText(ctx, text.trim(), maxWidth);
    // shrink if too many lines
    while(lines.length > 5 && fontSize > 28){
      fontSize -= 4; ctx.font = `700 ${fontSize}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      lines.splice(0, lines.length, ...wrapText(ctx, text.trim(), maxWidth));
    }
    let y = Math.round(h*0.27);
    lines.forEach(line => {
      ctx.fillText(line, pad, y);
      y += fontSize * 1.12;
    });
    ctx.shadowBlur = 0;
  }

  // Handle watermark
  if (handle?.trim()){
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    const s = Math.round(w*0.035);
    ctx.font = `600 ${s}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const txt = handle.startsWith('@') ? handle : '@'+handle;
    const m = ctx.measureText(txt);
    const pad = Math.round(w*0.04);
    ctx.fillText(txt, w - m.width - pad, h - pad);
  }

  // Logo
  if (logo){
    try{
      const img = await fileToImage(logo);
      const targetW = Math.min(w*0.18, 250);
      const scale = targetW / img.width;
      const targetH = img.height * scale;
      const pad = Math.round(w*0.04);
      ctx.globalAlpha = clamp(parseFloat(logoAlpha)||0.85, 0, 1);
      ctx.drawImage(img, pad, h - targetH - pad, targetW, targetH);
      ctx.globalAlpha = 1;
    }catch(e){ console.warn('Logo load failed', e); }
  }

  return canvas;
}

function wrapText(ctx, text, maxWidth){
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words){
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width <= maxWidth) line = test;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

function fileToImage(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = r.result;
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Form handling
const form = $("#form");
const tpl = $("#card-tpl");
const results = $("#results");
let uploadedLogoFile = null;
$("#logoInput").addEventListener("change", (e)=> {
  uploadedLogoFile = e.target.files?.[0] || null;
});

$("#savePreset").addEventListener("click", ()=>{
  const data = collectForm();
  localStorage.setItem("sps:preset", JSON.stringify(data));
  toast("Preset gespeichert ✔️");
});
$("#loadPreset").addEventListener("click", ()=>{
  const raw = localStorage.getItem("sps:preset");
  if(!raw) return toast("Kein Preset gefunden 🤔");
  const d = JSON.parse(raw);
  hydrateForm(d);
  toast("Preset geladen");
});
$("#reset").addEventListener("click", ()=>{
  form.reset();
  uploadedLogoFile = null;
  results.innerHTML = "";
});

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  results.innerHTML = "";
  const data = collectForm();
  const rng = mulberry32(data.seed || Math.floor(Math.random()*1e9));
  for (let i=0;i<data.variants;i++){
    const node = tpl.content.firstElementChild.cloneNode(true);
    const canvas = node.querySelector("canvas");
    const textarea = node.querySelector(".caption");
    const length = node.querySelector(".length");
    const btnCopy = node.querySelector(".copy");
    const btnDown = node.querySelector(".download");

    // Compose caption
    const caption = composeCaption({
      platform: data.platform, lang: data.lang, tone: data.tone, voice: data.voice,
      topic: data.topic, cta: data.cta, keywords: data.keywords, maxChars: clamp(data.maxChars, 60, PLATFORM[data.platform].max),
      rng
    });
    textarea.value = caption;
    length.textContent = `${caption.length}/${PLATFORM[data.platform].max} Zeichen`;
    // Render image
    const can = await renderImage({
      text: $("#imgText").value || data.topic,
      handle: data.handle,
      size: data.imgSize,
      gradA: data.gradA,
      gradB: data.gradB,
      logo: uploadedLogoFile,
      logoAlpha: $("#logoAlpha").value
    });
    canvas.width = can.width; canvas.height = can.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(can,0,0);

    btnCopy.addEventListener("click", async ()=>{
      await navigator.clipboard.writeText(textarea.value);
      toast("Caption kopiert 📋");
    });
    btnDown.addEventListener("click", ()=>{
      const a = document.createElement("a");
      a.download = `post-${data.platform}-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    });

    results.appendChild(node);
  }
});

function collectForm(){
  return {
    platform: $("#platform").value,
    lang: $("#lang").value,
    tone: $("#tone").value,
    voice: $("#voice").value,
    handle: $("#handle").value,
    variants: parseInt($("#variants").value,10) || 1,
    topic: $("#topic").value,
    cta: $("#cta").value,
    keywords: ($("#keywords").value || "").split(",").filter(Boolean),
    maxChars: parseInt($("#maxChars").value,10) || 300,
    seed: parseInt($("#seed").value,10) || 0,
    imgSize: parseInt($("#imgSize").value,10),
    gradA: $("#gradA").value,
    gradB: $("#gradB").value,
  };
}

function hydrateForm(d){
  $("#platform").value = d.platform || "instagram";
  $("#lang").value = d.lang || "de";
  $("#tone").value = d.tone || "informativ";
  $("#voice").value = d.voice || "";
  $("#handle").value = d.handle || "";
  $("#variants").value = d.variants || 3;
  $("#topic").value = d.topic || "";
  $("#cta").value = d.cta || "";
  $("#keywords").value = (d.keywords || []).join(", ");
  $("#maxChars").value = d.maxChars || 300;
  $("#seed").value = d.seed || 0;
  $("#imgSize").value = d.imgSize || 1080;
  $("#gradA").value = d.gradA || "#0ea5e9";
  $("#gradB").value = d.gradB || "#9333ea";
}

function toast(msg){
  const div = document.createElement("div");
  div.textContent = msg;
  Object.assign(div.style,{
    position:'fixed',bottom:'18px',left:'50%',transform:'translateX(-50%)',
    background:'#0d1218',color:'#e6edf3',border:'1px solid #233041',
    padding:'10px 14px',borderRadius:'10px', boxShadow:'0 10px 30px rgba(0,0,0,.35)', zIndex:9999
  });
  document.body.appendChild(div);
  setTimeout(()=>div.remove(),1800);
}

// Load preset on start if exists
(() => {
  const raw = localStorage.getItem("sps:preset");
  if (raw) { try { hydrateForm(JSON.parse(raw)); } catch{} }
})();
