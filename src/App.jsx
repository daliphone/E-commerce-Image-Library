import React, { useState, useRef, useEffect } from 'react';

// ─── IndexedDB 草稿 ───────────────────────────────────────────────────────────
const DB_NAME = 'ManiFactoryDB_V5';
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current_draft';
const initDB = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB_NAME, 1);
  r.onupgradeneeded = e => { if (!e.target.result.objectStoreNames.contains(STORE_NAME)) e.target.result.createObjectStore(STORE_NAME); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const saveDraft = async (s) => { try { const db = await initDB(); db.transaction(STORE_NAME,'readwrite').objectStore(STORE_NAME).put(s, DRAFT_KEY); } catch(e){} };
const loadDraft = async () => { try { const db = await initDB(); const tx = db.transaction(STORE_NAME,'readonly'); const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY); return new Promise(res => { req.onsuccess = () => res(req.result ?? null); req.onerror = () => res(null); }); } catch(e){ return null; } };

// ─── 7 類 × 各 2 組 = 14 組模板 ─────────────────────────────────────────────
const CATEGORIES = {
  phone:     { name:'手機',  icon:'📱', templates: {
    phone_a: { name:'旗艦科技藍', desc:'深藍漸層+幾何光效', primary:'#0ea5e9', accent:'#6366f1', bg:'#0f172a', textCol:'#ffffff', mode:'dark' },
    phone_b: { name:'極簡亮白系', desc:'純白底+細藍邊框',   primary:'#2563eb', accent:'#38bdf8', bg:'#f8fafc', textCol:'#0f172a', mode:'light' },
  }},
  accessory: { name:'配件',  icon:'🎧', templates: {
    accessory_a: { name:'潮流橘紅框', desc:'活力橘+動感斜切',  primary:'#f97316', accent:'#ef4444', bg:'#fff7ed', textCol:'#1c1917', mode:'light' },
    accessory_b: { name:'時尚暗金黑', desc:'質感黑底+金色點綴', primary:'#d97706', accent:'#fbbf24', bg:'#1c1917', textCol:'#ffffff', mode:'dark' },
  }},
  wearable:  { name:'穿戴',  icon:'⌚', templates: {
    wearable_a: { name:'運動翠綠系', desc:'清新綠+健康感設計',  primary:'#10b981', accent:'#34d399', bg:'#ecfdf5', textCol:'#064e3b', mode:'light' },
    wearable_b: { name:'智慧深夜藍', desc:'午夜藍底+銀色光環', primary:'#6366f1', accent:'#a5b4fc', bg:'#1e1b4b', textCol:'#e0e7ff', mode:'dark' },
  }},
  tv:        { name:'電視',  icon:'📺', templates: {
    tv_a: { name:'影音沉浸黑', desc:'純黑底+螢光框線', primary:'#f43f5e', accent:'#fbbf24', bg:'#0a0a0a', textCol:'#ffffff', mode:'dark' },
    tv_b: { name:'家庭溫暖白', desc:'米白底+紅色色條', primary:'#ef4444', accent:'#fca5a5', bg:'#fefce8', textCol:'#1f2937', mode:'light' },
  }},
  appliance: { name:'小家電', icon:'🔌', templates: {
    appliance_a: { name:'簡約灰銀系', desc:'銀灰底+現代感雙框',  primary:'#64748b', accent:'#cbd5e1', bg:'#f1f5f9', textCol:'#1e293b', mode:'light' },
    appliance_b: { name:'品牌天空藍', desc:'淺藍清新+頂部色帶', primary:'#0284c7', accent:'#7dd3fc', bg:'#f0f9ff', textCol:'#0c4a6e', mode:'light' },
  }},
  gaming:    { name:'電競',  icon:'🎮', templates: {
    gaming_a: { name:'霓虹賽博龐克', desc:'深黑底+RGB螢光邊框', primary:'#00f6ff', accent:'#bc13fe', bg:'#050810', textCol:'#ffffff', mode:'dark' },
    gaming_b: { name:'電競火焰紅',   desc:'深紅黑底+熱血斜切',  primary:'#ef4444', accent:'#fbbf24', bg:'#1a0505', textCol:'#ffffff', mode:'dark' },
  }},
  seasonal:  { name:'季節',  icon:'🌸', templates: {
    seasonal_a: { name:'清涼夏日藍', desc:'天藍漸層+波浪裝飾',  primary:'#06b6d4', accent:'#67e8f9', bg:'#ecfeff', textCol:'#164e63', mode:'light' },
    seasonal_b: { name:'溫暖秋楓橙', desc:'橘褐漸層+季節感暖色', primary:'#ea580c', accent:'#fbbf24', bg:'#fff7ed', textCol:'#431407', mode:'light' },
  }},
};

const ALL_TEMPLATES = {};
Object.values(CATEGORIES).forEach(cat => Object.assign(ALL_TEMPLATES, cat.templates));

const PLATFORMS = {
  Shopee:       { name:'蝦皮購物',     color:'#EE4D2D', allowDesign:true },
  Momo:         { name:'momo 購物',    color:'#CC0000', allowDesign:false },
  PChome:       { name:'PChome 24h',   color:'#1C3F7A', allowDesign:true },
  YahooAuction: { name:'奇摩拍賣',    color:'#8b5cf6', allowDesign:true },
  YahooMall:    { name:'奇摩購物中心', color:'#7c3aed', allowDesign:false },
};

const BANNED_WORDS = ['第一','最強','最優','療效','根治','殺頭價','保證見效'];

// ─── 工具函式 ─────────────────────────────────────────────────────────────────
const h2r = (hex, a) => {
  if (!hex || hex.length < 7) return `rgba(0,0,0,${a})`;
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
};
const rr = (ctx, x, y, w, h, r, stroke=false) => {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  stroke ? ctx.stroke() : ctx.fill();
};

// ─── 背景繪製（14 種各自風格）────────────────────────────────────────────────
function drawBg(ctx, W, H, tid, tpl) {
  const {primary:p, accent:a, bg} = tpl;
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  switch(tid) {
    case 'phone_a': {
      let g=ctx.createRadialGradient(W*.3,H*.2,0,W*.3,H*.2,W*.8);
      g.addColorStop(0,h2r(p,.35)); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      g=ctx.createRadialGradient(W*.8,H*.8,0,W*.8,H*.8,W*.5);
      g.addColorStop(0,h2r(a,.2)); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
      for(let i=0;i<W;i+=60){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke();}
      for(let j=0;j<H;j+=60){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(W,j);ctx.stroke();}
      ctx.fillStyle='rgba(255,255,255,0.05)'; rr(ctx,40,80,W-80,H-180,16); break;
    }
    case 'phone_b': {
      ctx.strokeStyle=p; ctx.lineWidth=10; ctx.strokeRect(14,14,W-28,H-28);
      ctx.strokeStyle=h2r(p,.2); ctx.lineWidth=2; ctx.strokeRect(26,26,W-52,H-52);
      const g=ctx.createLinearGradient(0,0,0,H*.4);
      g.addColorStop(0,h2r(p,.07)); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); break;
    }
    case 'accessory_a': {
      ctx.fillStyle=p;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*.55,0); ctx.lineTo(W*.38,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
      const g=ctx.createLinearGradient(W*.4,0,W,0);
      g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,h2r(a,.08)); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); break;
    }
    case 'accessory_b': {
      const gg=ctx.createLinearGradient(0,0,W,H);
      gg.addColorStop(0,'#6b4c00'); gg.addColorStop(.5,p); gg.addColorStop(1,'#6b4c00');
      ctx.strokeStyle=gg; ctx.lineWidth=12; ctx.strokeRect(18,18,W-36,H-36);
      ctx.lineWidth=2; ctx.strokeStyle=h2r(a,.5); ctx.strokeRect(32,32,W-64,H-64); break;
    }
    case 'wearable_a': {
      const g=ctx.createRadialGradient(W/2,H*.35,0,W/2,H*.35,W*.6);
      g.addColorStop(0,h2r(p,.12)); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle=h2r(p,.25); ctx.lineWidth=6; ctx.strokeRect(14,14,W-28,H-28);
      ctx.strokeStyle=h2r(a,.15); ctx.lineWidth=2; ctx.strokeRect(24,24,W-48,H-48); break;
    }
    case 'wearable_b': {
      const g=ctx.createRadialGradient(W/2,H/2,80,W/2,H/2,W*.7);
      g.addColorStop(0,h2r(p,.4)); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.shadowColor=p; ctx.shadowBlur=20;
      ctx.strokeStyle=h2r(a,.6); ctx.lineWidth=3; ctx.strokeRect(20,20,W-40,H-40); ctx.shadowBlur=0; break;
    }
    case 'tv_a': {
      ctx.shadowColor=p; ctx.shadowBlur=25;
      ctx.strokeStyle=p; ctx.lineWidth=4; ctx.strokeRect(20,20,W-40,H-40); ctx.shadowBlur=0;
      ctx.strokeStyle=h2r(a,.5); ctx.lineWidth=1.5; ctx.strokeRect(32,32,W-64,H-64);
      const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.6);
      g.addColorStop(0,h2r(p,.08)); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); break;
    }
    case 'tv_b': {
      ctx.fillStyle=p; ctx.fillRect(0,0,W,52);
      const g=ctx.createLinearGradient(0,52,0,H);
      g.addColorStop(0,h2r(p,.08)); g.addColorStop(.4,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,52,W,H-52); break;
    }
    case 'appliance_a': {
      ctx.strokeStyle=p; ctx.lineWidth=8; ctx.strokeRect(16,16,W-32,H-32);
      ctx.strokeStyle=h2r(a,.4); ctx.lineWidth=1.5; ctx.strokeRect(28,28,W-56,H-56); break;
    }
    case 'appliance_b': {
      const g=ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0,h2r(p,.1)); g.addColorStop(1,h2r(a,.05)); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.fillStyle=p; ctx.fillRect(0,0,W,56);
      ctx.strokeStyle=h2r(p,.3); ctx.lineWidth=2; ctx.strokeRect(18,18,W-36,H-36); break;
    }
    case 'gaming_a': {
      let g=ctx.createRadialGradient(W*.2,H*.8,0,W*.2,H*.8,W*.8);
      g.addColorStop(0,h2r(p,.25)); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      g=ctx.createRadialGradient(W*.8,H*.2,0,W*.8,H*.2,W*.6);
      g.addColorStop(0,h2r(a,.2)); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.shadowColor=p; ctx.shadowBlur=20;
      ctx.strokeStyle=p; ctx.lineWidth=2.5; ctx.strokeRect(22,22,W-44,H-44); ctx.shadowBlur=0;
      ctx.strokeStyle=h2r(a,.6); ctx.lineWidth=1; ctx.strokeRect(32,32,W-64,H-64);
      ctx.strokeStyle='rgba(255,255,255,0.025)'; ctx.lineWidth=1;
      for(let j=0;j<H;j+=4){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(W,j);ctx.stroke();} break;
    }
    case 'gaming_b': {
      ctx.fillStyle=h2r(p,.15); ctx.fillRect(0,0,W,H);
      ctx.fillStyle=p;
      ctx.beginPath(); ctx.moveTo(0,H-120); ctx.lineTo(W*.7,H-120); ctx.lineTo(W*.55,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
      ctx.fillStyle=a;
      ctx.beginPath(); ctx.moveTo(0,H-75); ctx.lineTo(W*.5,H-75); ctx.lineTo(W*.38,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill(); break;
    }
    case 'seasonal_a': {
      const g=ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0,h2r(p,.18)); g.addColorStop(1,h2r(a,.08)); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.fillStyle=h2r(p,.12);
      ctx.beginPath(); ctx.moveTo(0,H-100);
      for(let x=0;x<=W;x+=40) ctx.quadraticCurveTo(x+20,H-130,x+40,H-100);
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
      ctx.fillStyle=h2r(a,.15);
      ctx.beginPath(); ctx.moveTo(0,H-58);
      for(let x=0;x<=W;x+=40) ctx.quadraticCurveTo(x+20,H-82,x+40,H-58);
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill(); break;
    }
    case 'seasonal_b': {
      const g=ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0,'#fff7ed'); g.addColorStop(.5,h2r(p,.12)); g.addColorStop(1,h2r(a,.15));
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle=h2r(p,.3); ctx.lineWidth=8; ctx.strokeRect(16,16,W-32,H-32); break;
    }
  }
}

