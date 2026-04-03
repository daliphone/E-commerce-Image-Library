import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertTriangle, CheckCircle, Settings, Download, Layout, Type, ShieldCheck, Info, Image as ImageIcon, Sliders, Palette, Maximize, Box, Move, Type as TypeIcon, ImagePlus, RotateCcw, Cloud, Save, DownloadCloud, Loader2, Link2, GripVertical, Wand2, Key, Layers } from 'lucide-react';

const App = () => {
  // 核心狀態
  const [rawImage, setRawImage] = useState(null); 
  const [image, setImage] = useState(null); 
  const [iconImage, setIconImage] = useState(null);
  const [platform, setPlatform] = useState('Shopee');
  const [template, setTemplate] = useState('LightSoft');
  
  // 視覺效果狀態
  const [removeBg, setRemoveBg] = useState(true); 

  // --- Remove.bg API ---
  const [enableRemoveBgApi, setEnableRemoveBgApi] = useState(false);
  const [removeBgApiKey, setRemoveBgApiKey] = useState('');
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemovalCount, setBgRemovalCount] = useState(0); 

  // --- UI 面板拖曳寬度狀態 ---
  const [leftWidth, setLeftWidth] = useState(560); 
  const [isDragActive, setIsDragActive] = useState(false);

  const THEMES = {
    Shopee: { name: '蝦皮購物', main: '#f97316', gradient: 'linear-gradient(135deg, #fb923c, #ef4444)', bg: '#fff7ed', border: '#fdba74', text: '#ea580c', allowText: true },
    Momo: { name: 'Momo 購物', main: '#ec4899', gradient: 'linear-gradient(135deg, #f472b6, #e11d48)', bg: '#fdf2f8', border: '#f9a8d4', text: '#be185d', allowText: false },
    PChome: { name: 'PChome 24h', main: '#3b82f6', gradient: 'linear-gradient(135deg, #60a5fa, #ef4444)', bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', allowText: true }
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

  // --- 圖層化架構升級 (Layer System v1.0) ---
  const [productOffset, setProductOffset] = useState({ x: 0, y: 0 });
  const [titleOffset, setTitleOffset] = useState({ x: 0, y: 0 });
  const [iconOffset, setIconOffset] = useState({ x: 150, y: -150 });
  const [tagOffsets, setTagOffsets] = useState([]);
  
  // 新增：背景裝飾圖層獨立 Offset (讓模板的裝飾物也能自由移動)
  const [decoOffsets, setDecoOffsets] = useState({
      frame: { x: 0, y: 0 }, // 用於 LightSoft 邊框
      bars: { x: 0, y: 0 },  // 用於 LightClean 底部色條
      poly: { x: 0, y: 0 }   // 用於 TechBright 科技切角
  });
  
  const [gasUrl, setGasUrl] = useState('https://script.google.com/macros/s/AKfycbz56mtEvhynoY7CqJ7PKU0t5DMZDRWFta9fUQdrPAuxlGqCQ_hg5Fhe11JlSF9vORAJeQ/exec');
  const [projectName, setProjectName] = useState('雙11促銷樣板');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [cloudTemplates, setCloudTemplates] = useState([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [cloudMessage, setCloudMessage] = useState({ text: '', type: '' });

  const canvasRef = useRef(null);
  
  // 新增 deco (裝飾圖層) 的碰撞紀錄
  const hitBoxes = useRef({ product: null, title: null, icon: null, tags: [], deco: null });
  const dragInfo = useRef({ isDragging: false, target: null, startX: 0, startY: 0, initialOffset: {x:0, y:0} });

  const BANNED_WORDS = ['第一', '最強', '最優', '療效', '根治', '殺頭價', '保證見效'];

  const TEMPLATES = {
    LightSoft: { name: '柔和明亮框', desc: '純白底+微漸層點綴' },
    LightClean: { name: '極簡亮白底', desc: '乾淨無框+底部色條' },
    TechBright: { name: '科技亮色切角', desc: '幾何裝飾+明亮質感' },
    None: { name: '純淨白圖', desc: '僅商品與純白背景' }
  };

  useEffect(() => {
    const savedUrl = localStorage.getItem('ManiFactory_GAS_URL');
    if (savedUrl) setGasUrl(savedUrl);
    
    const savedBgKey = localStorage.getItem('ManiFactory_RemoveBg_Key');
    if (savedBgKey) {
        setRemoveBgApiKey(savedBgKey);
        setEnableRemoveBgApi(true);
    }

    const currentMonth = new Date().toISOString().slice(0, 7); 
    const savedMonth = localStorage.getItem('ManiFactory_RemoveBg_Month');
    const savedCount = parseInt(localStorage.getItem('ManiFactory_RemoveBg_Count') || '0', 10);

    if (savedMonth !== currentMonth) {
        localStorage.setItem('ManiFactory_RemoveBg_Month', currentMonth);
        localStorage.setItem('ManiFactory_RemoveBg_Count', '0');
        setBgRemovalCount(0);
    } else {
        setBgRemovalCount(savedCount);
    }
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
              setImage(reader.result); 
              setIsRemovingBg(false);
              setBgRemovalCount(prevCount => {
                  const newCount = prevCount + 1;
                  localStorage.setItem('ManiFactory_RemoveBg_Count', newCount.toString());
                  return newCount;
              });
          };
          reader.readAsDataURL(await apiRes.blob());
      } catch (err) {
          alert(`Remove.bg API 錯誤: ${err.message}`);
          setIsRemovingBg(false); setImage(base64Img); 
      }
  };

  const processUpload = (file) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (f) => {
            setRawImage(f.target.result); setImage(f.target.result); 
            if (enableRemoveBgApi && removeBgApiKey) executeRemoveBg(f.target.result);
        };
        reader.readAsDataURL(file);
      }
  };

  // --- 修復：補回拖拉上傳與圖片選擇事件函式 ---
  const handleImageUpload = (e) => {
    processUpload(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    processUpload(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };
  
  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (f) => setIconImage(f.target.result);
        reader.readAsDataURL(file);
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
      productOffset, titleOffset, iconOffset, tagOffsets, decoOffsets, // 加入圖層狀態
      imageBase64: image, iconImageBase64: iconImage
    };

    try {
      const response = await fetch(gasUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'save', payload: payload }) });
      const result = await response.json();
      if (result.status === 'success') {
        setCloudMessage({ text: `儲存成功！(${result.data.projectName})`, type: 'success' });
        setTimeout(() => setCloudMessage({ text: '', type: '' }), 3000);
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
    
    // 相容並還原背景圖層位移
    setDecoOffsets(params.decoOffsets || { frame: { x: 0, y: 0 }, bars: { x: 0, y: 0 }, poly: { x: 0, y: 0 } });

    if (params.savedMainImageUrl) { setImage(params.savedMainImageUrl); setRawImage(params.savedMainImageUrl); }
    if (params.savedIconImageUrl) setIconImage(params.savedIconImageUrl);

    setShowLoadMenu(false); setCloudMessage({ text: '已成功套用樣板！', type: 'success' });
    setTimeout(() => setCloudMessage({ text: '', type: '' }), 3000);
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  // --- 圖層拖曳碰撞邏輯升級 ---
  const handleMouseDown = (e) => {
    if (!activeTheme.allowText && platform === 'Momo') {
        const { x, y } = getMousePos(e);
        const boxes = hitBoxes.current;
        if (image && boxes.product && x >= boxes.product.x && x <= boxes.product.x + boxes.product.w && y >= boxes.product.y && y <= boxes.product.y + boxes.product.h) {
            dragInfo.current = { isDragging: true, target: { type: 'product' }, startX: x, startY: y, initialOffset: productOffset }; return;
        }
        return; 
    }
    
    const { x, y } = getMousePos(e);
    const boxes = hitBoxes.current;

    // Z-Index 優先級：圖示 > 標籤 > 標題 > 商品圖 >背景裝飾層
    if (iconImage && boxes.icon && x >= boxes.icon.x && x <= boxes.icon.x + boxes.icon.w && y >= boxes.icon.y && y <= boxes.icon.y + boxes.icon.h) {
        dragInfo.current = { isDragging: true, target: { type: 'icon' }, startX: x, startY: y, initialOffset: iconOffset }; return;
    }
    for (let i = boxes.tags.length - 1; i >= 0; i--) {
        const box = boxes.tags[i];
        if (box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
            dragInfo.current = { isDragging: true, target: { type: 'tag', index: i }, startX: x, startY: y, initialOffset: tagOffsets[i] || {x:0, y:0} }; return;
        }
    }
    if (showTitle && boxes.title && x >= boxes.title.x && x <= boxes.title.x + boxes.title.w && y >= boxes.title.y && y <= boxes.title.y + boxes.title.h) {
        dragInfo.current = { isDragging: true, target: { type: 'title' }, startX: x, startY: y, initialOffset: titleOffset }; return;
    }
    if (image && boxes.product && x >= boxes.product.x && x <= boxes.product.x + boxes.product.w && y >= boxes.product.y && y <= boxes.product.y + boxes.product.h) {
        dragInfo.current = { isDragging: true, target: { type: 'product' }, startX: x, startY: y, initialOffset: productOffset }; return;
    }
    
    // 背景裝飾層碰撞判定 (最後判定，確保不會遮擋主體)
    if (boxes.deco && x >= boxes.deco.x && x <= boxes.deco.x + boxes.deco.w && y >= boxes.deco.y && y <= boxes.deco.y + boxes.deco.h) {
        const key = boxes.deco.key;
        dragInfo.current = { isDragging: true, target: { type: 'deco', key: key }, startX: x, startY: y, initialOffset: decoOffsets[key] || {x:0, y:0} }; return;
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getMousePos(e);
    
    if (dragInfo.current.isDragging) {
        const dx = x - dragInfo.current.startX;
        const dy = y - dragInfo.current.startY;
        const { target, initialOffset } = dragInfo.current;
        
        if (target.type === 'title') setTitleOffset({ x: initialOffset.x + dx, y: initialOffset.y + dy });
        else if (target.type === 'icon') setIconOffset({ x: initialOffset.x + dx, y: initialOffset.y + dy });
        else if (target.type === 'tag') {
            setTagOffsets(prev => { const next = [...prev]; next[target.index] = { x: initialOffset.x + dx, y: initialOffset.y + dy }; return next; });
        }
        else if (target.type === 'product') setProductOffset({ x: initialOffset.x + dx, y: initialOffset.y + dy });
        else if (target.type === 'deco') {
            setDecoOffsets(prev => ({ ...prev, [target.key]: { x: initialOffset.x + dx, y: initialOffset.y + dy } }));
        }
        
        canvasRef.current.style.cursor = 'grabbing'; return;
    }

    let isHovering = false;
    const boxes = hitBoxes.current;
    
    if (iconImage && boxes.icon && x >= boxes.icon.x && x <= boxes.icon.x + boxes.icon.w && y >= boxes.icon.y && y <= boxes.icon.y + boxes.icon.h) isHovering = true;
    if (!isHovering && showTitle && boxes.title && x >= boxes.title.x && x <= boxes.title.x + boxes.title.w && y >= boxes.title.y && y <= boxes.title.y + boxes.title.h) isHovering = true;
    if (!isHovering) {
        for (let i = 0; i < boxes.tags.length; i++) {
            const box = boxes.tags[i];
            if (box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) { isHovering = true; break; }
        }
    }
    if (!isHovering && image && boxes.product && x >= boxes.product.x && x <= boxes.product.x + boxes.product.w && y >= boxes.product.y && y <= boxes.product.y + boxes.product.h) isHovering = true;
    
    // Hover 判定裝飾圖層
    if (!isHovering && boxes.deco && x >= boxes.deco.x && x <= boxes.deco.x + boxes.deco.w && y >= boxes.deco.y && y <= boxes.deco.y + boxes.deco.h) isHovering = true;

    canvasRef.current.style.cursor = isHovering ? 'grab' : 'default';
  };

  const handleMouseUpOrLeave = () => { dragInfo.current.isDragging = false; dragInfo.current.target = null; if (canvasRef.current) canvasRef.current.style.cursor = 'default'; };
  const resetPositions = () => { 
      setTitleOffset({x: 0, y: 0}); setIconOffset({x: 150, y: -150}); 
      setTagOffsets(tagOffsets.map(() => ({x: 0, y: 0}))); setProductOffset({x: 0, y: 0}); 
      setDecoOffsets({ frame: {x:0, y:0}, bars: {x:0, y:0}, poly: {x:0, y:0} }); // 重置圖層位置
  };

  // --- 畫布繪製 ---
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

    const renderCanvas = async () => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        const mImg = image ? await loadImg(image) : null;
        const iImg = iconImage ? await loadImg(iconImage) : null;

        const isMomo = !THEMES[platform].allowText;
        const currentTemplate = isMomo ? 'None' : template;

        // 1. 繪製圖層化背景裝飾
        if (currentTemplate === 'LightSoft') {
            const grad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width);
            grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(1, hexToRgba(primaryColor, 0.08)); 
            ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
            
            // 獨立的邊框圖層
            const fOff = decoOffsets.frame;
            const fx = 15 + fOff.x; const fy = 15 + fOff.y;
            const fw = width - 30; const fh = height - 30;
            ctx.strokeStyle = hexToRgba(primaryColor, 0.2); ctx.lineWidth = 15; ctx.strokeRect(fx, fy, fw, fh);
            hitBoxes.current.deco = { key: 'frame', x: fx, y: fy, w: fw, h: fh };
            
        } else if (currentTemplate === 'LightClean') {
             const bOff = decoOffsets.bars;
             const bx = bOff.x; const by = height - 150 + bOff.y;
             
             const grad = ctx.createLinearGradient(0, by, 0, by + 150);
             grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(1, hexToRgba(primaryColor, 0.15));
             ctx.fillStyle = grad; ctx.fillRect(bx, by, width, 150);
             hitBoxes.current.deco = { key: 'bars', x: bx, y: by, w: width, h: 150 };
        }

        // 2. 商品主體層
        let baseScale = 0.75;
        let baseYOffset = showTitle ? 20 : 0;
        if (currentTemplate === 'TechBright') { baseScale = 0.65; baseYOffset = showTitle ? -20 : 0; }

        const finalScale = baseScale * (productScale / 100);
        const w = width * finalScale;
        const h = (mImg && mImg.width) ? ((mImg.height / mImg.width) * w) : w;
        
        const x = (width - w) / 2 + (currentTemplate === 'TechBright' ? 60 : 0) + productOffset.x;
        const y = (height - h) / 2 + baseYOffset + productOffset.y;

        if (mImg) hitBoxes.current.product = { x, y, w, h };

        if (removeBg && mImg) { ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 15; }
        
        if (mImg) {
            ctx.drawImage(mImg, x, y, w, h);
            ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        } else {
            ctx.fillStyle = '#f8fafc'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#e2e8f0'; ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '20px sans-serif';
            ctx.fillText('請上傳商品圖', x + w/2, y + h/2); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        }

        // 3. 裝飾與文字層
        if (!isMomo) {
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
                    const badgeH = 50 * actualBrandScale;
                    const radius = 15 * actualBrandScale;
                    const badgeY = -10;

                    ctx.fillStyle = primaryColor; roundRect(ctx, width/2 - textW/2, badgeY, textW, badgeH, radius);
                    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
                    ctx.fillText(brandText, width/2, badgeY + badgeH/2 + (2 * actualBrandScale)); ctx.textBaseline = 'alphabetic';
                }
                if (showTitle) {
                    const fontSize = 36 * actualTextScale;
                    ctx.fillStyle = textColor; ctx.font = `900 ${fontSize}px "${titleFont}"`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    const baseTx = width/2; const baseTy = showLogo ? 90 : 60;
                    const finalTx = baseTx + titleOffset.x; const finalTy = baseTy + titleOffset.y;
                    ctx.fillText(promoText, finalTx, finalTy);
                    const metrics = ctx.measureText(promoText);
                    hitBoxes.current.title = { x: finalTx - metrics.width / 2, y: finalTy - fontSize / 2, w: metrics.width, h: fontSize };
                    ctx.textBaseline = 'alphabetic';
                }

                if (currentTemplate === 'LightClean') {
                    // 跟隨背景圖層 Offset 一起移動的色條
                    const bx = decoOffsets.bars.x;
                    const barBy = height - 30 + decoOffsets.bars.y;
                    ctx.fillStyle = accentColor; ctx.fillRect(bx, barBy, width, 30);
                    ctx.fillStyle = primaryColor; ctx.fillRect(bx, barBy - 15, width, 15);
                }

                if (showTags) {
                    const tagBaseY = currentTemplate === 'LightSoft' ? height - 90 : height - 120;
                    const tagHeight = 45 * actualTagScale;
                    let totalTagsWidth = 0;
                    ctx.font = `bold ${20 * actualTagScale}px "${tagFont}"`;
                    const tagPaddings = [];
                    tags.forEach(tag => { const tw = ctx.measureText(tag).width + (40 * actualTagScale); totalTagsWidth += tw + 15; tagPaddings.push(tw); });
                    totalTagsWidth -= 15;

                    let startX = (width - totalTagsWidth) / 2;
                    tags.forEach((tag, i) => {
                        const offset = tagOffsets[i] || {x: 0, y: 0};
                        const currentX = startX + offset.x; const currentY = tagBaseY + offset.y;
                        const radius = tagShape === 'pill' ? (tagHeight/2) : (tagShape === 'rect' ? 8 : (tagHeight/2));
                        hitBoxes.current.tags[i] = { x: currentX, y: currentY, w: tagPaddings[i], h: tagHeight };

                        if (tagShape === 'outline') {
                            ctx.strokeStyle = accentColor; ctx.lineWidth = 2.5;
                            roundRect(ctx, currentX, currentY, tagPaddings[i], tagHeight, radius, true);
                            ctx.fillStyle = accentColor;
                        } else {
                            ctx.fillStyle = accentColor; roundRect(ctx, currentX, currentY, tagPaddings[i], tagHeight, radius, false);
                            ctx.fillStyle = '#FFFFFF';
                        }
                        ctx.textAlign = 'center'; ctx.fillText(tag, currentX + tagPaddings[i]/2, currentY + (tagHeight * 0.68));
                        startX += tagPaddings[i] + 15; 
                    });
                    ctx.textAlign = 'left';
                }

            } else if (currentTemplate === 'TechBright') {
                // 科技版獨立背景圖層
                const pOff = decoOffsets.poly;
                const px = pOff.x; const py = pOff.y;
                
                ctx.fillStyle = hexToRgba(primaryColor, 0.1); ctx.beginPath();
                ctx.moveTo(100 + px, height + py); ctx.lineTo(250 + px, height - 150 + py); 
                ctx.lineTo(width + px, height - 150 + py); ctx.lineTo(width + px, height + py); 
                ctx.closePath(); ctx.fill();
                
                hitBoxes.current.deco = { key: 'poly', x: 100 + px, y: height - 150 + py, w: width - 100, h: 150 };

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
                    const finalTx = 170 + titleOffset.x; const finalTy = height - 40 + titleOffset.y;
                    ctx.fillStyle = primaryColor; ctx.fillRect(finalTx - 170, finalTy - 5, 150, 45);
                    ctx.fillStyle = '#FFFFFF'; ctx.font = `bold ${20 * actualTextScale}px "${titleFont}"`; ctx.fillText('嚴選推薦', finalTx - 150, finalTy + 25);
                    ctx.fillStyle = textColor; ctx.font = `bold ${fontSize}px "${titleFont}"`; ctx.textBaseline = 'alphabetic'; ctx.fillText(promoText, finalTx, finalTy);
                    const metrics = ctx.measureText(promoText);
                    hitBoxes.current.title = { x: finalTx, y: finalTy - fontSize, w: metrics.width, h: fontSize + 10 };
                }
                if (showTags) {
                    ctx.font = `bold ${22 * actualTagScale}px "${tagFont}"`;
                    const baseTechTagY = 150;
                    tags.forEach((tag, i) => {
                        const offset = tagOffsets[i] || {x: 0, y: 0};
                        const cx = 40 + offset.x; const cy = baseTechTagY + i * 50 + offset.y;
                        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fillStyle = accentColor; ctx.fill();
                        ctx.fillStyle = textColor; ctx.fillText(tag, cx + 20, cy + 8);
                        const tW = ctx.measureText(tag).width;
                        hitBoxes.current.tags[i] = { x: cx - 10, y: cy - 15, w: tW + 35, h: 30 };
                    });
                }
            }

            if (iImg) {
                const iW = width * (iconScale / 100); const iH = (iImg.height / iImg.width) * iW;
                const ix = (width / 2) - (iW / 2) + iconOffset.x; const iy = (height / 2) - (iH / 2) + iconOffset.y;
                ctx.drawImage(iImg, ix, iy, iW, iH);
                hitBoxes.current.icon = { x: ix, y: iy, w: iW, h: iH };
            }
        }

        if (isAiDisclosure) {
          ctx.fillStyle = 'rgba(150, 150, 150, 0.6)'; ctx.font = '11px Arial'; ctx.fillText('AI Generated', width - 85, 20);
        }
    };
    renderCanvas();
  }, [image, iconImage, platform, template, promoText, tagsInput, brandText, logoText, isAiDisclosure, removeBg, primaryColor, accentColor, textColor, productScale, brandScale, textScale, tagScale, tagShape, showLogo, showTitle, showTags, titleFont, tagFont, iconScale, titleOffset, iconOffset, tagOffsets, productOffset, decoOffsets]);

  const complianceResult = checkCompliance(promoText + tagsInput);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* ================= 左側控制面板 ================= */}
      <div 
        className="bg-white border-r border-slate-200 flex flex-col shadow-2xl z-10 relative shrink-0"
        style={{ width: `${leftWidth}px` }}
      >
        <div style={{ background: activeTheme.gradient }} className="p-5 border-b text-white shrink-0 transition-colors duration-500">
          <h1 className="text-xl font-bold flex items-center gap-2 drop-shadow-sm">
            <ImageIcon className="w-6 h-6 text-white" />
            馬尼製圖工廠 
            <span className="text-[10px] bg-white text-slate-900 px-2 py-0.5 rounded-full ml-2 font-black shadow-sm flex items-center gap-1">
                <Layers className="w-3 h-3" /> 圖層架構 v1.0
            </span>
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-28">
          
          {/* GAS 雲端儲存控制台 */}
          <section className="bg-slate-800 p-4 rounded-xl shadow-inner text-white relative overflow-hidden border border-slate-700">
            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none"><Cloud className="w-24 h-24" /></div>
            <label className="text-sm font-bold mb-3 flex items-center gap-2 text-sky-300">
              <Cloud className="w-4 h-4" /> 雲端樣板中心 (GAS + Drive)
            </label>
            
            <div className="space-y-3 relative z-10">
                <div className="flex gap-2">
                    <div className="flex-1 bg-slate-900/50 rounded flex items-center px-3 border border-slate-600 focus-within:border-sky-400">
                        <Link2 className="w-4 h-4 text-slate-400 mr-2" />
                        <input type="text" placeholder="貼上您的 GAS Web App 網址..." value={gasUrl} onChange={(e) => setGasUrl(e.target.value)} className="w-full bg-transparent text-sm py-2.5 outline-none text-slate-300 placeholder-slate-500" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input type="text" placeholder="樣板名稱 (如: 雙11)" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-1/2 bg-slate-900/50 text-sm py-2 px-3 rounded border border-slate-600 focus:border-emerald-400 outline-none" />
                    <button onClick={saveToGAS} disabled={isSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-bold py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? '儲存中...' : '儲存樣板'}
                    </button>
                    <button onClick={loadFromGAS} disabled={isLoadingList} className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-white text-sm font-bold py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors">
                        {isLoadingList ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                        載入紀錄
                    </button>
                </div>
                
                {cloudMessage.text && (
                    <div className={`text-xs font-bold p-2 rounded text-center ${cloudMessage.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                        {cloudMessage.text}
                    </div>
                )}

                {showLoadMenu && cloudTemplates.length > 0 && (
                    <div className="mt-2 bg-slate-900 border border-slate-600 rounded p-2 max-h-48 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs text-slate-400 font-bold">選擇要載入的樣板：</span>
                            <button onClick={()=>setShowLoadMenu(false)} className="text-[10px] text-slate-500 hover:text-white">關閉</button>
                        </div>
                        {cloudTemplates.map((t, idx) => (
                            <div key={idx} onClick={() => applyTemplate(t.parameters)} className="cursor-pointer bg-slate-800 hover:bg-sky-900 border border-slate-700 p-3 rounded mb-2 flex justify-between items-center transition-colors">
                                <span className="text-sm font-bold text-sky-100">{t.projectName}</span>
                                <span className="text-xs text-slate-500">{t.timestamp}</span>
                            </div>
                        ))}
                    </div>
                )}
                {showLoadMenu && cloudTemplates.length === 0 && (
                    <div className="mt-2 text-center text-xs text-slate-500 py-3 border border-slate-700 border-dashed rounded">尚無儲存的樣板紀錄</div>
                )}
            </div>
          </section>

          {/* 圖片上傳區 */}
          <section className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                    <Camera className="w-4 h-4" style={{ color: activeTheme.main }} /> 1. 原廠商品圖
                </label>
                <div className="flex items-center gap-2 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                    <Wand2 className="w-3 h-3 text-purple-500" />
                    <label className="flex items-center gap-1.5 text-xs font-bold text-purple-700 cursor-pointer">
                        <input type="checkbox" checked={enableRemoveBgApi} onChange={(e)=>setEnableRemoveBgApi(e.target.checked)} className="accent-purple-500" />
                        啟用真實 AI 去背 (Remove.bg)
                    </label>
                </div>
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
                <p className="text-[10px] text-slate-400 mt-1">載入後可於右側畫布自由拖曳商品位置</p>
              </label>
            </div>

            <div className="mt-3 flex items-center gap-2 pl-1 bg-white p-2 rounded-lg border border-slate-200">
                <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} id="remove-bg" className="accent-slate-500 rounded w-4 h-4 cursor-pointer" />
                <label htmlFor="remove-bg" className="text-xs text-slate-700 font-bold cursor-pointer">加上立體光影與陰影 (建議去背後開啟)</label>
            </div>
          </section>

          {/* 平台與模板 */}
          <section className="space-y-5">
             <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-slate-700">
                <Layout className="w-4 h-4" style={{ color: activeTheme.main }} /> 2. 平台適配 (動態換色)
                </label>
                <div className="grid grid-cols-3 gap-3">
                {Object.keys(THEMES).map(p => (
                    <button key={p} onClick={() => setPlatform(p)} className={`py-2.5 px-2 text-sm font-bold rounded-lg border-2 transition-all ${platform === p ? 'shadow-md bg-white' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`} style={platform === p ? { borderColor: THEMES[p].main, color: THEMES[p].main } : {}}>
                    {THEMES[p].name}
                    </button>
                ))}
                </div>
             </div>
             
             <div className={!activeTheme.allowText ? 'opacity-30 pointer-events-none' : ''}>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-slate-700">
                <Box className="w-4 h-4" style={{ color: activeTheme.main }} /> 3. 亮色系視覺模板
                </label>
                <div className="grid grid-cols-2 gap-3">
                {Object.keys(TEMPLATES).map(t => (
                    <div key={t} onClick={() => setTemplate(t)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${template === t ? 'bg-white shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`} style={template === t ? { borderColor: activeTheme.main, color: activeTheme.main } : {}}>
                    <p className={`text-sm font-bold ${template === t ? '' : 'text-slate-600'}`}>{TEMPLATES[t].name}</p>
                    <p className="text-xs text-slate-400 mt-1">{TEMPLATES[t].desc}</p>
                    </div>
                ))}
                </div>
             </div>
          </section>

          {/* 文案設定 */}
          <section className={!activeTheme.allowText ? 'opacity-30 pointer-events-none' : ''}>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-slate-700">
              <Type className="w-4 h-4" style={{ color: activeTheme.main }} /> 4. 文案設定與拖曳提示
            </label>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2 text-xs text-emerald-800 font-bold mb-3 shadow-sm">
                <Layers className="w-4 h-4 shrink-0 mt-0.5" />
                <p>現在連背景的「邊框」與「色塊裝飾」都可以被滑鼠點擊拖曳了！</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div className={!showLogo ? 'opacity-40' : ''}>
                    <div className="flex justify-between items-center mb-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                            <input type="checkbox" checked={showLogo} onChange={(e)=>setShowLogo(e.target.checked)} className="accent-slate-500 w-4 h-4" /> 品牌徽章/LOGO (左上角)
                        </label>
                    </div>
                    <div className="flex gap-2">
                        {template === 'TechBright' && (
                            <input type="text" value={logoText} onChange={(e) => setLogoText(e.target.value)} disabled={!showLogo} placeholder="LOGO (預設 BRAND)" className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-xs font-bold bg-slate-50" />
                        )}
                        <input type="text" value={brandText} onChange={(e) => setBrandText(e.target.value)} disabled={!showLogo} placeholder="徽章內文 (如:官方授權店)" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-xs font-bold bg-slate-50" />
                    </div>
                </div>
                <div className={!showTitle ? 'opacity-40 border-t border-slate-100 pt-4' : 'border-t border-slate-100 pt-4'}>
                    <div className="flex justify-between items-center mb-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                            <input type="checkbox" checked={showTitle} onChange={(e)=>setShowTitle(e.target.checked)} className="accent-slate-500 w-4 h-4" /> 主標題 (可拖曳)
                        </label>
                        <select value={titleFont} onChange={(e)=>setTitleFont(e.target.value)} className="text-xs bg-slate-100 border-none rounded p-1.5 outline-none text-slate-600 font-bold cursor-pointer">
                            <option value="Microsoft JhengHei">微軟正黑體</option>
                            <option value="Arial">Arial 圓滑體</option>
                            <option value="sans-serif">標準黑體</option>
                            <option value="serif">經典明體</option>
                        </select>
                    </div>
                    <input type="text" value={promoText} onChange={(e) => setPromoText(e.target.value)} disabled={!showTitle} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none text-sm font-bold bg-slate-50" />
                </div>
                <div className={!showTags ? 'opacity-40 border-t border-slate-100 pt-4' : 'border-t border-slate-100 pt-4'}>
                    <div className="flex justify-between items-center mb-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                            <input type="checkbox" checked={showTags} onChange={(e)=>setShowTags(e.target.checked)} className="accent-slate-500 w-4 h-4" /> 獨立標籤 (以逗號分隔)
                        </label>
                        <select value={tagFont} onChange={(e)=>setTagFont(e.target.value)} className="text-xs bg-slate-100 border-none rounded p-1.5 outline-none text-slate-600 font-bold cursor-pointer">
                            <option value="Microsoft JhengHei">微軟正黑體</option>
                            <option value="Arial">Arial 圓滑體</option>
                            <option value="sans-serif">標準黑體</option>
                        </select>
                    </div>
                    <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} disabled={!showTags} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none text-sm font-medium bg-slate-50" />
                </div>
            </div>
          </section>

          {/* 外部圖示 */}
          <section className={!activeTheme.allowText ? 'opacity-30 pointer-events-none' : ''}>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-slate-700">
              <ImagePlus className="w-4 h-4" style={{ color: activeTheme.main }} /> 5. 外部圖示 (如:免運標章)
            </label>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold py-2.5 px-4 rounded-lg transition-colors border border-slate-200">
                        <input type="file" onChange={handleIconUpload} className="hidden" accept="image/*" />
                        選擇圖示 (透明PNG)
                    </label>
                    {iconImage ? <span className="text-sm text-emerald-500 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> 已載入 (可拖曳)</span> : null}
                    {iconImage && <button onClick={()=>{setIconImage(null); setIconOffset({x:150, y:-150});}} className="text-xs text-red-400 hover:text-red-600 underline ml-auto">移除</button>}
                </div>
                {iconImage && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-500">圖示大小 ({iconScale}%)</span></div>
                        <input type="range" min="10" max="100" value={iconScale} onChange={(e) => setIconScale(e.target.value)} className="w-full accent-slate-400" />
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
                    <RotateCcw className="w-3 h-3" /> 座標全部重置
                </button>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center">
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-4 border-slate-100 p-0 shadow-sm" />
                        <span className="text-xs text-slate-500 mt-2 font-bold">主色調</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-4 border-slate-100 p-0 shadow-sm" />
                        <span className="text-xs text-slate-500 mt-2 font-bold">重點色</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-4 border-slate-100 p-0 shadow-sm" />
                        <span className="text-xs text-slate-500 mt-2 font-bold">文字色</span>
                    </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-xs font-black text-slate-600 flex items-center gap-1"><Camera className="w-4 h-4"/> 商品主體縮放 ({productScale}%)</p>
                        </div>
                        <input type="range" min="50" max="150" value={productScale} onChange={(e) => setProductScale(e.target.value)} className="w-full accent-slate-400" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className={`bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-center ${!showLogo && 'opacity-40'}`}>
                            <p className="text-[10px] font-black text-slate-600 mb-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> 徽章 ({brandScale}%)</p>
                            <input type="range" min="50" max="150" value={brandScale} onChange={(e) => setBrandScale(e.target.value)} disabled={!showLogo} className="w-full accent-slate-400" />
                        </div>
                        <div className={`bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-center ${!showTitle && 'opacity-40'}`}>
                            <p className="text-[10px] font-black text-slate-600 mb-2 flex items-center gap-1"><TypeIcon className="w-3 h-3"/> 標題 ({textScale}%)</p>
                            <input type="range" min="50" max="150" value={textScale} onChange={(e) => setTextScale(e.target.value)} disabled={!showTitle} className="w-full accent-slate-400" />
                        </div>
                        <div className={`bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-center ${!showTags && 'opacity-40'}`}>
                            <p className="text-[10px] font-black text-slate-600 mb-2 flex items-center gap-1"><Box className="w-3 h-3"/> 標籤 ({tagScale}%)</p>
                            <input type="range" min="50" max="150" value={tagScale} onChange={(e) => setTagScale(e.target.value)} disabled={!showTags} className="w-full accent-slate-400" />
                        </div>
                    </div>

                    <div className={`bg-slate-50 p-4 rounded-lg border border-slate-100 ${!showTags && 'opacity-40'}`}>
                        <span className="text-xs font-bold text-slate-500 block mb-2">標籤外觀形狀</span>
                        <div className="flex bg-slate-200/50 rounded-lg p-1.5">
                            <button onClick={()=>setTagShape('pill')} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${tagShape==='pill' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>圓角滿版</button>
                            <button onClick={()=>setTagShape('rect')} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${tagShape==='rect' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>微圓角塊</button>
                            <button onClick={()=>setTagShape('outline')} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${tagShape==='outline' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>清透線框</button>
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
      <div className="flex-1 p-8 flex flex-col items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-100/80 bg-blend-overlay overflow-y-auto">
        <div className="mb-4 flex items-center gap-6 w-full max-w-[700px]">
            <div className="flex-1">
                <h2 className="text-2xl font-black text-slate-800 tracking-wide flex items-center gap-2" style={{ color: activeTheme.text }}>
                    <Maximize className="w-6 h-6" />
                    互動式渲染畫布 (1000x1000px)
                </h2>
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
