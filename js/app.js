import { db, storage, auth, googleProvider } from "./firebase.js";
import { createEditor } from "./editor.js";
import { createGallery } from "./gallery.js";

import {
  collection, doc, addDoc, getDoc, getDocs, query, orderBy, limit, setDoc,
  serverTimestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import { onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const tabDesign = document.getElementById("tabDesign");
const tabGallery = document.getElementById("tabGallery");
const tabProfile = document.getElementById("tabProfile");
const viewDesign = document.getElementById("viewDesign");
const viewGallery = document.getElementById("viewGallery");
const viewProfile = document.getElementById("viewProfile");

const userBadge = document.getElementById("userBadge");

const canvas = document.getElementById("designCanvas");
const templateSelect = document.getElementById("templateSelect");
const assetGrid = document.getElementById("assetGrid");
const btnClear = document.getElementById("btnClear");
const btnPublish = document.getElementById("btnPublish");
const titleInput = document.getElementById("titleInput");

const panelTextBtn = document.getElementById("panelTextBtn");
const panelDrawBtn = document.getElementById("panelDrawBtn");
const panelStickerBtn = document.getElementById("panelStickerBtn");
const panelText = document.getElementById("panelText");
const panelDraw = document.getElementById("panelDraw");
const panelSticker = document.getElementById("panelSticker");
const btnUndo = document.getElementById("btnUndo");
const btnRedo = document.getElementById("btnRedo");

const textInput = document.getElementById("textInput");
const textSize = document.getElementById("textSize");
const textSizeValue = document.getElementById("textSizeValue");
const textFont = document.getElementById("textFont");
const btnAddText = document.getElementById("btnAddText");
const textColor = document.getElementById("textColor");
const neonPreset = document.getElementById("neonPreset");
const textAngle = document.getElementById("textAngle");
const textDirection = document.getElementById("textDirection");
const btnApplyText = document.getElementById("btnApplyText");
const textEffect = document.getElementById("textEffect");
const textEffectColor = document.getElementById("textEffectColor");
const textEffectBlur = document.getElementById("textEffectBlur");
const textStrokeColor = document.getElementById("textStrokeColor");
const textStrokeWidth = document.getElementById("textStrokeWidth");
const textStrokeWidthValue = document.getElementById("textStrokeWidthValue");

const penColor = document.getElementById("penColor");
const penSize = document.getElementById("penSize");
const penSizeValue = document.getElementById("penSizeValue");
const btnClearDraw = document.getElementById("btnClearDraw");
const drawEffect = document.getElementById("drawEffect");
const drawEffectColor = document.getElementById("drawEffectColor");
const drawEffectBlur = document.getElementById("drawEffectBlur");
const drawStrokeColor = document.getElementById("drawStrokeColor");
const drawStrokeWidth = document.getElementById("drawStrokeWidth");
const drawStrokeWidthValue = document.getElementById("drawStrokeWidthValue");
const toolPen = document.getElementById("toolPen");
const toolEraser = document.getElementById("toolEraser");

const publishStatus = document.getElementById("publishStatus");

const btnRefresh = document.getElementById("btnRefresh");
const galleryGrid = document.getElementById("galleryGrid");
const galleryStatus = document.getElementById("galleryStatus");

const profileAvatar = document.getElementById("profileAvatar");
const profileUid = document.getElementById("profileUid");
const profileName = document.getElementById("profileName");
const profileBio = document.getElementById("profileBio");
const profileSave = document.getElementById("profileSave");
const profileStatus = document.getElementById("profileStatus");
const profileFollowingCount = document.getElementById("profileFollowingCount");
const profileFollowersCount = document.getElementById("profileFollowersCount");
const profileRankBadge = document.getElementById("profileRankBadge");
const followingList = document.getElementById("followingList");
const followersList = document.getElementById("followersList");

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const profileModal = document.getElementById("profileModal");
const profileModalBody = document.getElementById("profileModalBody");
const profileModalClose = document.getElementById("profileModalClose");
const nicknameModal = document.getElementById("nicknameModal");
const nicknameInput = document.getElementById("nicknameInput");
const nicknameSave = document.getElementById("nicknameSave");
const nicknameStatus = document.getElementById("nicknameStatus");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const userAvatar = document.getElementById("userAvatar");

modalClose?.addEventListener("click", () => modal.close());
modal?.addEventListener("click", (e) => {
  const rect = modal.querySelector(".modalInner").getBoundingClientRect();
  const inside =
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) modal.close();
});
profileModalClose?.addEventListener("click", () => profileModal.close());
profileModal?.addEventListener("click", (e) => {
  const rect = profileModal.querySelector(".modalInner").getBoundingClientRect();
  const inside =
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) profileModal.close();
});

