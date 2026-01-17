import {
  collection, doc, addDoc, getDocs, query, orderBy, limit,
  serverTimestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export function createGallery({ db, uid, gridEl, statusEl, modalEl, modalBodyEl }) {
  const designsCol = collection(db, "designs");

  async function fetchTop() {
    statusEl.textContent = "読み込み中...";
    gridEl.innerHTML = "";

    const q = query(designsCol, orderBy("likes", "desc"), limit(30));
    const snap = await getDocs(q);

    if (snap.empty) {
      statusEl.textContent = "まだ投稿がありません。";
      return;
    }
    statusEl.textContent = "";

    for (const d of snap.docs) {
      const data = d.data();
      gridEl.appendChild(renderCard(d.id, data));
    }
  }

  function renderCard(id, data) {
    const el = document.createElement("div");
    el.className = "work";

    const title = escapeHtml(data.title || "Untitled");
    const likes = Number(data.likes || 0);

    el.innerHTML = `
      <img src="${data.imageUrl}" alt="">
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
        <img src="${data.imageUrl}" alt="" style="width:360px;max-width:45vw;border-radius:14px;border:1px solid rgba(255,255,255,.12)">
        <div style="flex:1;min-width:240px">
          <div style="font-weight:800;font-size:18px">${escapeHtml(data.title || "Untitled")}</div>
          <div class="muted">👍 ${Number(data.likes || 0)} / ${formatDate(data.createdAt)}</div>

          <div class="row" style="margin-top:10px">
            <input id="commentInput" class="input" maxlength="140" placeholder="コメントを書く（140文字まで）" style="flex:1">
            <button id="commentSend" class="btn primary">送信</button>
          </div>

          <div id="commentList"></div>
        </div>
      </div>
    `;

    modalEl.showModal();

    const listEl = modalBodyEl.querySelector("#commentList");
    const inputEl = modalBodyEl.querySelector("#commentInput");
    const sendBtn = modalBodyEl.querySelector("#commentSend");

    async function refreshComments() {
      listEl.innerHTML = `<div class="muted">読み込み中...</div>`;
      const commentsCol = collection(db, "designs", designId, "comments");
      const q = query(commentsCol, orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);

      if (snap.empty) {
        listEl.innerHTML = `<div class="muted">コメントはまだありません。</div>`;
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

  return { fetchTop };
}
