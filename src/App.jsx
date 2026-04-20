import React, { useState, useRef, useEffect } from 'react';

// ─── IndexedDB ────────────────────────────────────────────────────────────────
const DB_NAME = 'ManiFactoryDB_V51';
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current_draft';
const initDB = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB_NAME, 1);
  r.onupgradeneeded = e => { if (!e.target.result.objectStoreNames.contains(STORE_NAME)) e.target.result.createObjectStore(STORE_NAME); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const saveDraft = async (s) => { try { const db = await initDB(); db.transaction(STORE_NAME,'readwrite').objectStore(STORE_NAME).put(s, DRAFT_KEY); } catch(e){} };
const loadDraft = async () => { try { const db = await initDB(); const tx = db.transaction(STORE_NAME,'readonly'); const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY); return new Promise(res => { req.onsuccess = () => res(req.result ?? null); req.onerror = () => res(null); }); } catch(e){ return null; } };

// ─── 14 組模板 ───────────────────────────────────────────────────────────────
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

// ─── 文字樣式預設（每個文字元素都有這些屬性）────────────────────────────────
const defaultTextStyle = () => ({
  color: '',          // 空字串 = 使用模板預設色
  bold: true,
  italic: false,
  outline: false,     // 是否開啟描邊加框
  outlineColor: '#ffffff',
  outlineWidth: 6,    // px（canvas 實際值）
  scale: 100,         // 獨立縮放 %
});

// ─── 工具 ─────────────────────────────────────────────────────────────────────
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