// ---- assets list ----
const STICKERS = [
  { name: "Logo", url: "assets/stickers/Logo.png" },
  { name: "キラキラ1", url: "assets/stickers/キラキラ１.PNG" },
  { name: "一生友達", url: "assets/stickers/キラキラ２.PNG" },
  { name: "キラキラ2", url: "assets/stickers/キラキラ３.PNG" },
  { name: "ハートヒョウ柄", url: "assets/stickers/ハートヒョウ柄.PNG" },
  { name: "ハート1", url: "assets/stickers/ハート１.PNG" },
  { name: "ハート2", url: "assets/stickers/ハート２.PNG" },
  { name: "ハート3", url: "assets/stickers/ハート３.PNG" },
  { name: "心友", url: "assets/stickers/心友.PNG" },
  { name: "星1", url: "assets/stickers/星１.PNG" },
  { name: "カップル自撮りモビィ", url: "assets/stickers/モビィ透過済女/カップル自撮りモビィ.png" },
  { name: "ストーリー撮影班モビィ", url: "assets/stickers/モビィ透過済女/ストーリー撮影班モビィ.png" },
  { name: "ストーリー匂わせモビィ", url: "assets/stickers/モビィ透過済女/ストーリー匂わせモビィ.png" },
  { name: "ネイルこだわりモビィ", url: "assets/stickers/モビィ透過済女/ネイルこだわりモビィ.png" },
  { name: "プリクラ拡散モビィ", url: "assets/stickers/モビィ透過済女/プリクラ拡散モビィ.png" },
  { name: "ロッカー手紙モビィ", url: "assets/stickers/モビィ透過済女/ロッカー手紙モビィ.png" },
  { name: "屋上ひみつ恋モビィ", url: "assets/stickers/モビィ透過済女/屋上ひみつ恋モビィ.png" },
  { name: "帰り道デートモビィ", url: "assets/stickers/モビィ透過済女/帰り道デートモビィ.png" },
  { name: "購買前溜まり場モビィ", url: "assets/stickers/モビィ透過済女/購買前溜まり場モビィ.png" },
  { name: "図書室まったりモビィ", url: "assets/stickers/モビィ透過済女/図書室まったりモビィ.png" },
  { name: "昼休みお弁当会モビィ", url: "assets/stickers/モビィ透過済女/昼休みお弁当会モビィ.png" },
  { name: "匂わせプリクラモビィ", url: "assets/stickers/モビィ透過済女/匂わせプリクラモビィ.png" },
  { name: "文化祭広報モビィ", url: "assets/stickers/モビィ透過済女/文化祭広報モビィ.png" },
  { name: "放課後こっそり通話モビィ", url: "assets/stickers/モビィ透過済女/放課後こっそり通話モビィ.png" },
  { name: "放課後即レスモビィ", url: "assets/stickers/モビィ透過済女/放課後即レスモビィ.png" },
  { name: "もしランキングモビィ", url: "assets/stickers/モビィ透過済男/もしランキングモビィ.png" },
  { name: "応援団長モビィ", url: "assets/stickers/モビィ透過済男/応援団長モビィ.png" },
  { name: "屋上自由時間モビィ", url: "assets/stickers/モビィ透過済男/屋上自由時間モビィ.png" },
  { name: "学級委員モビィ", url: "assets/stickers/モビィ透過済男/学級委員モビィ.png" },
  { name: "教科書落書きモビィ", url: "assets/stickers/モビィ透過済男/教科書落書きモビィ.png" },
  { name: "自習室モビィ", url: "assets/stickers/モビィ透過済男/自習室モビィ.png" },
  { name: "図書委員モビィ", url: "assets/stickers/モビィ透過済男/図書委員モビィ.png" },
  { name: "制服アレンジモビィ", url: "assets/stickers/モビィ透過済男/制服アレンジモビィ.png" },
  { name: "成績掲示板モビィ", url: "assets/stickers/モビィ透過済男/成績掲示板モビィ.png" },
  { name: "体育祭モビィ", url: "assets/stickers/モビィ透過済男/体育祭モビィ.png" },
  { name: "舞台袖実行委員モビィ", url: "assets/stickers/モビィ透過済男/舞台袖実行委員モビィ.png" },
  { name: "部室たまり場モビィ", url: "assets/stickers/モビィ透過済男/部室たまり場モビィ.png" },
  { name: "文化祭センターステージモビィ", url: "assets/stickers/モビィ透過済男/文化祭センターステージモビィ.png" },
  { name: "理科室研究モビィ", url: "assets/stickers/モビィ透過済男/理科室研究モビィ.png" },
  { name: "裏垢拡散モビィ", url: "assets/stickers/モビィ透過済男/裏垢拡散モビィ.png" },
  { name: "廊下ランウェイモビィ", url: "assets/stickers/モビィ透過済男/廊下ランウェイモビィ.png" },
];