// ─── 文字層 ───────────────────────────────────────────────────────────────────
function drawTextLayer(ctx, W, H, tid, tpl, opts) {
  const {primary:p, accent:a, textCol} = tpl;
  const {logoText, brandText, promoText, showLogo, showTitle, brandScale, textScale, titleOffset, rotations, titleFont} = opts;
  const bs=(brandScale||100)/100, ts=(textScale||100)/100;
  const isDark = tpl.mode === 'dark';

  const rotated = (fn, x, y, w, h, ang) => {
    ctx.save(); ctx.translate(x+w/2,y+h/2); if(ang) ctx.rotate(ang*Math.PI/180);
    fn(ctx,-w/2,-h/2,w,h); ctx.restore(); return {x,y,w,h};
  };

  // Logo 徽章
  if (showLogo && brandText) {
    const sz = Math.round(18*bs);
    if (['gaming_a','gaming_b'].includes(tid)) {
      ctx.font = `italic 900 ${sz}px "${titleFont}"`;
      ctx.fillStyle = p; ctx.shadowColor = p; ctx.shadowBlur = 8;
      ctx.fillText(brandText, 42, 50*bs); ctx.shadowBlur = 0;
    } else if (tid === 'accessory_a') {
      ctx.font = `bold ${sz}px "${titleFont}"`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillText(brandText, 44, 50*bs);
    } else if (tid === 'appliance_b') {
      ctx.font = `bold ${sz}px "${titleFont}"`;
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(brandText, W/2, 36); ctx.textAlign = 'left';
    } else {
      ctx.font = `bold ${sz}px "${titleFont}"`;
      const lw = ctx.measureText(brandText).width + 48*bs, lh = 44*bs;
      ctx.fillStyle = p; rr(ctx,(W-lw)/2,14,lw,lh,lh/2);
      ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(brandText, W/2, 14+lh/2); ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    }
  }

  // 主標題
  let titleHit = null;
  if (showTitle && promoText) {
    const sz = Math.round(36*ts);
    const isGaming = ['gaming_a','gaming_b'].includes(tid);
    ctx.font = isGaming ? `italic 900 ${sz}px "${titleFont}"` : `900 ${sz}px "${titleFont}"`;
    const tw = ctx.measureText(promoText).width, th = sz+10;
    const bx = (tid==='accessory_a') ? W*.42+titleOffset.x : W/2+titleOffset.x-tw/2;
    const by = H-185+titleOffset.y;

    titleHit = rotated((c,dx,dy,dw,dh) => {
      if (isDark) {
        const tg = c.createLinearGradient(0,dy,0,dy+dh);
        tg.addColorStop(0,'#fff'); tg.addColorStop(1,h2r(a,.85)); c.fillStyle = tg;
        if (isGaming) { c.shadowColor = a; c.shadowBlur = 12; }
      } else {
        c.fillStyle = textCol;
      }
      c.textAlign = (tid==='accessory_a') ? 'left' : 'center';
      c.textBaseline = 'middle';
      c.fillText(promoText, dx+(tid==='accessory_a'?0:dw/2), dy+dh/2);
      c.shadowBlur=0; c.textBaseline='alphabetic'; c.textAlign='left';
    }, bx, by, tw, th, rotations.title);
  }
  return titleHit;
}

// ─── 標籤層 ───────────────────────────────────────────────────────────────────
function drawTagLayer(ctx, W, H, tid, tpl, opts) {
  const {accent:a} = tpl;
  const {tagsInput, tagScale, tagOffsets, tagShape, tagCustomColors, showTags, tagFont, selectedLayers} = opts;
  if (!showTags) return [];
  const tags = tagsInput.split(',').map(t=>t.trim()).filter(Boolean);
  if (!tags.length) return [];
  const sc=(tagScale||100)/100, tagH=Math.round(42*sc), fs=Math.round(18*sc), pad=Math.round(18*sc), gap=10;
  ctx.font = `bold ${fs}px "${tagFont}"`;
  const ws = tags.map(t=>ctx.measureText(t).width+pad*2);
  const total = ws.reduce((a,b)=>a+b,0)+gap*(tags.length-1);
  let sx=(W-total)/2;
  const baseY = ['gaming_a','gaming_b','tv_a'].includes(tid) ? H-132 : H-116;
  const radius = tagShape==='pill'?tagH/2:tagShape==='rect'?8:tagH/2;
  const isOut = tagShape==='outline';
  const hbs=[];

  tags.forEach((tag,i) => {
    const off=tagOffsets[i]||{x:0,y:0};
    const tx=sx+off.x, ty=baseY+off.y, tw=ws[i];
    const col=tagCustomColors[i]||a;
    const isAct=selectedLayers&&selectedLayers.some(l=>l.type==='tag'&&l.index===i);
    if(isAct){ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.strokeRect(tx-3,ty-3,tw+6,tagH+6);ctx.setLineDash([]);}
    if(isOut){
      ctx.strokeStyle=col; ctx.lineWidth=2.5;
      if(['gaming_a','gaming_b'].includes(tid)){ctx.shadowColor=col;ctx.shadowBlur=8;}
      rr(ctx,tx,ty,tw,tagH,radius,true); ctx.shadowBlur=0; ctx.fillStyle=col;
    } else {
      ctx.fillStyle=col;
      if(['gaming_a','gaming_b'].includes(tid)){ctx.shadowColor=col;ctx.shadowBlur=12;}
      rr(ctx,tx,ty,tw,tagH,radius); ctx.shadowBlur=0; ctx.fillStyle='#fff';
    }
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(tag, tx+tw/2, ty+tagH*.52);
    ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    hbs.push({x:tx,y:ty,w:tw,h:tagH}); sx+=tw+gap;
  });
  return hbs;
}

