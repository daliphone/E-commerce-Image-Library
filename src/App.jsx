import React, { useState, useRef, useEffect } from 'react';

// ─── IndexedDB ────────────────────────────────────────────────────────────────
const DB_NAME = 'MoneyFactoryDB_V8';
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current_draft';
const initDB = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB_NAME, 1);
  r.onupgradeneeded = e => { if (!e.target.result.objectStoreNames.contains(STORE_NAME)) e.target.result.createObjectStore(STORE_NAME); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const saveDraft = async (s) => {
  try {
    const db = await initDB();
    db.transaction(STORE_NAME,'readwrite').objectStore(STORE_NAME).put(s, DRAFT_KEY);
  } catch(e){}
  // localStorage 備份（排除 products 圖片 base64，只存設定值）
  try {
    const {products, iconImage, ...light} = s;
    localStorage.setItem('MoneyEC_draft_light', JSON.stringify(light));
    localStorage.setItem('MoneyEC_has_draft', '1');
  } catch(e){}
};
const loadDraft = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME,'readonly');
    const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY);
    const result = await new Promise(res => { req.onsuccess = () => res(req.result ?? null); req.onerror = () => res(null); });
    if (result) return result;
    // IndexedDB 讀不到時，退回 localStorage 輕量備份（無圖片）
    const light = localStorage.getItem('MoneyEC_draft_light');
    if (light) return JSON.parse(light);
    return null;
  } catch(e){
    try {
      const light = localStorage.getItem('MoneyEC_draft_light');
      if (light) return JSON.parse(light);
    } catch(e2){}
    return null;
  }
};

// ─── 通路設定 ─────────────────────────────────────────────────────────────────
const CHANNELS = {
  shopee_10x: {
    name: '蝦皮十倍館', icon: '🔟',
    bgImage: '/templates/shopee_10x.png',
    logoInPng: true,
    templates: {
      current: { name:'使用中', primary:'#1565c0', accent:'#fbbf24', bg:'#ffffff', textCol:'#1a1a1a', mode:'light', tagShape:'pill', tagColor:'#1565c0' },
      a:       { name:'A款',   primary:'#1565c0', accent:'#fbbf24', bg:'#ffffff', textCol:'#ffffff',  mode:'dark',  tagShape:'pill', tagColor:'#fbbf24' },
      b:       { name:'B款',   primary:'#1565c0', accent:'#ffffff', bg:'#ffffff', textCol:'#1565c0',  mode:'light', tagShape:'outline', tagColor:'#ffffff' },
    },
  },
  shopee_5x: {
    name: '蝦皮五倍館', icon: '5️⃣',
    bgImage: '/templates/shopee_5x.png',
    logoInPng: true,
    templates: {
      current: { name:'使用中', primary:'#ea580c', accent:'#ea580c', bg:'#ffffff', textCol:'#1a1a1a', mode:'light', tagShape:'pill', tagColor:'#ea580c' },
      a:       { name:'A款',   primary:'#ea580c', accent:'#ea580c', bg:'#ffffff', textCol:'#ea580c',  mode:'light', tagShape:'rect', tagColor:'#ea580c' },
      b:       { name:'B款',   primary:'#ea580c', accent:'#ea580c', bg:'#ffffff', textCol:'#ffffff',  mode:'dark',  tagShape:'outline', tagColor:'#ea580c' },
    },
  },
  shopee_mall: {
    name: '蝦皮商城', icon: '🏪',
    bgImage: '/templates/shopee_mall.png',
    logoInPng: true,
    templates: {
      current: { name:'使用中', primary:'#1a3c6e', accent:'#1a3c6e', bg:'#f8fafc', textCol:'#1a3c6e', mode:'light', tagShape:'pill', tagColor:'#1a3c6e' },
      a:       { name:'A款',   primary:'#f97316', accent:'#f97316', bg:'#f8fafc', textCol:'#f97316',  mode:'light', tagShape:'rect', tagColor:'#f97316' },
      b:       { name:'B款',   primary:'#1a3c6e', accent:'#f97316', bg:'#f8fafc', textCol:'#1a3c6e',  mode:'light', tagShape:'outline', tagColor:'#f97316' },
    },
  },
  official: {
    name: '官網', icon: '🌐',
    bgImage: '/templates/official.png',
    logoInPng: true,
    templates: {
      current: { name:'使用中', primary:'#2563eb', accent:'#f97316', bg:'#ffffff', textCol:'#1a3c6e', mode:'light', tagShape:'pill', tagColor:'#2563eb' },
      a:       { name:'A款',   primary:'#ffffff',  accent:'#ffffff',  bg:'#ffffff', textCol:'#ffffff',  mode:'dark',  tagShape:'pill', tagColor:'#ffffff' },
      b:       { name:'B款',   primary:'#d97706',  accent:'#d97706',  bg:'#ffffff', textCol:'#d97706',  mode:'light', tagShape:'pill', tagColor:'#d97706' },
    },
  },
  friday: {
    name: 'friDay購物', icon: '🛍️',
    bgImage: '/templates/shopee_10x.png',
    logoInPng: true,
    templates: {
      current: { name:'使用中', primary:'#1565c0', accent:'#fbbf24', bg:'#ffffff', textCol:'#1a1a1a', mode:'light', tagShape:'pill', tagColor:'#1565c0' },
      a:       { name:'A款',   primary:'#1565c0', accent:'#fbbf24', bg:'#ffffff', textCol:'#ffffff',  mode:'dark',  tagShape:'pill', tagColor:'#fbbf24' },
      b:       { name:'B款',   primary:'#1565c0', accent:'#ffffff', bg:'#ffffff', textCol:'#1565c0',  mode:'light', tagShape:'outline', tagColor:'#ffffff' },
    },
  },
};
const BANNED_WORDS = ['第一','最強','最優','療效','根治','殺頭價','保證見效'];