function showDesign() {
  tabDesign?.classList.add("active");
  tabGallery?.classList.remove("active");
  tabProfile?.classList.remove("active");
  viewDesign?.classList.remove("hidden");
  viewGallery?.classList.add("hidden");
  viewProfile?.classList.add("hidden");
}
function showGallery() {
  tabGallery?.classList.add("active");
  tabDesign?.classList.remove("active");
  tabProfile?.classList.remove("active");
  viewGallery?.classList.remove("hidden");
  viewDesign?.classList.add("hidden");
  viewProfile?.classList.add("hidden");
}
function showProfile() {
  tabProfile?.classList.add("active");
  tabDesign?.classList.remove("active");
  tabGallery?.classList.remove("active");
  viewProfile?.classList.remove("hidden");
  viewDesign?.classList.add("hidden");
  viewGallery?.classList.add("hidden");
}

// ---- watermark ----
const WATERMARK_URL = "assets/watermark/mobby.png";

async function addWatermarkToPngBlob(pngBlob, watermarkUrl = WATERMARK_URL) {
  const base = await createImageBitmap(pngBlob);

  const wmResp = await fetch(watermarkUrl);
  if (!wmResp.ok) throw new Error("ウォーターマーク画像が読み込めません: " + watermarkUrl);
  const wmBlob = await wmResp.blob();
  const wm = await createImageBitmap(wmBlob);

  const out = document.createElement("canvas");
  out.width = base.width;
  out.height = base.height;

  const ctx = out.getContext("2d");
  ctx.drawImage(base, 0, 0);

  const margin = Math.round(Math.min(out.width, out.height) * 0.03);
  const wmW = Math.round(out.width * 0.18);
  const wmH = Math.round((wm.height / wm.width) * wmW);

  ctx.globalAlpha = 0.35;
  ctx.drawImage(wm, out.width - wmW - margin, out.height - wmH - margin, wmW, wmH);
  ctx.globalAlpha = 1;

  const resultBlob = await new Promise((resolve) => out.toBlob(resolve, "image/png"));
  base.close?.();
  wm.close?.();

  if (!resultBlob) throw new Error("ウォーターマーク合成に失敗しました");
  return resultBlob;
}

// ---- main ----
const editor = createEditor({ canvas, templateSelect, assetGrid });
editor.setAssets(STICKERS);
editor.fitCanvas();
try {
  await editor.loadTemplate(templateSelect.value);
} catch (e) {
  console.warn("template load failed", e);
}

btnClear?.addEventListener("click", () => editor.clearAll());
btnUndo?.addEventListener("click", () => editor.undo?.());
btnRedo?.addEventListener("click", () => editor.redo?.());
editor.setHistoryListener?.(({ canUndo, canRedo }) => {
  if (btnUndo) btnUndo.disabled = !canUndo;
  if (btnRedo) btnRedo.disabled = !canRedo;
});

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function syncTextSizeValue() {
  if (!textSize || !textSizeValue) return;
  const size = clampNumber(textSize.value, 12, 120, 36);
  textSize.value = size;
  textSizeValue.textContent = String(size);
}

function getTextEffectOptions() {
  if (textStrokeWidthValue) textStrokeWidthValue.textContent = String(clampNumber(textStrokeWidth?.value, 0, 12, 0));
  return {
    effect: textEffect?.value || "none",
    effectColor: textEffectColor?.value || "#00f5ff",
    effectBlur: clampNumber(textEffectBlur?.value, 0, 60, 18),
    strokeColor: textStrokeColor?.value || "#000000",
    strokeWidth: clampNumber(textStrokeWidth?.value, 0, 12, 0),
  };
}