// ─── 帶描邊加框的文字繪製工具 ────────────────────────────────────────────────
function drawStyledText(ctx, text, x, y, style, fallbackColor, fontSize, font) {
  if (!text) return;
  const color = style.color || fallbackColor;
  const fontStr = `${style.italic?'italic ':''} ${style.bold?'900 ':'400 '}${fontSize}px "${font}"`;
  ctx.font = fontStr;
  if (style.outline && style.outlineWidth > 0) {
    ctx.strokeStyle = style.outlineColor || '#ffffff';
    ctx.lineWidth = style.outlineWidth;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// ─── 背景繪製（14 組）────────────────────────────────────────────────────────
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
      ctx.fillStyle=p; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*.55,0); ctx.lineTo(W*.38,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
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
      ctx.fillStyle=p; ctx.beginPath(); ctx.moveTo(0,H-120); ctx.lineTo(W*.7,H-120); ctx.lineTo(W*.55,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
      ctx.fillStyle=a; ctx.beginPath(); ctx.moveTo(0,H-75); ctx.lineTo(W*.5,H-75); ctx.lineTo(W*.38,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill(); break;
    }
    case 'seasonal_a': {
      const g=ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0,h2r(p,.18)); g.addColorStop(1,h2r(a,.08)); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.fillStyle=h2r(p,.12); ctx.beginPath(); ctx.moveTo(0,H-100);
      for(let x=0;x<=W;x+=40) ctx.quadraticCurveTo(x+20,H-130,x+40,H-100);
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
      ctx.fillStyle=h2r(a,.15); ctx.beginPath(); ctx.moveTo(0,H-58);
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

// ─── 標籤層 ───────────────────────────────────────────────────────────────────
function drawTagLayer(ctx, W, H, tid, tpl, opts) {
  const {accent:a} = tpl;
  const {tagsInput,tagScale,tagOffsets,tagShape,tagCustomColors,showTags,tagFont,selectedLayers,tagTextStyle} = opts;
  if (!showTags) return [];
  const tags = tagsInput.split(',').map(t=>t.trim()).filter(Boolean);
  if (!tags.length) return [];
  const sc=(tagScale||100)/100, tagH=Math.round(42*sc), fs=Math.round(18*sc), pad=Math.round(18*sc), gap=10;
  const style = tagTextStyle || defaultTextStyle();
  const fontStr = `${style.italic?'italic ':''} ${style.bold?'900 ':'400 '}${fs}px "${tagFont}"`;
  ctx.font = fontStr;
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
    const isActive=selectedLayers&&selectedLayers.some(l=>l.type==='tag'&&l.index===i);
    if(isActive){ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.strokeRect(tx-3,ty-3,tw+6,tagH+6);ctx.setLineDash([]);}
    if(isOut){
      ctx.strokeStyle=col; ctx.lineWidth=2.5;
      if(['gaming_a','gaming_b'].includes(tid)){ctx.shadowColor=col;ctx.shadowBlur=8;}
      rr(ctx,tx,ty,tw,tagH,radius,true); ctx.shadowBlur=0;
      // text color uses style.color or tag color
      const tcolor = style.color || col;
      if(style.outline){ ctx.strokeStyle=style.outlineColor||'#fff'; ctx.lineWidth=style.outlineWidth||4; ctx.lineJoin='round'; ctx.font=fontStr; ctx.strokeText(tag,tx+tw/2,ty+tagH*.52); }
      ctx.fillStyle=tcolor; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(tag,tx+tw/2,ty+tagH*.52);
    } else {
      if(['gaming_a','gaming_b'].includes(tid)){ctx.shadowColor=col;ctx.shadowBlur=12;}
      ctx.fillStyle=col; rr(ctx,tx,ty,tw,tagH,radius); ctx.shadowBlur=0;
      const tcolor = style.color || '#ffffff';
      if(style.outline){ ctx.strokeStyle=style.outlineColor||'#333'; ctx.lineWidth=style.outlineWidth||4; ctx.lineJoin='round'; ctx.font=fontStr; ctx.strokeText(tag,tx+tw/2,ty+tagH*.52); }
      ctx.fillStyle=tcolor; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(tag,tx+tw/2,ty+tagH*.52);
    }
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

  // 文案
  const [logoText,setLogoText]=useState('馬尼通訊');
  const [brandText,setBrandText]=useState('官方授權店');
  const [promoText,setPromoText]=useState('GPLUS A6 智慧手機');
  const [tagsInput,setTagsInput]=useState('公司貨,18+6保固,資安認證');
  const [isAiDisclosure,setIsAiDisclosure]=useState(false);
  const [showLogo,setShowLogo]=useState(true);    // logoText 圖層
  const [showBrand,setShowBrand]=useState(true);  // brandText 圖層（獨立）
  const [showTitle,setShowTitle]=useState(true);
  const [showTags,setShowTags]=useState(true);

  // 字型
  const [titleFont,setTitleFont]=useState('Microsoft JhengHei');
  const [tagFont,setTagFont]=useState('Microsoft JhengHei');

  // 各元素文字樣式（顏色/粗斜體/描邊）
  const [logoStyle,setLogoStyle]=useState({...defaultTextStyle(), bold:true});
  const [brandStyle,setBrandStyle]=useState({...defaultTextStyle(), bold:true});
  const [titleStyle,setTitleStyle]=useState({...defaultTextStyle(), bold:true});
  const [tagTextStyle,setTagTextStyle]=useState({...defaultTextStyle(), bold:true});

  // 全域縮放（滑桿 max=600）
  const [productScale,setProductScale]=useState(100);
  const [brandScale,setBrandScale]=useState(100);
  const [textScale,setTextScale]=useState(100);
  const [tagScale,setTagScale]=useState(100);
  const [iconScale,setIconScale]=useState(30);

  // 位移（logo 和 brand 現在各自獨立）
  const [logoOffset,setLogoOffset]=useState({x:0,y:0});
  const [brandOffset,setBrandOffset]=useState({x:0,y:40});
  const [titleOffset,setTitleOffset]=useState({x:0,y:0});
  const [iconOffset,setIconOffset]=useState({x:150,y:-150});
  const [tagOffsets,setTagOffsets]=useState([]);
  const [rotations,setRotations]=useState({logo:0,brand:0,title:0,icon:0});

  // 圖層
  const [layerOrder,setLayerOrder]=useState(['deco','tags','title','logo','brand','icon']);
  const [tagCustomColors,setTagCustomColors]=useState({});
  const [lockedLayers,setLockedLayers]=useState({});
  const [tagShape,setTagShape]=useState('pill');
  const [customColors,setCustomColors]=useState(null);

  // 選取
  const [selectedLayers,setSelectedLayers]=useState([]);
  const [leftWidth,setLeftWidth]=useState(530);
  const [isDragActive,setIsDragActive]=useState(false);
  const [guideLines,setGuideLines]=useState({active:false});
  const [showHelp,setShowHelp]=useState(false);
  const [isDraftLoaded,setIsDraftLoaded]=useState(false);

  // 雲端
  const [gasUrl,setGasUrl]=useState('');
  const [projectName,setProjectName]=useState('馬尼樣板');
  const [isSaving,setIsSaving]=useState(false);
  const [isLoadingList,setIsLoadingList]=useState(false);
  const [cloudTemplates,setCloudTemplates]=useState([]);
  const [showLoadMenu,setShowLoadMenu]=useState(false);
  const [cloudMsg,setCloudMsg]=useState({text:'',type:''});

  const histRef=useRef([]); const histIdx=useRef(-1);
  const hb=useRef({products:{},logo:null,brand:null,title:null,icon:null,tags:[],deco:null});
  const drag=useRef({isDragging:false,targets:[],startX:0,startY:0,ios:[]});

  const activeLayer=selectedLayers.length===1?selectedLayers[0]:null;
  const isMulti=selectedLayers.length>1;
  const baseTpl=ALL_TEMPLATES[templateId]||ALL_TEMPLATES['phone_a'];
  const tpl=customColors?{...baseTpl,...customColors}:baseTpl;
  const compliance=(()=>{const f=BANNED_WORDS.filter(w=>(promoText+tagsInput).includes(w));return{safe:!f.length,words:f};})();

  // ── Snapshot ──
  const buildSnap=()=>({
    products,templateId,activeCategory,platform,removeBg,
    logoText,brandText,promoText,tagsInput,isAiDisclosure,tagShape,
    showLogo,showBrand,showTitle,showTags,
    titleFont,tagFont,
    logoStyle,brandStyle,titleStyle,tagTextStyle,
    productScale,brandScale,textScale,tagScale,iconScale,
    logoOffset,brandOffset,titleOffset,iconOffset,tagOffsets,rotations,
    layerOrder,tagCustomColors,customColors,iconImage
  });
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
    setShowLogo(s.showLogo!==false); setShowBrand(s.showBrand!==false); setShowTitle(s.showTitle!==false); setShowTags(s.showTags!==false);
    setTitleFont(s.titleFont||'Microsoft JhengHei'); setTagFont(s.tagFont||'Microsoft JhengHei');
    setLogoStyle(s.logoStyle||{...defaultTextStyle(),bold:true});
    setBrandStyle(s.brandStyle||{...defaultTextStyle(),bold:true});
    setTitleStyle(s.titleStyle||{...defaultTextStyle(),bold:true});
    setTagTextStyle(s.tagTextStyle||{...defaultTextStyle(),bold:true});
    setProductScale(s.productScale||100); setBrandScale(s.brandScale||100); setTextScale(s.textScale||100);
    setTagScale(s.tagScale||100); setIconScale(s.iconScale||30);
    setLogoOffset(s.logoOffset||{x:0,y:0}); setBrandOffset(s.brandOffset||{x:0,y:40});
    setTitleOffset(s.titleOffset||{x:0,y:0}); setIconOffset(s.iconOffset||{x:150,y:-150});
    setTagOffsets(s.tagOffsets||[]); setRotations(s.rotations||{logo:0,brand:0,title:0,icon:0});
    setLayerOrder(s.layerOrder||['deco','tags','title','logo','brand','icon']);
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
    const key=localStorage.getItem('ManiFactory_RemoveBg_Key'); if(key) setRemoveBgApiKey(key);
    const curM=new Date().toISOString().slice(0,7);
    if(localStorage.getItem('ManiFactory_RemoveBg_Month')!==curM){localStorage.setItem('ManiFactory_RemoveBg_Month',curM);localStorage.setItem('ManiFactory_RemoveBg_Count','0');setBgRemovalCount(0);}
    else setBgRemovalCount(parseInt(localStorage.getItem('ManiFactory_RemoveBg_Count')||'0',10));
  },[]);

  useEffect(()=>{
    if(!isDraftLoaded)return;
    const t=setTimeout(()=>saveDraft(buildSnap()),1200);
    return()=>clearTimeout(t);
  },[isDraftLoaded,products,templateId,activeCategory,platform,removeBg,logoText,brandText,promoText,tagsInput,isAiDisclosure,tagShape,showLogo,showBrand,showTitle,showTags,titleFont,tagFont,logoStyle,brandStyle,titleStyle,tagTextStyle,productScale,brandScale,textScale,tagScale,iconScale,logoOffset,brandOffset,titleOffset,iconOffset,tagOffsets,rotations,layerOrder,tagCustomColors,customColors,iconImage]);

  useEffect(()=>{if(histRef.current.length===0)saveSnap();},[]);

  useEffect(()=>{
    const cnt=tagsInput.split(',').filter(t=>t.trim()).length;
    setTagOffsets(p=>{if(p.length>=cnt)return p;const n=[...p];while(n.length<cnt)n.push({x:0,y:0});return n;});
  },[tagsInput]);

  // ── 鍵盤 ──
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
          if(selectedLayers.some(l=>l.type==='logo'))setLogoOffset(o=>({x:o.x+dx,y:o.y+dy}));
          if(selectedLayers.some(l=>l.type==='brand'))setBrandOffset(o=>({x:o.x+dx,y:o.y+dy}));
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
    }catch(err){alert('Remove.bg: '+err.message);setProducts(p=>p.map(pr=>pr.id===prodId?{...pr,isRemovingBg:false}:pr));}
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
    hb.current={products:{},logo:null,brand:null,title:null,icon:null,tags:[],deco:null};
    const loadImg=src=>new Promise(res=>{if(!src)return res(null);const img=new Image();img.crossOrigin='Anonymous';img.onload=()=>res(img);img.onerror=()=>res(null);img.src=src;});

    (async()=>{
      ctx.clearRect(0,0,W,H);
      const pCfg=PLATFORMS[platform];
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
      if(pCfg.allowDesign) drawBg(ctx,W,H,templateId,tpl);

      const lprod={};
      for(const p of products)lprod[p.id]=p.src?await loadImg(p.src):null;
      const iImg=iconImage?await loadImg(iconImage):null;
      const isDark=tpl.mode==='dark';

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

      // ── 品牌名圖層（logoText）── 膠囊徽章，獨立可拖曳
      const drawLogoLayer=()=>{
        if(!showLogo||!logoText) return;
        const bs=(brandScale||100)/100;
        const sz=Math.round(20*bs*(logoStyle.scale||100)/100);
        const fontStr=`${logoStyle.italic?'italic ':''} ${logoStyle.bold?'900 ':'400 '}${sz}px "${titleFont}"`;
        ctx.font=fontStr;
        const tw=ctx.measureText(logoText).width;
        const ph=Math.round(46*bs), pw=tw+Math.round(56*bs), r=ph/2;
        const isGaming=['gaming_a','gaming_b'].includes(templateId);
        const fallbackBg=tpl.primary;
        const fallbackText='#ffffff';

        let cx,cy;
        if(isGaming){
          cx=42+logoOffset.x; cy=50*bs+logoOffset.y;
          const hitX=cx, hitY=cy-sz, hitW=tw+20, hitH=sz+10;
          withSel('logo',undefined,hitX,hitY,hitW,hitH,rotations.logo,(c,dx,dy,dw,dh)=>{
            const bgColor=logoStyle.color||fallbackBg;
            c.fillStyle=bgColor; c.shadowColor=bgColor; c.shadowBlur=8;
            if(logoStyle.outline){c.strokeStyle=logoStyle.outlineColor||'#fff';c.lineWidth=logoStyle.outlineWidth||4;c.lineJoin='round';c.font=fontStr;c.strokeText(logoText,dx+dw/2,dy+dh*.75);}
            c.fillText(logoText,dx+dw/2,dy+dh*.75); c.shadowBlur=0;
          });
          hb.current.logo={x:hitX,y:hitY,w:hitW,h:hitH};
        } else {
          const bx=(W-pw)/2+logoOffset.x, by=14+logoOffset.y;
          withSel('logo',undefined,bx,by,pw,ph,rotations.logo,(c,dx,dy,dw,dh)=>{
            const bgColor=logoStyle.color||fallbackBg;
            c.fillStyle=bgColor; rr(c,dx,dy,dw,dh,r);
            // text
            const tColor=fallbackText;
            c.font=fontStr;
            if(logoStyle.outline){c.strokeStyle=logoStyle.outlineColor||'rgba(0,0,0,0.4)';c.lineWidth=logoStyle.outlineWidth||3;c.lineJoin='round';c.strokeText(logoText,dx+dw/2,dy+dh*.65);}
            c.fillStyle=tColor; c.textAlign='center'; c.textBaseline='middle'; c.fillText(logoText,dx+dw/2,dy+dh/2); c.textBaseline='alphabetic'; c.textAlign='left';
          });
          hb.current.logo={x:bx,y:by,w:pw,h:ph};
        }
      };

      // ── 副文字圖層（brandText）── 小標籤，獨立可拖曳
      const drawBrandLayer=()=>{
        if(!showBrand||!brandText) return;
        const bs=(brandScale||100)/100;
        const sz=Math.round(16*bs*(brandStyle.scale||100)/100);
        const fontStr=`${brandStyle.italic?'italic ':''} ${brandStyle.bold?'700 ':'400 '}${sz}px "${titleFont}"`;
        ctx.font=fontStr;
        const tw=ctx.measureText(brandText).width;
        const ph=Math.round(32*bs), pw=tw+Math.round(36*bs), rr2=6;
        const isGaming=['gaming_a','gaming_b'].includes(templateId);
        const bx=(W/2-pw/2)+brandOffset.x;
        const by=isGaming ? 80*bs+brandOffset.y : 68+brandOffset.y;

        withSel('brand',undefined,bx,by,pw,ph,rotations.brand,(c,dx,dy,dw,dh)=>{
          const bgColor=brandStyle.color||h2r(tpl.primary,.25);
          c.fillStyle=bgColor; rr(c,dx,dy,dw,dh,rr2);
          const tColor = brandStyle.color ? '#ffffff' : (isDark?'#ffffff':tpl.primary);
          if(brandStyle.outline){c.strokeStyle=brandStyle.outlineColor||'#fff';c.lineWidth=brandStyle.outlineWidth||3;c.lineJoin='round';c.font=fontStr;c.strokeText(brandText,dx+dw/2,dy+dh*.7);}
          c.fillStyle=tColor; c.textAlign='center'; c.textBaseline='middle'; c.fillText(brandText,dx+dw/2,dy+dh/2); c.textBaseline='alphabetic'; c.textAlign='left';
        });
        hb.current.brand={x:bx,y:by,w:pw,h:ph};
      };

      // ── 主標題圖層 ──
      const drawTitleLayer=()=>{
        if(!showTitle||!promoText) return;
        const ts=(textScale||100)/100;
        const sz=Math.round(36*ts*(titleStyle.scale||100)/100);
        const isGaming=['gaming_a','gaming_b'].includes(templateId);
        const fontStr=`${titleStyle.italic?'italic ':''} ${titleStyle.bold?'900 ':'400 '}${sz}px "${titleFont}"`;
        ctx.font=fontStr;
        const tw=ctx.measureText(promoText).width, th=sz+10;
        const bx=(templateId==='accessory_a')?W*.42+titleOffset.x:W/2+titleOffset.x-tw/2;
        const by=H-185+titleOffset.y;

        withSel('title',undefined,bx,by,tw,th,rotations.title,(c,dx,dy,dw,dh)=>{
          const fallbackCol=isDark?'#ffffff':tpl.textCol;
          const tColor=titleStyle.color||fallbackCol;
          c.font=fontStr;
          if(titleStyle.outline){
            c.strokeStyle=titleStyle.outlineColor||'#ffffff';
            c.lineWidth=titleStyle.outlineWidth||8;
            c.lineJoin='round';
            c.textAlign=(templateId==='accessory_a')?'left':'center';
            c.textBaseline='middle';
            c.strokeText(promoText,dx+(templateId==='accessory_a'?0:dw/2),dy+dh/2);
          }
          if(isDark&&!titleStyle.color){
            const tg=c.createLinearGradient(0,dy,0,dy+dh);
            tg.addColorStop(0,'#fff'); tg.addColorStop(1,h2r(tpl.accent,.85)); c.fillStyle=tg;
            if(isGaming){c.shadowColor=tpl.accent;c.shadowBlur=12;}
          } else { c.fillStyle=tColor; }
          c.textAlign=(templateId==='accessory_a')?'left':'center';
          c.textBaseline='middle';
          c.fillText(promoText,dx+(templateId==='accessory_a'?0:dw/2),dy+dh/2);
          c.shadowBlur=0; c.textBaseline='alphabetic'; c.textAlign='left';
        });
        hb.current.title={x:bx,y:by,w:tw,h:th};
      };

      layerOrder.forEach(lid=>{
        if(lid==='deco'){hb.current.deco={key:'frame',x:14,y:14,w:W-28,h:H-28};}
        else if(lid.startsWith('prod_')){const p=products.find(pr=>pr.id===lid);if(p)drawProd(p);}
        else if(lid==='logo'&&pCfg.allowDesign) drawLogoLayer();
        else if(lid==='brand'&&pCfg.allowDesign) drawBrandLayer();
        else if(lid==='title'&&pCfg.allowDesign) drawTitleLayer();
        else if(lid==='tags'&&pCfg.allowDesign){
          hb.current.tags=drawTagLayer(ctx,W,H,templateId,tpl,{tagsInput,tagScale,tagOffsets,tagShape,tagCustomColors,showTags,tagFont,selectedLayers,tagTextStyle});
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
  },[products,iconImage,platform,templateId,tpl,logoText,brandText,promoText,tagsInput,isAiDisclosure,removeBg,productScale,brandScale,textScale,tagScale,tagShape,showLogo,showBrand,showTitle,showTags,titleFont,tagFont,iconScale,logoOffset,brandOffset,titleOffset,iconOffset,tagOffsets,selectedLayers,rotations,guideLines,layerOrder,tagCustomColors,customColors,logoStyle,brandStyle,titleStyle,tagTextStyle]);

  // ── 滑鼠 ──
  const gp=e=>{const r=canvasRef.current.getBoundingClientRect();return{x:(e.clientX-r.left)*canvasRef.current.width/r.width,y:(e.clientY-r.top)*canvasRef.current.height/r.height};};
  const ch=(x,y,b)=>b&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
  const same=(l1,l2)=>{if(l1.type!==l2.type)return false;if(l1.type==='product')return l1.id===l2.id;if(l1.type==='tag')return l1.index===l2.index;return true;};
  const isSel=l=>selectedLayers.some(s=>same(s,l));

  const startDrag=(layers,sx,sy)=>{
    const ios=layers.map(l=>{
      if(l.type==='product'){const p=products.find(pr=>pr.id===l.id);return p?p.offset:{x:0,y:0};}
      if(l.type==='logo')return logoOffset; if(l.type==='brand')return brandOffset;
      if(l.type==='title')return titleOffset; if(l.type==='icon')return iconOffset;
      if(l.type==='tag')return tagOffsets[l.index]||{x:0,y:0}; return{x:0,y:0};
    });
    drag.current={isDragging:true,targets:layers,startX:sx,startY:sy,ios};
  };

  const handleMouseDown=e=>{
    const{x,y}=gp(e); const b=hb.current; let hit=null;
    for(const lid of [...layerOrder].reverse()){
      if(lid==='icon'&&!lockedLayers.icon&&iconImage&&ch(x,y,b.icon)){hit={type:'icon'};break;}
      if(lid==='logo'&&!lockedLayers.logo&&showLogo&&ch(x,y,b.logo)){hit={type:'logo'};break;}
      if(lid==='brand'&&!lockedLayers.brand&&showBrand&&ch(x,y,b.brand)){hit={type:'brand'};break;}
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
      const pu={};let lO=logoOffset,brO=brandOffset,tO=titleOffset,iO=iconOffset,taO=[...tagOffsets];
      targets.forEach((t,i)=>{const nx=ios[i].x+adx,ny=ios[i].y+ady;
        if(t.type==='product')pu[t.id]={x:nx,y:ny};
        else if(t.type==='logo')lO={x:nx,y:ny};
        else if(t.type==='brand')brO={x:nx,y:ny};
        else if(t.type==='title')tO={x:nx,y:ny};
        else if(t.type==='icon')iO={x:nx,y:ny};
        else if(t.type==='tag')taO[t.index]={x:nx,y:ny};
      });
      if(Object.keys(pu).length)setProducts(p=>p.map(pr=>pu[pr.id]?{...pr,offset:pu[pr.id]}:pr));
      if(targets.some(t=>t.type==='logo'))setLogoOffset(lO);
      if(targets.some(t=>t.type==='brand'))setBrandOffset(brO);
      if(targets.some(t=>t.type==='title'))setTitleOffset(tO);
      if(targets.some(t=>t.type==='icon'))setIconOffset(iO);
      if(targets.some(t=>t.type==='tag'))setTagOffsets(taO);
      canvasRef.current.style.cursor='grabbing'; return;
    }
    const b=hb.current;let hov=false;
    for(const lid of [...layerOrder].reverse()){
      if(lid==='icon'&&iconImage&&ch(x,y,b.icon)){hov=true;break;}
      if(lid==='logo'&&showLogo&&ch(x,y,b.logo)){hov=true;break;}
      if(lid==='brand'&&showBrand&&ch(x,y,b.brand)){hov=true;break;}
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
      setRotations(r=>{const n={...r};selectedLayers.forEach(l=>{if(['logo','brand','title','icon'].includes(l.type))n[l.type]=(n[l.type]||0)+d;});return n;});
    }
  };

  const moveUp=id=>{const i=layerOrder.indexOf(id);if(i<layerOrder.length-1){const n=[...layerOrder];[n[i],n[i+1]]=[n[i+1],n[i]];setLayerOrder(n);setTimeout(saveSnap,50);}};
  const moveDown=id=>{const i=layerOrder.indexOf(id);if(i>0){const n=[...layerOrder];[n[i],n[i-1]]=[n[i-1],n[i]];setLayerOrder(n);setTimeout(saveSnap,50);}};
  const toggleLock=id=>setLockedLayers(p=>({...p,[id]:!p[id]}));

  const resetAll=()=>{
    setLogoOffset({x:0,y:0}); setBrandOffset({x:0,y:40}); setTitleOffset({x:0,y:0}); setIconOffset({x:150,y:-150});
    setTagOffsets(tagOffsets.map(()=>({x:0,y:0})));
    setProducts(p=>p.map(pr=>({...pr,offset:{x:0,y:0},rotation:0})));
    setRotations({logo:0,brand:0,title:0,icon:0});
    setLayerOrder(['deco',...products.map(p=>p.id),'tags','title','logo','brand','icon']);
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
    catch(e){alert('匯出失敗');}
  };

  const pCfg=PLATFORMS[platform];
  const catTpls=CATEGORIES[activeCategory].templates;
  const alid=activeLayer?.id||activeLayer?.type;

  // ── 文字樣式編輯器子元件 ──
  const TextStyleEditor=({label,style,setStyle})=>(
    <div style={{background:'#f8fafc',borderRadius:8,padding:'10px 10px',border:'1px solid #e2e8f0',marginTop:6}}>
      <div style={{fontSize:9,fontWeight:800,color:'#64748b',marginBottom:7,textTransform:'uppercase',letterSpacing:.5}}>{label} 文字樣式</div>
      <div style={{display:'flex',gap:6,marginBottom:7,alignItems:'center'}}>
        {/* 顏色 */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
          <input type="color" value={style.color||'#ffffff'} onChange={e=>setStyle(s=>({...s,color:e.target.value}))} onBlur={saveSnap} style={{width:30,height:30,borderRadius:6,border:'2px solid #e2e8f0',padding:2,cursor:'pointer'}} />
          <span style={{fontSize:8,color:'#94a3b8'}}>顏色</span>
        </div>
        {/* 縮放 */}
        <div style={{flex:1}}>
          <div style={{fontSize:9,color:'#64748b',marginBottom:2}}>個別縮放 {style.scale||100}%</div>
          <input type="range" min={50} max={300} value={style.scale||100} onChange={e=>setStyle(s=>({...s,scale:Number(e.target.value)}))} onMouseUp={saveSnap} style={{width:'100%',accentColor:tpl.primary}} />
        </div>
      </div>
      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
        {/* 粗體 */}
        <ToggleChip active={style.bold} onClick={()=>{setStyle(s=>({...s,bold:!s.bold}));saveSnap();}}>B 粗體</ToggleChip>
        {/* 斜體 */}
        <ToggleChip active={style.italic} onClick={()=>{setStyle(s=>({...s,italic:!s.italic}));saveSnap();}}>I 斜體</ToggleChip>
        {/* 描邊開關 */}
        <ToggleChip active={style.outline} onClick={()=>{setStyle(s=>({...s,outline:!s.outline}));saveSnap();}}>✏️ 加框</ToggleChip>
      </div>
      {style.outline&&(
        <div style={{marginTop:8,display:'flex',gap:8,alignItems:'center',background:'#fff',padding:'7px 8px',borderRadius:7,border:'1px solid #e2e8f0'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <input type="color" value={style.outlineColor||'#ffffff'} onChange={e=>setStyle(s=>({...s,outlineColor:e.target.value}))} onBlur={saveSnap} style={{width:28,height:28,borderRadius:6,border:'2px solid #e2e8f0',padding:2,cursor:'pointer'}} />
            <span style={{fontSize:8,color:'#94a3b8'}}>框色</span>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:'#64748b',marginBottom:2}}>框寬 {style.outlineWidth||6}px</div>
            <input type="range" min={1} max={30} value={style.outlineWidth||6} onChange={e=>setStyle(s=>({...s,outlineWidth:Number(e.target.value)}))} onMouseUp={saveSnap} style={{width:'100%',accentColor:'#f97316'}} />
          </div>
        </div>
      )}
    </div>
  );

  // ── 右側屬性面板 ──
  const renderCtx=()=>{
    if(isMulti) return(
      <PC title={`多選（${selectedLayers.length} 個）`}>
        <p style={{fontSize:11,color:'#64748b',marginBottom:8,lineHeight:1.6}}>可拖曳或鍵盤方向鍵同時移動所有選取圖層。</p>
        {selectedLayers.some(l=>l.type==='product')&&<SR label="統一縮放商品" min={10} max={600} val={100} onChange={v=>setProducts(p=>p.map(pr=>selectedLayers.some(l=>l.type==='product'&&l.id===pr.id)?{...pr,scale:v}:pr))} onUp={saveSnap} color={tpl.primary} />}
        <DB onClick={()=>{const ids=selectedLayers.filter(l=>l.type==='product').map(l=>l.id);setProducts(p=>p.filter(pr=>!ids.includes(pr.id)));setLayerOrder(p=>p.filter(l=>!ids.includes(l)));setSelectedLayers([]);saveSnap();}}>🗑️ 刪除選取商品</DB>
      </PC>
    );
    if(!activeLayer)return null;
    return(
      <PC title={
        activeLayer.type==='product'?'📦 商品圖層':
        activeLayer.type==='logo'?'🏷️ 品牌名稱':
        activeLayer.type==='brand'?'🔖 副文字標籤':
        activeLayer.type==='title'?'✏️ 主標題':
        activeLayer.type==='tag'?`🏷️ 標籤 #${activeLayer.index+1}`:
        activeLayer.type==='icon'?'🌟 圖示':'🖼️ 裝飾'
      }>
        <div style={{display:'flex',gap:5,marginBottom:8}}>
          <button onClick={()=>moveUp(alid)} disabled={layerOrder.indexOf(alid)===layerOrder.length-1} style={sb(layerOrder.indexOf(alid)===layerOrder.length-1)}>⬆️ 上移</button>
          <button onClick={()=>moveDown(alid)} disabled={layerOrder.indexOf(alid)===0} style={sb(layerOrder.indexOf(alid)===0)}>⬇️ 下移</button>
          <button onClick={()=>toggleLock(alid)} style={{...sb(false),borderColor:lockedLayers[alid]?'#fca5a5':'#e2e8f0',background:lockedLayers[alid]?'#fef2f2':'#fff',color:lockedLayers[alid]?'#dc2626':'#64748b'}}>{lockedLayers[alid]?'🔒':'🔓'}</button>
        </div>

        {activeLayer.type==='product'&&(()=>{const prod=products.find(p=>p.id===activeLayer.id);if(!prod)return null;return(<>
          <SR label={`縮放 ${prod.scale}%`} min={10} max={600} val={prod.scale} onChange={v=>setProducts(p=>p.map(pr=>pr.id===prod.id?{...pr,scale:v}:pr))} onUp={saveSnap} color={tpl.primary} />
          <LT label="立體陰影" checked={prod.shadow!==false} onChange={v=>{setProducts(p=>p.map(pr=>pr.id===prod.id?{...pr,shadow:v}:pr));saveSnap();}} />
          {enableRemoveBgApi&&removeBgApiKey&&!prod.isRemovingBg&&<button onClick={()=>execRmBg(prod.id,prod.rawSrc)} style={{width:'100%',padding:'7px',margin:'5px 0',borderRadius:8,border:'none',background:'#7c3aed',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:11}}>✨ AI 去背此圖</button>}
          <DB onClick={()=>{setProducts(p=>p.filter(pr=>pr.id!==prod.id));setLayerOrder(p=>p.filter(l=>l!==prod.id));setSelectedLayers([]);saveSnap();}}>🗑️ 刪除此商品</DB>
        </>);})()}

        {activeLayer.type==='logo'&&<>
          <div style={{marginBottom:6}}><div style={lb}>品牌名稱文字</div><LI value={logoText} onChange={setLogoText} onBlur={saveSnap} placeholder="品牌名" /></div>
          <TextStyleEditor label="品牌名" style={logoStyle} setStyle={setLogoStyle} />
        </>}

        {activeLayer.type==='brand'&&<>
          <div style={{marginBottom:6}}><div style={lb}>副文字內容</div><LI value={brandText} onChange={setBrandText} onBlur={saveSnap} placeholder="副文字" /></div>
          <TextStyleEditor label="副文字" style={brandStyle} setStyle={setBrandStyle} />
        </>}

        {activeLayer.type==='title'&&<>
          <div style={{marginBottom:6}}><div style={lb}>主標題內容</div><LI value={promoText} onChange={setPromoText} onBlur={saveSnap} placeholder="商品主標題" /></div>
          <TextStyleEditor label="主標題" style={titleStyle} setStyle={setTitleStyle} />
          <SR label={`全域標題縮放 ${textScale}%`} min={30} max={600} val={textScale} onChange={setTextScale} onUp={saveSnap} color={tpl.primary} />
        </>}

        {activeLayer.type==='tag'&&<>
          <div style={{marginBottom:6,fontSize:10,color:'#2563eb',fontWeight:700,background:'#eff6ff',padding:'5px 9px',borderRadius:6}}>第 {activeLayer.index+1} 個標籤</div>
          <div style={{marginBottom:8}}><div style={lb}>標籤背景色</div><div style={{display:'flex',alignItems:'center',gap:8}}>
            <input type="color" value={tagCustomColors[activeLayer.index]||tpl.accent} onChange={e=>setTagCustomColors(p=>({...p,[activeLayer.index]:e.target.value}))} onBlur={saveSnap} style={{width:32,height:32,borderRadius:8,border:'2px solid #e2e8f0',padding:2,cursor:'pointer'}} />
            <button onClick={()=>{setTagCustomColors(p=>{const n={...p};delete n[activeLayer.index];return n;});setTimeout(saveSnap,50);}} style={{fontSize:10,color:'#64748b',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',fontFamily:'inherit'}}>重置</button>
          </div></div>
          <TextStyleEditor label="標籤文字" style={tagTextStyle} setStyle={setTagTextStyle} />
          <SR label={`標籤全域縮放 ${tagScale}%`} min={30} max={600} val={tagScale} onChange={setTagScale} onUp={saveSnap} color={tpl.accent} />
        </>}

        {activeLayer.type==='icon'&&<>
          <SR label={`圖示大小 ${iconScale}%`} min={10} max={200} val={iconScale} onChange={setIconScale} onUp={saveSnap} color={tpl.primary} />
          <DB onClick={()=>{setIconImage(null);setSelectedLayers([]);saveSnap();}}>🗑️ 刪除圖示</DB>
        </>}
      </PC>
    );
  };

  return(
    <div style={{display:'flex',height:'100vh',fontFamily:'"Microsoft JhengHei",sans-serif',background:'#f0f4f8',overflow:'hidden'}}>

      {/* ══ 左側面板 ══ */}
      <div style={{width:leftWidth,background:'#fff',display:'flex',flexDirection:'column',boxShadow:'4px 0 20px rgba(0,0,0,0.08)',zIndex:10,flexShrink:0,borderRight:'1px solid #e2e8f0',overflow:'hidden'}}>

        <div style={{background:`linear-gradient(135deg,${tpl.primary},${tpl.accent})`,padding:'13px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <span style={{fontSize:20}}>🖼️</span>
            <div><div style={{fontSize:14,fontWeight:800,color:'#fff'}}>馬尼通訊製圖工廠</div><div style={{fontSize:9,color:'rgba(255,255,255,0.65)'}}>V5.1 · 文字樣式系統</div></div>
          </div>
          <div style={{display:'flex',gap:3,background:'rgba(0,0,0,0.2)',borderRadius:8,padding:3}}>
            <button onClick={handleUndo} style={hb2} title="Ctrl+Z">↩️</button>
            <button onClick={handleRedo} style={hb2} title="Ctrl+Y">↪️</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'11px 12px',display:'flex',flexDirection:'column',gap:8,background:'#f8fafc'}}>

          {(activeLayer||isMulti)&&<>
            <button onClick={()=>setSelectedLayers([])} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:20,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700,alignSelf:'flex-start'}}>← 返回總覽</button>
            {renderCtx()}
          </>}

          {!activeLayer&&!isMulti&&<>

            <PC title="① 商品類別">
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
                {Object.entries(CATEGORIES).map(([id,cat])=>(
                  <button key={id} onClick={()=>{setActiveCategory(id);setTemplateId(Object.keys(cat.templates)[0]);setCustomColors(null);setTimeout(saveSnap,50);}} style={{padding:'7px 3px',borderRadius:9,border:'2px solid',cursor:'pointer',textAlign:'center',fontFamily:'inherit',borderColor:activeCategory===id?tpl.primary:'#e2e8f0',background:activeCategory===id?tpl.primary+'18':'#fff',color:activeCategory===id?tpl.primary:'#64748b',transition:'all .15s'}}>
                    <div style={{fontSize:17,marginBottom:2}}>{cat.icon}</div>
                    <div style={{fontSize:9,fontWeight:700}}>{cat.name}</div>
                  </button>
                ))}
              </div>
            </PC>

            <PC title={`② ${CATEGORIES[activeCategory].name} 風格（2 組）`}>
              {Object.entries(catTpls).map(([tid,t])=>(
                <button key={tid} onClick={()=>{setTemplateId(tid);setCustomColors(null);setTimeout(saveSnap,50);}} style={{display:'flex',alignItems:'center',gap:9,padding:'10px 12px',borderRadius:9,border:'2px solid',cursor:'pointer',textAlign:'left',marginBottom:5,fontFamily:'inherit',width:'100%',borderColor:templateId===tid?tpl.primary:'#e2e8f0',background:templateId===tid?tpl.primary+'12':'#fff',transition:'all .15s'}}>
                  <div style={{display:'flex',gap:3,flexShrink:0}}>
                    {[t.primary,t.accent,t.bg].map((c,i)=><div key={i} style={{width:14,height:14,borderRadius:'50%',background:c,border:'1px solid rgba(0,0,0,0.08)'}} />)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:templateId===tid?tpl.primary:'#334155',fontFamily:'inherit'}}>{t.name}</div>
                    <div style={{fontSize:10,color:'#94a3b8',fontFamily:'inherit'}}>{t.desc}</div>
                  </div>
                  {templateId===tid&&<span style={{color:tpl.primary,fontWeight:900,fontSize:13}}>✓</span>}
                </button>
              ))}
            </PC>

            <PC title="③ 自訂配色">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7,marginBottom:7}}>
                {[['主色',tpl.primary,'primary'],['重點',tpl.accent,'accent'],['底色',tpl.bg,'bg']].map(([label,val,key])=>(
                  <div key={key} style={{textAlign:'center'}}>
                    <input type="color" value={val} onChange={e=>setCustomColors(p=>({...(p||{primary:tpl.primary,accent:tpl.accent,bg:tpl.bg,textCol:tpl.textCol,mode:tpl.mode}),[key]:e.target.value}))} onBlur={saveSnap} style={{width:32,height:32,borderRadius:'50%',border:'2px solid #e2e8f0',padding:2,cursor:'pointer',display:'block',margin:'0 auto 3px'}} />
                    <div style={{fontSize:9,color:'#64748b',fontWeight:600}}>{label}</div>
                  </div>
                ))}
              </div>
              {customColors&&<button onClick={()=>{setCustomColors(null);setTimeout(saveSnap,50);}} style={{width:'100%',padding:'4px',borderRadius:6,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700}}>↩ 恢復模板配色</button>}
            </PC>

            <PC title="④ 商品圖上傳（支援多圖）">
              <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 9px',background:'#f5f3ff',borderRadius:8,border:'1px solid #e9d5ff',marginBottom:7}}>
                <input type="checkbox" checked={enableRemoveBgApi} onChange={e=>setEnableRemoveBgApi(e.target.checked)} id="rbg" style={{accentColor:'#7c3aed'}} />
                <label htmlFor="rbg" style={{fontSize:11,fontWeight:700,color:'#6d28d9',cursor:'pointer'}}>✨ Remove.bg AI 去背</label>
              </div>
              {enableRemoveBgApi&&<div style={{marginBottom:7,padding:'7px 9px',background:'#faf5ff',borderRadius:8,border:'1px solid #e9d5ff'}}>
                <input type="password" placeholder="API Key" value={removeBgApiKey} onChange={e=>{setRemoveBgApiKey(e.target.value);localStorage.setItem('ManiFactory_RemoveBg_Key',e.target.value);}} style={{width:'100%',padding:'6px 8px',border:'1px solid #d8b4fe',borderRadius:6,fontSize:11,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}} />
                <div style={{fontSize:9,color:'#8b5cf6',marginTop:3}}>本月已去背 {bgRemovalCount} 次</div>
              </div>}
              <div onDrop={e=>{e.preventDefault();setIsDragActive(false);processUpload(e.dataTransfer.files);}} onDragOver={e=>{e.preventDefault();setIsDragActive(true);}} onDragLeave={()=>setIsDragActive(false)} onClick={()=>document.getElementById('img-upload').click()}
                style={{border:`2px dashed ${isDragActive?tpl.primary:'#bfdbfe'}`,borderRadius:10,padding:'13px',textAlign:'center',cursor:'pointer',background:isDragActive?tpl.primary+'10':'#f0f9ff',transition:'all .2s'}}>
                <input id="img-upload" type="file" multiple accept="image/*" style={{display:'none'}} onChange={e=>processUpload(e.target.files)} />
                <div style={{fontSize:22,marginBottom:2}}>📷</div>
                <div style={{fontSize:11,color:tpl.primary,fontWeight:600}}>點擊上傳或拖曳</div>
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
                  <button key={k} onClick={()=>{setPlatform(k);setTimeout(saveSnap,0);}} style={{padding:'7px 6px',borderRadius:9,border:'2px solid',cursor:'pointer',textAlign:'left',fontFamily:'inherit',borderColor:platform===k?p.color:'#e2e8f0',background:platform===k?p.color+'14':'#fff',transition:'all .15s'}}>
                    <div style={{fontSize:11,fontWeight:700,color:platform===k?p.color:'#334155'}}>{p.name}</div>
                    {!p.allowDesign&&<div style={{fontSize:9,color:'#ef4444'}}>強制純白底</div>}
                  </button>
                ))}
              </div>
              {!pCfg.allowDesign&&<div style={{marginTop:5,padding:'5px 9px',background:'#fef2f2',borderRadius:8,fontSize:10,color:'#dc2626',fontWeight:600}}>⚠️ 已自動隱藏設計元素</div>}
            </PC>

            {/* ⑥ 文案設定 — 品牌名+副文字各自獨立開關 */}
            <PC title="⑥ 文案設定（點擊圖層可編輯樣式）">
              <div style={{background:'#fffbeb',borderRadius:8,padding:'6px 9px',fontSize:10,color:'#92400e',marginBottom:8,border:'1px solid #fde68a'}}>
                💡 在右側畫布點擊文字元素，可設定顏色、粗斜體、加框等樣式
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                <ET label="🏷️ 品牌名稱（獨立圖層）" show={showLogo} onToggle={()=>{setShowLogo(!showLogo);saveSnap();}}>
                  <LI value={logoText} onChange={setLogoText} onBlur={saveSnap} placeholder="品牌名稱（如：馬尼通訊）" />
                </ET>
                <ET label="🔖 副文字標籤（獨立圖層）" show={showBrand} onToggle={()=>{setShowBrand(!showBrand);saveSnap();}}>
                  <LI value={brandText} onChange={setBrandText} onBlur={saveSnap} placeholder="副文字（如：官方授權店）" />
                </ET>
                <ET label="✏️ 主標題" show={showTitle} onToggle={()=>{setShowTitle(!showTitle);saveSnap();}}>
                  <LI value={promoText} onChange={setPromoText} onBlur={saveSnap} placeholder="商品主標題" />
                </ET>
                <ET label="🏷️ 特點標籤" show={showTags} onToggle={()=>{setShowTags(!showTags);saveSnap();}}>
                  <LI value={tagsInput} onChange={setTagsInput} onBlur={saveSnap} placeholder="標籤1,標籤2,標籤3" />
                  {tagsInput&&<div style={{marginTop:4,display:'flex',flexWrap:'wrap',gap:3}}>{tagsInput.split(',').map((t,i)=><span key={i} style={{padding:'2px 7px',borderRadius:10,fontSize:9,background:'#dbeafe',color:'#1d4ed8',fontWeight:700}}>{t.trim()}</span>)}</div>}
                </ET>
              </div>
              {!compliance.safe&&<div style={{marginTop:5,padding:'5px 9px',background:'#fef2f2',borderRadius:8,fontSize:10,color:'#dc2626',fontWeight:600}}>⚠️ 違禁詞：{compliance.words.join('、')}</div>}
            </PC>

            <PC title="⑦ 字型">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                <div><div style={lb}>標題/品牌字型</div><FS value={titleFont} onChange={v=>{setTitleFont(v);saveSnap();}} /></div>
                <div><div style={lb}>標籤字型</div><FS value={tagFont} onChange={v=>{setTagFont(v);saveSnap();}} /></div>
              </div>
            </PC>

            <PC title="⑧ 標籤形狀">
              <div style={{display:'flex',gap:5}}>
                {[['pill','💊 圓角'],['rect','▬ 方塊'],['outline','□ 線框']].map(([s,l])=>(
                  <button key={s} onClick={()=>{setTagShape(s);saveSnap();}} style={{flex:1,padding:'7px 3px',borderRadius:8,border:'2px solid',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700,borderColor:tagShape===s?tpl.primary:'#e2e8f0',background:tagShape===s?tpl.primary+'14':'#fff',color:tagShape===s?tpl.primary:'#64748b',transition:'all .15s'}}>{l}</button>
                ))}
              </div>
            </PC>

            <PC title="⑨ 全域大小調整（max 600%）">
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:5}}>
                <button onClick={resetAll} style={{padding:'4px 9px',borderRadius:6,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700}}>↩ 重置座標</button>
              </div>
              <SR label={`商品 ${productScale}%`} min={10} max={600} val={productScale} onChange={v=>{setProductScale(v);setProducts(p=>p.map(pr=>({...pr,scale:v})));}} onUp={saveSnap} color={tpl.primary} />
              <SR label={`標題 ${textScale}%`} min={10} max={600} val={textScale} onChange={setTextScale} onUp={saveSnap} color={tpl.primary} />
              <SR label={`標籤 ${tagScale}%`} min={10} max={600} val={tagScale} onChange={setTagScale} onUp={saveSnap} color={tpl.accent} />
              <SR label={`徽章 ${brandScale}%`} min={10} max={600} val={brandScale} onChange={setBrandScale} onUp={saveSnap} color={tpl.accent} />
            </PC>

            <PC title="⑩ 外部圖示 & AI 聲明">
              <label style={{display:'block',padding:'8px',textAlign:'center',border:'1px solid #e2e8f0',borderRadius:8,cursor:'pointer',fontSize:11,color:'#64748b',fontWeight:600,background:'#f8fafc',marginBottom:5}}>
                <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>setIconImage(ev.target.result);r.readAsDataURL(f);}}} style={{display:'none'}} />
                {iconImage?'✅ 已載入，點擊更換':'選擇透明 PNG 圖示'}
              </label>
              <LT label="AI Generated 聲明" checked={isAiDisclosure} onChange={v=>{setIsAiDisclosure(v);saveSnap();}} />
            </PC>

            <PC title="☁️ 雲端樣板中心">
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <input type="text" placeholder="GAS Web App 網址" value={gasUrl} onChange={e=>setGasUrl(e.target.value)} style={{padding:'7px 9px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:10,fontFamily:'inherit',outline:'none'}} />
                <div style={{display:'flex',gap:5}}>
                  <input type="text" placeholder="樣板名稱" value={projectName} onChange={e=>setProjectName(e.target.value)} style={{flex:1,padding:'6px 8px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:10,fontFamily:'inherit',outline:'none'}} />
                  <button onClick={saveToGAS} disabled={isSaving} style={{padding:'6px 10px',borderRadius:8,border:'none',background:'#059669',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:10,opacity:isSaving?.6:1}}>{isSaving?'⏳':'💾'}</button>
                  <button onClick={loadFromGAS} disabled={isLoadingList} style={{padding:'6px 10px',borderRadius:8,border:'none',background:'#2563eb',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:10,opacity:isLoadingList?.6:1}}>{isLoadingList?'⏳':'☁️'}</button>
                </div>
                {cloudMsg.text&&<div style={{padding:'5px 9px',borderRadius:8,fontSize:10,fontWeight:700,background:cloudMsg.type==='error'?'#fef2f2':cloudMsg.type==='success'?'#f0fdf4':'#eff6ff',color:cloudMsg.type==='error'?'#dc2626':cloudMsg.type==='success'?'#16a34a':'#2563eb'}}>{cloudMsg.text}</div>}
                {showLoadMenu&&cloudTemplates.length>0&&<div style={{border:'1px solid #e2e8f0',borderRadius:8,overflow:'hidden',maxHeight:140,overflowY:'auto'}}>
                  {cloudTemplates.map((t,i)=><div key={i} onClick={()=>{try{applySnap(t.parameters);}catch(e){}setShowLoadMenu(false);setTimeout(saveSnap,100);}} style={{padding:'7px 10px',cursor:'pointer',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',background:'#fff',fontSize:11}}>
                    <span style={{fontWeight:700,color:'#334155'}}>{t.projectName}</span><span style={{color:'#94a3b8',fontSize:9}}>{t.timestamp}</span>
                  </div>)}
                </div>}
              </div>
            </PC>

          </>}
        </div>

        <div style={{padding:'10px 12px',borderTop:'1px solid #e2e8f0',background:'#fff',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:7,padding:'5px 10px',borderRadius:8,background:compliance.safe?'#f0fdf4':'#fef2f2'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:compliance.safe?'#22c55e':'#ef4444'}} />
            <span style={{fontSize:10,fontWeight:700,color:compliance.safe?'#16a34a':'#dc2626'}}>{compliance.safe?'✅ 合規':` ⚠️ 違禁：${compliance.words.join('、')}`}</span>
          </div>
          <button onClick={handleDownload} disabled={!compliance.safe} style={{width:'100%',padding:'12px',borderRadius:11,border:'none',cursor:compliance.safe?'pointer':'not-allowed',fontFamily:'inherit',fontWeight:800,fontSize:12,background:compliance.safe?`linear-gradient(135deg,${tpl.primary},${tpl.accent})`:'#e2e8f0',color:compliance.safe?'#fff':'#94a3b8',boxShadow:compliance.safe?`0 4px 14px ${tpl.primary}55`:'none',transition:'all .2s'}}>
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
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:570,marginBottom:11}}>
          <div>
            <div style={{fontSize:17,fontWeight:900,color:'#1e293b'}}>即時預覽</div>
            <div style={{fontSize:11,color:'#64748b',marginTop:2}}>
              <span style={{color:tpl.primary,fontWeight:700}}>{CATEGORIES[activeCategory].icon} {CATEGORIES[activeCategory].name}</span> · {tpl.name} · {pCfg.name}
            </div>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <button onClick={()=>setShowHelp(true)} style={{padding:'5px 10px',borderRadius:20,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>❓ 說明</button>
            <div style={{padding:'4px 11px',borderRadius:20,fontSize:10,fontWeight:700,background:compliance.safe?'#dcfce7':'#fee2e2',color:compliance.safe?'#16a34a':'#dc2626'}}>{compliance.safe?'✅ 合規':'⚠️ 違禁'}</div>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:20,padding:11,boxShadow:'0 20px 60px rgba(0,0,0,0.1)',border:`2px solid ${tpl.primary}33`}}>
          <canvas ref={canvasRef} width={800} height={800} style={{display:'block',width:520,height:520,borderRadius:10}}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
        </div>

        <div style={{marginTop:10,display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',maxWidth:570}}>
          {[['🔍 圖+',()=>setProducts(p=>p.map(pr=>({...pr,scale:Math.min(600,(pr.scale||100)+15)})))],
            ['🔎 圖-',()=>setProducts(p=>p.map(pr=>({...pr,scale:Math.max(10,(pr.scale||100)-15)})))],
            ['🔡 字+',()=>setTextScale(v=>Math.min(600,v+15))],
            ['🔤 字-',()=>setTextScale(v=>Math.max(10,v-15))],
            ['🎯 重置',resetAll],
          ].map(([l,fn])=>(
            <button key={l} onClick={fn} style={{padding:'5px 10px',borderRadius:20,border:'1px solid #e2e8f0',background:'#fff',color:'#334155',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>{l}</button>
          ))}
        </div>

        {!pCfg.allowDesign&&<div style={{marginTop:8,padding:'7px 12px',borderRadius:10,maxWidth:530,width:'100%',background:'#fef3c7',border:'1px solid #fde68a',fontSize:11,color:'#92400e'}}><strong>📌 {pCfg.name}：</strong>已切換純白底。</div>}
        <div style={{marginTop:7,fontSize:10,color:'#94a3b8'}}>輸出 1000×1000px · PNG · V5.1</div>
      </div>

      {showHelp&&<div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:16}} onClick={()=>setShowHelp(false)}>
        <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:520,maxHeight:'72vh',overflow:'hidden',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f8fafc'}}>
            <div style={{fontSize:13,fontWeight:800,color:'#1e293b'}}>🖱️ 操作說明 V5.1</div>
            <button onClick={()=>setShowHelp(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:15,color:'#64748b'}}>✕</button>
          </div>
          <div style={{padding:13,overflowY:'auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['點擊文字元素','左側面板立即顯示該圖層的字型顏色、粗斜體、加框等樣式設定。'],['品牌名 & 副文字','兩個圖層完全獨立，可分別拖曳到不同位置。'],['加框描邊效果','點擊文字 → 開啟「✏️ 加框」→ 調整框色與框寬，可做出貼紙風。'],['多選 Shift+點','按住 Shift 點多個元素，可同時移動。'],['鍵盤微調','方向鍵 1px；Shift+方向鍵 10px。'],['旋轉','選取後 Shift+滾輪旋轉物件。'],['全域滑桿','最大 600%，適合超大版面填滿。'],['Ctrl+Z/Y','復原 / 重做。'],].map(([t,d])=>(
              <div key={t} style={{padding:'8px 9px',background:'#f8fafc',borderRadius:8,border:'1px solid #f1f5f9'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#1e293b',marginBottom:3}}>{t}</div>
                <div style={{fontSize:10,color:'#64748b',lineHeight:1.6}}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{padding:'9px 14px',borderTop:'1px solid #f1f5f9',textAlign:'center'}}>
            <button onClick={()=>setShowHelp(false)} style={{padding:'7px 24px',borderRadius:9,border:'none',background:'#1e293b',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:12}}>了解</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

// ── 共用 ─────────────────────────────────────────────────────────────────────
const lb={fontSize:9,fontWeight:700,color:'#64748b',marginBottom:3,display:'block'};
const hb2={padding:'5px 7px',background:'none',border:'none',color:'#fff',cursor:'pointer',borderRadius:5,fontSize:12,fontWeight:700};
const sb=disabled=>({flex:1,padding:'5px 3px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:disabled?'not-allowed':'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700,color:'#334155',opacity:disabled?.3:1});
function PC({title,children}){return(<div style={{background:'#fff',borderRadius:11,padding:'10px 11px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',border:'1px solid #f1f5f9'}}>{title&&<div style={{fontSize:9,fontWeight:800,color:'#64748b',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>{title}</div>}{children}</div>);}
function LI({value,onChange,onBlur,placeholder,style={}}){return(<input value={value} onChange={e=>onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} style={{width:'100%',padding:'6px 8px',border:'1.5px solid #e2e8f0',borderRadius:7,fontSize:11,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#f8fafc',color:'#1e293b',...style}} />);}
function LT({label,checked,onChange,style={}}){return(<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 0',...style}}><span style={{fontSize:11,color:'#475569',fontWeight:600}}>{label}</span><div onClick={()=>onChange(!checked)} style={{width:32,height:18,borderRadius:9,cursor:'pointer',background:checked?'#2563eb':'#cbd5e1',position:'relative',transition:'background .2s',flexShrink:0}}><div style={{position:'absolute',top:2,left:checked?15:2,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/></div></div>);}
function SR({label,min,max,val,onChange,onUp,color}){return(<div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:600,color:'#475569',marginBottom:3}}>{label}</div><input type="range" min={min} max={max} value={val} onChange={e=>onChange(Number(e.target.value))} onMouseUp={onUp} style={{width:'100%',accentColor:color||'#2563eb',cursor:'pointer'}}/></div>);}
function ET({label,show,onToggle,children}){return(<div style={{borderRadius:9,border:`1.5px solid ${show?'#bfdbfe':'#e2e8f0'}`,background:show?'#f0f9ff':'#fff',overflow:'hidden'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',cursor:'pointer'}} onClick={onToggle}><span style={{fontSize:11,fontWeight:700,color:show?'#1d4ed8':'#94a3b8'}}>{show?'👁️':'🚫'} {label}</span><div style={{width:28,height:16,borderRadius:8,background:show?'#2563eb':'#cbd5e1',position:'relative',flexShrink:0}}><div style={{position:'absolute',top:2,left:show?13:2,width:12,height:12,borderRadius:'50%',background:'#fff',transition:'left .18s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/></div></div>{show&&<div style={{padding:'0 10px 8px'}}>{children}</div>}</div>);}
function DB({onClick,children}){return(<button onClick={onClick} style={{width:'100%',padding:'6px',marginTop:5,borderRadius:8,border:'1px solid #fca5a5',background:'#fef2f2',color:'#dc2626',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:11}}>{children}</button>);}
function FS({value,onChange}){return(<select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'5px 6px',border:'1.5px solid #e2e8f0',borderRadius:7,fontSize:11,fontFamily:'inherit',outline:'none'}}><option value="Microsoft JhengHei">微軟正黑體</option><option value="Arial">Arial</option><option value="sans-serif">黑體</option><option value="serif">明體</option></select>);}
function ToggleChip({active,onClick,children}){return(<button onClick={onClick} style={{padding:'4px 9px',borderRadius:20,border:`1.5px solid ${active?'#2563eb':'#e2e8f0'}`,background:active?'#2563eb':'#fff',color:active?'#fff':'#64748b',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>{children}</button>);}