// ─── 文字樣式預設 ─────────────────────────────────────────────────────────────
// outlineStyle: 'none'|'simple'（單層貼紙）|'double'（雙層描邊）|'shadow'（陰影底）
const defaultTextStyle = () => ({
  color: '',
  bold: true,
  italic: false,
  outlineStyle: 'none',
  outlineColor: '#ffffff',
  outlineWidth: 8,
  outlineColor2: '#333333',
  outlineWidth2: 3,
  shadowColor: '#000000',
  shadowBlurAmount: 0,
  shadowOffsetX: 3,
  shadowOffsetY: 3,
  scale: 100,
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

// ─── 帶描邊加框的文字繪製工具（正確順序：先粗描邊 → 再細描邊 → 最後填色）────
// 關鍵：strokeText 的 lineWidth 向內外各延伸一半。
// 先畫描邊，再畫 fillText 蓋住內側一半，描邊就完美貼著字形向外擴展。
function applyTextOutline(ctx, text, x, y, style, fillColor, fontStr, align) {
  ctx.save();
  ctx.font = fontStr;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = ctx.textBaseline || 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const mode = style.outlineStyle || 'none';

  if (mode === 'shadow') {
    // 陰影底色模式：加 drop shadow，不畫描邊
    ctx.shadowColor = style.shadowColor || '#000000';
    ctx.shadowBlur = style.shadowBlurAmount || 0;
    ctx.shadowOffsetX = style.shadowOffsetX || 3;
    ctx.shadowOffsetY = style.shadowOffsetY || 3;
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
    ctx.shadowColor = 'transparent';
  } else if (mode === 'simple') {
    // 單層貼紙：粗描邊 → 文字填色
    ctx.strokeStyle = style.outlineColor || '#ffffff';
    ctx.lineWidth = (style.outlineWidth || 8) * 2; // *2 因為一半會被 fill 蓋住
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
  } else if (mode === 'double') {
    // 雙層描邊：先畫寬外框 → 再畫窄內框 → 最後填色
    ctx.strokeStyle = style.outlineColor || '#ffffff';
    ctx.lineWidth = ((style.outlineWidth || 8) + (style.outlineWidth2 || 3)) * 2;
    ctx.strokeText(text, x, y);
    ctx.strokeStyle = style.outlineColor2 || '#333333';
    ctx.lineWidth = (style.outlineWidth2 || 3) * 2;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
  } else {
    // none：只畫填色
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

// ─── 文字換行工具 ──────────────────────────────────────────────────────────────
function wrapText(ctx, text, maxWidth) {
  const chars = [...text];
  const lines = [];
  let cur = '';
  for (const ch of chars) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ─── 標籤層（8 種形狀）──────────────────────────────────────────────────────────
// tagShape: pill | rect | outline | skew | bar | badge | underline | gradient
const TAG_GRADIENT_PAIRS=[['#ff6ec7','#b372ff'],['#6d76ff','#00d9c0'],['#ffb84a','#ff6ec7'],['#00d9c0','#6366f1']];

function drawTagLayer(ctx, W, H, tid, tpl, opts) {
  const {accent:a, mode} = tpl;
  const {tagsInput,tagScale,tagOffsets,tagShape,tagCustomColors,showTags,tagFont,selectedLayers,tagTextStyle} = opts;
  if (!showTags) return [];
  const tags = tagsInput.split(',').map(t=>t.trim()).filter(Boolean);
  if (!tags.length) return [];
  const sc=(tagScale||100)/100;
  const tagH=Math.round(42*sc), fs=Math.round(18*sc), gap=Math.round(10*sc);
  const isBadge = tagShape==='badge';
  const isUnder = tagShape==='underline';
  const pad = isBadge ? 0 : isUnder ? Math.round(6*sc) : Math.round(18*sc);
  const isDark = mode==='dark';
  const style = tagTextStyle || defaultTextStyle();
  const fontStr = `${style.italic?'italic ':''} ${style.bold?'900 ':'400 '}${fs}px "${tagFont}"`;
  ctx.font = fontStr;
  // badge: 固定寬28*sc；underline: 只加小 padding
  const ws = tags.map(t => isBadge ? Math.round(28*sc) : ctx.measureText(t).width + pad*2);
  const total = ws.reduce((x,y)=>x+y,0)+gap*(tags.length-1);
  let sx = Math.max(20,(W-Math.min(total,W-40))/2);
  const baseY = H-116;
  const hbs=[];
  const isGlow = false;

  tags.forEach((tag,i) => {
    const off=tagOffsets[i]||{x:0,y:0};
    const tx=sx+off.x, ty=baseY+off.y, tw=ws[i];
    const col=tagCustomColors[i]||a;
    const isActive=selectedLayers&&selectedLayers.some(l=>l.type==='tag'&&l.index===i);
    if(isActive){ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.strokeRect(tx-3,ty-3,tw+6,tagH+6);ctx.setLineDash([]);}

    ctx.textAlign='center'; ctx.textBaseline='middle';
    const tcenter = tx+tw/2, tvcenter = ty+tagH*0.52;

    switch(tagShape){
      case 'pill': {
        if(isGlow){ctx.shadowColor=col;ctx.shadowBlur=10;}
        ctx.fillStyle=col; rr(ctx,tx,ty,tw,tagH,tagH/2); ctx.shadowBlur=0;
        applyTextOutline(ctx,tag,tcenter,tvcenter,style,style.color||'#fff',fontStr,'center'); break;
      }
      case 'rect': {
        ctx.fillStyle=col; rr(ctx,tx,ty,tw,tagH,6);
        applyTextOutline(ctx,tag,tcenter,tvcenter,style,style.color||'#fff',fontStr,'center'); break;
      }
      case 'outline': {
        ctx.strokeStyle=col; ctx.lineWidth=1.5;
        if(isGlow){ctx.shadowColor=col;ctx.shadowBlur=8;}
        rr(ctx,tx,ty,tw,tagH,tagH/2,true); ctx.shadowBlur=0;
        applyTextOutline(ctx,tag,tcenter,tvcenter,style,style.color||col,fontStr,'center'); break;
      }
      case 'skew': {
        const sk=Math.round(8*sc);
        ctx.fillStyle=col;
        ctx.beginPath(); ctx.moveTo(tx+sk,ty); ctx.lineTo(tx+tw,ty); ctx.lineTo(tx+tw-sk,ty+tagH); ctx.lineTo(tx,ty+tagH); ctx.closePath(); ctx.fill();
        applyTextOutline(ctx,tag,tcenter,tvcenter,style,style.color||'#fff',fontStr,'center'); break;
      }
      case 'bar': {
        ctx.fillStyle=isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.06)';
        rr(ctx,tx,ty,tw,tagH,5);
        ctx.fillStyle=col; ctx.fillRect(tx,ty,4,tagH);
        ctx.textAlign='left';
        applyTextOutline(ctx,tag,tx+Math.round(12*sc),tvcenter,style,style.color||(isDark?'#fff':'#2c2a26'),fontStr,'left');
        ctx.textAlign='center'; break;
      }
      case 'badge': {
        const r=Math.round(13*sc);
        ctx.fillStyle=col;
        ctx.beginPath(); ctx.arc(tx+r,ty+r,r,0,Math.PI*2); ctx.fill();
        const bfs=Math.round(9*sc);
        const bfont=`${style.italic?'italic ':''} 700 ${bfs}px "${tagFont}"`;
        applyTextOutline(ctx,tag.slice(0,2),tx+r,ty+r*1.05,style,style.color||'#fff',bfont,'center'); break;
      }
      case 'underline': {
        applyTextOutline(ctx,tag,tcenter,tvcenter,style,style.color||(isDark?'rgba(255,255,255,0.92)':'#2c2a26'),fontStr,'center');
        const mw=ctx.measureText(tag).width;
        ctx.fillStyle=col; ctx.fillRect(tcenter-mw/2,ty+tagH-Math.round(3*sc),mw,Math.round(3*sc)); break;
      }
      case 'gradient': {
        const pair=TAG_GRADIENT_PAIRS[i%TAG_GRADIENT_PAIRS.length];
        const gg=ctx.createLinearGradient(tx,0,tx+tw,0);
        gg.addColorStop(0,pair[0]); gg.addColorStop(1,pair[1]);
        if(isGlow){ctx.shadowColor=pair[0];ctx.shadowBlur=10;}
        ctx.fillStyle=gg; rr(ctx,tx,ty,tw,tagH,tagH/2); ctx.shadowBlur=0;
        applyTextOutline(ctx,tag,tcenter,tvcenter,style,style.color||'#fff',fontStr,'center'); break;
      }
      default: {
        ctx.fillStyle=col; rr(ctx,tx,ty,tw,tagH,tagH/2);
        applyTextOutline(ctx,tag,tcenter,tvcenter,style,style.color||'#fff',fontStr,'center');
      }
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
  const [activeChannel,setActiveChannel]=useState('shopee_10x');
  const [templateVariant,setTemplateVariant]=useState('current');
  const [debugBoxes,setDebugBoxes]=useState(false);
  const [removeBg,setRemoveBg]=useState(true);
  const [enableRemoveBgApi,setEnableRemoveBgApi]=useState(false);
  const [removeBgApiKey,setRemoveBgApiKey]=useState('');
  const [bgRemovalCount,setBgRemovalCount]=useState(0);

  // 文案
  const [logoText,setLogoText]=useState('馬尼通訊');
  const [brandText,setBrandText]=useState('官方授權店');
  const [promoText,setPromoText]=useState('GPLUS A6 智慧手機');
  const [subText,setSubText]=useState(''); // V6：副標題第二行（如：6.8吋 · 資安認證）
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
  const [canvasShape,setCanvasShape]=useState('square'); // V6：square | rounded | circle

  // 選取
  const [selectedLayers,setSelectedLayers]=useState([]);
  const [leftWidth,setLeftWidth]=useState(530);
  const [isDragActive,setIsDragActive]=useState(false);
  const [guideLines,setGuideLines]=useState({active:false});
  const [showHelp,setShowHelp]=useState(false);
  const [isDraftLoaded,setIsDraftLoaded]=useState(false);

  // 雲端
  const [gasUrl,setGasUrl]=useState('');
  const [projectName,setProjectName]=useState('EC 樣板');
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
  const channelCfg=CHANNELS[activeChannel]||CHANNELS['shopee_10x'];
  const baseTpl=channelCfg.templates[templateVariant]||channelCfg.templates['current'];
  const tpl=customColors?{...baseTpl,...customColors}:baseTpl;
  const compliance=(()=>{const f=BANNED_WORDS.filter(w=>(promoText+tagsInput).includes(w));return{safe:!f.length,words:f};})();

  // ── Snapshot ──
  const buildSnap=()=>({
    products,activeChannel,templateVariant,removeBg,subText,canvasShape,
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
    setProducts(s.products||[]); setActiveChannel(s.activeChannel||'shopee_10x'); setTemplateVariant(s.templateVariant||'current');
    setRemoveBg(s.removeBg!==false);
    setLogoText(s.logoText||'馬尼通訊'); setBrandText(s.brandText||'官方授權店'); setPromoText(s.promoText||'');
    setSubText(s.subText||''); setCanvasShape(s.canvasShape||'square');
    setTagsInput(s.tagsInput||''); setIsAiDisclosure(!!s.isAiDisclosure); setTagShape(s.tagShape||'pill');
    setShowLogo(s.showLogo!==false); setShowBrand(s.showBrand!==false); setShowTitle(s.showTitle!==false); setShowTags(s.showTags!==false);
    setTitleFont(s.titleFont||'Microsoft JhengHei'); setTagFont(s.tagFont||'Microsoft JhengHei');
    const mergeStyle = (saved) => ({...defaultTextStyle(), bold:true, ...(saved||{})});
    setLogoStyle(mergeStyle(s.logoStyle));
    setBrandStyle(mergeStyle(s.brandStyle));
    setTitleStyle(mergeStyle(s.titleStyle));
    setTagTextStyle(mergeStyle(s.tagTextStyle));
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
  // hasDraftRef：防止草稿載入期間（setState 尚未完成）的空白 buildSnap 覆蓋 IndexedDB
  const hasDraftRef = useRef(false);
  useEffect(()=>{
    (async()=>{
      const draft=await loadDraft();
      if(draft){
        hasDraftRef.current = true;
        try{
          applySnap(draft);
          setCloudMsg({text:'✅ 已還原上次草稿',type:'success'});
          setTimeout(()=>setCloudMsg({text:'',type:''}),3000);
        }catch(e){ hasDraftRef.current = false; }
      }
      // 延遲開啟 auto-save，讓所有 setState 的 re-render 完成後才開始監聽
      setTimeout(()=>{ setIsDraftLoaded(true); }, 300);
    })();
    const url=localStorage.getItem('MoneyEC_GAS_URL'); if(url) setGasUrl(url);
    const key=localStorage.getItem('MoneyEC_RemoveBg_Key'); if(key) setRemoveBgApiKey(key);
    const curM=new Date().toISOString().slice(0,7);
    if(localStorage.getItem('MoneyEC_RemoveBg_Month')!==curM){localStorage.setItem('MoneyEC_RemoveBg_Month',curM);localStorage.setItem('MoneyEC_RemoveBg_Count','0');setBgRemovalCount(0);}
    else setBgRemovalCount(parseInt(localStorage.getItem('MoneyEC_RemoveBg_Count')||'0',10));
  },[]);

  useEffect(()=>{
    if(!isDraftLoaded)return;
    // 首次觸發時（hasDraftRef 尚為 true）跳過，等第二次 re-render（用戶實際編輯）才存
    if(hasDraftRef.current){ hasDraftRef.current = false; return; }
    const t=setTimeout(()=>saveDraft(buildSnap()),1200);
    return()=>clearTimeout(t);
  },[isDraftLoaded,products,activeChannel,templateVariant,removeBg,subText,canvasShape,logoText,brandText,promoText,tagsInput,isAiDisclosure,tagShape,showLogo,showBrand,showTitle,showTags,titleFont,tagFont,logoStyle,brandStyle,titleStyle,tagTextStyle,productScale,brandScale,textScale,tagScale,iconScale,logoOffset,brandOffset,titleOffset,iconOffset,tagOffsets,rotations,layerOrder,tagCustomColors,customColors,iconImage]);

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
        if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();selectedLayers.forEach(l=>{if(l.type==='product'){setProducts(p=>p.filter(pr=>pr.id!==l.id));setLayerOrder(lo=>lo.filter(id=>id!==l.id));}else if(l.type==='logo')setShowLogo(false);else if(l.type==='brand')setShowBrand(false);else if(l.type==='title')setShowTitle(false);else if(l.type==='tags')setShowTags(false);else if(l.type==='icon')setIconImage(null);});setSelectedLayers([]);setTimeout(saveSnap,50);return;}
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
      reader.onloadend=()=>{setProducts(p=>p.map(pr=>pr.id===prodId?{...pr,src:reader.result,isRemovingBg:false}:pr));setBgRemovalCount(n=>{const nn=n+1;localStorage.setItem('MoneyEC_RemoveBg_Count',String(nn));return nn;});setTimeout(saveSnap,100);};
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
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
      const bgImg = await loadImg(channelCfg.bgImage);
      if (bgImg) ctx.drawImage(bgImg, 0, 0, W, H);

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
            // canvasShape 裁切（V6 新增）
            c.save();
            if(canvasShape==='circle'){
              c.beginPath(); c.arc(dx+dw/2,dy+dh/2,Math.min(dw,dh)/2,0,Math.PI*2); c.clip();
            } else if(canvasShape==='rounded'){
              const rad=Math.min(dw,dh)*0.12;
              rr(c,dx,dy,dw,dh,rad); c.clip();
            }
            if(prod.shadow&&removeBg){c.shadowColor='rgba(0,0,0,0.12)';c.shadowBlur=30;c.shadowOffsetY=14;}
            c.drawImage(pi,dx,dy,dw,dh); c.shadowBlur=0; c.shadowOffsetY=0;
            c.restore();
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
        const fallbackBg=tpl.primary;
        const fallbackText='#ffffff';
        const bx=(W-pw)/2+logoOffset.x, by=14+logoOffset.y;
        withSel('logo',undefined,bx,by,pw,ph,rotations.logo,(c,dx,dy,dw,dh)=>{
          c.fillStyle=logoStyle.color||fallbackBg;
          rr(c,dx,dy,dw,dh,r);
          c.textBaseline='middle'; c.textAlign='center';
          applyTextOutline(c,logoText,dx+dw/2,dy+dh/2,logoStyle,fallbackText,fontStr,'center');
          c.textBaseline='alphabetic'; c.textAlign='left';
        });
        hb.current.logo={x:bx,y:by,w:pw,h:ph};
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
        const bx=(W/2-pw/2)+brandOffset.x;
        const by=68+brandOffset.y;

        withSel('brand',undefined,bx,by,pw,ph,rotations.brand,(c,dx,dy,dw,dh)=>{
          const bgColor=brandStyle.color||h2r(tpl.primary,.25);
          c.fillStyle=bgColor; rr(c,dx,dy,dw,dh,rr2);
          const tColor = brandStyle.color ? '#ffffff' : (isDark?'#ffffff':tpl.primary);
          c.textBaseline='middle'; c.textAlign='center';
          applyTextOutline(c,brandText,dx+dw/2,dy+dh/2,brandStyle,tColor,fontStr,'center');
          c.textBaseline='alphabetic'; c.textAlign='left';
        });
        hb.current.brand={x:bx,y:by,w:pw,h:ph};
      };

      // ── 主標題圖層 ──
      const drawTitleLayer=()=>{
        if(!showTitle||!promoText) return;
        const ts=(textScale||100)/100;
        const sz=Math.round(36*ts*(titleStyle.scale||100)/100);
        const isGaming=false;
        const fontStr=`${titleStyle.italic?'italic ':''} ${titleStyle.bold?'900 ':'400 '}${sz}px "${titleFont}"`;
        ctx.font=fontStr;
        const tw=ctx.measureText(promoText).width, th=sz+10;
        const bx=W/2+titleOffset.x-tw/2;
        const by=H-185+titleOffset.y;

        withSel('title',undefined,bx,by,tw,th,rotations.title,(c,dx,dy,dw,dh)=>{
          const fallbackCol=isDark?'#ffffff':tpl.textCol;
          const titleAlign='center';
          const titleX=dx+dw/2, titleY=dy+dh/2;
          // 暗色模板且未自訂顏色時，用漸層填色
          let fillCol=titleStyle.color||fallbackCol;
          if(isDark&&!titleStyle.color){
            const tg=c.createLinearGradient(0,dy,0,dy+dh);
            tg.addColorStop(0,'#fff'); tg.addColorStop(1,h2r(tpl.accent,.85));
            // 暫存 fillStyle 物件，applyTextOutline 直接用 fillCol 字串無法傳漸層
            // 解法：先畫描邊（如有），再手動畫漸層 fill
            c.save(); c.font=fontStr; c.lineJoin='round'; c.miterLimit=2;
            const mode=titleStyle.outlineStyle||'none';
            if(mode==='simple'){
              c.strokeStyle=titleStyle.outlineColor||'#ffffff'; c.lineWidth=(titleStyle.outlineWidth||8)*2;
              c.textAlign=titleAlign; c.textBaseline='middle'; c.strokeText(promoText,titleX,titleY);
            } else if(mode==='double'){
              c.strokeStyle=titleStyle.outlineColor||'#ffffff'; c.lineWidth=((titleStyle.outlineWidth||8)+(titleStyle.outlineWidth2||3))*2;
              c.textAlign=titleAlign; c.textBaseline='middle'; c.strokeText(promoText,titleX,titleY);
              c.strokeStyle=titleStyle.outlineColor2||'#333333'; c.lineWidth=(titleStyle.outlineWidth2||3)*2;
              c.strokeText(promoText,titleX,titleY);
            } else if(mode==='shadow'){
              c.shadowColor=titleStyle.shadowColor||'#000'; c.shadowBlur=titleStyle.shadowBlurAmount||0;
              c.shadowOffsetX=titleStyle.shadowOffsetX||3; c.shadowOffsetY=titleStyle.shadowOffsetY||3;
            }
            c.fillStyle=tg; c.textAlign=titleAlign; c.textBaseline='middle';
            if(isGaming){c.shadowColor=tpl.accent;c.shadowBlur=12;}
            c.fillText(promoText,titleX,titleY);
            c.shadowBlur=0; c.shadowColor='transparent'; c.restore();
          } else {
            c.textBaseline='middle'; c.textAlign=titleAlign;
            applyTextOutline(c,promoText,titleX,titleY,titleStyle,fillCol,fontStr,titleAlign);
          }
          c.textBaseline='alphabetic'; c.textAlign='left';
        });
        hb.current.title={x:bx,y:by,w:tw,h:th};
        // subText 副標題（V6 新增）
        if(subText){
          const subSz=Math.round(22*ts*(titleStyle.scale||100)/100);
          const subFont=`${titleStyle.italic?'italic ':''} 400 ${subSz}px "${titleFont}"`;
          ctx.font=subFont; ctx.fillStyle=isDark?'rgba(255,255,255,0.65)':h2r(tpl.textCol,.65);
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(subText,W/2+titleOffset.x,by+th+subSz*0.8+6);
          ctx.textBaseline='alphabetic'; ctx.textAlign='left';
        }
      };

      layerOrder.forEach(lid=>{
        if(lid==='deco'){hb.current.deco={key:'frame',x:14,y:14,w:W-28,h:H-28};}
        else if(lid.startsWith('prod_')){const p=products.find(pr=>pr.id===lid);if(p)drawProd(p);}
        else if(lid==='logo') drawLogoLayer();
        else if(lid==='brand') drawBrandLayer();
        else if(lid==='title') drawTitleLayer();
        else if(lid==='tags'){
          hb.current.tags=drawTagLayer(ctx,W,H,'',tpl,{tagsInput,tagScale,tagOffsets,tagShape,tagCustomColors,showTags,tagFont,selectedLayers,tagTextStyle});
        }
        else if(lid==='icon'&&iImg){
          const iW=W*(iconScale/100), iH=(iImg.height/iImg.width)*iW;
          const ox=(W-iW)/2+iconOffset.x, oy=(H-iH)/2+iconOffset.y;
          withSel('icon',undefined,ox,oy,iW,iH,rotations.icon,(c,dx,dy,dw,dh)=>c.drawImage(iImg,dx,dy,dw,dh));
          hb.current.icon={x:ox,y:oy,w:iW,h:iH};
        }
      });

      if(products.length===0){
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
  },[products,iconImage,activeChannel,templateVariant,channelCfg,debugBoxes,tpl,subText,canvasShape,logoText,brandText,promoText,tagsInput,isAiDisclosure,removeBg,productScale,brandScale,textScale,tagScale,tagShape,showLogo,showBrand,showTitle,showTags,titleFont,tagFont,iconScale,logoOffset,brandOffset,titleOffset,iconOffset,tagOffsets,selectedLayers,rotations,guideLines,layerOrder,tagCustomColors,customColors,logoStyle,brandStyle,titleStyle,tagTextStyle]);

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
      if(l.type==='tag')return tagOffsets[l.index]||{x:0,y:0};
      return{x:0,y:0};
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
    setFeatureBoxOffsets([]);
    setProducts(p=>p.map(pr=>({...pr,offset:{x:0,y:0},rotation:0})));
    setRotations({logo:0,brand:0,title:0,icon:0});
    setLayerOrder(['deco',...products.map(p=>p.id),'tags','title','logo','brand','icon']);
    setTimeout(saveSnap,50);
  };

  const saveToGAS=async()=>{
    if(!gasUrl){setCloudMsg({text:'請輸入 GAS 網址',type:'error'});return;}
    setIsSaving(true); setCloudMsg({text:'儲存中...',type:'info'});
    localStorage.setItem('MoneyEC_GAS_URL',gasUrl);
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
    try{const link=document.createElement('a');link.download=`馬尼製圖_${channelCfg.name}_${baseTpl.name}_${Date.now()}.png`;link.href=canvasRef.current.toDataURL('image/png',1.0);document.body.appendChild(link);link.click();document.body.removeChild(link);}
    catch(e){alert('匯出失敗');}
  };

  const alid=activeLayer?.id||activeLayer?.type;

  // ── 文字樣式編輯器子元件（4 種加框效果）──
  const TextStyleEditor=({label,style,setStyle})=>{
    const mode=style.outlineStyle||'none';
    const MODES=[
      {id:'none',    icon:'A',  label:'無框'},
      {id:'simple',  icon:'A̲',  label:'貼紙框'},
      {id:'double',  icon:'Ã',  label:'雙層框'},
      {id:'shadow',  icon:'Å',  label:'陰影底'},
    ];
    return(
      <div style={{background:'#f8fafc',borderRadius:8,padding:'10px',border:'1px solid #e2e8f0',marginTop:6}}>
        <div style={{fontSize:9,fontWeight:800,color:'#64748b',marginBottom:7,textTransform:'uppercase',letterSpacing:.5}}>{label} 文字樣式</div>

        {/* 顏色 + 縮放 */}
        <div style={{display:'flex',gap:6,marginBottom:7,alignItems:'center'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0}}>
            <input type="color" value={style.color||'#ffffff'} onChange={e=>setStyle(s=>({...s,color:e.target.value}))} onBlur={saveSnap} style={{width:30,height:30,borderRadius:6,border:'2px solid #e2e8f0',padding:2,cursor:'pointer'}} />
            <span style={{fontSize:8,color:'#94a3b8'}}>顏色</span>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:'#64748b',marginBottom:2}}>個別縮放 {style.scale||100}%</div>
            <input type="range" min={50} max={300} value={style.scale||100} onChange={e=>setStyle(s=>({...s,scale:Number(e.target.value)}))} onMouseUp={saveSnap} style={{width:'100%',accentColor:tpl.primary}} />
          </div>
        </div>

        {/* 粗體 / 斜體 */}
        <div style={{display:'flex',gap:5,marginBottom:8}}>
          <ToggleChip active={style.bold} onClick={()=>{setStyle(s=>({...s,bold:!s.bold}));saveSnap();}}>B 粗體</ToggleChip>
          <ToggleChip active={style.italic} onClick={()=>{setStyle(s=>({...s,italic:!s.italic}));saveSnap();}}>I 斜體</ToggleChip>
        </div>

        {/* 4 種加框模式 */}
        <div style={{fontSize:9,fontWeight:700,color:'#64748b',marginBottom:5}}>加框效果</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:4,marginBottom:8}}>
          {MODES.map(m=>(
            <button key={m.id} onClick={()=>{setStyle(s=>({...s,outlineStyle:m.id}));saveSnap();}} style={{padding:'6px 3px',borderRadius:7,border:`2px solid ${mode===m.id?tpl.primary:'#e2e8f0'}`,background:mode===m.id?tpl.primary+'14':'#fff',cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
              <div style={{fontSize:16,fontWeight:900,color:mode===m.id?tpl.primary:'#334155',lineHeight:1.1,fontFamily:'serif'}}>{m.icon}</div>
              <div style={{fontSize:8,color:mode===m.id?tpl.primary:'#94a3b8',fontWeight:700,marginTop:2}}>{m.label}</div>
            </button>
          ))}
        </div>

        {/* simple / double 的顏色與寬度 */}
        {(mode==='simple'||mode==='double')&&(
          <div style={{background:'#fff',borderRadius:7,border:'1px solid #e2e8f0',padding:'7px 8px',display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0}}>
                <input type="color" value={style.outlineColor||'#ffffff'} onChange={e=>setStyle(s=>({...s,outlineColor:e.target.value}))} onBlur={saveSnap} style={{width:26,height:26,borderRadius:5,border:'2px solid #e2e8f0',padding:2,cursor:'pointer'}} />
                <span style={{fontSize:8,color:'#94a3b8'}}>{mode==='double'?'外框色':'框色'}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:'#64748b',marginBottom:2}}>{mode==='double'?'外框寬':'框寬'} {style.outlineWidth||8}px</div>
                <input type="range" min={1} max={40} value={style.outlineWidth||8} onChange={e=>setStyle(s=>({...s,outlineWidth:Number(e.target.value)}))} onMouseUp={saveSnap} style={{width:'100%',accentColor:'#f97316'}} />
              </div>
            </div>
            {mode==='double'&&(
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0}}>
                  <input type="color" value={style.outlineColor2||'#333333'} onChange={e=>setStyle(s=>({...s,outlineColor2:e.target.value}))} onBlur={saveSnap} style={{width:26,height:26,borderRadius:5,border:'2px solid #e2e8f0',padding:2,cursor:'pointer'}} />
                  <span style={{fontSize:8,color:'#94a3b8'}}>內框色</span>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:'#64748b',marginBottom:2}}>內框寬 {style.outlineWidth2||3}px</div>
                  <input type="range" min={1} max={20} value={style.outlineWidth2||3} onChange={e=>setStyle(s=>({...s,outlineWidth2:Number(e.target.value)}))} onMouseUp={saveSnap} style={{width:'100%',accentColor:'#6366f1'}} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* shadow 模式的設定 */}
        {mode==='shadow'&&(
          <div style={{background:'#fff',borderRadius:7,border:'1px solid #e2e8f0',padding:'7px 8px',display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0}}>
                <input type="color" value={style.shadowColor||'#000000'} onChange={e=>setStyle(s=>({...s,shadowColor:e.target.value}))} onBlur={saveSnap} style={{width:26,height:26,borderRadius:5,border:'2px solid #e2e8f0',padding:2,cursor:'pointer'}} />
                <span style={{fontSize:8,color:'#94a3b8'}}>陰影色</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:'#64748b',marginBottom:2}}>模糊 {style.shadowBlurAmount||0}px</div>
                <input type="range" min={0} max={30} value={style.shadowBlurAmount||0} onChange={e=>setStyle(s=>({...s,shadowBlurAmount:Number(e.target.value)}))} onMouseUp={saveSnap} style={{width:'100%',accentColor:'#8b5cf6'}} />
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              <div>
                <div style={{fontSize:9,color:'#64748b',marginBottom:2}}>X偏移 {style.shadowOffsetX||3}px</div>
                <input type="range" min={-20} max={20} value={style.shadowOffsetX||3} onChange={e=>setStyle(s=>({...s,shadowOffsetX:Number(e.target.value)}))} onMouseUp={saveSnap} style={{width:'100%',accentColor:'#f43f5e'}} />
              </div>
              <div>
                <div style={{fontSize:9,color:'#64748b',marginBottom:2}}>Y偏移 {style.shadowOffsetY||3}px</div>
                <input type="range" min={-20} max={20} value={style.shadowOffsetY||3} onChange={e=>setStyle(s=>({...s,shadowOffsetY:Number(e.target.value)}))} onMouseUp={saveSnap} style={{width:'100%',accentColor:'#f43f5e'}} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
            <div><div style={{fontSize:14,fontWeight:800,color:'#fff'}}>馬尼電商製圖</div><div style={{fontSize:9,color:'rgba(255,255,255,0.65)'}}>V7.0 · 馬尼電商製圖</div></div>
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

            <PC title="① 上架通路">
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5}}>
                {Object.entries(CHANNELS).map(([id,ch])=>(
                  <button key={id} onClick={()=>{
                    setActiveChannel(id);
                    setTemplateVariant('current');
                    setCustomColors(null);
                    if(ch.logoInPng){setShowLogo(false);setShowBrand(false);}
                    else{setShowLogo(true);setShowBrand(true);}
                    setTimeout(saveSnap,50);
                  }} style={{padding:'7px 3px',borderRadius:9,border:'2px solid',cursor:'pointer',textAlign:'center',fontFamily:'inherit',borderColor:activeChannel===id?tpl.primary:'#e2e8f0',background:activeChannel===id?tpl.primary+'18':'#fff',color:activeChannel===id?tpl.primary:'#64748b',transition:'all .15s'}}>
                    <div style={{fontSize:17,marginBottom:2}}>{ch.icon}</div>
                    <div style={{fontSize:9,fontWeight:700}}>{ch.name}</div>
                  </button>
                ))}
              </div>
            </PC>

            <PC title="② 款式選擇">
              <div style={{display:'flex',gap:5}}>
                {Object.entries(channelCfg.templates).map(([vid,v])=>(
                  <button key={vid} onClick={()=>{setTemplateVariant(vid);setCustomColors(null);setTimeout(saveSnap,50);}} style={{flex:1,padding:'8px 6px',borderRadius:9,border:'2px solid',cursor:'pointer',textAlign:'center',fontFamily:'inherit',borderColor:templateVariant===vid?tpl.primary:'#e2e8f0',background:templateVariant===vid?tpl.primary+'18':'#fff',color:templateVariant===vid?tpl.primary:'#64748b',transition:'all .15s'}}>
                    <div style={{display:'flex',gap:3,justifyContent:'center',marginBottom:4}}>
                      {[v.primary,v.accent,v.bg].map((c,i)=><div key={i} style={{width:12,height:12,borderRadius:'50%',background:c,border:'1px solid rgba(0,0,0,0.08)'}} />)}
                    </div>
                    <div style={{fontSize:11,fontWeight:700}}>{v.name}</div>
                  </button>
                ))}
              </div>
            </PC>

            <PC title="③ 自訂配色（各自獨立）">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7,marginBottom:7}}>
                {[
                  ['主色', customColors?.primary||baseTpl.primary, 'primary'],
                  ['重點', customColors?.accent||baseTpl.accent,   'accent'],
                  ['底色', customColors?.bg||baseTpl.bg,           'bg'],
                ].map(([label,val,key])=>(
                  <div key={key} style={{textAlign:'center',position:'relative'}}>
                    <input type="color" value={val}
                      onChange={e=>setCustomColors(p=>({...(p||{}),[key]:e.target.value}))}
                      onBlur={saveSnap}
                      style={{width:32,height:32,borderRadius:'50%',border:'2px solid #e2e8f0',padding:2,cursor:'pointer',display:'block',margin:'0 auto 3px'}} />
                    <div style={{fontSize:9,color:'#64748b',fontWeight:600}}>{label}</div>
                    {customColors?.[key]&&(
                      <button onClick={()=>{setCustomColors(p=>{if(!p)return null;const n={...p};delete n[key];return Object.keys(n).length?n:null;});setTimeout(saveSnap,50);}}
                        title="恢復此色的模板預設"
                        style={{position:'absolute',top:-3,right:'calc(50% - 20px)',width:14,height:14,borderRadius:'50%',border:'none',background:'#ef4444',color:'#fff',fontSize:9,cursor:'pointer',fontFamily:'inherit',padding:0,fontWeight:900,lineHeight:'14px'}}>×</button>
                    )}
                  </div>
                ))}
              </div>
              {customColors&&Object.keys(customColors).length>0&&(
                <button onClick={()=>{setCustomColors(null);setTimeout(saveSnap,50);}} style={{width:'100%',padding:'4px',borderRadius:6,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700}}>↩ 全部恢復模板配色</button>
              )}
            </PC>

            <PC title="④ 商品圖上傳（支援多圖）">
              <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 9px',background:'#f5f3ff',borderRadius:8,border:'1px solid #e9d5ff',marginBottom:7}}>
                <input type="checkbox" checked={enableRemoveBgApi} onChange={e=>setEnableRemoveBgApi(e.target.checked)} id="rbg" style={{accentColor:'#7c3aed'}} />
                <label htmlFor="rbg" style={{fontSize:11,fontWeight:700,color:'#6d28d9',cursor:'pointer'}}>✨ Remove.bg AI 去背</label>
              </div>
              {enableRemoveBgApi&&<div style={{marginBottom:7,padding:'7px 9px',background:'#faf5ff',borderRadius:8,border:'1px solid #e9d5ff'}}>
                <input type="password" placeholder="API Key" value={removeBgApiKey} onChange={e=>{setRemoveBgApiKey(e.target.value);localStorage.setItem('MoneyEC_RemoveBg_Key',e.target.value);}} style={{width:'100%',padding:'6px 8px',border:'1px solid #d8b4fe',borderRadius:6,fontSize:11,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}} />
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
                  <LI value={subText} onChange={setSubText} onBlur={saveSnap} placeholder="副標題（選填，如：6.8吋 · 資安認證）" style={{marginTop:5,fontSize:10,color:'#94a3b8'}} />
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

            <PC title="⑧ 商品圖裁切形狀">
              <div style={{display:'flex',gap:5}}>
                {[['square','⬜ 正方形'],['rounded','▢ 圓角框'],['circle','⭕ 圓形']].map(([s,l])=>(
                  <button key={s} onClick={()=>{setCanvasShape(s);saveSnap();}} style={{flex:1,padding:'7px 3px',borderRadius:8,border:'2px solid',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700,textAlign:'center',borderColor:canvasShape===s?tpl.primary:'#e2e8f0',background:canvasShape===s?tpl.primary+'14':'#fff',color:canvasShape===s?tpl.primary:'#64748b',transition:'all .15s'}}>{l}</button>
                ))}
              </div>
            </PC>

            <PC title="⑨ 標籤形狀（8 種）">
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
                {[
                  ['pill','💊','圓角膠囊'],['rect','▬','方形色塊'],['outline','□','線框透明'],['skew','◇','斜角動感'],
                  ['bar','▌','色條白底'],['badge','●','圓形徽章'],['underline','_','底線強調'],['gradient','🌈','漸層膠囊'],
                ].map(([s,ic,l])=>(
                  <button key={s} onClick={()=>{setTagShape(s);saveSnap();}} style={{padding:'6px 3px',borderRadius:8,border:'2px solid',cursor:'pointer',fontFamily:'inherit',textAlign:'center',borderColor:tagShape===s?tpl.primary:'#e2e8f0',background:tagShape===s?tpl.primary+'14':'#fff',transition:'all .15s'}}>
                    <div style={{fontSize:14,marginBottom:2}}>{ic}</div>
                    <div style={{fontSize:9,fontWeight:700,color:tagShape===s?tpl.primary:'#64748b'}}>{l}</div>
                  </button>
                ))}
              </div>
            </PC>

            <PC title="⑩ 全域大小調整（max 600%）">
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:5}}>
                <button onClick={resetAll} style={{padding:'4px 9px',borderRadius:6,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700}}>↩ 重置座標</button>
              </div>
              <SR label={`商品 ${productScale}%`} min={10} max={600} val={productScale} onChange={v=>{setProductScale(v);setProducts(p=>p.map(pr=>({...pr,scale:v})));}} onUp={saveSnap} color={tpl.primary} />
              <SR label={`標題 ${textScale}%`} min={10} max={600} val={textScale} onChange={setTextScale} onUp={saveSnap} color={tpl.primary} />
              <SR label={`標籤 ${tagScale}%`} min={10} max={600} val={tagScale} onChange={setTagScale} onUp={saveSnap} color={tpl.accent} />
              <SR label={`徽章 ${brandScale}%`} min={10} max={600} val={brandScale} onChange={setBrandScale} onUp={saveSnap} color={tpl.accent} />
            </PC>

            <PC title="⑪ 外部圖示 & AI 聲明">
              <label style={{display:'block',padding:'8px',textAlign:'center',border:'1px solid #e2e8f0',borderRadius:8,cursor:'pointer',fontSize:11,color:'#64748b',fontWeight:600,background:'#f8fafc',marginBottom:5}}>
                <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>setIconImage(ev.target.result);r.readAsDataURL(f);}}} style={{display:'none'}} />
                {iconImage?'✅ 已載入，點擊更換':'選擇透明 PNG 圖示'}
              </label>
              <LT label="AI Generated 聲明" checked={isAiDisclosure} onChange={v=>{setIsAiDisclosure(v);saveSnap();}} />
            </PC>

            <PC title="🔧 座標偵錯">
              <LT label="顯示特色框座標（紅框）" checked={debugBoxes} onChange={v=>{setDebugBoxes(v);}} />
              <div style={{fontSize:9,color:'#94a3b8',marginTop:3}}>確認框對齊後關閉，匯出不影響</div>
            </PC>

            <PC title="⑫ ☁️ 雲端樣板中心">
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
            ⬇️ 匯出 {channelCfg.icon} {channelCfg.name} · {baseTpl.name}
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
              <span style={{color:tpl.primary,fontWeight:700}}>{channelCfg.icon} {channelCfg.name}</span> · {baseTpl.name}
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

        <div style={{marginTop:7,fontSize:10,color:'#94a3b8'}}>輸出 1000×1000px · PNG · V7.0</div>
      </div>

      {showHelp&&<div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:16}} onClick={()=>setShowHelp(false)}>
        <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:520,maxHeight:'72vh',overflow:'hidden',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f8fafc'}}>
            <div style={{fontSize:13,fontWeight:800,color:'#1e293b'}}>🖱️ 操作說明 V6.0</div>
            <button onClick={()=>setShowHelp(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:15,color:'#64748b'}}>✕</button>
          </div>
          <div style={{padding:13,overflowY:'auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['點擊文字元素','左側面板立即顯示該圖層的字型顏色、粗斜體、加框等樣式設定。'],['品牌名 & 副文字','兩個圖層完全獨立，可分別拖曳到不同位置。'],['副標題','主標題輸入框下方可輸入副標題，自動顯示在標題下方。'],['商品圖裁切','可選正方形、圓角框、圓形三種裁切方式。'],['加框描邊效果','點擊文字 → 開啟「✏️ 加框」→ 調整框色與框寬，可做出貼紙風。'],['多選 Shift+點','按住 Shift 點多個元素，可同時移動。'],['鍵盤微調','方向鍵 1px；Shift+方向鍵 10px。'],['旋轉','選取後 Shift+滾輪旋轉物件。'],['全域滑桿','最大 600%，適合超大版面填滿。'],['Ctrl+Z/Y','復原 / 重做。'],].map(([t,d])=>(
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