function getDrawEffectOptions() {
  if (drawStrokeWidthValue) drawStrokeWidthValue.textContent = String(clampNumber(drawStrokeWidth?.value, 0, 12, 0));
  return {
    effect: drawEffect?.value || "none",
    effectColor: drawEffectColor?.value || "#00f5ff",
    effectBlur: clampNumber(drawEffectBlur?.value, 0, 60, 18),
    strokeColor: drawStrokeColor?.value || "#000000",
    strokeWidth: clampNumber(drawStrokeWidth?.value, 0, 12, 0),
  };
}

function getTextStyle() {
  const angle = clampNumber(textAngle?.value, -180, 180, 0);
  return {
    color: textColor?.value || "#ffffff",
    r: (angle * Math.PI) / 180,
    ...getTextEffectOptions()
  };
}

function applySelectedTextFromControls() {
  const size = Math.max(12, Math.min(120, parseInt(textSize?.value, 10) || 36));
  if (textSize) textSize.value = size;
  syncTextSizeValue();
  editor.applyTextStyleToSelected({
    fontFamily: textFont?.value || "Noto Sans JP",
    size,
    ...getTextStyle()
  });
}

function updateOrCreateTextFromInput() {
  const value = textInput?.value ?? "";
  const updated = editor.updateSelectedText?.(value);
  if (updated || !value.trim()) return;
  const size = Math.max(12, Math.min(120, parseInt(textSize?.value, 10) || 36));
  if (textSize) textSize.value = size;
  syncTextSizeValue();
  editor.addText(value, textFont?.value || "Noto Sans JP", size, getTextStyle());
}

btnAddText?.addEventListener("click", () => {
  updateOrCreateTextFromInput();
  textInput?.focus();
});

textInput?.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  updateOrCreateTextFromInput();
});
textInput?.addEventListener("input", updateOrCreateTextFromInput);
textInput?.addEventListener("compositionupdate", updateOrCreateTextFromInput);

btnApplyText?.addEventListener("click", () => {
  applySelectedTextFromControls();
});

neonPreset?.addEventListener("change", () => {
  if (!neonPreset.value) return;
  if (textColor) textColor.value = neonPreset.value;
  if (textEffectColor) textEffectColor.value = neonPreset.value;
  applySelectedTextFromControls();
});

function updatePenOptions() {
  if (penSizeValue) penSizeValue.textContent = String(clampNumber(penSize?.value, 1, 40, 6));
  editor.setPenOptions({
    color: penColor?.value || "#3a2f26",
    size: clampNumber(penSize?.value, 1, 40, 6),
    ...getDrawEffectOptions()
  });
  editor.setEraserOptions?.({
    size: clampNumber(penSize?.value, 1, 40, 6)
  });
}

function setDrawTool(tool) {
  const isPen = tool === "pen";
  toolPen?.classList.toggle("active", isPen);
  toolEraser?.classList.toggle("active", !isPen);
  editor.setDrawTool?.(isPen ? "pen" : "eraser");
}

penColor?.addEventListener("input", updatePenOptions);
penSize?.addEventListener("input", updatePenOptions);
drawEffect?.addEventListener("change", updatePenOptions);
drawEffectColor?.addEventListener("input", updatePenOptions);
drawEffectBlur?.addEventListener("input", updatePenOptions);
drawStrokeColor?.addEventListener("input", updatePenOptions);
drawStrokeWidth?.addEventListener("input", updatePenOptions);
btnClearDraw?.addEventListener("click", () => editor.clearDraw());
toolPen?.addEventListener("click", () => setDrawTool("pen"));
toolEraser?.addEventListener("click", () => setDrawTool("eraser"));

editor.setDrawMode("select");
updatePenOptions();
if (penSizeValue) penSizeValue.textContent = String(clampNumber(penSize?.value, 1, 40, 6));
if (textStrokeWidthValue) textStrokeWidthValue.textContent = String(clampNumber(textStrokeWidth?.value, 0, 12, 0));
if (drawStrokeWidthValue) drawStrokeWidthValue.textContent = String(clampNumber(drawStrokeWidth?.value, 0, 12, 0));
setDrawTool("pen");
textSize?.addEventListener("input", syncTextSizeValue);
syncTextSizeValue();

textSize?.addEventListener("input", applySelectedTextFromControls);
textFont?.addEventListener("change", applySelectedTextFromControls);
textColor?.addEventListener("input", applySelectedTextFromControls);
textAngle?.addEventListener("input", applySelectedTextFromControls);
textEffect?.addEventListener("change", applySelectedTextFromControls);
textEffectColor?.addEventListener("input", applySelectedTextFromControls);
textEffectBlur?.addEventListener("input", applySelectedTextFromControls);
textStrokeColor?.addEventListener("input", applySelectedTextFromControls);
textStrokeWidth?.addEventListener("input", applySelectedTextFromControls);

