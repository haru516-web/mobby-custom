export function createEditor({ canvas, templateSelect, assetGrid }) {
  const ctx = canvas.getContext("2d");
  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));

  let templateImg = new Image();
  let templateUrl = "";
  let objects = []; // {type:'img'|'text'|'path', ...}
  let selectedId = null;
  let drag = null;
  let drawMode = "select";
  let drawing = null;
  let dragMoved = false;
  let rotateDrag = null;
  let scaleDrag = null;
  let erasing = null;
  let drawTool = "pen";
  let pinch = null;
  const activePointers = new Map();
  const sampleSpacing = 2;
  const MIN_SCALE = 0.05;
  const MAX_SCALE = 1.2;
  let history = [];
  let redoStack = [];
  let historyListener = null;
  let penOptions = {
    color: "#3a2f26",
    size: 6,
    effect: "none",
    effectColor: "#00f5ff",
    effectBlur: 18,
    strokeColor: "#000000",
    strokeWidth: 0
  };
  let eraserOptions = {
    size: 24
  };

  function applyEffect(ctx, effect, effectColor, effectBlur) {
    if (!effect || effect === "none") {
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      return;
    }
    const blur = Math.max(0, Number(effectBlur || 0));
    ctx.shadowColor = effectColor || "#000000";
    ctx.shadowBlur = blur;
    if (effect === "shadow") {
      const offset = Math.max(2, Math.round(blur * 0.15) || 2);
      ctx.shadowOffsetX = offset;
      ctx.shadowOffsetY = offset;
    } else {
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  function normalizeEffectOptions(opts = {}) {
    return {
      effect: opts.effect || "none",
      effectColor: opts.effectColor || "#00f5ff",
      effectBlur: Number(opts.effectBlur || 0),
      strokeColor: opts.strokeColor || "#000000",
      strokeWidth: Number(opts.strokeWidth || 0)
    };
  }

  function cloneObjects(list) {
    return list.map((o) => {
      if (o.type === "img") {
        return { ...o, img: o.img };
      }
      if (o.type === "path") {
        return { ...o, points: o.points.map((p) => ({ x: p.x, y: p.y })) };
      }
      return { ...o };
    });
  }

  function snapshot() {
    return {
      objects: cloneObjects(objects),
      selectedId,
    };
  }

  function notifyHistory() {
    if (historyListener) historyListener({ canUndo: history.length > 1, canRedo: redoStack.length > 0 });
  }

  function pushHistory() {
    history.push(snapshot());
    if (history.length > 80) history.shift();
    redoStack = [];
    notifyHistory();
  }

  function restore(state) {
    objects = cloneObjects(state.objects);
    selectedId = state.selectedId;
    draw();
  }

  function fitCanvas() {
    const cssW = canvas.clientWidth || 900;
    const cssH = cssW;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.floor(cssW * DPR);
    canvas.height = Math.floor(cssH * DPR);
    draw();
  }

  function loadTemplate(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { templateImg = img; templateUrl = url || ""; draw(); resolve(); };
      img.onerror = reject;
      img.src = url;
    });
  }

  function addAsset(assetUrl, name) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const id = crypto.randomUUID();
      objects.push({
        type: "img",
        id,
        img,
        name,
        src: assetUrl,
        x: canvas.width / 2,
        y: canvas.height / 2,
        s: 0.35,
        r: 0,
        w: img.width,
        h: img.height,
      });
      selectedId = id;
      draw();
      pushHistory();
    };
    img.src = assetUrl;
  }

  function addText(text, fontFamily = "Noto Sans JP", size = 36, style = {}) {
    const t = String(text || "").trim();
    if (!t) return;
    const effect = normalizeEffectOptions(style);
    const id = crypto.randomUUID();
    objects.push({
      type: "text",
      id,
      text: t,
      fontFamily,
      size,
      color: style.color || "#ffffff",
      x: canvas.width / 2,
      y: canvas.height / 2,
      s: 1,
      r: Number(style.r || 0),
      effect: effect.effect,
      effectColor: effect.effectColor,
      effectBlur: effect.effectBlur,
      strokeColor: effect.strokeColor,
      strokeWidth: effect.strokeWidth
    });
    selectedId = id;
    draw();
    pushHistory();
  }

  function clearAll() {
    objects = [];
    selectedId = null;
    draw();
    pushHistory();
  }

  function hitTest(px, py) {
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      if (o.type === "path") continue;
      const cos = Math.cos(-o.r);
      const sin = Math.sin(-o.r);
      const dx = px - o.x;
      const dy = py - o.y;
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;

      if (o.type === "img") {
        const halfW = (o.w * o.s) / 2;
        const halfH = (o.h * o.s) / 2;
        if (lx >= -halfW && lx <= halfW && ly >= -halfH && ly <= halfH) return o.id;
      } else {
        ctx.save();
        ctx.font = `${o.size}px "${o.fontFamily}"`;
        const w = ctx.measureText(o.text).width * o.s;
        const h = o.size * o.s;
        ctx.restore();
        if (lx >= -w / 2 && lx <= w / 2 && ly >= -h / 2 && ly <= h / 2) return o.id;
      }
    }
    return null;
  }

  function getObjectBounds(o) {
    if (o.type === "img") {
      return { w: o.w * o.s, h: o.h * o.s };
    }
    ctx.save();
    ctx.font = `${o.size}px "${o.fontFamily}"`;
    const w = ctx.measureText(o.text).width * o.s;
    const h = o.size * o.s;
    ctx.restore();
    return { w, h };
  }

  function getDeleteHandle(o) {
    const bounds = getObjectBounds(o);
    const offset = Math.max(10 * DPR, Math.min(bounds.w, bounds.h) * 0.08);
    const radius = Math.max(12 * DPR, Math.min(bounds.w, bounds.h) * 0.09);
    const localX = bounds.w / 2 + offset;
    const localY = -bounds.h / 2 - offset;
    const cos = Math.cos(o.r);
    const sin = Math.sin(o.r);
    return {
      x: o.x + localX * cos - localY * sin,
      y: o.y + localX * sin + localY * cos,
      radius
    };
  }

  function getScaleHandle(o) {
    const bounds = getObjectBounds(o);
    const offset = Math.max(14 * DPR, Math.min(bounds.w, bounds.h) * 0.1);
    const radius = Math.max(16 * DPR, Math.min(bounds.w, bounds.h) * 0.1);
    const localX = bounds.w / 2 + offset;
    const localY = bounds.h / 2 + offset;
    const cos = Math.cos(o.r);
    const sin = Math.sin(o.r);
    return {
      x: o.x + localX * cos - localY * sin,
      y: o.y + localX * sin + localY * cos,
      radius
    };
  }

  function hitDeleteHandle(px, py, o) {
    if (o.type !== "img") return false;
    const handle = getDeleteHandle(o);
    const dx = px - handle.x;
    const dy = py - handle.y;
    return (dx * dx + dy * dy) <= (handle.radius * handle.radius);
  }

  function hitScaleHandle(px, py, o) {
    if (o.type === "path") return false;
    const handle = getScaleHandle(o);
    const dx = px - handle.x;
    const dy = py - handle.y;
    return (dx * dx + dy * dy) <= (handle.radius * handle.radius);
  }

  function getRotationRing(px, py, o) {
    const dx = px - o.x;
    const dy = py - o.y;
    const dist = Math.hypot(dx, dy);
    const bounds = getObjectBounds(o);
    const base = Math.max(bounds.w, bounds.h) * 0.5;
    const ring = Math.max(26 * DPR, base + 16 * DPR);
    const thick = 10 * DPR;
    if (dist >= ring - thick && dist <= ring + thick) return { ring, dist };
    return null;
  }

  function distToSegmentSquared(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    if (ab2 === 0) return apx * apx + apy * apy;
    let t = (apx * abx + apy * aby) / ab2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy;
  }

  function sampleAlongLine(ax, ay, bx, by, spacing) {
    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy);
    if (dist <= spacing) return [];
    const steps = Math.floor(dist / spacing);
    const points = [];
    for (let i = 1; i <= steps; i++) {
      const t = (spacing * i) / dist;
      points.push({ x: ax + dx * t, y: ay + dy * t });
    }
    return points;
  }

  function eraseAt(x, y) {
    const radius = Math.max(1, Number(eraserOptions.size || 0) * 0.5);
    const r2 = radius * radius;
    let changed = false;
    const next = [];

    for (const o of objects) {
      if (o.type !== "path") {
        next.push(o);
        continue;
      }

      let anyRemoved = false;
      let current = [];
      const segments = [];

      for (let i = 0; i < o.points.length; i++) {
        const p = o.points[i];
        const dx = p.x - x;
        const dy = p.y - y;
        const pointHit = (dx * dx + dy * dy) <= r2;
        let segHit = false;
        if (i > 0) {
          const prev = o.points[i - 1];
          segHit = distToSegmentSquared(x, y, prev.x, prev.y, p.x, p.y) <= r2;
        }
        if (pointHit || segHit) {
          anyRemoved = true;
          if (current.length > 1) segments.push(current);
          current = [];
          if (!pointHit && !segHit) {
            current.push(p);
          }
        } else {
          current.push(p);
        }
      }
      if (current.length > 1) segments.push(current);

      if (!anyRemoved) {
        next.push(o);
        continue;
      }

      changed = true;
      for (const seg of segments) {
        next.push({
          ...o,
          id: crypto.randomUUID(),
          points: seg.map((p) => ({ x: p.x, y: p.y }))
        });
      }
    }

    if (changed) {
      objects = next;
      if (selectedId && !objects.find(o => o.id === selectedId)) selectedId = null;
    }
    return changed;
  }

  function drawStroke(points, width, color, effect) {
    if (!points.length) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    if (effect) applyEffect(ctx, effect.effect, effect.effectColor, effect.effectBlur);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pad = canvas.width * 0.06;
    const w = canvas.width - pad * 2;
    const h = canvas.height - pad * 2;

    ctx.save();
    if (templateImg?.width) {
      ctx.drawImage(templateImg, pad, pad, w, h);
    } else {
      ctx.fillStyle = "rgba(255,255,255,.06)";
      ctx.fillRect(pad, pad, w, h);
    }
    ctx.restore();

    for (const o of objects) {
      if (o.type === "path") {
        if (o.strokeWidth > 0) {
          drawStroke(o.points, o.size + o.strokeWidth * 2, o.strokeColor, null);
        }
        drawStroke(o.points, o.size, o.color, o);
        continue;
      }

      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.r);
      ctx.scale(o.s, o.s);

      if (o.type === "img") {
        ctx.drawImage(o.img, -o.w / 2, -o.h / 2);
      } else {
        ctx.fillStyle = o.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${o.size}px "${o.fontFamily}"`;
        applyEffect(ctx, o.effect, o.effectColor, o.effectBlur);
        if (o.strokeWidth > 0) {
          ctx.lineWidth = o.strokeWidth * 2;
          ctx.strokeStyle = o.strokeColor;
          ctx.strokeText(o.text, 0, 0);
        }
        ctx.fillText(o.text, 0, 0);
      }
      ctx.restore();

      if (o.id === selectedId) {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.r);
        ctx.strokeStyle = "rgba(106,168,255,.9)";
        ctx.lineWidth = Math.max(2, 2 * DPR);

        if (o.type === "img") {
          ctx.strokeRect(-(o.w * o.s) / 2, -(o.h * o.s) / 2, o.w * o.s, o.h * o.s);
        } else {
          ctx.font = `${o.size}px "${o.fontFamily}"`;
          const tw = ctx.measureText(o.text).width * o.s;
          const th = o.size * o.s;
          ctx.strokeRect(-tw / 2, -th / 2, tw, th);
        }
        ctx.restore();
      }
    }

    if (selectedId) {
      const o = objects.find(v => v.id === selectedId);
      if (o && o.type !== "path") {
        const bounds = getObjectBounds(o);
        const ring = Math.max(26 * DPR, Math.max(bounds.w, bounds.h) * 0.5 + 16 * DPR);
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.strokeStyle = "rgba(106,168,255,.55)";
        ctx.lineWidth = Math.max(2, 2 * DPR);
        ctx.setLineDash([6 * DPR, 6 * DPR]);
        ctx.beginPath();
        ctx.arc(0, 0, ring, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(106,168,255,.9)";
        ctx.beginPath();
        ctx.arc(ring, 0, 4 * DPR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const scaleHandle = getScaleHandle(o);
        ctx.save();
        ctx.fillStyle = "rgba(106,168,255,.9)";
        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.lineWidth = Math.max(2, 2 * DPR);
        ctx.beginPath();
        ctx.arc(scaleHandle.x, scaleHandle.y, scaleHandle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      if (o && o.type === "img") {
        const handle = getDeleteHandle(o);
        ctx.save();
        ctx.fillStyle = "rgba(28,34,48,.9)";
        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.lineWidth = Math.max(2, 2 * DPR);
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, handle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const cross = handle.radius * 0.6;
        ctx.beginPath();
        ctx.moveTo(handle.x - cross, handle.y - cross);
        ctx.lineTo(handle.x + cross, handle.y + cross);
        ctx.moveTo(handle.x + cross, handle.y - cross);
        ctx.lineTo(handle.x - cross, handle.y + cross);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function toCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * DPR;
    const y = (e.clientY - rect.top) * DPR;
    return { x, y };
  }

  function updatePointer(e) {
    const { x, y } = toCanvasCoords(e);
    activePointers.set(e.pointerId, { x, y, type: e.pointerType });
    return { x, y };
  }

  function clampScale(value) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  }

  function maybeStartPinch() {
    if (drawMode === "draw" || activePointers.size !== 2 || !selectedId) return false;
    const o = objects.find(v => v.id === selectedId);
    if (!o || o.type === "path") return false;
    const points = Array.from(activePointers.values());
    const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    pinch = {
      id: o.id,
      startDist: dist || 1,
      startScale: o.s
    };
    drag = null;
    rotateDrag = null;
    scaleDrag = null;
    drawing = null;
    erasing = null;
    return true;
  }

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = updatePointer(e);
    if (maybeStartPinch()) {
      draw();
      return;
    }
    if (drawMode === "draw") {
      if (drawTool === "eraser") {
        erasing = { pointerId: e.pointerId, lastX: x, lastY: y };
        const changed = eraseAt(x, y);
        if (changed) draw();
        return;
      }
      const id = crypto.randomUUID();
      drawing = { id, pointerId: e.pointerId, lastX: x, lastY: y };
      const effect = normalizeEffectOptions(penOptions);
      objects.push({
        type: "path",
        id,
        points: [{ x, y }],
        color: penOptions.color,
        size: penOptions.size,
        effect: effect.effect,
        effectColor: effect.effectColor,
        effectBlur: effect.effectBlur,
        strokeColor: effect.strokeColor,
        strokeWidth: effect.strokeWidth
      });
      selectedId = null;
      drag = null;
      draw();
      return;
    }
    const current = selectedId ? objects.find(v => v.id === selectedId) : null;
    if (current && current.type !== "path") {
      if (hitDeleteHandle(x, y, current)) {
        objects = objects.filter(v => v.id !== current.id);
        selectedId = null;
        draw();
        pushHistory();
        return;
      }
      if (hitScaleHandle(x, y, current)) {
        const dist = Math.hypot(x - current.x, y - current.y);
        scaleDrag = {
          id: current.id,
          startDist: dist || 1,
          baseScale: current.s
        };
        drag = null;
        rotateDrag = null;
        drawing = null;
        erasing = null;
        draw();
        return;
      }
      const ring = getRotationRing(x, y, current);
      if (ring) {
        rotateDrag = {
          id: current.id,
          startAngle: Math.atan2(y - current.y, x - current.x),
          baseRotation: current.r
        };
        drag = null;
        draw();
        return;
      }
    }
    const id = hitTest(x, y);
    selectedId = id;
    if (id) {
      const o = objects.find(v => v.id === id);
      drag = { id, dx: x - o.x, dy: y - o.y };
      dragMoved = false;
    } else {
      drag = null;
    }
    draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    updatePointer(e);
    if (pinch && activePointers.size === 2) {
      const points = Array.from(activePointers.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const o = objects.find(v => v.id === pinch.id);
      if (o) {
        const nextScale = clampScale(pinch.startScale * (dist / pinch.startDist));
        if (o.s !== nextScale) {
          o.s = nextScale;
          draw();
        }
      }
      return;
    }
    if (scaleDrag && scaleDrag.id) {
      const o = objects.find(v => v.id === scaleDrag.id);
      if (!o) return;
      const { x, y } = toCanvasCoords(e);
      const dist = Math.hypot(x - o.x, y - o.y);
      const nextScale = clampScale(scaleDrag.baseScale * (dist / scaleDrag.startDist));
      if (o.s !== nextScale) {
        o.s = nextScale;
        draw();
      }
      return;
    }
    if (erasing && erasing.pointerId === e.pointerId) {
      const { x, y } = toCanvasCoords(e);
      const samples = sampleAlongLine(erasing.lastX, erasing.lastY, x, y, sampleSpacing * DPR);
      let changed = false;
      for (const p of samples) {
        if (eraseAt(p.x, p.y)) changed = true;
      }
      erasing.lastX = x;
      erasing.lastY = y;
      if (changed) draw();
      return;
    }
    if (rotateDrag && rotateDrag.id) {
      const o = objects.find(v => v.id === rotateDrag.id);
      if (!o) return;
      const { x, y } = toCanvasCoords(e);
      const next = Math.atan2(y - o.y, x - o.x);
      o.r = rotateDrag.baseRotation + (next - rotateDrag.startAngle);
      draw();
      return;
    }
    if (drawing && drawing.pointerId === e.pointerId) {
      const o = objects.find(v => v.id === drawing.id);
      if (!o) return;
      const { x, y } = toCanvasCoords(e);
      const samples = sampleAlongLine(drawing.lastX, drawing.lastY, x, y, sampleSpacing * DPR);
      if (samples.length) {
        for (const p of samples) o.points.push(p);
        drawing.lastX = x;
        drawing.lastY = y;
        draw();
      }
      return;
    }
    if (!drag) return;
    const { x, y } = toCanvasCoords(e);
    const o = objects.find(v => v.id === drag.id);
    if (!o) return;
    const nextX = x - drag.dx;
    const nextY = y - drag.dy;
    if (o.x !== nextX || o.y !== nextY) {
      o.x = nextX;
      o.y = nextY;
      dragMoved = true;
    }
    draw();
  });

  canvas.addEventListener("pointerup", (e) => {
    activePointers.delete(e.pointerId);
    if (pinch && activePointers.size < 2) {
      pinch = null;
      pushHistory();
      return;
    }
    if (scaleDrag) {
      scaleDrag = null;
      pushHistory();
      return;
    }
    if (erasing && erasing.pointerId === e.pointerId) {
      erasing = null;
      pushHistory();
      return;
    }
    if (rotateDrag) {
      rotateDrag = null;
      pushHistory();
      return;
    }
    if (drawing && drawing.pointerId === e.pointerId) {
      drawing = null;
      pushHistory();
      return;
    }
    if (drag && dragMoved) pushHistory();
    drag = null;
  });
  canvas.addEventListener("pointercancel", () => {
    activePointers.clear();
    drawing = null;
    drag = null;
    rotateDrag = null;
    erasing = null;
    pinch = null;
    scaleDrag = null;
  });

  canvas.addEventListener("wheel", (e) => {
    if (!selectedId) return;
    e.preventDefault();
    const o = objects.find(v => v.id === selectedId);
    if (!o) return;
    const delta = Math.sign(e.deltaY) * -0.04;
    o.s = clampScale(o.s + delta);
    draw();
    pushHistory();
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (!selectedId) return;
    const o = objects.find(v => v.id === selectedId);
    if (!o) return;

    if (e.key === "Delete" || e.key === "Backspace") {
      objects = objects.filter(v => v.id !== selectedId);
      selectedId = null;
      draw();
      pushHistory();
    }
    if (e.key.toLowerCase() === "q") { o.r -= 0.08; draw(); pushHistory(); }
    if (e.key.toLowerCase() === "e") { o.r += 0.08; draw(); pushHistory(); }
  });

  function dataUrlToBlob(dataUrl) {
    const [meta, encoded] = dataUrl.split(",");
    const mime = (meta.match(/data:([^;]+)/) || [])[1] || "image/png";
    const binary = atob(encoded);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  async function exportPngBlob(options = {}) {
    const hideUi = !!options.hideUi;
    const prevSelectedId = selectedId;
    if (hideUi) {
      selectedId = null;
      draw();
    }
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1.0));
    if (!blob) {
      const dataUrl = canvas.toDataURL("image/png");
      blob = dataUrlToBlob(dataUrl);
    }
    if (hideUi) {
      selectedId = prevSelectedId;
      draw();
    }
    return blob;
  }

  function setAssets(assetList) {
    assetGrid.innerHTML = "";
    const groups = [
      { key: "mobby", label: "モビー" },
      { key: "lucky", label: "素材" },
      { key: "logo", label: "Logo" },
    ];

    const grouped = new Map(groups.map((g) => [g.key, []]));
    const isMobbyAsset = (name, url) => /モビ[ィー]/.test(name) || /モビ[ィー]/.test(url) || /モビィ透過済|モビー透過済/.test(url);

    for (const a of assetList) {
      const url = String(a.url || "");
      const name = String(a.name || "");
      let key = "lucky";
      if (name === "Logo") {
        key = "logo";
      } else if (isMobbyAsset(name, url)) {
        key = "mobby";
      }
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(a);
    }

    const tabs = document.createElement("div");
    tabs.className = "assetTabs";
    const row = document.createElement("div");
    row.className = "assetRow";
    const empty = document.createElement("p");
    empty.className = "muted assetEmpty";

    const tabButtons = new Map();
    let activeKey = groups.find((g) => (grouped.get(g.key) || []).length)?.key || groups[0].key;

    function renderGroup(key) {
      row.innerHTML = "";
      const items = grouped.get(key) || [];
      empty.textContent = "素材がまだありません。";
      empty.classList.toggle("hidden", items.length > 0);
      for (const a of items) {
        const div = document.createElement("button");
        div.className = "asset";
        div.type = "button";
        div.innerHTML = `<img src="${a.url}" alt=""><span>${a.name}</span>`;
        div.addEventListener("click", () => addAsset(a.url, a.name));
        row.appendChild(div);
      }
    }

    function updateTabs() {
      for (const [key, btn] of tabButtons.entries()) {
        btn.classList.toggle("active", key === activeKey);
      }
    }

    for (const group of groups) {
      const btn = document.createElement("button");
      btn.className = "assetTab";
      btn.type = "button";
      btn.textContent = group.label;
      btn.addEventListener("click", () => {
        if (activeKey === group.key) return;
        activeKey = group.key;
        renderGroup(activeKey);
        updateTabs();
      });
      tabButtons.set(group.key, btn);
      tabs.appendChild(btn);
    }

    assetGrid.appendChild(tabs);
    assetGrid.appendChild(row);
    assetGrid.appendChild(empty);

    renderGroup(activeKey);
    updateTabs();
  }

  function getUsedAssetNames() {
    return objects.filter(o => o.type === "img").map(o => o.name);
  }

  function getState() {
    const safeObjects = objects.map((o) => {
      if (o.type === "img") {
        return {
          type: "img",
          id: o.id,
          name: o.name || "",
          src: o.src || "",
          x: o.x,
          y: o.y,
          s: o.s,
          r: o.r,
          w: o.w,
          h: o.h
        };
      }
      if (o.type === "text") {
        return {
          type: "text",
          id: o.id,
          text: o.text || "",
          fontFamily: o.fontFamily || "Noto Sans JP",
          size: o.size,
          color: o.color || "#ffffff",
          x: o.x,
          y: o.y,
          s: o.s,
          r: o.r,
          effect: o.effect || "none",
          effectColor: o.effectColor || "#00f5ff",
          effectBlur: o.effectBlur || 0,
          strokeColor: o.strokeColor || "#000000",
          strokeWidth: o.strokeWidth || 0
        };
      }
      return {
        type: "path",
        id: o.id,
        points: Array.isArray(o.points) ? o.points.map((p) => ({ x: p.x, y: p.y })) : [],
        color: o.color || "#000000",
        size: o.size || 1,
        effect: o.effect || "none",
        effectColor: o.effectColor || "#00f5ff",
        effectBlur: o.effectBlur || 0,
        strokeColor: o.strokeColor || "#000000",
        strokeWidth: o.strokeWidth || 0
      };
    });
    return { template: templateUrl, objects: safeObjects };
  }

  function setDrawMode(mode) {
    drawMode = mode === "draw" ? "draw" : "select";
  }

  function setPenOptions(opts = {}) {
    const effect = normalizeEffectOptions(opts);
    penOptions = {
      color: opts.color || penOptions.color,
      size: Number(opts.size || penOptions.size),
      effect: effect.effect,
      effectColor: effect.effectColor,
      effectBlur: effect.effectBlur,
      strokeColor: effect.strokeColor,
      strokeWidth: effect.strokeWidth
    };
  }

  function setEraserOptions(opts = {}) {
    eraserOptions = {
      size: Number(opts.size || eraserOptions.size)
    };
  }

  function setDrawTool(tool) {
    drawTool = tool === "eraser" ? "eraser" : "pen";
  }

  function clearDraw() {
    objects = objects.filter(o => o.type !== "path");
    if (selectedId && !objects.find(o => o.id === selectedId)) selectedId = null;
    draw();
    pushHistory();
  }

  function applyTextStyleToSelected(style = {}) {
    if (!selectedId) return;
    const o = objects.find(v => v.id === selectedId);
    if (!o || o.type !== "text") return;
    let changed = false;
    if (style.color && o.color !== style.color) { o.color = style.color; changed = true; }
    if (style.fontFamily && o.fontFamily !== style.fontFamily) { o.fontFamily = style.fontFamily; changed = true; }
    if (Number.isFinite(style.size) && o.size !== style.size) { o.size = style.size; changed = true; }
    if (Number.isFinite(style.r) && o.r !== style.r) { o.r = style.r; changed = true; }
    if ("effect" in style || "effectColor" in style || "effectBlur" in style || "strokeColor" in style || "strokeWidth" in style) {
      const effect = normalizeEffectOptions(style);
      if (o.effect !== effect.effect) { o.effect = effect.effect; changed = true; }
      if (o.effectColor !== effect.effectColor) { o.effectColor = effect.effectColor; changed = true; }
      if (o.effectBlur !== effect.effectBlur) { o.effectBlur = effect.effectBlur; changed = true; }
      if (o.strokeColor !== effect.strokeColor) { o.strokeColor = effect.strokeColor; changed = true; }
      if (o.strokeWidth !== effect.strokeWidth) { o.strokeWidth = effect.strokeWidth; changed = true; }
    }
    if (changed) {
      draw();
      pushHistory();
    }
  }

  function updateSelectedText(text) {
    if (!selectedId) return false;
    const o = objects.find(v => v.id === selectedId);
    if (!o || o.type !== "text") return false;
    const next = String(text ?? "");
    if (o.text === next) return true;
    o.text = next;
    draw();
    pushHistory();
    return true;
  }

  templateSelect?.addEventListener("change", () => loadTemplate(templateSelect.value));
  window.addEventListener("resize", fitCanvas);
  history = [snapshot()];
  notifyHistory();

  return {
    fitCanvas,
    loadTemplate,
    setAssets,
    addText,
    clearAll,
    draw,
    exportPngBlob,
    getUsedAssetNames,
    getState,
    setDrawMode,
    setPenOptions,
    setEraserOptions,
    setDrawTool,
    clearDraw,
    applyTextStyleToSelected,
    updateSelectedText,
    undo() {
      if (history.length <= 1) return false;
      const current = history.pop();
      redoStack.push(current);
      restore(history[history.length - 1]);
      notifyHistory();
      return true;
    },
    redo() {
      if (!redoStack.length) return false;
      const state = redoStack.pop();
      history.push(state);
      restore(state);
      notifyHistory();
      return true;
    },
    setHistoryListener(fn) {
      historyListener = fn;
      notifyHistory();
    },
  };
}
