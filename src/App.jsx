import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertTriangle, CheckCircle, Settings, Download, Layout, Type, ShieldCheck, Info, Image as ImageIcon, Sliders, Palette, Maximize, Box, Move, Type as TypeIcon, ImagePlus, RotateCcw, Cloud, Save, DownloadCloud, Loader2, Link2, GripVertical, Wand2, Key, Layers, Undo2, Redo2, Lock, Unlock, MousePointer2, X } from 'lucide-react';

const App = () => {
  // 核心狀態
  const [rawImage, setRawImage] = useState(null); 
  const [image, setImage] = useState(null); 
  const [iconImage, setIconImage] = useState(null);
  const [platform, setPlatform] = useState('Shopee');
  const [template, setTemplate] = useState('LightSoft');
  
  // 視覺效果狀態
  const [removeBg, setRemoveBg] = useState(true); 
  const [cyberBgMode, setCyberBgMode] = useState('dark'); // 新增：電競風深淺色切換

  // --- Remove.bg API ---
  const [enableRemoveBgApi, setEnableRemoveBgApi] = useState(false);
  const [removeBgApiKey, setRemoveBgApiKey] = useState('');
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemovalCount, setBgRemovalCount] = useState(0); 

  // --- UI 面板拖曳寬度狀態 ---
  const [leftWidth, setLeftWidth] = useState(560); 
  const [isDragActive, setIsDragActive] = useState(false);

  // 🛍️ 平台與色彩規範 (新增 Yahoo 雙平台)
  const THEMES = {
    Shopee: { name: '蝦皮購物', main: '#f97316', gradient: 'linear-gradient(135deg, #fb923c, #ef4444)', bg: '#fff7ed', border: '#fdba74', text: '#ea580c', allowText: true },
    Momo: { name: 'Momo 購物', main: '#ec4899', gradient: 'linear-gradient(135deg, #f472b6, #e11d48)', bg: '#fdf2f8', border: '#f9a8d4', text: '#be185d', allowText: false },
    PChome: { name: 'PChome 24h', main: '#3b82f6', gradient: 'linear-gradient(135deg, #60a5fa, #ef4444)', bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', allowText: true },
    YahooAuction: { name: '奇摩拍賣', main: '#8b5cf6', gradient: 'linear-gradient(135deg, #a855f7, #6366f1)', bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9', allowText: true },
    YahooMall: { name: '奇摩購物中心', main: '#7c3aed', gradient: 'linear-gradient(135deg, #8b5cf6, #4c1d95)', bg: '#f5f3ff', border: '#a78bfa', text: '#5b21b6', allowText: false }
  };
  const activeTheme = THEMES[platform];

  const [primaryColor, setPrimaryColor] = useState('#f97316'); 
  const [accentColor, setAccentColor] = useState('#ef4444'); 
  const [textColor, setTextColor] = useState('#1e293b'); 
  
  const [logoText, setLogoText] = useState('BRAND');
  const [brandText, setBrandText] = useState('官方授權店');
  const [promoText, setPromoText] = useState('GPLUS 智慧手機');
  const [tagsInput, setTagsInput] = useState('公司貨,極窄邊框,資安認證');
  const [isAiDisclosure, setIsAiDisclosure] = useState(false);

  const [tagShape, setTagShape] = useState('pill');
  const [showLogo, setShowLogo] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [titleFont, setTitleFont] = useState('Microsoft JhengHei');
  const [tagFont, setTagFont] = useState('Microsoft JhengHei');

  const [productScale, setProductScale] = useState(100);
  const [brandScale, setBrandScale] = useState(100);
  const [textScale, setTextScale] = useState(100);
  const [tagScale, setTagScale] = useState(100);   
  const [iconScale, setIconScale] = useState(30);

  // --- 圖層化架構狀態 ---
  const [productOffset, setProductOffset] = useState({ x: 0, y: 0 });
  const [titleOffset, setTitleOffset] = useState({ x: 0, y: 0 });
  const [iconOffset, setIconOffset] = useState({ x: 150, y: -150 });
  const [tagOffsets, setTagOffsets] = useState([]);
  
  // 裝飾圖層位置狀態
  const [decoOffsets, setDecoOffsets] = useState({ 
      frame: { x: 0, y: 0 }, 
      bars: { x: 0, y: 0 }, 
      poly: { x: 0, y: 0 },
      cyber: { x: 0, y: 0 },
      premium: { x: 0, y: 0 }
  });

  const [lockedLayers, setLockedLayers] = useState({ product: false, deco: false, title: false, icon: false });
  const [activeLayer, setActiveLayer] = useState(null);
  const [rotations, setRotations] = useState({ product: 0, title: 0, icon: 0, deco: 0 });
  const [guideLines, setGuideLines] = useState({ x: null, y: null, active: false });
  const [showHelpModal, setShowHelpModal] = useState(false); 
  
  const historyRef = useRef([]);
  const historyIndex = useRef(-1);

  const [gasUrl, setGasUrl] = useState('https://script.google.com/macros/s/AKfycbz56mtEvhynoY7CqJ7PKU0t5DMZDRWFta9fUQdrPAuxlGqCQ_hg5Fhe11JlSF9vORAJeQ/exec');
  const [projectName, setProjectName] = useState('雙11促銷樣板');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [cloudTemplates, setCloudTemplates] = useState([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [cloudMessage, setCloudMessage] = useState({ text: '', type: '' });

  const canvasRef = useRef(null);
  const hitBoxes = useRef({ product: null, title: null, icon: null, tags: [], deco: null });
  const dragInfo = useRef({ isDragging: false, target: null, startX: 0, startY: 0, initialOffset: {x:0, y:0} });

  const BANNED_WORDS = ['第一', '最強', '最優', '療效', '根治', '殺頭價', '保證見效'];

  // 🎨 視覺模板清單
  const TEMPLATES = {
    LightSoft: { name: '柔和明亮框', desc: '純白底+微漸層點綴' },
    LightClean: { name: '極簡亮白底', desc: '乾淨無框+底部色條' },
    TechBright: { name: '科技亮色切角', desc: '幾何裝飾+明亮質感' },
    CyberNeon: { name: '霓虹電競風', desc: '深色底+螢光科技邊框' },
    PremiumGold: { name: '奢華質感風', desc: '極簡莫蘭迪底+優雅雙框' },
    None: { name: '純淨白圖', desc: '僅商品與純白背景' }
  };

  const saveHistorySnapshot = () => {
    const stateSnapshot = { productOffset, titleOffset, iconOffset, tagOffsets, decoOffsets, rotations, productScale, brandScale, textScale, tagScale, iconScale, primaryColor, accentColor, textColor, cyberBgMode };
    historyRef.current = historyRef.current.slice(0, historyIndex.current + 1);
    historyRef.current.push(JSON.stringify(stateSnapshot));
    if (historyRef.current.length > 30) historyRef.current.shift(); 
    else historyIndex.current++;
  };

  const handleUndo = () => {
    if (historyIndex.current > 0) {
        historyIndex.current--;
        applyHistoryState(JSON.parse(historyRef.current[historyIndex.current]));
    }
  };

  const handleRedo = () => {
    if (historyIndex.current < historyRef.current.length - 1) {
        historyIndex.current++;
        applyHistoryState(JSON.parse(historyRef.current[historyIndex.current]));
    }
  };

  const applyHistoryState = (state) => {
    setProductOffset(state.productOffset); setTitleOffset(state.titleOffset); setIconOffset(state.iconOffset);
    setTagOffsets(state.tagOffsets); setDecoOffsets(state.decoOffsets); setRotations(state.rotations);
    setProductScale(state.productScale); setBrandScale(state.brandScale); setTextScale(state.textScale);
    setTagScale(state.tagScale); setIconScale(state.iconScale);
    setCyberBgMode(state.cyberBgMode || 'dark');
    if(state.primaryColor) setPrimaryColor(state.primaryColor);
    if(state.accentColor) setAccentColor(state.accentColor);
    if(state.textColor) setTextColor(state.textColor);
  };

  useEffect(() => { if (historyRef.current.length === 0) saveHistorySnapshot(); }, []);

  // --- 💡 智慧模板與色彩預設切換 ---
  const handleTemplateChange = (t) => {
      setTemplate(t);
      if (t === 'CyberNeon') {
          setPrimaryColor('#00f6ff'); 
          setAccentColor('#bc13fe');  
          setTextColor(cyberBgMode === 'dark' ? '#ffffff' : '#1e293b');    
      } else if (t === 'PremiumGold') {
          setPrimaryColor('#d4af37'); 
          setAccentColor('#8c7b66');  
          setTextColor('#2c3e50');    
      } else if (t === 'LightSoft' || t === 'LightClean' || t === 'TechBright') {
          setPrimaryColor(THEMES[platform].main); 
          setTextColor('#1e293b');
      }
      setTimeout(saveHistorySnapshot, 50);
  };

  const handleCyberBgToggle = (mode) => {
      setCyberBgMode(mode);
      setTextColor(mode === 'dark' ? '#ffffff' : '#1e293b');
      setTimeout(saveHistorySnapshot, 50);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey) {
          if (e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); return; }
          if (e.key.toLowerCase() === 'y') { e.preventDefault(); handleRedo(); return; }
      }
      if (activeLayer) {
          const step = e.shiftKey ? 10 : 1;
          let dx = 0, dy = 0;
          if (e.key === 'ArrowUp') dy = -step;
          else if (e.key === 'ArrowDown') dy = step;
          else if (e.key === 'ArrowLeft') dx = -step;
          else if (e.key === 'ArrowRight') dx = step;

          if (dx !== 0 || dy !== 0) {
              e.preventDefault();
              if (activeLayer.type === 'product') setProductOffset(p => ({ x: p.x + dx, y: p.y + dy }));
              else if (activeLayer.type === 'title') setTitleOffset(p => ({ x: p.x + dx, y: p.y + dy }));
              else if (activeLayer.type === 'icon') setIconOffset(p => ({ x: p.x + dx, y: p.y + dy }));
              else if (activeLayer.type === 'tag') setTagOffsets(p => { const next = [...p]; next[activeLayer.index] = { x: p[activeLayer.index].x + dx, y: p[activeLayer.index].y + dy }; return next; });
              else if (activeLayer.type === 'deco') setDecoOffsets(p => ({ ...p, [activeLayer.key]: { x: p[activeLayer.key].x + dx, y: p[activeLayer.key].y + dy } }));
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLayer]);

  useEffect(() => {
    const handleKeyUp = (e) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && activeLayer) saveHistorySnapshot(); };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [activeLayer, productOffset, titleOffset, iconOffset, tagOffsets, decoOffsets]);


  useEffect(() => {
    const savedUrl = localStorage.getItem('ManiFactory_GAS_URL');
    if (savedUrl) setGasUrl(savedUrl);
    
    const savedBgKey = localStorage.getItem('ManiFactory_RemoveBg_Key');
    if (savedBgKey) { setRemoveBgApiKey(savedBgKey); setEnableRemoveBgApi(true); }

    const currentMonth = new Date().toISOString().slice(0, 7); 
    const savedMonth = localStorage.getItem('ManiFactory_RemoveBg_Month');
    const savedCount = parseInt(localStorage.getItem('ManiFactory_RemoveBg_Count') || '0', 10);

    if (savedMonth !== currentMonth) {
        localStorage.setItem('ManiFactory_RemoveBg_Month', currentMonth);
        localStorage.setItem('ManiFactory_RemoveBg_Count', '0');
        setBgRemovalCount(0);
    } else setBgRemovalCount(savedCount);
  }, []);

  useEffect(() => {
    const tagsCount = tagsInput.split(',').filter(t => t.trim()).length;
    setTagOffsets(prev => {
        if (prev.length >= tagsCount) return prev;
        const newOffsets = [...prev];
        while(newOffsets.length < tagsCount) newOffsets.push({x: 0, y: 0});
        return newOffsets;
    });
  }, [tagsInput]);

  const checkCompliance = (text) => {
    const detected = BANNED_WORDS.filter(word => text.includes(word));
    return { safe: detected.length === 0, words: detected };
  };

  const executeRemoveBg = async (base64Img) => {
      if (!removeBgApiKey) { alert('請先輸入 Remove.bg API Key！'); return; }
      setIsRemovingBg(true);
      try {
          const res = await fetch(base64Img);
          const blob = await res.blob();
          const formData = new FormData();
          formData.append('image_file', blob);
          formData.append('size', 'auto');

          const apiRes = await fetch('https://api.remove.bg/v1.0/removebg', { method: 'POST', headers: { 'X-Api-Key': removeBgApiKey }, body: formData });
          if (!apiRes.ok) throw new Error((await apiRes.json()).errors?.[0]?.title || '去背失敗');

          const reader = new FileReader();
          reader.onloadend = () => {
              setImage(reader.result); setIsRemovingBg(false);
              setBgRemovalCount(prev => { const n = prev + 1; localStorage.setItem('ManiFactory_RemoveBg_Count', n.toString()); return n; });
          };
          reader.readAsDataURL(await apiRes.blob());
      } catch (err) { alert(`Remove.bg API 錯誤: ${err.message}`); setIsRemovingBg(false); setImage(base64Img); }
  };

  const processUpload = (file) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (f) => { setRawImage(f.target.result); setImage(f.target.result); if (enableRemoveBgApi && removeBgApiKey) executeRemoveBg(f.target.result); };
        reader.readAsDataURL(file);
      }
  };

  const handleImageUpload = (e) => { processUpload(e.target.files[0]); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragActive(false); processUpload(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragActive(false); };
  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader(); reader.onload = (f) => setIconImage(f.target.result); reader.readAsDataURL(file);
    }
  };

  const roundRect = (ctx, x, y, width, height, radius, stroke = false) => {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
    stroke ? ctx.stroke() : ctx.fill();
  };

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const saveToGAS = async () => {
    if (!gasUrl) { setCloudMessage({ text: '請先輸入 GAS 網址！', type: 'error' }); return; }
    if (!projectName.trim()) { setCloudMessage({ text: '請輸入樣板名稱！', type: 'error' }); return; }
    localStorage.setItem('ManiFactory_GAS_URL', gasUrl);
    setIsSaving(true); setCloudMessage({ text: '正在上傳參數與圖片至 Google Drive...', type: 'info' });

    const payload = {
      projectName, platform, template, removeBg, primaryColor, accentColor, textColor,
      logoText, brandText, promoText, tagsInput, isAiDisclosure, tagShape, showLogo, showTitle, showTags,
      titleFont, tagFont, productScale, brandScale, textScale, tagScale, iconScale, 
      productOffset, titleOffset, iconOffset, tagOffsets, decoOffsets, rotations, cyberBgMode,
      imageBase64: image, iconImageBase64: iconImage
    };

    try {
      const response = await fetch(gasUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'save', payload: payload }) });
      const result = await response.json();
      if (result.status === 'success') {
        setCloudMessage({ text: `儲存成功！(${result.data.projectName})`, type: 'success' }); setTimeout(() => setCloudMessage({ text: '', type: '' }), 3000);
      } else setCloudMessage({ text: '儲存失敗: ' + result.message, type: 'error' });
    } catch (err) { setCloudMessage({ text: '連線失敗，請檢查網址或網路狀態。', type: 'error' }); } 
    finally { setIsSaving(false); }
  };

  const loadFromGAS = async () => {
    if (!gasUrl) { setCloudMessage({ text: '請先輸入 GAS 網址！', type: 'error' }); return; }
    setIsLoadingList(true); setShowLoadMenu(true);
    try {
      const response = await fetch(gasUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'load' }) });
      const result = await response.json();
      if (result.status === 'success') setCloudTemplates(result.data.templates);
      else setCloudMessage({ text: '讀取失敗: ' + result.message, type: 'error' });
    } catch (err) { setCloudMessage({ text: '無法讀取樣板列表。', type: 'error' }); } 
    finally { setIsLoadingList(false); }
  };

  const applyTemplate = async (params) => {
    setPlatform(params.platform); setTemplate(params.template); setRemoveBg(params.removeBg);
    setPrimaryColor(params.primaryColor); setAccentColor(params.accentColor); setTextColor(params.textColor);
    setLogoText(params.logoText || 'BRAND'); setBrandText(params.brandText); setPromoText(params.promoText); setTagsInput(params.tagsInput);
    setIsAiDisclosure(params.isAiDisclosure); setTagShape(params.tagShape); setShowLogo(params.showLogo);
    setShowTitle(params.showTitle); setShowTags(params.showTags); setTitleFont(params.titleFont);
    setTagFont(params.tagFont); setProductScale(params.productScale); setBrandScale(params.brandScale || 100); setTextScale(params.textScale);
    setTagScale(params.tagScale); setIconScale(params.iconScale); setTitleOffset(params.titleOffset);
    setIconOffset(params.iconOffset); setTagOffsets(params.tagOffsets);
    setProductOffset(params.productOffset || { x: 0, y: params.productOffsetY || 0 });
    setDecoOffsets(params.decoOffsets || { frame: { x: 0, y: 0 }, bars: { x: 0, y: 0 }, poly: { x: 0, y: 0 }, cyber: {x:0, y:0}, premium: {x:0, y:0} });
    setRotations(params.rotations || { product: 0, title: 0, icon: 0, deco: 0 });
    setCyberBgMode(params.cyberBgMode || 'dark');

    if (params.savedMainImageUrl) { setImage(params.savedMainImageUrl); setRawImage(params.savedMainImageUrl); }
    if (params.savedIconImageUrl) setIconImage(params.savedIconImageUrl);

    setShowLoadMenu(false); setCloudMessage({ text: '已成功套用樣板！', type: 'success' });
    setTimeout(() => setCloudMessage({ text: '', type: '' }), 3000);
    setTimeout(() => saveHistorySnapshot(), 100); 
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e) => {
    if (!activeTheme.allowText) {
        const { x, y } = getMousePos(e);
        const boxes = hitBoxes.current;
        if (!lockedLayers.product && image && boxes.product && x >= boxes.product.x && x <= boxes.product.x + boxes.product.w && y >= boxes.product.y && y <= boxes.product.y + boxes.product.h) {
            dragInfo.current = { isDragging: true, target: { type: 'product' }, startX: x, startY: y, initialOffset: productOffset };
            setActiveLayer({ type: 'product' }); return;
        }
        setActiveLayer(null); return; 
    }
    
    const { x, y } = getMousePos(e);
    const boxes = hitBoxes.current;
    let clickedSomething = false;

    if (!lockedLayers.icon && iconImage && boxes.icon && x >= boxes.icon.x && x <= boxes.icon.x + boxes.icon.w && y >= boxes.icon.y && y <= boxes.icon.y + boxes.icon.h) {
        dragInfo.current = { isDragging: true, target: { type: 'icon' }, startX: x, startY: y, initialOffset: iconOffset }; 
        setActiveLayer({ type: 'icon' }); clickedSomething = true;
    } else {
        if (!clickedSomething) {
            for (let i = boxes.tags.length - 1; i >= 0; i--) {
                const box = boxes.tags[i];
                if (box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
                    dragInfo.current = { isDragging: true, target: { type: 'tag', index: i }, startX: x, startY: y, initialOffset: tagOffsets[i] || {x:0, y:0} }; 
                    setActiveLayer({ type: 'tag', index: i }); clickedSomething = true; break;
                }
            }
        }
        if (!clickedSomething && !lockedLayers.title && showTitle && boxes.title && x >= boxes.title.x && x <= boxes.title.x + boxes.title.w && y >= boxes.title.y && y <= boxes.title.y + boxes.title.h) {
            dragInfo.current = { isDragging: true, target: { type: 'title' }, startX: x, startY: y, initialOffset: titleOffset }; 
            setActiveLayer({ type: 'title' }); clickedSomething = true;
        }
        if (!clickedSomething && !lockedLayers.product && image && boxes.product && x >= boxes.product.x && x <= boxes.product.x + boxes.product.w && y >= boxes.product.y && y <= boxes.product.y + boxes.product.h) {
            dragInfo.current = { isDragging: true, target: { type: 'product' }, startX: x, startY: y, initialOffset: productOffset }; 
            setActiveLayer({ type: 'product' }); clickedSomething = true;
        }
        if (!clickedSomething && !lockedLayers.deco && boxes.deco && x >= boxes.deco.x && x <= boxes.deco.x + boxes.deco.w && y >= boxes.deco.y && y <= boxes.deco.y + boxes.deco.h) {
            const key = boxes.deco.key;
            dragInfo.current = { isDragging: true, target: { type: 'deco', key: key }, startX: x, startY: y, initialOffset: decoOffsets[key] || {x:0, y:0} }; 
            setActiveLayer({ type: 'deco', key: key }); clickedSomething = true;
        }
    }

    if (!clickedSomething) setActiveLayer(null);
  };

  const handleMouseMove = (e) => {
    if (!activeTheme.allowText && !dragInfo.current.isDragging) return;

    const { x, y } = getMousePos(e);
    
    if (dragInfo.current.isDragging) {
        const dx = x - dragInfo.current.startX;
        const dy = y - dragInfo.current.startY;
        const { target, initialOffset } = dragInfo.current;
        
        let newX = initialOffset.x + dx;
        let newY = initialOffset.y + dy;

        const SNAP_TOL = 12; let isSnapped = false;
        if (Math.abs(newX) < SNAP_TOL) { newX = 0; isSnapped = true; }
        if (Math.abs(newY) < SNAP_TOL) { newY = 0; isSnapped = true; }
        
        setGuideLines({ active: isSnapped, x: newX === 0 ? 400 : null, y: newY === 0 ? 400 : null });

        if (target.type === 'title') setTitleOffset({ x: newX, y: newY });
        else if (target.type === 'icon') setIconOffset({ x: newX, y: newY });
        else if (target.type === 'tag') {
            setTagOffsets(prev => { const next = [...prev]; next[target.index] = { x: newX, y: newY }; return next; });
        }
        else if (target.type === 'product') setProductOffset({ x: newX, y: newY });
        else if (target.type === 'deco') {
            setDecoOffsets(prev => ({ ...prev, [target.key]: { x: newX, y: newY } }));
        }
        
        canvasRef.current.style.cursor = 'grabbing'; return;
    }

    let isHovering = false;
    const boxes = hitBoxes.current;
    
    if (!lockedLayers.icon && iconImage && boxes.icon && x >= boxes.icon.x && x <= boxes.icon.x + boxes.icon.w && y >= boxes.icon.y && y <= boxes.icon.y + boxes.icon.h) isHovering = true;
    if (!isHovering && !lockedLayers.title && showTitle && boxes.title && x >= boxes.title.x && x <= boxes.title.x + boxes.title.w && y >= boxes.title.y && y <= boxes.title.y + boxes.title.h) isHovering = true;
    if (!isHovering) {
        for (let i = 0; i < boxes.tags.length; i++) {
            const box = boxes.tags[i];
            if (box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) { isHovering = true; break; }
        }
    }
    if (!isHovering && !lockedLayers.product && image && boxes.product && x >= boxes.product.x && x <= boxes.product.x + boxes.product.w && y >= boxes.product.y && y <= boxes.product.y + boxes.product.h) isHovering = true;
    if (!isHovering && !lockedLayers.deco && boxes.deco && x >= boxes.deco.x && x <= boxes.deco.x + boxes.deco.w && y >= boxes.deco.y && y <= boxes.deco.y + boxes.deco.h) isHovering = true;

    canvasRef.current.style.cursor = isHovering ? 'grab' : 'default';
  };

  const handleMouseUpOrLeave = () => { 
      if (dragInfo.current.isDragging) { saveHistorySnapshot(); }
      dragInfo.current.isDragging = false; 
      setGuideLines({x: null, y: null, active: false});
      if (canvasRef.current) canvasRef.current.style.cursor = 'default'; 
  };

  const handleWheel = (e) => {
      if (!activeLayer) return;
      if (e.shiftKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? 5 : -5;
          setRotations(prev => {
              if (activeLayer.type === 'product' || activeLayer.type === 'title' || activeLayer.type === 'icon' || activeLayer.type === 'deco') {
                  return { ...prev, [activeLayer.type]: (prev[activeLayer.type] || 0) + delta };
              }
              return prev;
          });
      }
  };

  const resetPositions = () => { 
      setTitleOffset({x: 0, y: 0}); setIconOffset({x: 150, y: -150}); 
      setTagOffsets(tagOffsets.map(() => ({x: 0, y: 0}))); setProductOffset({x: 0, y: 0}); 
      setDecoOffsets({ frame: {x:0, y:0}, bars: {x:0, y:0}, poly: {x:0, y:0}, cyber: {x:0, y:0}, premium: {x:0, y:0} });
      setRotations({ product: 0, title: 0, icon: 0, deco: 0 });
      setTimeout(() => saveHistorySnapshot(), 50);
  };

  const toggleLock = (layerName) => {
      setLockedLayers(p => ({...p, [layerName]: !p[layerName]}));
      if (activeLayer?.type === layerName) setActiveLayer(null); 
  };

  // --- 畫布繪製邏輯 ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    hitBoxes.current = { product: null, title: null, icon: null, tags: [], deco: null };

    const loadImg = (src) => new Promise((resolve) => {
        const img = new Image(); img.crossOrigin = "Anonymous"; 
        img.onload = () => resolve(img); img.onerror = () => resolve(null); 
        img.src = src;
    });

    const drawWithRotation = (ctx, x, y, w, h, angle, drawFn, layerType, layerKey) => {
        ctx.save();
        const cx = x + w/2; const cy = y + h/2;
        ctx.translate(cx, cy);
        if (angle) ctx.rotate(angle * Math.PI / 180);
        
        drawFn(ctx, -w/2, -h/2, w, h);

        const isActive = activeLayer?.type === layerType && (layerKey === undefined || activeLayer?.key === layerKey);
        if (isActive) {
            ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
            ctx.strokeRect(-w/2 - 5, -h/2 - 5, w + 10, h + 10); ctx.setLineDash([]);
        }
        ctx.restore();
        return { x, y, w, h }; 
    };

    const renderCanvas = async () => {
        ctx.clearRect(0, 0, width, height);
        
        const isMomoOrYahooMall = !THEMES[platform].allowText;
        const currentTemplate = isMomoOrYahooMall ? 'None' : template;

        // 🎨 背景層填充
        if (currentTemplate === 'CyberNeon') {
            ctx.fillStyle = cyberBgMode === 'dark' ? '#0f172a' : '#f0f4f8'; // 電競底色切換
        } else if (currentTemplate === 'PremiumGold') {
            ctx.fillStyle = '#faf9f6'; // 燕麥白
        } else {
            ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillRect(0, 0, width, height);

        const mImg = image ? await loadImg(image) : null;
        const iImg = iconImage ? await loadImg(iconImage) : null;

        // 1. 繪製圖層化背景裝飾
        if (currentTemplate === 'LightSoft') {
            const grad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width);
            grad.addColorStop(0, 'rgba(255,255,255,0)'); grad.addColorStop(1, hexToRgba(primaryColor, 0.08)); 
            ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
            
            const fOff = decoOffsets.frame || {x:0, y:0};
            const fw = width - 30; const fh = height - 30;
            const fx = 15 + fOff.x; const fy = 15 + fOff.y;
            
            drawWithRotation(ctx, fx, fy, fw, fh, rotations.deco, (c, x, y, w, h) => {
                c.strokeStyle = hexToRgba(primaryColor, 0.2); c.lineWidth = 15; c.strokeRect(x, y, w, h);
            }, 'deco', 'frame');
            hitBoxes.current.deco = { key: 'frame', x: fx, y: fy, w: fw, h: fh };
            
        } else if (currentTemplate === 'LightClean') {
             const bOff = decoOffsets.bars || {x:0, y:0};
             const bx = bOff.x; const by = height - 150 + bOff.y;
             
             drawWithRotation(ctx, bx, by, width, 150, rotations.deco, (c, x, y, w, h) => {
                 const grad = c.createLinearGradient(0, y, 0, y + h);
                 grad.addColorStop(0, 'rgba(255,255,255,0)'); grad.addColorStop(1, hexToRgba(primaryColor, 0.15));
                 c.fillStyle = grad; c.fillRect(x, y, w, h);
             }, 'deco', 'bars');
             hitBoxes.current.deco = { key: 'bars', x: bx, y: by, w: width, h: 150 };

        } else if (currentTemplate === 'TechBright') {
            const pOff = decoOffsets.poly || {x:0, y:0};
            const px = pOff.x; const py = pOff.y;
            
            drawWithRotation(ctx, 100 + px, height - 150 + py, width - 100, 150, rotations.deco, (c, x, y, w, h) => {
                c.fillStyle = hexToRgba(primaryColor, 0.1); c.beginPath();
                c.moveTo(x, y + h); c.lineTo(x + 150, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); 
                c.closePath(); c.fill();
            }, 'deco', 'poly');
            hitBoxes.current.deco = { key: 'poly', x: 100 + px, y: height - 150 + py, w: width - 100, h: 150 };

        } else if (currentTemplate === 'CyberNeon') {
            const cOff = decoOffsets.cyber || {x:0, y:0};
            const cx = 30 + cOff.x; const cy = 30 + cOff.y;
            const cw = width - 60; const ch = height - 60;
            
            drawWithRotation(ctx, cx, cy, cw, ch, rotations.deco, (c, x, y, w, h) => {
                c.strokeStyle = primaryColor; c.lineWidth = 3;
                c.shadowColor = primaryColor; c.shadowBlur = cyberBgMode === 'dark' ? 15 : 8; 
                c.strokeRect(x, y, w, h);
                c.beginPath(); c.moveTo(x - 15, y + 40); c.lineTo(x, y + 40); c.stroke();
                c.beginPath(); c.moveTo(x - 15, y + h - 40); c.lineTo(x, y + h - 40); c.stroke();
                c.beginPath(); c.moveTo(x + w + 15, y + 40); c.lineTo(x + w, y + 40); c.stroke();
                c.shadowBlur = 0; 
            }, 'deco', 'cyber');
            hitBoxes.current.deco = { key: 'cyber', x: cx, y: cy, w: cw, h: ch };

        } else if (currentTemplate === 'PremiumGold') {
            const pOff = decoOffsets.premium || {x:0, y:0};
            const px = 40 + pOff.x; const py = 40 + pOff.y;
            const pw = width - 80; const ph = height - 80;
            
            drawWithRotation(ctx, px, py, pw, ph, rotations.deco, (c, x, y, w, h) => {
                c.strokeStyle = primaryColor; 
                c.lineWidth = 1; c.strokeRect(x, y, w, h); 
                c.lineWidth = 0.5; c.strokeRect(x + 10, y + 10, w - 20, h - 20); 
            }, 'deco', 'premium');
            hitBoxes.current.deco = { key: 'premium', x: px, y: py, w: pw, h: ph };
        }

        // 2. 商品主體層
        let baseScale = 0.75; let baseYOffset = showTitle ? 20 : 0;
        if (currentTemplate === 'TechBright' || currentTemplate === 'CyberNeon') { baseScale = 0.65; baseYOffset = showTitle ? -20 : 0; }

        const finalScale = baseScale * (productScale / 100);
        const w = width * finalScale;
        const h = (mImg && mImg.width) ? ((mImg.height / mImg.width) * w) : w;
        const x = (width - w) / 2 + (currentTemplate === 'TechBright' ? 60 : 0) + productOffset.x;
        const y = (height - h) / 2 + baseYOffset + productOffset.y;

        if (mImg) hitBoxes.current.product = { x, y, w, h };
        
        drawWithRotation(ctx, x, y, w, h, rotations.product, (c, dx, dy, dw, dh) => {
            if (currentTemplate === 'CyberNeon') {
                const cx = dx + dw/2; const cy = dy + dh/2;
                const radius = Math.max(dw, dh) * 0.7;
                const glowGrad = c.createRadialGradient(cx, cy, 0, cx, cy, radius);
                
                // 深/淺底光暈透明度微調
                const op1 = cyberBgMode === 'dark' ? 0.4 : 0.25;
                const op2 = cyberBgMode === 'dark' ? 0.15 : 0.1;
                const bgEnd = cyberBgMode === 'dark' ? 'rgba(15, 23, 42, 0)' : 'rgba(240, 244, 248, 0)';
                
                glowGrad.addColorStop(0, hexToRgba(primaryColor, op1));
                glowGrad.addColorStop(0.5, hexToRgba(accentColor, op2));
                glowGrad.addColorStop(1, bgEnd);
                c.fillStyle = glowGrad;
                c.beginPath(); c.arc(cx, cy, radius, 0, Math.PI * 2); c.fill();
            }

            if (mImg) { 
                if (removeBg) {
                    if (currentTemplate === 'CyberNeon') {
                        c.shadowColor = primaryColor; c.shadowBlur = cyberBgMode === 'dark' ? 40 : 25; c.shadowOffsetY = 0;
                    } else {
                        c.shadowColor = 'rgba(0,0,0,0.08)'; c.shadowBlur = 30; c.shadowOffsetY = 15;
                    }
                }
                c.drawImage(mImg, dx, dy, dw, dh); 
                c.shadowBlur = 0; c.shadowOffsetY = 0; 
            } 
            else {
                c.fillStyle = '#f8fafc'; c.fillRect(dx, dy, dw, dh); c.strokeStyle = '#e2e8f0'; c.strokeRect(dx, dy, dw, dh);
                c.fillStyle = '#94a3b8'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '20px sans-serif';
                c.fillText('請上傳商品圖', dx + dw/2, dy + dh/2); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
            }
        }, 'product');

        // 3. 裝飾與文字層 
        if (!isMomoOrYahooMall) {
            const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
            const actualTextScale = textScale / 100;
            const actualTagScale = tagScale / 100;
            const actualBrandScale = brandScale / 100;

            if (currentTemplate === 'LightSoft' || currentTemplate === 'LightClean') {
                if (showLogo && brandText) {
                    const badgeFontSize = 18 * actualBrandScale;
                    ctx.font = `bold ${badgeFontSize}px "${titleFont}"`;
                    const textMetrics = ctx.measureText(brandText);
                    const textW = textMetrics.width + (60 * actualBrandScale);
                    const badgeH = 50 * actualBrandScale; const radius = 15 * actualBrandScale; const badgeY = -10;
                    ctx.fillStyle = primaryColor; roundRect(ctx, width/2 - textW/2, badgeY, textW, badgeH, radius);
                    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
                    ctx.fillText(brandText, width/2, badgeY + badgeH/2 + (2 * actualBrandScale)); ctx.textBaseline = 'alphabetic';
                }
                if (showTitle) {
                    const fontSize = 36 * actualTextScale;
                    ctx.font = `900 ${fontSize}px "${titleFont}"`;
                    const metrics = ctx.measureText(promoText);
                    const tW = metrics.width; const tH = fontSize;
                    
                    const baseTx = width/2; const baseTy = showLogo ? 90 : 60;
                    const finalTx = baseTx + titleOffset.x - tW/2; const finalTy = baseTy + titleOffset.y - tH/2;
                    
                    drawWithRotation(ctx, finalTx, finalTy, tW, tH, rotations.title, (c, dx, dy, dw, dh) => {
                        c.fillStyle = textColor; c.textAlign = 'center'; c.textBaseline = 'middle';
                        c.fillText(promoText, dx + dw/2, dy + dh/2); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
                    }, 'title');
                    hitBoxes.current.title = { x: finalTx, y: finalTy, w: tW, h: tH };
                }

                if (currentTemplate === 'LightClean') {
                    const bx = decoOffsets.bars?.x || 0; const barBy = height - 30 + (decoOffsets.bars?.y || 0);
                    ctx.fillStyle = accentColor; ctx.fillRect(bx, barBy, width, 30);
                    ctx.fillStyle = primaryColor; ctx.fillRect(bx, barBy - 15, width, 15);
                }

            } else if (currentTemplate === 'TechBright') {
                if (showLogo && (logoText || brandText)) {
                    const logoFontSize = 24 * actualBrandScale; const subFontSize = 16 * actualBrandScale;
                    const baseX = 30; const baseY = 50 * Math.max(1, actualBrandScale);
                    ctx.fillStyle = textColor; ctx.font = `900 ${logoFontSize}px "${titleFont}"`; ctx.fillText(logoText, baseX, baseY);
                    const logoMetrics = ctx.measureText(logoText);
                    const gap = logoText ? (10 * actualBrandScale) : 0; const pipeX = baseX + logoMetrics.width + gap;
                    ctx.fillStyle = primaryColor; ctx.font = `bold ${subFontSize}px "${titleFont}"`; 
                    ctx.fillText(`${logoText ? '| ' : ''}${brandText}`, pipeX, baseY - (2 * actualBrandScale));
                }
                
                if (showTitle) {
                    const fontSize = 28 * actualTextScale;
                    ctx.font = `bold ${fontSize}px "${titleFont}"`;
                    const tW = ctx.measureText(promoText).width; const tH = fontSize + 10;
                    const finalTx = 170 + titleOffset.x; const finalTy = height - 40 + titleOffset.y;
                    
                    drawWithRotation(ctx, finalTx, finalTy - tH + 5, Math.max(150, tW), tH + 30, rotations.title, (c, dx, dy, dw, dh) => {
                        c.fillStyle = primaryColor; c.fillRect(dx, dy + 20, 150, 45);
                        c.fillStyle = '#FFFFFF'; c.font = `bold ${20 * actualTextScale}px "${titleFont}"`; c.fillText('嚴選推薦', dx + 20, dy + 50);
                        c.fillStyle = textColor; c.font = `bold ${fontSize}px "${titleFont}"`; c.textBaseline = 'alphabetic'; 
                        c.fillText(promoText, dx + 170, dy + 45 + (fontSize/2));
                    }, 'title');
                    hitBoxes.current.title = { x: finalTx, y: finalTy - fontSize, w: Math.max(150, tW), h: tH + 10 };
                }

            } else if (currentTemplate === 'CyberNeon') {
                if (showLogo && (logoText || brandText)) {
                    const logoFontSize = 20 * actualBrandScale;
                    const tx = 45; const ty = 50 * Math.max(1, actualBrandScale);
                    ctx.fillStyle = primaryColor; ctx.font = `italic 900 ${logoFontSize}px "${titleFont}"`;
                    ctx.shadowColor = primaryColor; ctx.shadowBlur = cyberBgMode === 'dark' ? 10 : 5;
                    ctx.fillText(`${logoText} ${brandText}`, tx, ty);
                    ctx.shadowBlur = 0;
                }
                if (showTitle) {
                    const fontSize = 38 * actualTextScale;
                    ctx.font = `italic 900 ${fontSize}px "${titleFont}"`;
                    const tW = ctx.measureText(promoText).width; const tH = fontSize + 10;
                    const finalTx = width/2 + titleOffset.x - tW/2; const finalTy = height - 100 + titleOffset.y - tH/2;
                    
                    drawWithRotation(ctx, finalTx, finalTy, tW, tH, rotations.title, (c, dx, dy, dw, dh) => {
                        c.fillStyle = textColor; c.shadowColor = accentColor; c.shadowBlur = cyberBgMode === 'dark' ? 15 : 8;
                        c.textAlign = 'center'; c.textBaseline = 'middle';
                        c.fillText(promoText, dx + dw/2, dy + dh/2);
                        c.shadowBlur = 0; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
                    }, 'title');
                    hitBoxes.current.title = { x: finalTx, y: finalTy, w: tW, h: tH };
                }

            } else if (currentTemplate === 'PremiumGold') {
                if (showLogo && brandText) {
                    const badgeFontSize = 16 * actualBrandScale;
                    ctx.font = `${badgeFontSize}px "${titleFont}"`; 
                    ctx.fillStyle = textColor; ctx.textAlign = 'center';
                    ctx.fillText(brandText, width/2, 70 * actualBrandScale);
                    ctx.textAlign = 'left';
                }
                if (showTitle) {
                    const fontSize = 32 * actualTextScale;
                    ctx.font = `300 ${fontSize}px "${titleFont}"`; 
                    const tW = ctx.measureText(promoText).width; const tH = fontSize + 10;
                    const finalTx = width/2 + titleOffset.x - tW/2; const finalTy = height - 120 + titleOffset.y - tH/2;
                    
                    drawWithRotation(ctx, finalTx, finalTy, tW, tH, rotations.title, (c, dx, dy, dw, dh) => {
                        c.fillStyle = textColor; c.textAlign = 'center'; c.textBaseline = 'middle';
                        c.fillText(promoText, dx + dw/2, dy + dh/2);
                        c.textBaseline = 'alphabetic'; c.textAlign = 'left';
                    }, 'title');
                    hitBoxes.current.title = { x: finalTx, y: finalTy, w: tW, h: tH };
                }
            }

            // 共同標籤
            if (showTags) {
                const isPremium = currentTemplate === 'PremiumGold';
                const isCyber = currentTemplate === 'CyberNeon';
                
                let tagBaseY = currentTemplate === 'LightSoft' ? height - 90 : height - 120;
                if (isCyber) tagBaseY = 120; 
                if (isPremium) tagBaseY = height - 70; 

                const tagHeight = (isPremium ? 35 : 45) * actualTagScale;
                let totalTagsWidth = 0;
                ctx.font = `bold ${isPremium ? 16 : 20 * actualTagScale}px "${tagFont}"`;
                const tagPaddings = [];
                tags.forEach(tag => { const tw = ctx.measureText(tag).width + (isPremium ? 30 : 40 * actualTagScale); totalTagsWidth += tw + 15; tagPaddings.push(tw); });
                totalTagsWidth -= 15;

                let startX = (width - totalTagsWidth) / 2;
                tags.forEach((tag, i) => {
                    const offset = tagOffsets[i] || {x: 0, y: 0};
                    const currentX = startX + offset.x; const currentY = tagBaseY + offset.y;
                    
                    let radius = tagShape === 'pill' ? (tagHeight/2) : (tagShape === 'rect' ? 8 : (tagHeight/2));
                    if (isPremium) radius = 0; 

                    hitBoxes.current.tags[i] = { x: currentX, y: currentY, w: tagPaddings[i], h: tagHeight };
                    
                    const isActive = activeLayer?.type === 'tag' && activeLayer?.index === i;
                    if (isActive) { ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.strokeRect(currentX - 2, currentY - 2, tagPaddings[i] + 4, tagHeight + 4); ctx.setLineDash([]); }

                    if (tagShape === 'outline' || isPremium) {
                        ctx.strokeStyle = isPremium ? primaryColor : accentColor; ctx.lineWidth = isPremium ? 1 : 2.5;
                        if(isCyber) { ctx.shadowColor = accentColor; ctx.shadowBlur = cyberBgMode === 'dark' ? 10 : 5; }
                        roundRect(ctx, currentX, currentY, tagPaddings[i], tagHeight, radius, true);
                        ctx.shadowBlur = 0; ctx.fillStyle = isPremium ? textColor : accentColor;
                    } else {
                        ctx.fillStyle = accentColor; 
                        if(isCyber) { ctx.shadowColor = accentColor; ctx.shadowBlur = cyberBgMode === 'dark' ? 15 : 8; }
                        roundRect(ctx, currentX, currentY, tagPaddings[i], tagHeight, radius, false);
                        ctx.shadowBlur = 0; ctx.fillStyle = '#FFFFFF';
                    }
                    ctx.textAlign = 'center'; ctx.fillText(tag, currentX + tagPaddings[i]/2, currentY + (tagHeight * 0.68));
                    startX += tagPaddings[i] + 15; 
                });
                ctx.textAlign = 'left';
            }

            // 外部圖示
            if (iImg) {
                const iW = width * (iconScale / 100); const iH = (iImg.height / iImg.width) * iW;
                const ix = (width / 2) - (iW / 2) + iconOffset.x; const iy = (height / 2) - (iH / 2) + iconOffset.y;
                drawWithRotation(ctx, ix, iy, iW, iH, rotations.icon, (c, dx, dy, dw, dh) => {
                    c.drawImage(iImg, dx, dy, dw, dh);
                }, 'icon');
                hitBoxes.current.icon = { x: ix, y: iy, w: iW, h: iH };
            }
        }

        if (isAiDisclosure) {
          ctx.fillStyle = 'rgba(150, 150, 150, 0.6)'; ctx.font = '11px Arial'; ctx.fillText('AI Generated', width - 85, 20);
        }
        
        if (guideLines.active) {
            ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
            if (guideLines.x) { ctx.beginPath(); ctx.moveTo(width/2, 0); ctx.lineTo(width/2, height); ctx.stroke(); }
            if (guideLines.y) { ctx.beginPath(); ctx.moveTo(0, height/2); ctx.lineTo(width, height/2); ctx.stroke(); }
            ctx.setLineDash([]);
        }
    };
    renderCanvas();
  }, [image, iconImage, platform, template, promoText, tagsInput, brandText, logoText, isAiDisclosure, removeBg, primaryColor, accentColor, textColor, productScale, brandScale, textScale, tagScale, tagShape, showLogo, showTitle, showTags, titleFont, tagFont, iconScale, titleOffset, iconOffset, tagOffsets, productOffset, decoOffsets, activeLayer, rotations, guideLines, cyberBgMode]);

  const complianceResult = checkCompliance(promoText + tagsInput);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* ================= 左側控制面板 ================= */}
      <div 
        className="bg-white border-r border-slate-200 flex flex-col shadow-2xl z-10 relative shrink-0"
        style={{ width: `${leftWidth}px` }}
      >
        <div style={{ background: activeTheme.gradient }} className="p-5 border-b text-white shrink-0 transition-colors duration-500">
          <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold flex items-center gap-2 drop-shadow-sm">
                <ImageIcon className="w-6 h-6 text-white" />
                馬尼製圖工廠 
                <span className="text-[10px] bg-white text-slate-900 px-2 py-0.5 rounded-full ml-2 font-black shadow-sm flex items-center gap-1">
                    <Layers className="w-3 h-3 text-sky-500" /> Yahoo 雙平台+全風格版
                </span>
              </h1>
              
              <div className="flex bg-black/20 rounded-lg p-1 backdrop-blur-sm">
                  <button onClick={handleUndo} disabled={historyIndex.current <= 0} className="p-1.5 text-white disabled:opacity-30 hover:bg-white/20 rounded transition-colors" title="復原 (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
                  <button onClick={handleRedo} disabled={historyIndex.current >= historyRef.current.length - 1} className="p-1.5 text-white disabled:opacity-30 hover:bg-white/20 rounded transition-colors" title="重做 (Ctrl+Y)"><Redo2 className="w-4 h-4" /></button>
              </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-28">
          
          <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl shadow-sm text-xs text-sky-800 flex items-start gap-3">
              <MousePointer2 className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
              <div className="w-full">
                  <div className="flex justify-between items-center mb-1.5">
                      <p className="font-bold">✨ 旗艦編輯器新功能解鎖：</p>
                      <button onClick={() => setShowHelpModal(true)} className="text-[10px] bg-sky-200 hover:bg-sky-300 text-sky-800 font-bold px-2 py-1 rounded transition-colors">查看完整秘笈</button>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 opacity-90">
                      <li>點擊畫布圖層即可選取，使用鍵盤 <kbd className="bg-white px-1 rounded shadow-sm text-slate-600">方向鍵</kbd> 精準微調。</li>
                      <li>停留在物件上按住 <kbd className="bg-white px-1 rounded shadow-sm text-slate-600">Shift + 滾輪</kbd> 可進行旋轉。</li>
                  </ul>
              </div>
          </div>

          {/* 圖片上傳區 */}
          <section className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                    <Camera className="w-4 h-4" style={{ color: activeTheme.main }} /> 1. 原廠商品圖
                </label>
                <div className="flex gap-2">
                    <button onClick={() => toggleLock('product')} className={`p-1.5 rounded-md border transition-colors ${lockedLayers.product ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`} title="鎖定商品圖層防誤觸">
                        {lockedLayers.product ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-purple-50 px-2 py-1.5 rounded border border-purple-100 mb-3">
                <Wand2 className="w-3 h-3 text-purple-500" />
                <label className="flex items-center gap-1.5 text-xs font-bold text-purple-700 cursor-pointer">
                    <input type="checkbox" checked={enableRemoveBgApi} onChange={(e)=>setEnableRemoveBgApi(e.target.checked)} className="accent-purple-500" />
                    啟用真實 AI 去背 (Remove.bg)
                </label>
            </div>

            {enableRemoveBgApi && (
                <div className="mb-4 bg-purple-100/50 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-purple-600" />
                        <input 
                            type="password" 
                            placeholder="請輸入您的 Remove.bg API Key" 
                            value={removeBgApiKey}
                            onChange={handleApiKeyChange}
                            className="w-full text-xs px-2 py-1.5 border border-purple-200 rounded focus:outline-none focus:border-purple-400 bg-white" 
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2 ml-6">
                        <p className="text-[10px] text-purple-500">設定後將自動記憶。開啟此功能時，上傳新圖會自動呼叫 API 去背。</p>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-200 px-2 py-0.5 rounded-full shadow-sm">
                            本月已去背: {bgRemovalCount} 次
                        </span>
                    </div>
                    {rawImage && !isRemovingBg && (
                         <button onClick={() => executeRemoveBg(rawImage)} className="mt-2 w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-1.5 rounded transition-colors">
                             ✨ 立即為目前圖片去背
                         </button>
                    )}
                </div>
            )}

            <div 
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative group cursor-pointer overflow-hidden ${isDragActive ? 'border-sky-500 bg-sky-50 shadow-inner' : 'border-slate-200 bg-white'}`} 
              style={!isDragActive ? { borderColor: activeTheme.border } : {}}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isRemovingBg && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                      <Loader2 className="w-6 h-6 text-purple-600 animate-spin mb-2" />
                      <p className="text-xs font-bold text-purple-800">🚀 正在呼叫 AI 高精度去背...</p>
                  </div>
              )}
              <input type="file" onChange={handleImageUpload} className="hidden" id="img-upload" accept="image/*" />
              <label htmlFor="img-upload" className="cursor-pointer block pointer-events-none">
                <div className="bg-white shadow-sm border border-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" style={{ color: activeTheme.main }} />
                </div>
                <span className="text-sm font-bold" style={{ color: activeTheme.main }}>
                  {isDragActive ? '放開以載入圖片' : '點擊或將圖片拖放至此'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">載入後可於右側畫布自由拖曳與旋轉商品位置</p>
              </label>
            </div>

            <div className="mt-3 flex items-center gap-2 pl-1 bg-white p-2 rounded-lg border border-slate-200">
                <input type="checkbox" checked={removeBg} onChange={(e) => {setRemoveBg(e.target.checked); saveHistorySnapshot();}} id="remove-bg" className="accent-slate-500 rounded w-4 h-4 cursor-pointer" />
                <label htmlFor="remove-bg" className="text-xs text-slate-700 font-bold cursor-pointer">加上立體光影與陰影 (建議去背後開啟)</label>
            </div>
          </section>

          {/* 平台適配區 (含 Yahoo) */}
          <section className="space-y-5">
             <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-slate-700">
                <Layout className="w-4 h-4" style={{ color: activeTheme.main }} /> 2. 平台適配 (規範與動態換色)
                </label>
                <div className="flex flex-wrap gap-3">
                {Object.keys(THEMES).map(p => (
                    <button key={p} onClick={() => {setPlatform(p); setTimeout(saveHistorySnapshot,0);}} className={`flex-1 min-w-[120px] py-2.5 px-2 text-sm font-bold rounded-lg border-2 transition-all ${platform === p ? 'shadow-md bg-white' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`} style={platform === p ? { borderColor: THEMES[p].main, color: THEMES[p].main } : {}}>
                    {THEMES[p].name}
                    </button>
                ))}
                </div>
                {/* 顯示嚴格規範提示 */}
                {!activeTheme.allowText && (
                    <p className="mt-2 text-[11px] text-red-500 font-bold flex items-center gap-1 bg-red-50 p-2 rounded border border-red-100">
                        <AlertTriangle className="w-3 h-3" /> 此平台規範極度嚴格，已自動切換為純白底且隱藏所有文字與裝飾。
                    </p>
                )}
             </div>
             
             {/* 視覺模板區 (含電競/質感) */}
             <div className={!activeTheme.allowText ? 'opacity-30 pointer-events-none' : ''}>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                        <Box className="w-4 h-4" style={{ color: activeTheme.main }} /> 3. 視覺風格模板
                    </label>
                    <button onClick={() => toggleLock('deco')} className={`p-1.5 rounded-md border transition-colors ${lockedLayers.deco ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`} title="鎖定背景裝飾圖層防誤觸">
                        {lockedLayers.deco ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                {Object.keys(TEMPLATES).map(t => (
                    <div key={t} onClick={() => handleTemplateChange(t)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${template === t ? 'bg-white shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`} style={template === t ? { borderColor: activeTheme.main, color: activeTheme.main } : {}}>
                    <p className={`text-sm font-bold ${template === t ? '' : 'text-slate-600'}`}>{TEMPLATES[t].name}</p>
                    <p className="text-xs text-slate-400 mt-1">{TEMPLATES[t].desc}</p>
                    </div>
                ))}
                </div>

                {/* 🌟 電競風專屬：深淺底色切換開關 🌟 */}
                {template === 'CyberNeon' && (
                    <div className="mt-3 flex bg-slate-200/50 rounded-lg p-1.5">
                        <button onClick={() => handleCyberBgToggle('dark')} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${cyberBgMode === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>深色星空底</button>
                        <button onClick={() => handleCyberBgToggle('light')} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${cyberBgMode === 'light' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>淺色科技底</button>
                    </div>
                )}
             </div>
          </section>

          {/* 文案設定 */}
          <section className={!activeTheme.allowText ? 'opacity-30 pointer-events-none' : ''}>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold flex items-center gap-2 text-slate-700">
                    <Type className="w-4 h-4" style={{ color: activeTheme.main }} /> 4. 文案設定與拖曳提示
                </label>
                <button onClick={() => toggleLock('title')} className={`p-1.5 rounded-md border transition-colors ${lockedLayers.title ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`} title="鎖定標題與文字防誤觸">
                    {lockedLayers.title ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div className={!showLogo ? 'opacity-40' : ''}>
                    <div className="flex justify-between items-center mb-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                            <input type="checkbox" checked={showLogo} onChange={(e)=>{setShowLogo(e.target.checked); saveHistorySnapshot();}} className="accent-slate-500 w-4 h-4" /> 品牌徽章/LOGO (左上角)
                        </label>
                    </div>
                    <div className="flex gap-2">
                        {(template === 'TechBright' || template === 'CyberNeon') && (
                            <input type="text" value={logoText} onBlur={saveHistorySnapshot} onChange={(e) => setLogoText(e.target.value)} disabled={!showLogo} placeholder="LOGO (預設 BRAND)" className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-xs font-bold bg-slate-50" />
                        )}
                        <input type="text" value={brandText} onBlur={saveHistorySnapshot} onChange={(e) => setBrandText(e.target.value)} disabled={!showLogo} placeholder="徽章內文 (如:官方授權店)" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-xs font-bold bg-slate-50" />
                    </div>
                </div>
                <div className={!showTitle ? 'opacity-40 border-t border-slate-100 pt-4' : 'border-t border-slate-100 pt-4'}>
                    <div className="flex justify-between items-center mb-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                            <input type="checkbox" checked={showTitle} onChange={(e)=>{setShowTitle(e.target.checked); saveHistorySnapshot();}} className="accent-slate-500 w-4 h-4" /> 主標題 (可拖曳)
                        </label>
                        <select value={titleFont} onChange={(e)=>{setTitleFont(e.target.value); saveHistorySnapshot();}} className="text-xs bg-slate-100 border-none rounded p-1.5 outline-none text-slate-600 font-bold cursor-pointer">
                            <option value="Microsoft JhengHei">微軟正黑體</option>
                            <option value="Arial">Arial 圓滑體</option>
                            <option value="sans-serif">標準黑體</option>
                            <option value="serif">經典明體</option>
                        </select>
                    </div>
                    <input type="text" value={promoText} onBlur={saveHistorySnapshot} onChange={(e) => setPromoText(e.target.value)} disabled={!showTitle} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none text-sm font-bold bg-slate-50" />
                </div>
                <div className={!showTags ? 'opacity-40 border-t border-slate-100 pt-4' : 'border-t border-slate-100 pt-4'}>
                    <div className="flex justify-between items-center mb-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                            <input type="checkbox" checked={showTags} onChange={(e)=>{setShowTags(e.target.checked); saveHistorySnapshot();}} className="accent-slate-500 w-4 h-4" /> 獨立標籤 (以逗號分隔)
                        </label>
                        <select value={tagFont} onChange={(e)=>{setTagFont(e.target.value); saveHistorySnapshot();}} className="text-xs bg-slate-100 border-none rounded p-1.5 outline-none text-slate-600 font-bold cursor-pointer">
                            <option value="Microsoft JhengHei">微軟正黑體</option>
                            <option value="Arial">Arial 圓滑體</option>
                            <option value="sans-serif">標準黑體</option>
                        </select>
                    </div>
                    <input type="text" value={tagsInput} onBlur={saveHistorySnapshot} onChange={(e) => setTagsInput(e.target.value)} disabled={!showTags} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none text-sm font-medium bg-slate-50" />
                </div>
            </div>
          </section>

          {/* 外部圖示 */}
          <section className={!activeTheme.allowText ? 'opacity-30 pointer-events-none' : ''}>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold flex items-center gap-2 text-slate-700">
                  <ImagePlus className="w-4 h-4" style={{ color: activeTheme.main }} /> 5. 外部圖示 (如:免運標章)
                </label>
                <button onClick={() => toggleLock('icon')} className={`p-1.5 rounded-md border transition-colors ${lockedLayers.icon ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`} title="鎖定外部圖示防誤觸">
                    {lockedLayers.icon ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold py-2.5 px-4 rounded-lg transition-colors border border-slate-200">
                        <input type="file" onChange={handleIconUpload} className="hidden" accept="image/*" />
                        選擇圖示 (透明PNG)
                    </label>
                    {iconImage ? <span className="text-sm text-emerald-500 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> 已載入</span> : null}
                    {iconImage && <button onClick={()=>{setIconImage(null); setIconOffset({x:150, y:-150}); saveHistorySnapshot();}} className="text-xs text-red-400 hover:text-red-600 underline ml-auto">移除</button>}
                </div>
                {iconImage && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-500">圖示大小 ({iconScale}%)</span></div>
                        <input type="range" min="10" max="100" value={iconScale} onMouseUp={saveHistorySnapshot} onChange={(e) => setIconScale(e.target.value)} className="w-full accent-slate-400" />
                    </div>
                )}
            </div>
          </section>

          {/* 顏色與大小微調 */}
          <section className={!activeTheme.allowText ? 'opacity-30 pointer-events-none' : ''}>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold flex items-center gap-2 text-slate-700">
                <Palette className="w-4 h-4" style={{ color: activeTheme.main }} /> 6. 顏色與大小微調
                </label>
                <button onClick={resetPositions} className="text-xs flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded font-bold transition-colors">
                    <RotateCcw className="w-3 h-3" /> 重置所有座標與旋轉
                </button>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center">
                        <input type="color" value={primaryColor} onBlur={saveHistorySnapshot} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-4 border-slate-100 p-0 shadow-sm" />
                        <span className="text-xs text-slate-500 mt-2 font-bold">主色調</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <input type="color" value={accentColor} onBlur={saveHistorySnapshot} onChange={(e) => setAccentColor(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-4 border-slate-100 p-0 shadow-sm" />
                        <span className="text-xs text-slate-500 mt-2 font-bold">重點色</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <input type="color" value={textColor} onBlur={saveHistorySnapshot} onChange={(e) => setTextColor(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-4 border-slate-100 p-0 shadow-sm" />
                        <span className="text-xs text-slate-500 mt-2 font-bold">文字色</span>
                    </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-xs font-black text-slate-600 flex items-center gap-1"><Camera className="w-4 h-4"/> 商品主體縮放 ({productScale}%)</p>
                        </div>
                        <input type="range" min="50" max="150" value={productScale} onMouseUp={saveHistorySnapshot} onChange={(e) => setProductScale(e.target.value)} className="w-full accent-slate-400" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className={`bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-center ${!showLogo && 'opacity-40'}`}>
                            <p className="text-[10px] font-black text-slate-600 mb-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> 徽章 ({brandScale}%)</p>
                            <input type="range" min="50" max="150" value={brandScale} onMouseUp={saveHistorySnapshot} onChange={(e) => setBrandScale(e.target.value)} disabled={!showLogo} className="w-full accent-slate-400" />
                        </div>
                        <div className={`bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-center ${!showTitle && 'opacity-40'}`}>
                            <p className="text-[10px] font-black text-slate-600 mb-2 flex items-center gap-1"><TypeIcon className="w-3 h-3"/> 標題 ({textScale}%)</p>
                            <input type="range" min="50" max="150" value={textScale} onMouseUp={saveHistorySnapshot} onChange={(e) => setTextScale(e.target.value)} disabled={!showTitle} className="w-full accent-slate-400" />
                        </div>
                        <div className={`bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-center ${!showTags && 'opacity-40'}`}>
                            <p className="text-[10px] font-black text-slate-600 mb-2 flex items-center gap-1"><Box className="w-3 h-3"/> 標籤 ({tagScale}%)</p>
                            <input type="range" min="50" max="150" value={tagScale} onMouseUp={saveHistorySnapshot} onChange={(e) => setTagScale(e.target.value)} disabled={!showTags} className="w-full accent-slate-400" />
                        </div>
                    </div>

                    <div className={`bg-slate-50 p-4 rounded-lg border border-slate-100 ${!showTags && 'opacity-40'}`}>
                        <span className="text-xs font-bold text-slate-500 block mb-2">標籤外觀形狀</span>
                        <div className="flex bg-slate-200/50 rounded-lg p-1.5">
                            <button onClick={()=>{setTagShape('pill'); saveHistorySnapshot();}} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${tagShape==='pill' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>圓角滿版</button>
                            <button onClick={()=>{setTagShape('rect'); saveHistorySnapshot();}} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${tagShape==='rect' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>微圓角塊</button>
                            <button onClick={()=>{setTagShape('outline'); saveHistorySnapshot();}} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${tagShape==='outline' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>清透線框</button>
                        </div>
                    </div>
                </div>
            </div>
          </section>
        </div>

        <div className="absolute bottom-0 w-full p-5 border-t border-slate-100 bg-white/95 backdrop-blur shrink-0 z-20">
          <button 
            className="w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-white text-base"
            style={complianceResult.safe ? { background: activeTheme.gradient } : { background: '#ef4444', cursor: 'not-allowed' }}
          >
            <Download className="w-6 h-6" /> 
            {complianceResult.safe ? `匯出 ${activeTheme.name} 專圖` : '請修正違禁詞'}
          </button>
        </div>
      </div>

      {/* ================= 左右拖拉分隔線 ================= */}
      <div 
        className="w-1.5 hover:w-2 bg-slate-200 hover:bg-sky-400 cursor-col-resize z-50 flex items-center justify-center transition-all shadow-[inset_1px_0_2px_rgba(0,0,0,0.05)] active:bg-sky-500 shrink-0 group relative"
        onMouseDown={(e) => {
          e.preventDefault();
          const handleMouseMove = (moveEvent) => {
            const newWidth = Math.max(400, Math.min(moveEvent.clientX, window.innerWidth * 0.8));
            setLeftWidth(newWidth);
          };
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
          };
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = 'col-resize';
        }}
      >
        <div className="h-16 w-full flex items-center justify-center bg-transparent rounded-full group-hover:bg-sky-500 transition-colors">
             <GripVertical className="w-4 h-5 text-slate-400 group-hover:text-white" />
        </div>
      </div>

      {/* ================= 右側互動預覽區 ================= */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-100/80 bg-blend-overlay overflow-y-auto" onWheel={handleWheel}>
        <div className="mb-4 flex items-center gap-6 w-full max-w-[700px]">
            <div className="flex-1 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800 tracking-wide flex items-center gap-2" style={{ color: activeTheme.text }}>
                    <Maximize className="w-6 h-6" />
                    互動式渲染畫布 (1000x1000px)
                </h2>
                <button onClick={() => setShowHelpModal(true)} className="flex items-center gap-1.5 text-sm font-bold bg-white text-slate-600 px-3.5 py-2 rounded-full shadow-sm hover:text-sky-500 hover:shadow transition-all border border-slate-200">
                    <Info className="w-4 h-4" /> 操作秘笈
                </button>
            </div>
            
            <div className="bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200 text-center flex items-center gap-3">
                <div className="text-left flex items-center gap-2">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0">掃描狀態</p>
                    {complianceResult.safe ? (
                        <span className="flex items-center gap-1 text-emerald-500 text-sm font-black">
                            <CheckCircle className="w-5 h-5" /> 通過
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-red-500 text-sm font-black">
                            <AlertTriangle className="w-5 h-5" /> 違規
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* --- Canvas --- */}
        <div className="relative group p-2 bg-white rounded-[2rem] shadow-2xl border select-none transition-shadow duration-300 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)]" style={{ borderColor: activeTheme.border }}>
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={800} 
                className="relative bg-white w-full max-w-[500px] h-auto aspect-square object-contain rounded-3xl"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
            />
        </div>
      </div>

      {/* ================= 快捷鍵與操作指南 Modal (彈出視窗) ================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all" onClick={() => setShowHelpModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Info className="w-5 h-5 text-sky-500" /> 馬尼製圖工廠 - 完整操作指南</h3>
              <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 bg-white rounded-full shadow-sm border border-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-6 bg-white overflow-y-auto max-h-[70vh]">
              {/* 基礎操作 */}
              <div className="space-y-4">
                <h4 className="font-bold text-sky-600 flex items-center gap-1.5 border-b border-sky-100 pb-2"><MousePointer2 className="w-4 h-4" /> 基礎滑鼠操作</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs w-max">左鍵點擊與拖曳</span> 
                      <span>選取並自由移動標題、標籤、商品圖與裝飾圖層。</span>
                  </li>
                  <li className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs w-max">Shift + 滾動滑鼠滾輪</span> 
                      <span>游標停留在物件上時，可任意<b className="text-sky-600">旋轉</b>該圖層。</span>
                  </li>
                  <li className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs w-max">左右拖拉分隔線</span> 
                      <span>滑鼠游標移至左右面板交界處，可拖拉改變左側設定區寬度。</span>
                  </li>
                </ul>
              </div>

              {/* 進階鍵盤操作 */}
              <div className="space-y-4">
                <h4 className="font-bold text-emerald-600 flex items-center gap-1.5 border-b border-emerald-100 pb-2"><TypeIcon className="w-4 h-4" /> 鍵盤精準快捷鍵</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs w-max">選取物件 + ↑↓←→ (方向鍵)</span> 
                      <span>每次移動 <b className="text-emerald-600">1px</b> 進行精準像素對齊。</span>
                  </li>
                  <li className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs w-max">Shift + ↑↓←→ (方向鍵)</span> 
                      <span>每次移動 <b className="text-emerald-600">10px</b>，加速位置微調。</span>
                  </li>
                  <li className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs w-max">Ctrl + Z (或 Cmd + Z)</span> 
                      <span><b className="text-emerald-600">復原</b>上一個步驟 (也可點擊左上角返回按鈕)。</span>
                  </li>
                  <li className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs w-max">Ctrl + Y (或 Cmd + Y)</span> 
                      <span><b className="text-emerald-600">重做</b>下一步驟。</span>
                  </li>
                </ul>
              </div>

              {/* 圖層與排版 */}
              <div className="col-span-2 space-y-4 mt-2">
                <h4 className="font-bold text-purple-600 flex items-center gap-1.5 border-b border-purple-100 pb-2"><Layers className="w-4 h-4" /> 圖層系統與智慧排版</h4>
                <div className="grid grid-cols-2 gap-6 text-sm text-slate-600">
                  <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                      <p className="font-bold text-slate-800 mb-2 flex items-center gap-1"><Lock className="w-4 h-4 text-purple-500" /> 圖層鎖定防呆</p>
                      <p className="leading-relaxed">當物件互相重疊時，點擊左側設定區塊右上角的<b className="text-purple-600">「小鎖頭」</b>，鎖定後的圖層將不會被滑鼠選取與拖拉，有效防止誤觸背景或商品主體。</p>
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-lg border border-pink-100">
                      <p className="font-bold text-slate-800 mb-2 flex items-center gap-1"><Move className="w-4 h-4 text-pink-500" /> 智慧置中吸附 (Snapping)</p>
                      <p className="leading-relaxed">拖曳任何圖層靠近畫布的「正中央」(X軸或Y軸) 時，系統會自動將其<b className="text-pink-500">吸附對齊</b>，並顯示粉紅色的十字輔助線，幫助您完美置中排版。</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
              <button onClick={() => setShowHelpModal(false)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-10 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">我了解了，開始製圖</button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}} />
    </div>
  );
};

export default App;