// ─── 主元件 ──────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef=useRef(null);
  const [products,setProducts]=useState([]);
  const [iconImage,setIconImage]=useState(null);
  const [platform,setPlatform]=useState('Shopee');
  const [activeCategory,setActiveCategory]=useState('phone');
  const [templateId,setTemplateId]=useState('phone_a');
  const [removeBg,setRemoveBg]=useState(true);
  const [enableRemoveBgApi,setEnableRemoveBgApi]=useState(false);
  const [removeBgApiKey,setRemoveBgApiKey]=useState('');
  const [bgRemovalCount,setBgRemovalCount]=useState(0);
  const [logoText,setLogoText]=useState('馬尼通訊');
  const [brandText,setBrandText]=useState('官方授權店');
  const [promoText,setPromoText]=useState('GPLUS A6 智慧手機');
  const [tagsInput,setTagsInput]=useState('公司貨,18+6保固,資安認證');
  const [isAiDisclosure,setIsAiDisclosure]=useState(false);
  const [showLogo,setShowLogo]=useState(true);
  const [showTitle,setShowTitle]=useState(true);
  const [showTags,setShowTags]=useState(true);
  const [titleFont,setTitleFont]=useState('Microsoft JhengHei');
  const [tagFont,setTagFont]=useState('Microsoft JhengHei');
  const [productScale,setProductScale]=useState(100);
  const [brandScale,setBrandScale]=useState(100);
  const [textScale,setTextScale]=useState(100);
  const [tagScale,setTagScale]=useState(100);
  const [iconScale,setIconScale]=useState(30);
  const [titleOffset,setTitleOffset]=useState({x:0,y:0});
  const [iconOffset,setIconOffset]=useState({x:150,y:-150});
  const [tagOffsets,setTagOffsets]=useState([]);
  const [rotations,setRotations]=useState({title:0,icon:0});
  const [layerOrder,setLayerOrder]=useState(['deco','tags','title','icon']);
  const [tagCustomColors,setTagCustomColors]=useState({});
  const [lockedLayers,setLockedLayers]=useState({});
  const [tagShape,setTagShape]=useState('pill');
  const [customColors,setCustomColors]=useState(null);
  const [selectedLayers,setSelectedLayers]=useState([]);
  const [leftWidth,setLeftWidth]=useState(520);
  const [isDragActive,setIsDragActive]=useState(false);
  const [guideLines,setGuideLines]=useState({active:false});
  const [showHelp,setShowHelp]=useState(false);
  const [isDraftLoaded,setIsDraftLoaded]=useState(false);
  const [gasUrl,setGasUrl]=useState('');
  const [projectName,setProjectName]=useState('馬尼樣板');
  const [isSaving,setIsSaving]=useState(false);
  const [isLoadingList,setIsLoadingList]=useState(false);
  const [cloudTemplates,setCloudTemplates]=useState([]);
  const [showLoadMenu,setShowLoadMenu]=useState(false);
  const [cloudMsg,setCloudMsg]=useState({text:'',type:''});

  const histRef=useRef([]); const histIdx=useRef(-1);
  const hb=useRef({products:{},title:null,icon:null,tags:[],deco:null});
  const drag=useRef({isDragging:false,targets:[],startX:0,startY:0,ios:[]});

  const activeLayer=selectedLayers.length===1?selectedLayers[0]:null;
  const isMulti=selectedLayers.length>1;
  const baseTpl=ALL_TEMPLATES[templateId]||ALL_TEMPLATES['phone_a'];
  const tpl=customColors?{...baseTpl,...customColors}:baseTpl;
  const compliance=(()=>{const f=BANNED_WORDS.filter(w=>(promoText+tagsInput).includes(w));return{safe:!f.length,words:f};})();

  // ── Snapshot ──
  const buildSnap=()=>({products,templateId,activeCategory,platform,removeBg,logoText,brandText,promoText,tagsInput,isAiDisclosure,tagShape,showLogo,showTitle,showTags,titleFont,tagFont,productScale,brandScale,textScale,tagScale,iconScale,titleOffset,iconOffset,tagOffsets,rotations,layerOrder,tagCustomColors,customColors,iconImage});
  const saveSnap=()=>{
    const s=JSON.stringify(buildSnap());
    histRef.current=histRef.current.slice(0,histIdx.current+1);
    histRef.current.push(s);
    if(histRef.current.length>30)histRef.current.shift(); else histIdx.current++;
  };
  const applySnap=(snap)=>{
    const s=typeof snap==='string'?JSON.parse(snap):snap;
    setProducts(s.products||[]); setTemplateId(s.templateId||'phone_a'); setActiveCategory(s.activeCategory||'phone');
    setPlatform(s.platform||'Shopee'); setRemoveBg(s.removeBg!==false);
    setLogoText(s.logoText||'馬尼通訊'); setBrandText(s.brandText||'官方授權店'); setPromoText(s.promoText||'');
    setTagsInput(s.tagsInput||''); setIsAiDisclosure(!!s.isAiDisclosure); setTagShape(s.tagShape||'pill');
    setShowLogo(s.showLogo!==false); setShowTitle(s.showTitle!==false); setShowTags(s.showTags!==false);
    setTitleFont(s.titleFont||'Microsoft JhengHei'); setTagFont(s.tagFont||'Microsoft JhengHei');
    setProductScale(s.productScale||100); setBrandScale(s.brandScale||100); setTextScale(s.textScale||100);
    setTagScale(s.tagScale||100); setIconScale(s.iconScale||30);
    setTitleOffset(s.titleOffset||{x:0,y:0}); setIconOffset(s.iconOffset||{x:150,y:-150});
    setTagOffsets(s.tagOffsets||[]); setRotations(s.rotations||{title:0,icon:0});
    setLayerOrder(s.layerOrder||['deco','tags','title','icon']);
    setTagCustomColors(s.tagCustomColors||{}); setCustomColors(s.customColors||null);
    if(s.iconImage!==undefined) setIconImage(s.iconImage);
    setSelectedLayers([]);
  };
  const handleUndo=()=>{if(histIdx.current>0){histIdx.current--;applySnap(histRef.current[histIdx.current]);}};
  const handleRedo=()=>{if(histIdx.current<histRef.current.length-1){histIdx.current++;applySnap(histRef.current[histIdx.current]);}};

  // ── 初始化 ──
  useEffect(()=>{
    (async()=>{
      const draft=await loadDraft();
      if(draft){try{applySnap(draft);setCloudMsg({text:'✅ 已還原草稿',type:'success'});setTimeout(()=>setCloudMsg({text:'',type:''}),3000);}catch(e){}}
      setIsDraftLoaded(true); setTimeout(saveSnap,120);
    })();
    const url=localStorage.getItem('ManiFactory_GAS_URL'); if(url) setGasUrl(url);
    const key=localStorage.getItem('ManiFactory_RemoveBg_Key'); if(key){setRemoveBgApiKey(key);setEnableRemoveBgApi(true);}
    const curM=new Date().toISOString().slice(0,7);
    if(localStorage.getItem('ManiFactory_RemoveBg_Month')!==curM){localStorage.setItem('ManiFactory_RemoveBg_Month',curM);localStorage.setItem('ManiFactory_RemoveBg_Count','0');setBgRemovalCount(0);}
    else setBgRemovalCount(parseInt(localStorage.getItem('ManiFactory_RemoveBg_Count')||'0',10));
  },[]);

  useEffect(()=>{
    if(!isDraftLoaded)return;
    const t=setTimeout(()=>saveDraft(buildSnap()),1200);
    return()=>clearTimeout(t);
  },[isDraftLoaded,products,templateId,activeCategory,platform,removeBg,logoText,brandText,promoText,tagsInput,isAiDisclosure,tagShape,showLogo,showTitle,showTags,titleFont,tagFont,productScale,brandScale,textScale,tagScale,iconScale,titleOffset,iconOffset,tagOffsets,rotations,layerOrder,tagCustomColors,customColors,iconImage]);

  useEffect(()=>{if(histRef.current.length===0)saveSnap();},[]);

  useEffect(()=>{
    const cnt=tagsInput.split(',').filter(t=>t.trim()).length;
    setTagOffsets(p=>{if(p.length>=cnt)return p;const n=[...p];while(n.length<cnt)n.push({x:0,y:0});return n;});
  },[tagsInput]);

  useEffect(()=>{
    const kd=e=>{
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?handleRedo():handleUndo();return;}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();handleRedo();return;}
      if(selectedLayers.length>0){
        const step=e.shiftKey?10:1; let dx=0,dy=0;
        if(e.key==='ArrowUp')dy=-step; else if(e.key==='ArrowDown')dy=step;
        else if(e.key==='ArrowLeft')dx=-step; else if(e.key==='ArrowRight')dx=step;
        if(dx||dy){
          e.preventDefault();
          setProducts(p=>p.map(pr=>selectedLayers.some(l=>l.type==='product'&&l.id===pr.id)?{...pr,offset:{x:pr.offset.x+dx,y:pr.offset.y+dy}}:pr));
          if(selectedLayers.some(l=>l.type==='title'))setTitleOffset(o=>({x:o.x+dx,y:o.y+dy}));
          if(selectedLayers.some(l=>l.type==='icon'))setIconOffset(o=>({x:o.x+dx,y:o.y+dy}));
          if(selectedLayers.some(l=>l.type==='tag'))setTagOffsets(p=>p.map((o,i)=>selectedLayers.some(l=>l.type==='tag'&&l.index===i)?{x:o.x+dx,y:o.y+dy}:o));
        }
      }
    };
    const ku=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)&&selectedLayers.length>0)saveSnap();};
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);};
  },[selectedLayers]);

  // ── Remove.bg ──
  const execRmBg=async(prodId,base64)=>{
    if(!removeBgApiKey){alert('請先輸入 Remove.bg API Key');return;}
    setProducts(p=>p.map(pr=>pr.id===prodId?{...pr,isRemovingBg:true}:pr));
    try{
      const res=await fetch(base64); const blob=await res.blob();
      const fd=new FormData(); fd.append('image_file',blob); fd.append('size','auto');
      const api=await fetch('https://api.remove.bg/v1.0/removebg',{method:'POST',headers:{'X-Api-Key':removeBgApiKey},body:fd});
      if(!api.ok)throw new Error('去背失敗');
      const reader=new FileReader();
      reader.onloadend=()=>{setProducts(p=>p.map(pr=>pr.id===prodId?{...pr,src:reader.result,isRemovingBg:false}:pr));setBgRemovalCount(n=>{const nn=n+1;localStorage.setItem('ManiFactory_RemoveBg_Count',String(nn));return nn;});setTimeout(saveSnap,100);};
      reader.readAsDataURL(await api.blob());
    }catch(err){alert('Remove.bg 錯誤: '+err.message);setProducts(p=>p.map(pr=>pr.id===prodId?{...pr,isRemovingBg:false}:pr));}
  };

  const processUpload=files=>{
    Array.from(files).forEach((file,idx)=>{
      if(!file.type.startsWith('image/'))return;
      const reader=new FileReader();
      reader.onload=f=>{
        const src=f.target.result, id='prod_'+Date.now()+'_'+idx+Math.floor(Math.random()*999);
        const np={id,src,rawSrc:src,offset:{x:0,y:0},scale:productScale,rotation:0,shadow:true,isRemovingBg:false};
        setProducts(p=>[...p,np]);
        setLayerOrder(p=>{const di=p.indexOf('deco');const n=[...p];n.splice(di>-1?di+1:0,0,id);return n;});
        if(enableRemoveBgApi&&removeBgApiKey)execRmBg(id,src); else setTimeout(saveSnap,100);
      };
      reader.readAsDataURL(file);
    });
  };

  // ── Canvas ──
  useEffect(()=>{
    if(!canvasRef.current)return;
    const canvas=canvasRef.current, ctx=canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    hb.current={products:{},title:null,icon:null,tags:[],deco:null};
    const loadImg=src=>new Promise(res=>{if(!src)return res(null);const img=new Image();img.crossOrigin='Anonymous';img.onload=()=>res(img);img.onerror=()=>res(null);img.src=src;});

    (async()=>{
      ctx.clearRect(0,0,W,H);
      const pCfg=PLATFORMS[platform];
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
      if(pCfg.allowDesign) drawBg(ctx,W,H,templateId,tpl);

      const lprod={};
      for(const p of products)lprod[p.id]=p.src?await loadImg(p.src):null;
      const iImg=iconImage?await loadImg(iconImage):null;

      const withSel=(type,key,x,y,w,h,ang,fn)=>{
        ctx.save();ctx.translate(x+w/2,y+h/2);if(ang)ctx.rotate(ang*Math.PI/180);
        fn(ctx,-w/2,-h/2,w,h);
        if(selectedLayers.some(l=>l.type===type&&(key===undefined||l.id===key||l.index===key))){
          ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.strokeRect(-w/2-5,-h/2-5,w+10,h+10);ctx.setLineDash([]);
        }
        ctx.restore();
      };

      const drawProd=prod=>{
        const sc=0.72*(prod.scale/100);
        const pi=lprod[prod.id];
        const iW=W*sc, iH=pi?(pi.height/pi.width)*iW:iW;
        const ix=(W-iW)/2+prod.offset.x, iy=(H-iH)/2+prod.offset.y;
        if(pi)hb.current.products[prod.id]={x:ix,y:iy,w:iW,h:iH};
        withSel('product',prod.id,ix,iy,iW,iH,prod.rotation,(c,dx,dy,dw,dh)=>{
          if(pi){
            if(prod.shadow&&removeBg){
              if(templateId==='gaming_a'){c.shadowColor=tpl.primary;c.shadowBlur=35;c.shadowOffsetY=0;}
              else{c.shadowColor='rgba(0,0,0,0.12)';c.shadowBlur=30;c.shadowOffsetY=14;}
            }
            c.drawImage(pi,dx,dy,dw,dh); c.shadowBlur=0; c.shadowOffsetY=0;
          }else{
            c.fillStyle='#f1f5f9'; c.fillRect(dx,dy,dw,dh);
            c.fillStyle='#94a3b8'; c.font='20px sans-serif'; c.textAlign='center'; c.textBaseline='middle';
            c.fillText('商品圖',dx+dw/2,dy+dh/2); c.textBaseline='alphabetic'; c.textAlign='left';
          }
        });
      };

      layerOrder.forEach(lid=>{
        if(lid==='deco'){hb.current.deco={key:'frame',x:14,y:14,w:W-28,h:H-28};}
        else if(lid.startsWith('prod_')){const p=products.find(pr=>pr.id===lid);if(p)drawProd(p);}
        else if(lid==='title'&&pCfg.allowDesign){
          const r=drawTextLayer(ctx,W,H,templateId,tpl,{logoText,brandText,promoText,showLogo,showTitle,brandScale,textScale,titleOffset,rotations,titleFont});
          if(r)hb.current.title=r;
        }
        else if(lid==='tags'&&pCfg.allowDesign){
          hb.current.tags=drawTagLayer(ctx,W,H,templateId,tpl,{tagsInput,tagScale,tagOffsets,tagShape,tagCustomColors,showTags,tagFont,selectedLayers});
        }
        else if(lid==='icon'&&iImg){
          const iW=W*(iconScale/100), iH=(iImg.height/iImg.width)*iW;
          const ox=(W-iW)/2+iconOffset.x, oy=(H-iH)/2+iconOffset.y;
          withSel('icon',undefined,ox,oy,iW,iH,rotations.icon,(c,dx,dy,dw,dh)=>c.drawImage(iImg,dx,dy,dw,dh));
          hb.current.icon={x:ox,y:oy,w:iW,h:iH};
        }
      });

      if(products.length===0&&pCfg.allowDesign){
        const pw=W*.68,px=(W-pw)/2,py=(H-pw)/2;
        ctx.fillStyle='rgba(200,210,230,0.18)'; ctx.fillRect(px,py,pw,pw);
        ctx.fillStyle='#94a3b8'; ctx.font='22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('請上傳商品圖',px+pw/2,py+pw/2); ctx.textBaseline='alphabetic'; ctx.textAlign='left';
      }
      if(isAiDisclosure){ctx.fillStyle='rgba(150,150,150,0.55)';ctx.font='11px Arial';ctx.fillText('AI Generated',W-88,20);}
      if(guideLines.active){
        ctx.strokeStyle='#f472b6'; ctx.lineWidth=1; ctx.setLineDash([5,5]);
        ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();
        ctx.setLineDash([]);
      }
    })();
  },[products,iconImage,platform,templateId,tpl,logoText,brandText,promoText,tagsInput,isAiDisclosure,removeBg,productScale,brandScale,textScale,tagScale,tagShape,showLogo,showTitle,showTags,titleFont,tagFont,iconScale,titleOffset,iconOffset,tagOffsets,selectedLayers,rotations,guideLines,layerOrder,tagCustomColors,customColors]);

  // ── 滑鼠 ──
  const gp=e=>{const r=canvasRef.current.getBoundingClientRect();return{x:(e.clientX-r.left)*canvasRef.current.width/r.width,y:(e.clientY-r.top)*canvasRef.current.height/r.height};};
  const ch=(x,y,b)=>b&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
  const same=(l1,l2)=>{if(l1.type!==l2.type)return false;if(l1.type==='product')return l1.id===l2.id;if(l1.type==='tag')return l1.index===l2.index;return true;};
  const isSel=l=>selectedLayers.some(s=>same(s,l));

  const startDrag=(layers,sx,sy)=>{
    const ios=layers.map(l=>{
      if(l.type==='product'){const p=products.find(pr=>pr.id===l.id);return p?p.offset:{x:0,y:0};}
      if(l.type==='title')return titleOffset; if(l.type==='icon')return iconOffset;
      if(l.type==='tag')return tagOffsets[l.index]||{x:0,y:0}; return{x:0,y:0};
    });
    drag.current={isDragging:true,targets:layers,startX:sx,startY:sy,ios};
  };

  const handleMouseDown=e=>{
    const{x,y}=gp(e); const b=hb.current; let hit=null;
    for(const lid of [...layerOrder].reverse()){
      if(lid==='icon'&&!lockedLayers.icon&&iconImage&&ch(x,y,b.icon)){hit={type:'icon'};break;}
      if(lid==='title'&&!lockedLayers.title&&showTitle&&ch(x,y,b.title)){hit={type:'title'};break;}
      if(lid==='tags'&&showTags){let f=false;for(let i=b.tags.length-1;i>=0;i--){if(ch(x,y,b.tags[i])){hit={type:'tag',index:i};f=true;break;}}if(f)break;}
      if(lid.startsWith('prod_')&&!lockedLayers[lid]&&ch(x,y,b.products[lid])){hit={type:'product',id:lid};break;}
    }
    if(hit){
      if(e.shiftKey){isSel(hit)?setSelectedLayers(p=>p.filter(l=>!same(l,hit))):setSelectedLayers(p=>{const n=[...p,hit];startDrag(n,x,y);return n;});}
      else{if(!isSel(hit))setSelectedLayers([hit]);startDrag(isSel(hit)?selectedLayers:[hit],x,y);}
    }else setSelectedLayers([]);
  };

  const handleMouseMove=e=>{
    const{x,y}=gp(e);
    if(drag.current.isDragging){
      const dx=x-drag.current.startX,dy=y-drag.current.startY;
      const{targets,ios}=drag.current;
      let adx=dx,ady=dy,snapped=false;
      if(ios.length>0){const nx=ios[0].x+dx,ny=ios[0].y+dy;const T=12;if(Math.abs(nx)<T){adx=-ios[0].x;snapped=true;}if(Math.abs(ny)<T){ady=-ios[0].y;snapped=true;}}
      setGuideLines({active:snapped});
      const pu={};let tO=titleOffset,iO=iconOffset,taO=[...tagOffsets];
      targets.forEach((t,i)=>{const nx=ios[i].x+adx,ny=ios[i].y+ady;if(t.type==='product')pu[t.id]={x:nx,y:ny};else if(t.type==='title')tO={x:nx,y:ny};else if(t.type==='icon')iO={x:nx,y:ny};else if(t.type==='tag')taO[t.index]={x:nx,y:ny};});
      if(Object.keys(pu).length)setProducts(p=>p.map(pr=>pu[pr.id]?{...pr,offset:pu[pr.id]}:pr));
      if(targets.some(t=>t.type==='title'))setTitleOffset(tO);
      if(targets.some(t=>t.type==='icon'))setIconOffset(iO);
      if(targets.some(t=>t.type==='tag'))setTagOffsets(taO);
      canvasRef.current.style.cursor='grabbing'; return;
    }
    const b=hb.current;let hov=false;
    for(const lid of [...layerOrder].reverse()){
      if(lid==='icon'&&iconImage&&ch(x,y,b.icon)){hov=true;break;}
      if(lid==='title'&&showTitle&&ch(x,y,b.title)){hov=true;break;}
      if(lid==='tags'){let f=false;for(let i=0;i<b.tags.length;i++){if(ch(x,y,b.tags[i])){f=true;break;}}if(f){hov=true;break;}}
      if(lid.startsWith('prod_')&&ch(x,y,b.products[lid])){hov=true;break;}
    }
    canvasRef.current.style.cursor=hov?'grab':'default';
  };

  const handleMouseUp=()=>{if(drag.current.isDragging)saveSnap();drag.current.isDragging=false;setGuideLines({active:false});if(canvasRef.current)canvasRef.current.style.cursor='default';};

  const handleWheel=e=>{
    if(selectedLayers.length>0&&e.shiftKey){
      e.preventDefault(); const d=e.deltaY>0?5:-5;
      setProducts(p=>p.map(pr=>selectedLayers.some(l=>l.type==='product'&&l.id===pr.id)?{...pr,rotation:(pr.rotation||0)+d}:pr));
      setRotations(r=>{const n={...r};selectedLayers.forEach(l=>{if(l.type==='title')n.title=(n.title||0)+d;if(l.type==='icon')n.icon=(n.icon||0)+d;});return n;});
    }
  };

  const moveUp=id=>{const i=layerOrder.indexOf(id);if(i<layerOrder.length-1){const n=[...layerOrder];[n[i],n[i+1]]=[n[i+1],n[i]];setLayerOrder(n);setTimeout(saveSnap,50);}};
  const moveDown=id=>{const i=layerOrder.indexOf(id);if(i>0){const n=[...layerOrder];[n[i],n[i-1]]=[n[i-1],n[i]];setLayerOrder(n);setTimeout(saveSnap,50);}};
  const toggleLock=id=>setLockedLayers(p=>({...p,[id]:!p[id]}));

  const resetAll=()=>{
    setTitleOffset({x:0,y:0}); setIconOffset({x:150,y:-150});
    setTagOffsets(tagOffsets.map(()=>({x:0,y:0})));
    setProducts(p=>p.map(pr=>({...pr,offset:{x:0,y:0},rotation:0})));
    setRotations({title:0,icon:0});
    setLayerOrder(['deco',...products.map(p=>p.id),'tags','title','icon']);
    setTimeout(saveSnap,50);
  };

  const saveToGAS=async()=>{
    if(!gasUrl){setCloudMsg({text:'請輸入 GAS 網址',type:'error'});return;}
    setIsSaving(true); setCloudMsg({text:'儲存中...',type:'info'});
    localStorage.setItem('ManiFactory_GAS_URL',gasUrl);
    try{
      const r=await fetch(gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'save',payload:{projectName,...buildSnap(),imageBase64:products[0]?.src||null}})});
      const res=await r.json();
      if(res.status==='success'){setCloudMsg({text:'✅ 儲存成功！',type:'success'});setTimeout(()=>setCloudMsg({text:'',type:''}),3000);}
      else setCloudMsg({text:'失敗: '+res.message,type:'error'});
    }catch(e){setCloudMsg({text:'連線失敗',type:'error'});}
    setIsSaving(false);
  };

  const loadFromGAS=async()=>{
    if(!gasUrl){setCloudMsg({text:'請輸入 GAS 網址',type:'error'});return;}
    setIsLoadingList(true); setShowLoadMenu(true);
    try{
      const r=await fetch(gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'load'})});
      const res=await r.json();
      if(res.status==='success')setCloudTemplates(res.data.templates);
      else setCloudMsg({text:'讀取失敗: '+res.message,type:'error'});
    }catch(e){setCloudMsg({text:'無法讀取',type:'error'});}
    setIsLoadingList(false);
  };

  const handleDownload=()=>{
    if(!compliance.safe||!canvasRef.current)return;
    try{const link=document.createElement('a');link.download=`馬尼製圖_${CATEGORIES[activeCategory].name}_${tpl.name}_${Date.now()}.png`;link.href=canvasRef.current.toDataURL('image/png',1.0);document.body.appendChild(link);link.click();document.body.removeChild(link);}
    catch(e){alert('匯出失敗（可能為跨域圖片）');}
  };

  const pCfg=PLATFORMS[platform];
  const catTpls=CATEGORIES[activeCategory].templates;
  const alid=activeLayer?.id||activeLayer?.type;

  // ── 右側屬性面板 ──
  const renderCtx=()=>{
    if(isMulti) return(
      <PC title={`多選模式（${selectedLayers.length} 個圖層）`}>
        <p style={{fontSize:11,color:'#64748b',marginBottom:10,lineHeight:1.6}}>可拖曳或用鍵盤方向鍵微調所有選取圖層。</p>
        {selectedLayers.some(l=>l.type==='product')&&<SR label="統一縮放商品" min={10} max={250} val={100} onChange={v=>setProducts(p=>p.map(pr=>selectedLayers.some(l=>l.type==='product'&&l.id===pr.id)?{...pr,scale:v}:pr))} onUp={saveSnap} color={tpl.primary} />}
        <DB onClick={()=>{const ids=selectedLayers.filter(l=>l.type==='product').map(l=>l.id);setProducts(p=>p.filter(pr=>!ids.includes(pr.id)));setLayerOrder(p=>p.filter(l=>!ids.includes(l)));setSelectedLayers([]);saveSnap();}}>🗑️ 刪除選取商品</DB>
      </PC>
    );
    if(!activeLayer)return null;
    return(
      <PC title={activeLayer.type==='product'?'📦 商品圖層':activeLayer.type==='title'?'✏️ 標題文字':activeLayer.type==='tag'?`🏷️ 標籤 #${activeLayer.index+1}`:activeLayer.type==='icon'?'🌟 圖示':'🖼️ 裝飾'}>
        <div style={{display:'flex',gap:5,marginBottom:10}}>
          <button onClick={()=>moveUp(alid)} disabled={layerOrder.indexOf(alid)===layerOrder.length-1} style={sb(layerOrder.indexOf(alid)===layerOrder.length-1)}>⬆️ 上移</button>
          <button onClick={()=>moveDown(alid)} disabled={layerOrder.indexOf(alid)===0} style={sb(layerOrder.indexOf(alid)===0)}>⬇️ 下移</button>
          <button onClick={()=>toggleLock(alid)} style={{...sb(false),borderColor:lockedLayers[alid]?'#fca5a5':'#e2e8f0',background:lockedLayers[alid]?'#fef2f2':'#fff',color:lockedLayers[alid]?'#dc2626':'#64748b'}}>{lockedLayers[alid]?'🔒':'🔓'}</button>
        </div>
        {activeLayer.type==='product'&&(()=>{const prod=products.find(p=>p.id===activeLayer.id);if(!prod)return null;return(<>
          <SR label={`縮放 ${prod.scale}%`} min={10} max={250} val={prod.scale} onChange={v=>setProducts(p=>p.map(pr=>pr.id===prod.id?{...pr,scale:v}:pr))} onUp={saveSnap} color={tpl.primary} />
          <LT label="立體陰影" checked={prod.shadow!==false} onChange={v=>{setProducts(p=>p.map(pr=>pr.id===prod.id?{...pr,shadow:v}:pr));saveSnap();}} />
          {enableRemoveBgApi&&removeBgApiKey&&!prod.isRemovingBg&&<button onClick={()=>execRmBg(prod.id,prod.rawSrc)} style={{width:'100%',padding:'7px',margin:'5px 0',borderRadius:8,border:'none',background:'#7c3aed',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:11}}>✨ AI 去背此圖</button>}
          <DB onClick={()=>{setProducts(p=>p.filter(pr=>pr.id!==prod.id));setLayerOrder(p=>p.filter(l=>l!==prod.id));setSelectedLayers([]);saveSnap();}}>🗑️ 刪除此商品</DB>
        </>);})()}
        {activeLayer.type==='title'&&<>
          <div style={{marginBottom:8}}><div style={lb}>主標題內容</div><LI value={promoText} onChange={setPromoText} onBlur={saveSnap} placeholder="商品主標題" /></div>
          <SR label={`標題大小 ${textScale}%`} min={50} max={180} val={textScale} onChange={setTextScale} onUp={saveSnap} color={tpl.primary} />
        </>}
        {activeLayer.type==='tag'&&<>
          <div style={{marginBottom:8,fontSize:10,color:'#2563eb',fontWeight:700,background:'#eff6ff',padding:'5px 9px',borderRadius:6}}>第 {activeLayer.index+1} 個標籤獨立設定</div>
          <div style={{marginBottom:8}}><div style={lb}>獨立顏色</div><div style={{display:'flex',alignItems:'center',gap:8}}>
            <input type="color" value={tagCustomColors[activeLayer.index]||tpl.accent} onChange={e=>setTagCustomColors(p=>({...p,[activeLayer.index]:e.target.value}))} onBlur={saveSnap} style={{width:32,height:32,borderRadius:8,border:'2px solid #e2e8f0',padding:2,cursor:'pointer'}} />
            <button onClick={()=>{setTagCustomColors(p=>{const n={...p};delete n[activeLayer.index];return n;});setTimeout(saveSnap,50);}} style={{fontSize:10,color:'#64748b',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',fontFamily:'inherit'}}>重置</button>
          </div></div>
          <SR label={`標籤大小 ${tagScale}%`} min={50} max={180} val={tagScale} onChange={setTagScale} onUp={saveSnap} color={tpl.accent} />
        </>}
        {activeLayer.type==='icon'&&<>
          <SR label={`圖示大小 ${iconScale}%`} min={10} max={100} val={iconScale} onChange={setIconScale} onUp={saveSnap} color={tpl.primary} />
          <DB onClick={()=>{setIconImage(null);setSelectedLayers([]);saveSnap();}}>🗑️ 刪除圖示</DB>
        </>}
      </PC>
    );
  };

  return(
    <div style={{display:'flex',height:'100vh',fontFamily:'"Microsoft JhengHei",sans-serif',background:'#f0f4f8',overflow:'hidden'}}>

      {/* ══ 左側面板 ══ */}
      <div style={{width:leftWidth,background:'#fff',display:'flex',flexDirection:'column',boxShadow:'4px 0 20px rgba(0,0,0,0.08)',zIndex:10,flexShrink:0,borderRight:'1px solid #e2e8f0',overflow:'hidden'}}>

        <div style={{background:`linear-gradient(135deg,${tpl.primary},${tpl.accent})`,padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>🖼️</span>
            <div><div style={{fontSize:15,fontWeight:800,color:'#fff'}}>馬尼通訊製圖工廠</div><div style={{fontSize:10,color:'rgba(255,255,255,0.65)'}}>商品類別模板 V5.0</div></div>
          </div>
          <div style={{display:'flex',gap:4,background:'rgba(0,0,0,0.2)',borderRadius:8,padding:4}}>
            <button onClick={handleUndo} style={hb2} title="Ctrl+Z">↩️</button>
            <button onClick={handleRedo} style={hb2} title="Ctrl+Y">↪️</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'12px 13px',display:'flex',flexDirection:'column',gap:9,background:'#f8fafc'}}>

          {(activeLayer||isMulti)&&<>
            <button onClick={()=>setSelectedLayers([])} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:20,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700,alignSelf:'flex-start'}}>← 返回總覽</button>
            {renderCtx()}
          </>}

          {!activeLayer&&!isMulti&&<>

            <PC title="① 商品類別">
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
                {Object.entries(CATEGORIES).map(([id,cat])=>(
                  <button key={id} onClick={()=>{setActiveCategory(id);setTemplateId(Object.keys(cat.templates)[0]);setCustomColors(null);setTimeout(saveSnap,50);}} style={{padding:'7px 3px',borderRadius:9,border:'2px solid',cursor:'pointer',textAlign:'center',fontFamily:'inherit',borderColor:activeCategory===id?tpl.primary:'#e2e8f0',background:activeCategory===id?tpl.primary+'18':'#fff',color:activeCategory===id?tpl.primary:'#64748b',transition:'all .15s'}}>
                    <div style={{fontSize:18,marginBottom:2}}>{cat.icon}</div>
                    <div style={{fontSize:9,fontWeight:700}}>{cat.name}</div>
                  </button>
                ))}
              </div>
            </PC>

            <PC title={`② ${CATEGORIES[activeCategory].name} 風格（2 組）`}>
              {Object.entries(catTpls).map(([tid,t])=>(
                <button key={tid} onClick={()=>{setTemplateId(tid);setCustomColors(null);setTimeout(saveSnap,50);}} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 12px',borderRadius:10,border:'2px solid',cursor:'pointer',textAlign:'left',marginBottom:5,fontFamily:'inherit',width:'100%',borderColor:templateId===tid?tpl.primary:'#e2e8f0',background:templateId===tid?tpl.primary+'12':'#fff',transition:'all .15s'}}>
                  <div style={{display:'flex',gap:3,flexShrink:0}}>
                    {[t.primary,t.accent,t.bg].map((c,i)=><div key={i} style={{width:15,height:15,borderRadius:'50%',background:c,border:'1px solid rgba(0,0,0,0.08)'}} />)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:templateId===tid?tpl.primary:'#334155',fontFamily:'inherit'}}>{t.name}</div>
                    <div style={{fontSize:10,color:'#94a3b8',fontFamily:'inherit'}}>{t.desc}</div>
                  </div>
                  {templateId===tid&&<span style={{color:tpl.primary,fontWeight:900,fontSize:13}}>✓</span>}
                </button>
              ))}
            </PC>

            <PC title="③ 自訂配色覆蓋">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7,marginBottom:7}}>
                {[['主色',tpl.primary,'primary'],['重點',tpl.accent,'accent'],['底色',tpl.bg,'bg']].map(([label,val,key])=>(
                  <div key={key} style={{textAlign:'center'}}>
                    <input type="color" value={val} onChange={e=>setCustomColors(p=>({...(p||{primary:tpl.primary,accent:tpl.accent,bg:tpl.bg,textCol:tpl.textCol,mode:tpl.mode}),[key]:e.target.value}))} onBlur={saveSnap} style={{width:34,height:34,borderRadius:'50%',border:'2px solid #e2e8f0',padding:2,cursor:'pointer',display:'block',margin:'0 auto 3px'}} />
                    <div style={{fontSize:9,color:'#64748b',fontWeight:600}}>{label}</div>
                  </div>
                ))}
              </div>
              {customColors&&<button onClick={()=>{setCustomColors(null);setTimeout(saveSnap,50);}} style={{width:'100%',padding:'5px',borderRadius:7,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700}}>↩ 恢復模板配色</button>}
            </PC>

            <PC title="④ 商品圖上傳（支援多圖）">
              <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 9px',background:'#f5f3ff',borderRadius:8,border:'1px solid #e9d5ff',marginBottom:7}}>
                <input type="checkbox" checked={enableRemoveBgApi} onChange={e=>setEnableRemoveBgApi(e.target.checked)} id="rbg" style={{accentColor:'#7c3aed'}} />
                <label htmlFor="rbg" style={{fontSize:11,fontWeight:700,color:'#6d28d9',cursor:'pointer'}}>✨ Remove.bg AI 去背</label>
              </div>
              {enableRemoveBgApi&&<div style={{marginBottom:7,padding:'7px 9px',background:'#faf5ff',borderRadius:8,border:'1px solid #e9d5ff'}}>
                <input type="password" placeholder="Remove.bg API Key" value={removeBgApiKey} onChange={e=>{setRemoveBgApiKey(e.target.value);localStorage.setItem('ManiFactory_RemoveBg_Key',e.target.value);}} style={{width:'100%',padding:'6px 8px',border:'1px solid #d8b4fe',borderRadius:6,fontSize:11,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}} />
                <div style={{fontSize:9,color:'#8b5cf6',marginTop:3}}>本月已去背 {bgRemovalCount} 次</div>
              </div>}
              <div onDrop={e=>{e.preventDefault();setIsDragActive(false);processUpload(e.dataTransfer.files);}} onDragOver={e=>{e.preventDefault();setIsDragActive(true);}} onDragLeave={()=>setIsDragActive(false)} onClick={()=>document.getElementById('img-upload').click()}
                style={{border:`2px dashed ${isDragActive?tpl.primary:'#bfdbfe'}`,borderRadius:10,padding:'13px',textAlign:'center',cursor:'pointer',background:isDragActive?tpl.primary+'10':'#f0f9ff',transition:'all .2s'}}>
                <input id="img-upload" type="file" multiple accept="image/*" style={{display:'none'}} onChange={e=>processUpload(e.target.files)} />
                <div style={{fontSize:22,marginBottom:2}}>📷</div>
                <div style={{fontSize:11,color:tpl.primary,fontWeight:600}}>點擊上傳或拖曳（可多選）</div>
              </div>
              {products.length>0&&<div style={{marginTop:7,display:'flex',gap:5,overflowX:'auto',paddingBottom:4}}>
                {products.map((p,i)=>{const sel=selectedLayers.some(l=>l.type==='product'&&l.id===p.id);return(
                  <div key={p.id} onClick={e=>{if(e.shiftKey){sel?setSelectedLayers(prev=>prev.filter(l=>l.id!==p.id)):setSelectedLayers(prev=>[...prev,{type:'product',id:p.id}]);}else setSelectedLayers([{type:'product',id:p.id}]);}} style={{position:'relative',width:46,height:46,border:`2px solid ${sel?tpl.primary:'#e2e8f0'}`,borderRadius:8,cursor:'pointer',flexShrink:0,background:'#fff'}}>
                    <img src={p.src} style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:6}} />
                    {p.isRemovingBg&&<div style={{position:'absolute',inset:0,background:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,fontSize:11}}>⏳</div>}
                    <span style={{position:'absolute',bottom:-5,right:-5,background:'#1e293b',color:'#fff',fontSize:8,padding:'1px 4px',borderRadius:8}}>{i+1}</span>
                  </div>);
                })}
              </div>}
              <LT label="全域陰影效果" checked={removeBg} onChange={v=>{setRemoveBg(v);saveSnap();}} style={{marginTop:5}} />
            </PC>

            <PC title="⑤ 上架平台">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
                {Object.entries(PLATFORMS).map(([k,p])=>(
                  <button key={k} onClick={()=>{setPlatform(k);setTimeout(saveSnap,0);}} style={{padding:'8px 6px',borderRadius:9,border:'2px solid',cursor:'pointer',textAlign:'left',fontFamily:'inherit',borderColor:platform===k?p.color:'#e2e8f0',background:platform===k?p.color+'14':'#fff',transition:'all .15s'}}>
                    <div style={{fontSize:11,fontWeight:700,color:platform===k?p.color:'#334155'}}>{p.name}</div>
                    {!p.allowDesign&&<div style={{fontSize:9,color:'#ef4444'}}>強制純白底</div>}
                  </button>
                ))}
              </div>
              {!pCfg.allowDesign&&<div style={{marginTop:5,padding:'6px 9px',background:'#fef2f2',borderRadius:8,fontSize:10,color:'#dc2626',fontWeight:600}}>⚠️ 已自動隱藏所有設計元素</div>}
            </PC>

            <PC title="⑥ 文案設定">
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                <ET label="品牌徽章" show={showLogo} onToggle={()=>{setShowLogo(!showLogo);saveSnap();}}>
                  <div style={{display:'flex',gap:5}}><LI value={logoText} onChange={setLogoText} onBlur={saveSnap} placeholder="品牌名" style={{flex:1}} /><LI value={brandText} onChange={setBrandText} onBlur={saveSnap} placeholder="副文字" style={{flex:2}} /></div>
                </ET>
                <ET label="主標題" show={showTitle} onToggle={()=>{setShowTitle(!showTitle);saveSnap();}}>
                  <LI value={promoText} onChange={setPromoText} onBlur={saveSnap} placeholder="商品主標題" />
                </ET>
                <ET label="特點標籤" show={showTags} onToggle={()=>{setShowTags(!showTags);saveSnap();}}>
                  <LI value={tagsInput} onChange={setTagsInput} onBlur={saveSnap} placeholder="標籤1,標籤2,標籤3" />
                  {tagsInput&&<div style={{marginTop:4,display:'flex',flexWrap:'wrap',gap:3}}>{tagsInput.split(',').map((t,i)=><span key={i} style={{padding:'2px 7px',borderRadius:10,fontSize:9,background:'#dbeafe',color:'#1d4ed8',fontWeight:700}}>{t.trim()}</span>)}</div>}
                </ET>
              </div>
              {!compliance.safe&&<div style={{marginTop:5,padding:'6px 9px',background:'#fef2f2',borderRadius:8,fontSize:10,color:'#dc2626',fontWeight:600}}>⚠️ 違禁詞：{compliance.words.join('、')}</div>}
            </PC>

            <PC title="⑦ 標籤形狀">
              <div style={{display:'flex',gap:5}}>
                {[['pill','💊 圓角'],['rect','▬ 方塊'],['outline','□ 線框']].map(([s,l])=>(
                  <button key={s} onClick={()=>{setTagShape(s);saveSnap();}} style={{flex:1,padding:'7px 3px',borderRadius:8,border:'2px solid',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700,borderColor:tagShape===s?tpl.primary:'#e2e8f0',background:tagShape===s?tpl.primary+'14':'#fff',color:tagShape===s?tpl.primary:'#64748b',transition:'all .15s'}}>{l}</button>
                ))}
              </div>
            </PC>

            <PC title="⑧ 全域大小調整">
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:5}}>
                <button onClick={resetAll} style={{padding:'4px 9px',borderRadius:6,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700}}>↩ 重置座標</button>
              </div>
              <SR label={`商品 ${productScale}%`} min={30} max={200} val={productScale} onChange={v=>{setProductScale(v);setProducts(p=>p.map(pr=>({...pr,scale:v})));}} onUp={saveSnap} color={tpl.primary} />
              <SR label={`標題 ${textScale}%`} min={50} max={180} val={textScale} onChange={setTextScale} onUp={saveSnap} color={tpl.primary} />
              <SR label={`標籤 ${tagScale}%`} min={50} max={180} val={tagScale} onChange={setTagScale} onUp={saveSnap} color={tpl.accent} />
              <SR label={`徽章 ${brandScale}%`} min={50} max={150} val={brandScale} onChange={setBrandScale} onUp={saveSnap} color={tpl.accent} />
            </PC>

            <PC title="⑨ 字型設定">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                <div><div style={lb}>標題字型</div><FS value={titleFont} onChange={v=>{setTitleFont(v);saveSnap();}} /></div>
                <div><div style={lb}>標籤字型</div><FS value={tagFont} onChange={v=>{setTagFont(v);saveSnap();}} /></div>
              </div>
            </PC>

            <PC title="⑩ 外部圖示 & AI 聲明">
              <label style={{display:'block',padding:'8px',textAlign:'center',border:'1px solid #e2e8f0',borderRadius:8,cursor:'pointer',fontSize:11,color:'#64748b',fontWeight:600,background:'#f8fafc',marginBottom:5}}>
                <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>setIconImage(ev.target.result);r.readAsDataURL(f);}}} style={{display:'none'}} />
                {iconImage?'✅ 已載入，點擊更換':'選擇透明 PNG 圖示'}
              </label>
              <LT label="AI Generated 聲明" checked={isAiDisclosure} onChange={v=>{setIsAiDisclosure(v);saveSnap();}} />
            </PC>

            <PC title="☁️ 雲端樣板中心（GAS）">
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <input type="text" placeholder="GAS Web App 網址" value={gasUrl} onChange={e=>setGasUrl(e.target.value)} style={{padding:'7px 9px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:10,fontFamily:'inherit',outline:'none'}} />
                <div style={{display:'flex',gap:5}}>
                  <input type="text" placeholder="樣板名稱" value={projectName} onChange={e=>setProjectName(e.target.value)} style={{flex:1,padding:'6px 8px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:10,fontFamily:'inherit',outline:'none'}} />
                  <button onClick={saveToGAS} disabled={isSaving} style={{padding:'6px 10px',borderRadius:8,border:'none',background:'#059669',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:10,opacity:isSaving?.6:1}}>{isSaving?'⏳':'💾'}</button>
                  <button onClick={loadFromGAS} disabled={isLoadingList} style={{padding:'6px 10px',borderRadius:8,border:'none',background:'#2563eb',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:10,opacity:isLoadingList?.6:1}}>{isLoadingList?'⏳':'☁️'}</button>
                </div>
                {cloudMsg.text&&<div style={{padding:'6px 9px',borderRadius:8,fontSize:10,fontWeight:700,background:cloudMsg.type==='error'?'#fef2f2':cloudMsg.type==='success'?'#f0fdf4':'#eff6ff',color:cloudMsg.type==='error'?'#dc2626':cloudMsg.type==='success'?'#16a34a':'#2563eb'}}>{cloudMsg.text}</div>}
                {showLoadMenu&&cloudTemplates.length>0&&<div style={{border:'1px solid #e2e8f0',borderRadius:8,overflow:'hidden',maxHeight:150,overflowY:'auto'}}>
                  {cloudTemplates.map((t,i)=><div key={i} onClick={()=>{try{applySnap(t.parameters);}catch(e){}setShowLoadMenu(false);setTimeout(saveSnap,100);}} style={{padding:'8px 11px',cursor:'pointer',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',background:'#fff',fontSize:11}}>
                    <span style={{fontWeight:700,color:'#334155'}}>{t.projectName}</span><span style={{color:'#94a3b8',fontSize:9}}>{t.timestamp}</span>
                  </div>)}
                </div>}
              </div>
            </PC>

          </>}
        </div>

        {/* 匯出 */}
        <div style={{padding:'11px 13px',borderTop:'1px solid #e2e8f0',background:'#fff',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:7,padding:'5px 10px',borderRadius:8,background:compliance.safe?'#f0fdf4':'#fef2f2'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:compliance.safe?'#22c55e':'#ef4444'}} />
            <span style={{fontSize:10,fontWeight:700,color:compliance.safe?'#16a34a':'#dc2626'}}>{compliance.safe?'✅ 合規通過':` ⚠️ 違禁詞：${compliance.words.join('、')}`}</span>
          </div>
          <button onClick={handleDownload} disabled={!compliance.safe} style={{width:'100%',padding:'13px',borderRadius:12,border:'none',cursor:compliance.safe?'pointer':'not-allowed',fontFamily:'inherit',fontWeight:800,fontSize:13,background:compliance.safe?`linear-gradient(135deg,${tpl.primary},${tpl.accent})`:'#e2e8f0',color:compliance.safe?'#fff':'#94a3b8',boxShadow:compliance.safe?`0 4px 14px ${tpl.primary}55`:'none',transition:'all .2s'}}>
            ⬇️ 匯出 {CATEGORIES[activeCategory].icon} {CATEGORIES[activeCategory].name} · {tpl.name}
          </button>
        </div>
      </div>

      {/* 分隔線 */}
      <div style={{width:5,background:'#e2e8f0',cursor:'col-resize',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}} onMouseDown={e=>{e.preventDefault();const mv=me=>setLeftWidth(Math.max(400,Math.min(me.clientX,window.innerWidth*.75)));const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);}}>
        <div style={{width:3,height:26,borderRadius:4,background:'#94a3b8'}} />
      </div>

      {/* ══ 右側預覽 ══ */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:22,overflow:'auto',background:'#eef2f7'}} onWheel={handleWheel}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:560,marginBottom:12}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:'#1e293b'}}>即時預覽</div>
            <div style={{fontSize:11,color:'#64748b',marginTop:2}}>
              <span style={{color:tpl.primary,fontWeight:700}}>{CATEGORIES[activeCategory].icon} {CATEGORIES[activeCategory].name}</span> · <span style={{fontWeight:600}}>{tpl.name}</span> · {pCfg.name}
            </div>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <button onClick={()=>setShowHelp(true)} style={{padding:'5px 11px',borderRadius:20,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>❓ 說明</button>
            <div style={{padding:'5px 12px',borderRadius:20,fontSize:10,fontWeight:700,background:compliance.safe?'#dcfce7':'#fee2e2',color:compliance.safe?'#16a34a':'#dc2626'}}>{compliance.safe?'✅ 合規':'⚠️ 違禁'}</div>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:20,padding:12,boxShadow:'0 20px 60px rgba(0,0,0,0.1)',border:`2px solid ${tpl.primary}33`}}>
          <canvas ref={canvasRef} width={800} height={800} style={{display:'block',width:520,height:520,borderRadius:10}}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
        </div>

        <div style={{marginTop:11,display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',maxWidth:560}}>
          {[['🔍 圖+',()=>setProducts(p=>p.map(pr=>({...pr,scale:Math.min(200,(pr.scale||100)+10)})))],
            ['🔎 圖-',()=>setProducts(p=>p.map(pr=>({...pr,scale:Math.max(20,(pr.scale||100)-10)})))],
            ['🔡 字+',()=>setTextScale(v=>Math.min(180,v+10))],
            ['🔤 字-',()=>setTextScale(v=>Math.max(50,v-10))],
            ['🎯 重置',resetAll],
          ].map(([l,fn])=>(
            <button key={l} onClick={fn} style={{padding:'5px 10px',borderRadius:20,border:'1px solid #e2e8f0',background:'#fff',color:'#334155',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>{l}</button>
          ))}
        </div>

        {!pCfg.allowDesign&&<div style={{marginTop:9,padding:'8px 13px',borderRadius:10,maxWidth:520,width:'100%',background:'#fef3c7',border:'1px solid #fde68a',fontSize:11,color:'#92400e'}}><strong>📌 {pCfg.name}：</strong>已切換純白底，所有設計元素隱藏。</div>}
        <div style={{marginTop:7,fontSize:10,color:'#94a3b8'}}>輸出 1000×1000px · PNG · 多圖層編輯</div>
      </div>

      {/* 說明 Modal */}
      {showHelp&&<div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:16}} onClick={()=>setShowHelp(false)}>
        <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:540,maxHeight:'75vh',overflow:'hidden',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:'13px 17px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f8fafc'}}>
            <div style={{fontSize:14,fontWeight:800,color:'#1e293b'}}>🖱️ 操作說明</div>
            <button onClick={()=>setShowHelp(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#64748b'}}>✕</button>
          </div>
          <div style={{padding:14,overflowY:'auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
            {[['點擊圖層','在畫布點擊任何元素，左側面板即顯示該圖層的獨立設定。'],['多選 Shift+點','按住 Shift 點其他圖層可多選，同時拖曳移動。'],['鍵盤微調','選取後方向鍵移動 1px；Shift+方向鍵移動 10px。'],['旋轉','選取後按住 Shift + 滾動滾輪旋轉物件。'],['置中吸附','拖曳靠近中央時自動吸附，顯示粉紅輔助線。'],['鎖定圖層','點圖層後可鎖定，防止誤移。'],['Ctrl+Z/Y','復原 / 重做。'],['草稿自動存','每 1.2 秒自動備份至 IndexedDB。'],].map(([t,d])=>(
              <div key={t} style={{padding:'8px 10px',background:'#f8fafc',borderRadius:8,border:'1px solid #f1f5f9'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#1e293b',marginBottom:3}}>{t}</div>
                <div style={{fontSize:10,color:'#64748b',lineHeight:1.6}}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{padding:'10px 15px',borderTop:'1px solid #f1f5f9',textAlign:'center'}}>
            <button onClick={()=>setShowHelp(false)} style={{padding:'8px 26px',borderRadius:10,border:'none',background:'#1e293b',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:12}}>了解，開始製圖</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

// ── 共用樣式常數 ──────────────────────────────────────────────────────────────
const lb={fontSize:9,fontWeight:700,color:'#64748b',marginBottom:3,display:'block'};
const hb2={padding:'5px 7px',background:'none',border:'none',color:'#fff',cursor:'pointer',borderRadius:5,fontSize:12,fontWeight:700};
const sb=disabled=>({flex:1,padding:'5px 3px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:disabled?'not-allowed':'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700,color:'#334155',opacity:disabled?.3:1});

// ── 共用元件 ─────────────────────────────────────────────────────────────────
function PC({title,children}){return(<div style={{background:'#fff',borderRadius:11,padding:'10px 12px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',border:'1px solid #f1f5f9'}}>{title&&<div style={{fontSize:9,fontWeight:800,color:'#64748b',marginBottom:7,textTransform:'uppercase',letterSpacing:.5}}>{title}</div>}{children}</div>);}
function LI({value,onChange,onBlur,placeholder,style={}}){return(<input value={value} onChange={e=>onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} style={{width:'100%',padding:'6px 8px',border:'1.5px solid #e2e8f0',borderRadius:7,fontSize:11,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#f8fafc',color:'#1e293b',...style}} />);}
function LT({label,checked,onChange,style={}}){return(<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 0',...style}}><span style={{fontSize:11,color:'#475569',fontWeight:600}}>{label}</span><div onClick={()=>onChange(!checked)} style={{width:32,height:18,borderRadius:9,cursor:'pointer',background:checked?'#2563eb':'#cbd5e1',position:'relative',transition:'background .2s',flexShrink:0}}><div style={{position:'absolute',top:2,left:checked?15:2,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/></div></div>);}
function SR({label,min,max,val,onChange,onUp,color}){return(<div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:600,color:'#475569',marginBottom:3}}>{label}</div><input type="range" min={min} max={max} value={val} onChange={e=>onChange(Number(e.target.value))} onMouseUp={onUp} style={{width:'100%',accentColor:color||'#2563eb',cursor:'pointer'}}/></div>);}
function ET({label,show,onToggle,children}){return(<div style={{borderRadius:9,border:`1.5px solid ${show?'#bfdbfe':'#e2e8f0'}`,background:show?'#f0f9ff':'#fff',overflow:'hidden'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',cursor:'pointer'}} onClick={onToggle}><span style={{fontSize:11,fontWeight:700,color:show?'#1d4ed8':'#94a3b8'}}>{show?'👁️':'🚫'} {label}</span><div style={{width:28,height:16,borderRadius:8,background:show?'#2563eb':'#cbd5e1',position:'relative',flexShrink:0}}><div style={{position:'absolute',top:2,left:show?13:2,width:12,height:12,borderRadius:'50%',background:'#fff',transition:'left .18s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/></div></div>{show&&<div style={{padding:'0 10px 8px'}}>{children}</div>}</div>);}
function DB({onClick,children}){return(<button onClick={onClick} style={{width:'100%',padding:'6px',marginTop:5,borderRadius:8,border:'1px solid #fca5a5',background:'#fef2f2',color:'#dc2626',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:11}}>{children}</button>);}
function FS({value,onChange}){return(<select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'5px 7px',border:'1.5px solid #e2e8f0',borderRadius:7,fontSize:11,fontFamily:'inherit',outline:'none'}}><option value="Microsoft JhengHei">微軟正黑體</option><option value="Arial">Arial</option><option value="sans-serif">黑體</option><option value="serif">明體</option></select>);}