function setAdjustPanel(panel) {
  const isText = panel === "text";
  const isDraw = panel === "draw";
  const isSticker = panel === "sticker";
  panelTextBtn?.classList.toggle("active", isText);
  panelDrawBtn?.classList.toggle("active", isDraw);
  panelStickerBtn?.classList.toggle("active", isSticker);
  panelText?.classList.toggle("hidden", !isText);
  panelDraw?.classList.toggle("hidden", !isDraw);
  panelSticker?.classList.toggle("hidden", !isSticker);
  if (isDraw) {
    editor.setDrawMode("draw");
  } else {
    editor.setDrawMode("select");
  }
}

panelTextBtn?.addEventListener("click", () => setAdjustPanel("text"));
panelDrawBtn?.addEventListener("click", () => setAdjustPanel("draw"));
panelStickerBtn?.addEventListener("click", () => setAdjustPanel("sticker"));
setAdjustPanel("text");

let gallery = null;
let uid = "";
let galleryUid = "";
let followingSet = new Set();
const profileCache = new Map();

tabDesign?.addEventListener("click", showDesign);
tabGallery?.addEventListener("click", async () => {
  showGallery();
  await gallery?.fetchTop?.();
});
tabProfile?.addEventListener("click", async () => {
  showProfile();
  await loadProfileView();
});
btnRefresh?.addEventListener("click", async () => {
  await gallery?.fetchTop?.();
});

function syncAuthUi(user) {
  if (userBadge) {
    userBadge.textContent = user ? `uid: ${user.uid.slice(0, 6)}...` : "未ログイン";
  }
  btnLogin?.classList.toggle("hidden", !!user);
  btnLogout?.classList.toggle("hidden", !user);
  if (userAvatar) {
    const avatarUrl = user?.photoURL || "";
    if (avatarUrl) {
      userAvatar.src = avatarUrl;
      userAvatar.alt = user?.displayName ? `${user.displayName}のアイコン` : "Googleアカウントのアイコン";
      userAvatar.title = user?.displayName || user?.email || "";
      userAvatar.classList.remove("hidden");
    } else {
      userAvatar.removeAttribute("src");
      userAvatar.removeAttribute("title");
      userAvatar.classList.add("hidden");
    }
  }
}

syncAuthUi(null);

function updateUserBadgeFromProfile(profile, user) {
  if (!userBadge) return;
  if (!user) {
    userBadge.textContent = "未ログイン";
    return;
  }
  const name = profile?.displayName?.trim();
  userBadge.textContent = name ? name : `uid: ${user.uid.slice(0, 6)}...`;
}

async function updateProfileRankBadge(targetUid) {
  if (!profileRankBadge) return;
  profileRankBadge.classList.add("hidden");
  profileRankBadge.classList.remove("rank1", "rank2", "rank3");
  if (!targetUid) return;
  try {
    const designsCol = collection(db, "designs");
    const q = query(designsCol, orderBy("likes", "desc"), limit(3));
    const snap = await getDocs(q);
    let rank = null;
    snap.docs.some((d, index) => {
      if (d.data()?.uid === targetUid) {
        rank = index + 1;
        return true;
      }
      return false;
    });
    if (rank) {
      profileRankBadge.textContent = `👑 ${rank}位`;
      profileRankBadge.classList.remove("hidden");
      profileRankBadge.classList.add(`rank${rank}`);
    }
  } catch (e) {
    console.warn("profile rank fetch failed", e);
  }
}

function ensureGallery(nextUid) {
  if (gallery && galleryUid === nextUid) return;
  galleryUid = nextUid;
  gallery = createGallery({
    db,
    uid: nextUid,
    gridEl: galleryGrid,
    statusEl: galleryStatus,
    modalEl: modal,
    modalBodyEl: modalBody,
    profileModalEl: profileModal,
    profileModalBodyEl: profileModalBody
  });
}

function getFallbackName(nextUid) {
  if (!nextUid) return "user-unknown";
  return `user-${nextUid.slice(0, 6)}`;
}

async function ensureProfileDoc(user) {
  if (!user) return;
  try {
    const profileRef = doc(db, "profiles", user.uid);
    const snap = await getDoc(profileRef);
    const data = snap.exists() ? snap.data() : {};
    const next = { updatedAt: serverTimestamp() };
    if (!data.photoURL && user.photoURL) next.photoURL = user.photoURL;
    if (!data.bio) next.bio = "";
    if (!snap.exists()) {
      next.createdAt = serverTimestamp();
      next.followersCount = 0;
      next.followingCount = 0;
    }
    await setDoc(profileRef, next, { merge: true });
  } catch (e) {
    console.warn("profile ensure failed", e);
  }
}

