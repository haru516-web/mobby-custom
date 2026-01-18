import {
  collection, doc, addDoc, getDocs, query, orderBy, limit,
  serverTimestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export function createGallery({ db, uid, gridEl, statusEl, modalEl, modalBodyEl }) {
  const designsCol = collection(db, "designs");
  let cachedDocs = [];
  let currentFilter = "all";
  let filterOptions = [];

  function extractMobbyNames(state) {
    const names = new Set();
    const objects = Array.isArray(state?.objects) ? state.objects : [];
    for (const o of objects) {
      if (o?.type === "img" && typeof o.name === "string" && o.name.includes("モビィ")) {
        names.add(o.name);
      }
    }
    return names;
  }

  function buildFilterOptions(items) {
    const set = new Set();
    for (const item of items) {
      const names = extractMobbyNames(item.data?.state);
      for (const name of names) set.add(name);
    }
    return Array.from(set);
  }

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

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function drawStroke(ctx, points, width, color, effect) {
    if (!points?.length) return;
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

  async function renderStateToCanvas(state, canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width || 900;
    canvas.width = size;
    canvas.height = size;

    const pad = canvas.width * 0.06;
    const w = canvas.width - pad * 2;
    const h = canvas.height - pad * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const templateUrl = state?.template || "";
    if (templateUrl) {
      try {
        const templateImg = await loadImage(templateUrl);
        ctx.drawImage(templateImg, pad, pad, w, h);
      } catch (_) {
        ctx.fillStyle = "rgba(255,255,255,.06)";
        ctx.fillRect(pad, pad, w, h);
      }
    } else {
      ctx.fillStyle = "rgba(255,255,255,.06)";
      ctx.fillRect(pad, pad, w, h);
    }

    const objects = Array.isArray(state?.objects) ? state.objects : [];
    const imageLoads = objects
      .filter((o) => o.type === "img" && o.src)
      .map((o) => loadImage(o.src).then((img) => ({ id: o.id, img })));

    const loadedImages = await Promise.all(imageLoads);
    const imageMap = new Map(loadedImages.map((entry) => [entry.id, entry.img]));

    for (const o of objects) {
      if (o.type === "path") {
        if (o.strokeWidth > 0) {
          drawStroke(ctx, o.points, o.size + o.strokeWidth * 2, o.strokeColor, null);
        }
        drawStroke(ctx, o.points, o.size, o.color, o);
        continue;
      }

      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.r || 0);
      ctx.scale(o.s || 1, o.s || 1);

      if (o.type === "img") {
        const img = imageMap.get(o.id);
        if (img) {
          const w = o.w || img.width;
          const h = o.h || img.height;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
      } else if (o.type === "text") {
        ctx.fillStyle = o.color || "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${o.size || 36}px "${o.fontFamily || "Noto Sans JP"}"`;
        applyEffect(ctx, o.effect, o.effectColor, o.effectBlur);
        if (o.strokeWidth > 0) {
          ctx.lineWidth = o.strokeWidth * 2;
          ctx.strokeStyle = o.strokeColor || "#000000";
          ctx.strokeText(o.text || "", 0, 0);
        }
        ctx.fillText(o.text || "", 0, 0);
      }
      ctx.restore();
    }
  }

  function renderCurrent() {
    gridEl.innerHTML = "";

    const filtered = cachedDocs.filter(({ data }) => {
      if (currentFilter === "all") return true;
      const names = extractMobbyNames(data?.state);
      return names.has(currentFilter);
    });

    if (!filtered.length) {
      statusEl.textContent = "まだ投稿がありません。";
      return;
    }

    statusEl.textContent = "";
    for (const item of filtered) {
      gridEl.appendChild(renderCard(item.id, item.data));
    }
  }

  async function fetchTop() {
    statusEl.textContent = "読み込み中...";
    gridEl.innerHTML = "";

    const q = query(designsCol, orderBy("likes", "desc"), limit(30));
    const snap = await getDocs(q);

    cachedDocs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    filterOptions = buildFilterOptions(cachedDocs);
    if (currentFilter !== "all" && !filterOptions.includes(currentFilter)) {
      currentFilter = "all";
    }
    renderCurrent();
  }

  function setFilter(next) {
    currentFilter = next || "all";
    renderCurrent();
  }

  function getFilterOptions() {
    return ["all", ...filterOptions];
  }

  function renderCard(id, data) {
    const el = document.createElement("div");
    el.className = "work";

    const title = escapeHtml(data.title || "Untitled");
    const likes = Number(data.likes || 0);

    el.innerHTML = `
      <img src="${data.thumb}" alt="">
      <div class="workBody">
        <div class="workTitle">${title}</div>
        <div class="workMeta">👍 ${likes} / ${formatDate(data.createdAt)}</div>
        <div class="workActions">
          <button class="btn smallBtn" data-like="1">いいね</button>
          <button class="btn smallBtn" data-open="1">コメント</button>
        </div>
      </div>
    `;

    el.querySelector('[data-like="1"]').addEventListener("click", async () => {
      if (!uid) {
        alert("ログインが必要");
        return;
      }
      try { await toggleLike(id); await fetchTop(); }
      catch (e) { alert("いいねに失敗: " + e.message); }
    });

    el.querySelector('[data-open="1"]').addEventListener("click", async () => {
      await openModal(id, data);
    });

    return el;
  }

  async function toggleLike(designId) {
    const designRef = doc(db, "designs", designId);
    const likeRef = doc(db, "designs", designId, "likesByUser", uid);

    await runTransaction(db, async (tx) => {
      const designSnap = await tx.get(designRef);
      const likeSnap = await tx.get(likeRef);

      if (!designSnap.exists()) throw new Error("作品が見つかりません");
      const likes = Number(designSnap.data().likes || 0);

      if (likeSnap.exists()) {
        tx.delete(likeRef);
        tx.update(designRef, { likes: Math.max(0, likes - 1) });
      } else {
        tx.set(likeRef, { createdAt: serverTimestamp() });
        tx.update(designRef, { likes: likes + 1 });
      }
    });
  }

  async function openModal(designId, data) {
    modalBodyEl.innerHTML = `
      <div class="row" style="align-items:flex-start;">
        <canvas id="previewCanvas" width="900" height="900" style="width:360px;max-width:45vw;border-radius:14px;border:1px solid rgba(255,255,255,.12)"></canvas>
        <div style="flex:1;min-width:240px">
          <div style="font-weight:800;font-size:18px">${escapeHtml(data.title || "Untitled")}</div>
          <div class="muted">👍 ${Number(data.likes || 0)} / ${formatDate(data.createdAt)}</div>

          <div class="row" style="margin-top:10px">
            <input id="commentInput" class="input" maxlength="140" placeholder="コメントを書く！（140文字まで）" style="flex:1">
            <button id="commentSend" class="btn primary">送信</button>
          </div>

          <div id="commentList"></div>
        </div>
      </div>
    `;

    modalEl.showModal();

    const previewCanvas = modalBodyEl.querySelector("#previewCanvas");
    await renderStateToCanvas(data.state, previewCanvas);

    const listEl = modalBodyEl.querySelector("#commentList");
    const inputEl = modalBodyEl.querySelector("#commentInput");
    const sendBtn = modalBodyEl.querySelector("#commentSend");

    async function refreshComments() {
      listEl.innerHTML = `<div class="muted">読み込み中...</div>`;
      const commentsCol = collection(db, "designs", designId, "comments");
      const q = query(commentsCol, orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);

      if (snap.empty) {
        listEl.innerHTML = `<div class="muted">コメントがまだありません。</div>`;
        return;
      }

      listEl.innerHTML = "";
      for (const c of snap.docs) {
        const cd = c.data();
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `
          <div>${escapeHtml(cd.text || "")}</div>
          <small>${formatDate(cd.createdAt)} / ${shortUid(cd.uid)}</small>
        `;
        listEl.appendChild(div);
      }
    }

    sendBtn.onclick = async () => {
      if (!uid) {
        alert("ログインが必要");
        return;
      }
      const text = (inputEl.value || "").trim();
      if (!text) return;
      inputEl.value = "";
      const commentsCol = collection(db, "designs", designId, "comments");
      await addDoc(commentsCol, { uid, text, createdAt: serverTimestamp() });
      await refreshComments();
    };

    await refreshComments();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }
  function shortUid(u) { return (u || "").slice(0, 6) + "..." }
  function formatDate(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("ja-JP");
  }

  return { fetchTop, setFilter, getFilterOptions };
}