async function fetchProfile(targetUid) {
  if (!targetUid) return null;
  if (profileCache.has(targetUid)) return profileCache.get(targetUid);
  try {
    const ref = doc(db, "profiles", targetUid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : null;
    profileCache.set(targetUid, data);
    return data;
  } catch (e) {
    console.warn("profile fetch failed", e);
    profileCache.set(targetUid, null);
    return null;
  }
}

async function refreshFollowingSet() {
  if (!uid) {
    followingSet = new Set();
    return;
  }
  const col = collection(db, "profiles", uid, "following");
  const q = query(col, orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  followingSet = new Set(snap.docs.map((d) => d.id));
}

async function toggleFollow(targetUid) {
  if (!uid || !targetUid || uid === targetUid) return false;
  const followingRef = doc(db, "profiles", uid, "following", targetUid);
  const followerRef = doc(db, "profiles", targetUid, "followers", uid);
  const myProfileRef = doc(db, "profiles", uid);
  const targetProfileRef = doc(db, "profiles", targetUid);

  let nextFollowing = false;
  let nextFollowersCount = 0;
  let nextFollowingCount = 0;

  await runTransaction(db, async (tx) => {
    const [followingSnap, mySnap, targetSnap] = await Promise.all([
      tx.get(followingRef),
      tx.get(myProfileRef),
      tx.get(targetProfileRef)
    ]);
    const myCount = Number(mySnap.data()?.followingCount || 0);
    const targetCount = Number(targetSnap.data()?.followersCount || 0);

    if (followingSnap.exists()) {
      tx.delete(followingRef);
      tx.delete(followerRef);
      nextFollowing = false;
      nextFollowingCount = Math.max(0, myCount - 1);
      nextFollowersCount = Math.max(0, targetCount - 1);
    } else {
      tx.set(followingRef, { createdAt: serverTimestamp() });
      tx.set(followerRef, { createdAt: serverTimestamp() });
      nextFollowing = true;
      nextFollowingCount = myCount + 1;
      nextFollowersCount = targetCount + 1;
    }

    tx.set(myProfileRef, { followingCount: nextFollowingCount }, { merge: true });
    tx.set(targetProfileRef, { followersCount: nextFollowersCount }, { merge: true });
  });

  const cached = profileCache.get(targetUid);
  if (cached) {
    cached.followersCount = nextFollowersCount;
    profileCache.set(targetUid, cached);
  }
  return nextFollowing;
}

function setProfileUiEnabled(enabled) {
  if (profileName) profileName.disabled = !enabled;
  if (profileBio) profileBio.disabled = !enabled;
  if (profileSave) profileSave.disabled = !enabled;
}

async function renderUserList(type, container) {
  if (!container) return;
  if (!uid) {
    container.innerHTML = `<div class="muted">ログインが必要です。</div>`;
    return;
  }
  const col = collection(db, "profiles", uid, type);
  const q = query(col, orderBy("createdAt", "desc"), limit(30));
  const snap = await getDocs(q);
  if (snap.empty) {
    container.innerHTML = `<div class="muted">まだいません。</div>`;
    return;
  }

  container.innerHTML = "";
  for (const docSnap of snap.docs) {
    const targetUid = docSnap.id;
    const profile = await fetchProfile(targetUid);
    const displayName = profile?.displayName || getFallbackName(targetUid);
    const photoUrl = profile?.photoURL || "";

    const card = document.createElement("div");
    card.className = "userCard";

    const avatar = document.createElement("img");
    avatar.className = "userAvatar";
    avatar.alt = `${displayName}のアイコン`;
    if (photoUrl) avatar.src = photoUrl;

    const meta = document.createElement("div");
    meta.className = "userMeta";
    const nameEl = document.createElement("div");
    nameEl.className = "userName";
    nameEl.textContent = displayName;
    const idEl = document.createElement("div");
    idEl.className = "userId";
    idEl.textContent = `uid: ${targetUid.slice(0, 6)}...`;
    meta.appendChild(nameEl);
    meta.appendChild(idEl);

    const btn = document.createElement("button");
    btn.className = "btn smallBtn";
    if (targetUid === uid) {
      btn.textContent = "あなた";
      btn.disabled = true;
    } else {
      const isFollowing = followingSet.has(targetUid);
      btn.textContent = isFollowing ? (type === "following" ? "解除" : "フォロー中") : "フォロー";
      btn.classList.toggle("active", isFollowing && type !== "following");
      btn.addEventListener("click", async () => {
        await toggleFollow(targetUid);
        await loadProfileView();
      });
    }

    card.appendChild(avatar);
    card.appendChild(meta);
    card.appendChild(btn);
    container.appendChild(card);
  }
}

async function loadProfileView() {
  if (!viewProfile || viewProfile.classList.contains("hidden")) return;
  if (!uid) {
    if (profileStatus) profileStatus.textContent = "ログインが必要です。";
    if (profileUid) profileUid.textContent = "uid: -";
    if (profileAvatar) {
      profileAvatar.removeAttribute("src");
    }
    if (profileRankBadge) {
      profileRankBadge.classList.add("hidden");
      profileRankBadge.classList.remove("rank1", "rank2", "rank3");
    }
    setProfileUiEnabled(false);
    if (followingList) followingList.innerHTML = "";
    if (followersList) followersList.innerHTML = "";
    if (profileFollowingCount) profileFollowingCount.textContent = "0";
    if (profileFollowersCount) profileFollowersCount.textContent = "0";
    return;
  }

  setProfileUiEnabled(true);
  if (profileStatus) profileStatus.textContent = "読み込み中...";

  const profile = await fetchProfile(uid);
  const displayName = profile?.displayName || getFallbackName(uid);
  if (profileName) profileName.value = displayName;
  if (profileBio) profileBio.value = profile?.bio || "";
  if (profileUid) profileUid.textContent = `uid: ${uid.slice(0, 6)}...`;
  if (profileAvatar) {
    const url = profile?.photoURL || auth.currentUser?.photoURL || "";
    if (url) profileAvatar.src = url;
    else profileAvatar.removeAttribute("src");
  }
  if (profileFollowingCount) profileFollowingCount.textContent = String(profile?.followingCount || 0);
  if (profileFollowersCount) profileFollowersCount.textContent = String(profile?.followersCount || 0);
  await updateProfileRankBadge(uid);

  await refreshFollowingSet();
  await renderUserList("following", followingList);
  await renderUserList("followers", followersList);

  if (profileStatus) profileStatus.textContent = "";
}

function openNicknameModal(currentName) {
  if (!nicknameModal || !nicknameInput) return;
  nicknameInput.value = currentName || "";
  if (nicknameStatus) nicknameStatus.textContent = "";
  nicknameModal.showModal();
  nicknameInput.focus();
}

onAuthStateChanged(auth, async (user) => {
  uid = user?.uid || "";
  syncAuthUi(user);
  await ensureProfileDoc(user);
  profileCache.clear();
  const profile = await fetchProfile(uid);
  updateUserBadgeFromProfile(profile, user);
  ensureGallery(uid);
  if (viewGallery && !viewGallery.classList.contains("hidden")) {
    await gallery?.fetchTop?.();
  }
  if (viewProfile && !viewProfile.classList.contains("hidden")) {
    await loadProfileView();
  }
  if (user && (!profile?.displayName || !profile.displayName.trim())) {
    openNicknameModal("");
  }
});

btnLogin?.addEventListener("click", async () => {
  try {
    if (btnLogin) btnLogin.disabled = true;
    if (userBadge) userBadge.textContent = "ログイン中...";
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    if (e?.code === "auth/operation-not-allowed") {
      alert("Googleログインが無効です。Firebaseコンソールで Authentication > ログイン方法 > Google を有効化してください。");
    } else if (e?.code === "auth/unauthorized-domain") {
      alert("このドメインは許可されていません。Firebaseコンソールの Authentication > 設定 > 承認済みドメイン に追加してください。");
    } else if (e?.code === "auth/popup-blocked") {
      alert("ポップアップがブロックされました。許可して再試行してください。");
    } else if (e?.code === "auth/popup-closed-by-user") {
      // no-op
    } else {
      alert("ログインに失敗: " + e.message);
    }
    syncAuthUi(auth.currentUser);
  } finally {
    if (btnLogin) btnLogin.disabled = false;
  }
});

btnLogout?.addEventListener("click", async () => {
  try {
    if (btnLogout) btnLogout.disabled = true;
    if (userBadge) userBadge.textContent = "ログアウト中...";
    await signOut(auth);
    syncAuthUi(null);
  } catch (e) {
    alert("ログアウトに失敗: " + e.message);
    syncAuthUi(auth.currentUser);
  } finally {
    if (btnLogout) btnLogout.disabled = false;
  }
});

nicknameSave?.addEventListener("click", async () => {
  if (!uid) {
    alert("ログインが必要");
    return;
  }
  const name = (nicknameInput?.value || "").trim();
  if (!name) {
    if (nicknameStatus) nicknameStatus.textContent = "ニックネームを入力してください。";
    return;
  }
  try {
    if (nicknameSave) nicknameSave.disabled = true;
    if (nicknameStatus) nicknameStatus.textContent = "保存中...";
    const profileRef = doc(db, "profiles", uid);
    let needsInit = false;
    try {
      const snap = await getDoc(profileRef);
      needsInit = !snap.exists();
    } catch (_) {
      needsInit = true;
    }
    const payload = { displayName: name, updatedAt: serverTimestamp() };
    if (needsInit) {
      payload.createdAt = serverTimestamp();
      payload.followersCount = 0;
      payload.followingCount = 0;
      payload.bio = "";
    }
    await setDoc(profileRef, payload, { merge: true });
    profileCache.set(uid, { ...(profileCache.get(uid) || {}), displayName: name });
    if (profileName) profileName.value = name;
    updateUserBadgeFromProfile({ displayName: name }, auth.currentUser);
    if (nicknameStatus) nicknameStatus.textContent = "保存しました。";
    nicknameModal?.close();
  } catch (e) {
    alert("ニックネーム保存に失敗: " + e.message);
    if (nicknameStatus) nicknameStatus.textContent = "";
  } finally {
    if (nicknameSave) nicknameSave.disabled = false;
  }
});

// ---- publish ----
btnPublish?.addEventListener("click", async () => {
  try {
    if (!uid) {
      alert("ログインが必要");
      return;
    }
    btnPublish.disabled = true;
    if (publishStatus) publishStatus.textContent = "画像を書き出し中...";

    const usedNames = editor.getUsedAssetNames();
    const hasLogo = usedNames.includes("Logo");
    const hasMobby = usedNames.some((name) => name.includes("モビィ"));
    if (!hasLogo || !hasMobby) {
      alert("モビィのステッカーを1つ以上と、Logoステッカーを使用してください。");
      if (publishStatus) publishStatus.textContent = "";
      return;
    }

    let blob = await editor.exportPngBlob();
    if (!blob) throw new Error("画像の書き出しに失敗しました");

    blob = await addWatermarkToPngBlob(blob);

    if (publishStatus) publishStatus.textContent = "アップロード中...";

    const id = crypto.randomUUID();
    const path = `designs/${uid}/${id}.png`;
    const fileRef = ref(storage, path);

    await uploadBytes(fileRef, blob, { contentType: "image/png" });
    const imageUrl = await getDownloadURL(fileRef);

    if (publishStatus) publishStatus.textContent = "投稿登録中...";

    const designsCol = collection(db, "designs");
    await addDoc(designsCol, {
      title: (titleInput?.value || "").trim(),
      imageUrl,
      storagePath: path,
      uid,
      likes: 0,
      createdAt: serverTimestamp(),
      template: templateSelect?.value || ""
    });

    if (publishStatus) publishStatus.textContent = "投稿しました。ランキングに反映されます。";
    if (titleInput) titleInput.value = "";
  } catch (e) {
    alert("投稿に失敗: " + e.message);
    if (publishStatus) publishStatus.textContent = "";
  } finally {
    btnPublish.disabled = false;
  }
});

profileSave?.addEventListener("click", async () => {
  if (!uid) {
    alert("ログインが必要");
    return;
  }
  try {
    if (profileSave) profileSave.disabled = true;
    if (profileStatus) profileStatus.textContent = "保存中...";
    const name = (profileName?.value || "").trim() || getFallbackName(uid);
    const bio = (profileBio?.value || "").trim();
    const profileRef = doc(db, "profiles", uid);
    await setDoc(profileRef, {
      displayName: name,
      bio,
      updatedAt: serverTimestamp()
    }, { merge: true });
    profileCache.set(uid, { ...(profileCache.get(uid) || {}), displayName: name, bio });
    updateUserBadgeFromProfile({ displayName: name }, auth.currentUser);
    if (profileStatus) profileStatus.textContent = "保存しました。";
  } catch (e) {
    alert("プロフィール保存に失敗: " + e.message);
    if (profileStatus) profileStatus.textContent = "";
  } finally {
    if (profileSave) profileSave.disabled = false;
  }
});
