import { db, auth, googleProvider } from "./firebase.js";
import { createEditor } from "./editor.js";
import { createGallery } from "./gallery.js";

import {
  collection, doc, addDoc, getDoc, getDocs, query, orderBy, limit, setDoc,
  serverTimestamp, runTransaction, where, deleteDoc, deleteField
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

function patchDialog(el) {
  if (!el) return;
  if (typeof el.showModal !== "function") {
    el.showModal = () => {
      el.setAttribute("open", "");
      el.classList.add("isOpen");
    };
  }
  if (typeof el.close !== "function") {
    el.close = () => {
      el.removeAttribute("open");
      el.classList.remove("isOpen");
    };
  }
}

document.querySelectorAll("dialog").forEach(patchDialog);

const tabDesign = document.getElementById("tabDesign");
const tabGallery = document.getElementById("tabGallery");
const tabProfile = document.getElementById("tabProfile");
const tabTimeline = document.getElementById("tabTimeline");
const viewDesign = document.getElementById("viewDesign");
const viewGallery = document.getElementById("viewGallery");
const viewProfile = document.getElementById("viewProfile");
const viewTimeline = document.getElementById("viewTimeline");

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

async function createThumbDataUrl(sourceCanvas, size = 320) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(sourceCanvas, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.8);
}

async function createThumbDataUrlFromBlob(blob, size = 320) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    ctx.drawImage(img, 0, 0, size, size);
  } finally {
    URL.revokeObjectURL(url);
  }
  return canvas.toDataURL("image/jpeg", 0.8);
}
const btnRefresh = document.getElementById("btnRefresh");
const galleryGrid = document.getElementById("galleryGrid");
const galleryStatus = document.getElementById("galleryStatus");
const rankFilter = document.getElementById("rankFilter");
const timelineFilter = document.getElementById("timelineFilter");
const btnTimelineRefresh = document.getElementById("btnTimelineRefresh");
const timelineTabRecommend = document.getElementById("timelineTabRecommend");
const timelineTabFollowing = document.getElementById("timelineTabFollowing");
const timelinePanelRecommend = document.getElementById("timelinePanelRecommend");
const timelinePanelFollowing = document.getElementById("timelinePanelFollowing");
const timelineRecommend = document.getElementById("timelineRecommend");
const timelineFollowing = document.getElementById("timelineFollowing");
const timelineRecommendStatus = document.getElementById("timelineRecommendStatus");
const timelineFollowingStatus = document.getElementById("timelineFollowingStatus");

const profileAvatar = document.getElementById("profileAvatar");
const profileUid = document.getElementById("profileUid");
const idReset = document.getElementById("idReset");
const profileName = document.getElementById("profileName");
const profileBio = document.getElementById("profileBio");
const profileSave = document.getElementById("profileSave");
const profileStatus = document.getElementById("profileStatus");
const profileFollowingCount = document.getElementById("profileFollowingCount");
const profileFollowersCount = document.getElementById("profileFollowersCount");
const profileFollowingBtn = document.getElementById("profileFollowingBtn");
const profileFollowersBtn = document.getElementById("profileFollowersBtn");
const profileRankBadge = document.getElementById("profileRankBadge");
const profileInviteCode = document.getElementById("profileInviteCode");
const profileInviteCopy = document.getElementById("profileInviteCopy");
const followingList = document.getElementById("followingList");
const followersList = document.getElementById("followersList");
const profileDesigns = document.getElementById("profileDesigns");
const profileDesignsStatus = document.getElementById("profileDesignsStatus");

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const profileModal = document.getElementById("profileModal");
const profileModalBody = document.getElementById("profileModalBody");
const profileModalClose = document.getElementById("profileModalClose");
const followListModal = document.getElementById("followListModal");
const followListModalClose = document.getElementById("followListModalClose");
const followListTitle = document.getElementById("followListTitle");
const followListBody = document.getElementById("followListBody");
const nicknameModal = document.getElementById("nicknameModal");
const nicknameInput = document.getElementById("nicknameInput");
const nicknameSave = document.getElementById("nicknameSave");
const nicknameStatus = document.getElementById("nicknameStatus");
const idModal = document.getElementById("idModal");
const idInput = document.getElementById("idInput");
const idSave = document.getElementById("idSave");
const idStatus = document.getElementById("idStatus");
const idModalClose = document.getElementById("idModalClose");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const userAvatar = document.getElementById("userAvatar");

const btnAvatar = document.getElementById("btnAvatar");
const avatarModal = document.getElementById("avatarModal");
const avatarModalClose = document.getElementById("avatarModalClose");
const avatarFrame = document.getElementById("avatarFrame");
const termsModal = document.getElementById("termsModal");
const termsModalClose = document.getElementById("termsModalClose");
const termsContent = document.getElementById("termsContent");
const termsAgreeRow = document.getElementById("termsAgreeRow");
const termsAgree = document.getElementById("termsAgree");
const termsAccept = document.getElementById("termsAccept");
const inviteModal = document.getElementById("inviteModal");
const inviteModalClose = document.getElementById("inviteModalClose");
const inviteInput = document.getElementById("inviteInput");
const inviteSave = document.getElementById("inviteSave");
const inviteSkip = document.getElementById("inviteSkip");
const inviteStatus = document.getElementById("inviteStatus");

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
followListModalClose?.addEventListener("click", () => followListModal.close());
followListModal?.addEventListener("click", (e) => {
  const rect = followListModal.querySelector(".modalInner").getBoundingClientRect();
  const inside =
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) followListModal.close();
});
idModal?.addEventListener("cancel", (e) => {
  e.preventDefault();
});
idModalClose?.addEventListener("click", () => {
  if (requireProfileSetup) {
    if (idStatus) idStatus.textContent = "ユーザーIDの登録が必要です。";
    return;
  }
  idModal.close();
});
nicknameModal?.addEventListener("cancel", (e) => {
  e.preventDefault();
});
avatarModalClose?.addEventListener("click", () => avatarModal.close());
avatarModal?.addEventListener("click", (e) => {
  const rect = avatarModal.querySelector(".modalInner").getBoundingClientRect();
  const inside =
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) avatarModal.close();
});
termsModalClose?.addEventListener("click", () => termsModal.close());
termsModal?.addEventListener("click", (e) => {
  const rect = termsModal.querySelector(".modalInner").getBoundingClientRect();
  const inside =
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) termsModal.close();
});
inviteModalClose?.addEventListener("click", () => inviteModal.close());
inviteModal?.addEventListener("click", (e) => {
  const rect = inviteModal.querySelector(".modalInner").getBoundingClientRect();
  const inside =
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) inviteModal.close();
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
  { name: "カップル自撮りモビー", url: "assets/stickers/モビィ透過済女/カップル自撮りモビィ.png" },
  { name: "ストーリー撮影班モビー", url: "assets/stickers/モビィ透過済女/ストーリー撮影班モビィ.png" },
  { name: "ストーリー匂わせモビー", url: "assets/stickers/モビィ透過済女/ストーリー匂わせモビィ.png" },
  { name: "ネイルこだわりモビー", url: "assets/stickers/モビィ透過済女/ネイルこだわりモビィ.png" },
  { name: "プリクラ拡散モビー", url: "assets/stickers/モビィ透過済女/プリクラ拡散モビィ.png" },
  { name: "ロッカー手紙モビー", url: "assets/stickers/モビィ透過済女/ロッカー手紙モビィ.png" },
  { name: "屋上ひみつ恋モビー", url: "assets/stickers/モビィ透過済女/屋上ひみつ恋モビィ.png" },
  { name: "帰り道デートモビー", url: "assets/stickers/モビィ透過済女/帰り道デートモビィ.png" },
  { name: "購買前溜まり場モビー", url: "assets/stickers/モビィ透過済女/購買前溜まり場モビィ.png" },
  { name: "図書室まったりモビー", url: "assets/stickers/モビィ透過済女/図書室まったりモビィ.png" },
  { name: "昼休みお弁当会モビー", url: "assets/stickers/モビィ透過済女/昼休みお弁当会モビィ.png" },
  { name: "匂わせプリクラモビー", url: "assets/stickers/モビィ透過済女/匂わせプリクラモビィ.png" },
  { name: "文化祭広報モビー", url: "assets/stickers/モビィ透過済女/文化祭広報モビィ.png" },
  { name: "放課後こっそり通話モビー", url: "assets/stickers/モビィ透過済女/放課後こっそり通話モビィ.png" },
  { name: "放課後即レスモビー", url: "assets/stickers/モビィ透過済女/放課後即レスモビィ.png" },
  { name: "もしランキングモビー", url: "assets/stickers/モビィ透過済男/もしランキングモビィ.png" },
  { name: "応援団長モビー", url: "assets/stickers/モビィ透過済男/応援団長モビィ.png" },
  { name: "屋上自由時間モビー", url: "assets/stickers/モビィ透過済男/屋上自由時間モビィ.png" },
  { name: "学級委員モビー", url: "assets/stickers/モビィ透過済男/学級委員モビィ.png" },
  { name: "教科書落書きモビー", url: "assets/stickers/モビィ透過済男/教科書落書きモビィ.png" },
  { name: "自習室モビー", url: "assets/stickers/モビィ透過済男/自習室モビィ.png" },
  { name: "図書委員モビー", url: "assets/stickers/モビィ透過済男/図書委員モビィ.png" },
  { name: "制服アレンジモビー", url: "assets/stickers/モビィ透過済男/制服アレンジモビィ.png" },
  { name: "成績掲示板モビー", url: "assets/stickers/モビィ透過済男/成績掲示板モビィ.png" },
  { name: "体育祭モビー", url: "assets/stickers/モビィ透過済男/体育祭モビィ.png" },
  { name: "舞台袖実行委員モビー", url: "assets/stickers/モビィ透過済男/舞台袖実行委員モビィ.png" },
  { name: "部室たまり場モビー", url: "assets/stickers/モビィ透過済男/部室たまり場モビィ.png" },
  { name: "文化祭センターステージモビー", url: "assets/stickers/モビィ透過済男/文化祭センターステージモビィ.png" },
  { name: "理科室研究モビー", url: "assets/stickers/モビィ透過済男/理科室研究モビィ.png" },
  { name: "裏垢拡散モビー", url: "assets/stickers/モビィ透過済男/裏垢拡散モビィ.png" },
  { name: "廊下ランウェイモビー", url: "assets/stickers/モビィ透過済男/廊下ランウェイモビィ.png" },
];
const MOBBY_NAME_RE = /モビ[ィー]/;

function showDesign() {
  tabDesign?.classList.add("active");
  tabGallery?.classList.remove("active");
  tabProfile?.classList.remove("active");
  tabTimeline?.classList.remove("active");
  viewDesign?.classList.remove("hidden");
  viewGallery?.classList.add("hidden");
  viewProfile?.classList.add("hidden");
  viewTimeline?.classList.add("hidden");
}
function showGallery() {
  tabGallery?.classList.add("active");
  tabDesign?.classList.remove("active");
  tabProfile?.classList.remove("active");
  tabTimeline?.classList.remove("active");
  viewGallery?.classList.remove("hidden");
  viewDesign?.classList.add("hidden");
  viewProfile?.classList.add("hidden");
  viewTimeline?.classList.add("hidden");
}
function showProfile() {
  tabProfile?.classList.add("active");
  tabDesign?.classList.remove("active");
  tabGallery?.classList.remove("active");
  tabTimeline?.classList.remove("active");
  viewProfile?.classList.remove("hidden");
  viewDesign?.classList.add("hidden");
  viewGallery?.classList.add("hidden");
  viewTimeline?.classList.add("hidden");
}
function showTimeline() {
  tabTimeline?.classList.add("active");
  tabDesign?.classList.remove("active");
  tabGallery?.classList.remove("active");
  tabProfile?.classList.remove("active");
  viewTimeline?.classList.remove("hidden");
  viewDesign?.classList.add("hidden");
  viewGallery?.classList.add("hidden");
  viewProfile?.classList.add("hidden");
  showTimelinePanel("recommend");
}
function showTimelinePanel(panel) {
  const isRecommend = panel === "recommend";
  timelineTabRecommend?.classList.toggle("active", isRecommend);
  timelineTabFollowing?.classList.toggle("active", !isRecommend);
  timelinePanelRecommend?.classList.toggle("hidden", !isRecommend);
  timelinePanelFollowing?.classList.toggle("hidden", isRecommend);
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
let requireProfileSetup = false;
let authReady = false;
let timelineRecommendDocs = [];
let timelineFollowingDocs = [];
let timelineFilterValue = "all";
let invitePrompted = false;

tabDesign?.addEventListener("click", showDesign);
tabGallery?.addEventListener("click", async () => {
  showGallery();
  await gallery?.fetchTop?.();
  syncRankFilterOptions();
});
tabProfile?.addEventListener("click", async () => {
  showProfile();
  await loadProfileView();
});
tabTimeline?.addEventListener("click", () => {
  showTimeline();
  refreshTimeline();
});
timelineTabRecommend?.addEventListener("click", () => showTimelinePanel("recommend"));
timelineTabFollowing?.addEventListener("click", () => showTimelinePanel("following"));
btnRefresh?.addEventListener("click", async () => {
  await gallery?.fetchTop?.();
  syncRankFilterOptions();
});
btnTimelineRefresh?.addEventListener("click", () => {
  refreshTimeline();
});
rankFilter?.addEventListener("change", () => {
  gallery?.setFilter?.(rankFilter.value || "all");
});
timelineFilter?.addEventListener("change", () => {
  timelineFilterValue = timelineFilter.value || "all";
  renderTimelineList(timelineRecommendDocs, timelineRecommend, timelineRecommendStatus);
  renderTimelineList(timelineFollowingDocs, timelineFollowing, timelineFollowingStatus);
});

const DEFAULT_AVATAR_URL = "assets/watermark/mobby.png";

function setAvatarImage(el, url, title) {
  if (!el) return;
  const finalUrl = url || DEFAULT_AVATAR_URL;
  el.src = finalUrl;
  if (title) el.title = title;
  el.classList.remove("hidden");
}

function syncAuthUi(user) {
  if (userBadge) {
    userBadge.textContent = user ? "ログイン中" : "未ログイン";
  }
  btnLogin?.classList.toggle("hidden", !!user);
  btnLogout?.classList.toggle("hidden", !user);
  if (!user && userAvatar) {
    userAvatar.removeAttribute("src");
    userAvatar.removeAttribute("title");
    userAvatar.classList.add("hidden");
  }
}

function syncAvatarFromProfile(profile, user) {
  if (!user) return;
  const title = profile?.displayName || user?.displayName || user?.email || "";
  const url = profile?.avatarData || "";
  setAvatarImage(userAvatar, url, title);
  if (profileAvatar && !viewProfile?.classList.contains("hidden")) {
    setAvatarImage(profileAvatar, url, title);
  }
}

syncAuthUi(null);

function getUserLabel(profile, user) {
  if (profile?.username) return profile.username;
  if (profile?.displayName) return profile.displayName;
  if (user?.displayName) return user.displayName;
  if (user?.email) return user.email;
  return "";
}

function updateUserBadgeFromProfile(profile, user) {
  if (!userBadge) return;
  if (!user) {
    userBadge.textContent = "未ログイン";
    return;
  }
  const name = getUserLabel(profile, user)?.trim();
  userBadge.textContent = name ? name : "ログイン中";
}
function syncRankFilterOptions() {
  if (!rankFilter || !gallery) return;
  const options = gallery.getFilterOptions?.() || ["all"];
  const current = rankFilter.value || "all";
  rankFilter.innerHTML = "";
  for (const opt of options) {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt === "all" ? "すべて" : opt;
    rankFilter.appendChild(el);
  }
  rankFilter.value = options.includes(current) ? current : "all";
  gallery.setFilter?.(rankFilter.value || "all");
}

function extractTimelineMobbyNames(state) {
  if (gallery?.extractMobbyNames) return gallery.extractMobbyNames(state);
  const names = new Set();
  const objects = Array.isArray(state?.objects) ? state.objects : [];
  for (const o of objects) {
    if (o?.type !== "img" || typeof o.name !== "string") continue;
    if (!/モビ[ィー]/.test(o.name)) continue;
    names.add(o.name.replace(/モビィ/g, "モビー"));
  }
  return names;
}

function buildTimelineFilterOptions(items) {
  const set = new Set();
  for (const item of items) {
    const names = extractTimelineMobbyNames(item.data?.state);
    for (const name of names) set.add(name);
  }
  return Array.from(set);
}

function syncTimelineFilterOptions(items) {
  if (!timelineFilter) return;
  const options = ["all", ...buildTimelineFilterOptions(items)];
  timelineFilter.innerHTML = "";
  for (const opt of options) {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt === "all" ? "すべて" : opt;
    timelineFilter.appendChild(el);
  }
  if (!options.includes(timelineFilterValue)) {
    timelineFilterValue = "all";
  }
  timelineFilter.value = timelineFilterValue;
}

function filterTimelineDocs(items) {
  if (timelineFilterValue === "all") return items;
  return items.filter((item) => {
    const names = extractTimelineMobbyNames(item.data?.state);
    return names.has(timelineFilterValue);
  });
}

function renderTimelineList(items, container, statusEl) {
  if (!container) return;
  const filtered = filterTimelineDocs(items);
  container.innerHTML = "";
  if (!filtered.length) {
    if (statusEl) statusEl.textContent = "まだ投稿がありません。";
    return;
  }
  if (statusEl) statusEl.textContent = "";
  filtered.forEach((item) => {
    if (gallery?.renderCard) {
      container.appendChild(gallery.renderCard(item.id, item.data, null, { afterLike: refreshTimeline }));
    }
  });
}

async function fetchTimelineRecommend() {
  if (timelineRecommendStatus) timelineRecommendStatus.textContent = "読み込み中...";
  if (timelineRecommend) timelineRecommend.innerHTML = "";
  const designsCol = collection(db, "designs");
  const q = query(designsCol, orderBy("createdAt", "desc"), limit(30));
  const snap = await getDocs(q);
  timelineRecommendDocs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  if (timelineRecommendStatus) timelineRecommendStatus.textContent = "";
}

async function fetchTimelineFollowing() {
  if (timelineFollowingStatus) timelineFollowingStatus.textContent = "読み込み中...";
  if (timelineFollowing) timelineFollowing.innerHTML = "";
  if (!uid) {
    timelineFollowingDocs = [];
    if (timelineFollowingStatus) timelineFollowingStatus.textContent = "ログインが必要です。";
    return;
  }
  await refreshFollowingSet();
  const ids = Array.from(followingSet);
  if (!ids.length) {
    timelineFollowingDocs = [];
    if (timelineFollowingStatus) timelineFollowingStatus.textContent = "フォロー中がいません。";
    return;
  }
  const designsCol = collection(db, "designs");
  const chunkSize = 10;
  const chunks = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }
  const results = [];
  for (const chunk of chunks) {
    const q = query(
      designsCol,
      where("uid", "in", chunk),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ id: d.id, data: d.data() })));
  }
  const seen = new Set();
  const deduped = [];
  for (const item of results) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }
  deduped.sort((a, b) => {
    const aTime = a.data?.createdAt?.toMillis ? a.data.createdAt.toMillis() : 0;
    const bTime = b.data?.createdAt?.toMillis ? b.data.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
  timelineFollowingDocs = deduped.slice(0, 30);
  if (timelineFollowingStatus) timelineFollowingStatus.textContent = "";
}

async function refreshTimeline() {
  await Promise.all([fetchTimelineRecommend(), fetchTimelineFollowing()]);
  if (gallery?.warmProfileCache) {
    await gallery.warmProfileCache([...timelineRecommendDocs, ...timelineFollowingDocs]);
  }
  syncTimelineFilterOptions(timelineRecommendDocs);
  renderTimelineList(timelineRecommendDocs, timelineRecommend, timelineRecommendStatus);
  renderTimelineList(timelineFollowingDocs, timelineFollowing, timelineFollowingStatus);
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
      profileRankBadge.textContent = "👑";
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

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("ja-JP");
}

function generateInviteCode(seed) {
  const base = String(seed || "");
  let hash = 2166136261;
  for (let i = 0; i < base.length; i += 1) {
    hash ^= base.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hashPart = (hash >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  const tail = base.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase().padStart(4, "0");
  return `MOBBY-${hashPart}${tail}`;
}

async function ensureProfileDoc(user) {
  if (!user) return;
  try {
    const profileRef = doc(db, "profiles", user.uid);
    const snap = await getDoc(profileRef);
    const data = snap.exists() ? snap.data() : {};
    const next = { updatedAt: serverTimestamp() };
    if (!data.bio) next.bio = "";
    if (!data.email && user.email) next.email = user.email;
    if (!data.inviteIssuedCode) {
      next.inviteIssuedCode = generateInviteCode(user.uid);
      next.inviteIssuedAt = serverTimestamp();
    }
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
    const displayName = profile?.username || profile?.displayName || getFallbackName(targetUid);
    const photoUrl = profile?.avatarData || DEFAULT_AVATAR_URL;

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
    meta.appendChild(nameEl);

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

    card.addEventListener("click", async () => {
      if (!gallery?.openProfileModal) return;
      await gallery.openProfileModal(targetUid);
    });
    btn.addEventListener("click", (e) => e.stopPropagation());

    card.appendChild(avatar);
    card.appendChild(meta);
    card.appendChild(btn);
    container.appendChild(card);
  }
}

async function openFollowList(type) {
  if (!followListModal || !followListTitle || !followListBody) return;
  if (!uid) {
    followListTitle.textContent = "";
    followListBody.innerHTML = `<div class="muted">ログインが必要です。</div>`;
    followListModal.showModal();
    return;
  }
  followListTitle.textContent = type === "following" ? "フォロー中" : "フォロワー";
  followListBody.innerHTML = `<div class="muted">読み込み中...</div>`;
  followListModal.showModal();
  await renderUserList(type, followListBody);
}

async function renderProfileDesigns() {
  if (!profileDesigns || !profileDesignsStatus) return;
  if (!uid) {
    profileDesigns.innerHTML = "";
    profileDesignsStatus.textContent = "ログインが必要です。";
    return;
  }
  profileDesignsStatus.textContent = "読み込み中...";
  profileDesigns.innerHTML = "";
  try {
    const designsCol = collection(db, "designs");
    const q = query(
      designsCol,
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      profileDesignsStatus.textContent = "まだ投稿がありません。";
      return;
    }
    profileDesignsStatus.textContent = "";
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "profileWork";

      const img = document.createElement("img");
      img.src = data.thumb || data.imageUrl || "";
      img.alt = data.title || "Untitled";

      const body = document.createElement("div");
      body.className = "profileWorkBody";

      const title = document.createElement("div");
      title.className = "profileWorkTitle";
      title.textContent = data.title || "Untitled";

      const meta = document.createElement("div");
      meta.className = "profileWorkMeta";
      meta.textContent = `👍 ${Number(data.likes || 0)} / ${formatDate(data.createdAt)}`;

      const actions = document.createElement("div");
      actions.className = "profileWorkActions";

      const delBtn = document.createElement("button");
      delBtn.className = "btn smallBtn";
      delBtn.type = "button";
      delBtn.textContent = "削除";
      delBtn.addEventListener("click", async () => {
        if (!confirm("この投稿を削除しますか？")) return;
        try {
          delBtn.disabled = true;
          await deleteDoc(doc(db, "designs", docSnap.id));
          card.remove();
          if (!profileDesigns.children.length) {
            profileDesignsStatus.textContent = "まだ投稿がありません。";
          }
        } catch (e) {
          alert("削除に失敗: " + e.message);
        } finally {
          delBtn.disabled = false;
        }
      });

      actions.appendChild(delBtn);
      body.appendChild(title);
      body.appendChild(meta);
      body.appendChild(actions);
      card.appendChild(img);
      card.appendChild(body);
      profileDesigns.appendChild(card);
    }
  } catch (e) {
    console.warn("profile designs fetch failed", e);
    profileDesignsStatus.textContent = "読み込みに失敗しました。";
  }
}

async function loadProfileView() {
  if (!viewProfile || viewProfile.classList.contains("hidden")) return;
  if (!uid) {
    if (profileStatus) profileStatus.textContent = "ログインが必要です。";
    if (profileUid) profileUid.textContent = "id: -";
    if (idReset) idReset.classList.add("hidden");
    if (profileInviteCode) profileInviteCode.classList.add("hidden");
    if (profileInviteCopy) profileInviteCopy.classList.add("hidden");
    if (profileAvatar) {
      profileAvatar.removeAttribute("src");
      profileAvatar.classList.add("hidden");
    }
    if (profileRankBadge) {
      profileRankBadge.classList.add("hidden");
      profileRankBadge.classList.remove("rank1", "rank2", "rank3");
    }
    setProfileUiEnabled(false);
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
  if (profileUid) {
    const idText = profile?.username ? `id: ${profile.username}` : "id: -";
    profileUid.textContent = idText;
  }
  if (idReset) idReset.classList.toggle("hidden", !profile?.username);
  if (profileInviteCode) {
    if (profile?.inviteIssuedCode) {
      profileInviteCode.textContent = `招待: ${profile.inviteIssuedCode}`;
      profileInviteCode.classList.remove("hidden");
      profileInviteCopy?.classList.remove("hidden");
    } else {
      profileInviteCode.classList.add("hidden");
      profileInviteCopy?.classList.add("hidden");
    }
  }
  if (profileAvatar) {
    const url = profile?.avatarData || "";
    setAvatarImage(profileAvatar, url, displayName);
  }
  if (profileFollowingCount) profileFollowingCount.textContent = String(profile?.followingCount || 0);
  if (profileFollowersCount) profileFollowersCount.textContent = String(profile?.followersCount || 0);
  await updateProfileRankBadge(uid);

  await refreshFollowingSet();
  await renderProfileDesigns();

  if (profileStatus) profileStatus.textContent = "";
}

async function saveProfileAvatar(dataUrl) {
  if (!uid) {
    throw new Error("ログインが必要です。");
  }
  const profileRef = doc(db, "profiles", uid);
  await setDoc(profileRef, { avatarData: dataUrl, updatedAt: serverTimestamp() }, { merge: true });
  profileCache.set(uid, { ...(profileCache.get(uid) || {}), avatarData: dataUrl });
  setAvatarImage(userAvatar, dataUrl, profileName?.value || "");
  if (profileAvatar) setAvatarImage(profileAvatar, dataUrl, profileName?.value || "");
  return dataUrl;
}

function normalizeUsername(raw) {
  return (raw || "").trim();
}

function validateUsername(name) {
  if (!name) return "ユーザーIDを入力してください。";
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
    return "英数字とアンダーバーのみ（3〜20文字）で入力してください。";
  }
  return "";
}

function openIdModal(currentName) {
  if (!idModal || !idInput) return;
  idInput.value = currentName || "";
  if (idStatus) idStatus.textContent = "";
  if (idSave) idSave.disabled = !authReady;
  idModal.showModal();
  idInput.focus();
}

function openInviteModal(code) {
  if (!inviteModal || !inviteInput) return;
  inviteInput.value = code || "";
  if (inviteStatus) inviteStatus.textContent = "";
  if (inviteSave) inviteSave.disabled = !authReady;
  inviteModal.showModal();
  inviteInput.focus();
}

function openNicknameModal(currentName) {
  if (!nicknameModal || !nicknameInput) return;
  nicknameInput.value = currentName || "";
  if (nicknameStatus) nicknameStatus.textContent = "";
  nicknameModal.showModal();
  nicknameInput.focus();
}

function isProfileSetupComplete(profile) {
  return !!(profile?.username && profile?.displayName);
}

function maybeOpenInviteModal() {
  if (invitePrompted || !uid || !auth.currentUser) return;
  if (requireProfileSetup) return;
  const profile = profileCache.get(uid);
  if (profile?.inviteCode || profile?.inviteLocked) return;
  invitePrompted = true;
  openInviteModal("");
}

onAuthStateChanged(auth, async (user) => {
  authReady = true;
  uid = user?.uid || "";
  invitePrompted = false;
  syncAuthUi(user);
  await ensureProfileDoc(user);
  profileCache.clear();
  let profile = await fetchProfile(uid);
  requireProfileSetup = !!user && !isProfileSetupComplete(profile);
  updateUserBadgeFromProfile(profile, user);
  syncAvatarFromProfile(profile, user);
  ensureGallery(uid);
  if (viewGallery && !viewGallery.classList.contains("hidden")) {
    await gallery?.fetchTop?.();
    syncRankFilterOptions();
  }
  if (viewTimeline && !viewTimeline.classList.contains("hidden")) {
    await refreshTimeline();
  }
  if (viewProfile && !viewProfile.classList.contains("hidden")) {
    await loadProfileView();
  }
  if (user && (!profile?.username || !profile.username.trim())) {
    openIdModal("");
  } else if (user && (!profile?.displayName || !profile.displayName.trim())) {
    openNicknameModal("");
  } else if (user && !profile?.inviteCode) {
    maybeOpenInviteModal();
  }
});

profileFollowingBtn?.addEventListener("click", async () => {
  await openFollowList("following");
});
profileFollowersBtn?.addEventListener("click", async () => {
  await openFollowList("followers");
});
profileInviteCopy?.addEventListener("click", async () => {
  const currentProfile = profileCache.get(uid) || await fetchProfile(uid);
  const code = currentProfile?.inviteIssuedCode || "";
  if (!code) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    if (profileStatus) profileStatus.textContent = "招待コードをコピーしました。";
  } catch (e) {
    alert("コピーに失敗: " + e.message);
  }
});
btnAvatar?.addEventListener("click", () => {
  if (!uid) {
    alert("ログインが必要です。");
    return;
  }
  avatarModal?.showModal();
});

idReset?.addEventListener("click", async () => {
  if (!uid) {
    alert("ログインが必要です。");
    return;
  }
  const currentProfile = profileCache.get(uid) || await fetchProfile(uid);
  const currentUsername = currentProfile?.username || "";
  if (!currentUsername) {
    if (profileStatus) profileStatus.textContent = "登録済みのIDがありません。";
    return;
  }
  openIdModal(currentUsername);
});

window.addEventListener("message", async (event) => {
  if (!event?.data || event.data.type !== "mobby-avatar") return;
  const currentOrigin = window.location.origin;
  if (currentOrigin !== "null" && event.origin !== currentOrigin) return;
  try {
    if (profileStatus) profileStatus.textContent = "アイコン保存中...";
    await saveProfileAvatar(event.data.dataUrl);
    if (profileStatus) profileStatus.textContent = "アイコンを保存しました。";
    avatarModal?.close();
  } catch (e) {
    alert("アイコン保存に失敗: " + e.message);
    if (profileStatus) profileStatus.textContent = "";
  }
});

idSave?.addEventListener("click", async () => {
  if (!authReady || !uid || !auth.currentUser) {
    if (idStatus) idStatus.textContent = "ログイン確認中です。もう一度お試しください。";
    return;
  }
  const raw = normalizeUsername(idInput?.value || "");
  const err = validateUsername(raw);
  if (err) {
    if (idStatus) idStatus.textContent = err;
    return;
  }
  try {
    if (idSave) idSave.disabled = true;
    if (idStatus) idStatus.textContent = "保存中...";
    const normalized = raw.toLowerCase();
    const usernameRef = doc(db, "usernames", normalized);
    const profileRef = doc(db, "profiles", uid);
    const currentProfile = profileCache.get(uid) || await fetchProfile(uid);
    const prevUsername = currentProfile?.username || "";
    const existingSnap = await getDoc(usernameRef);
    if (existingSnap.exists()) {
      const existing = existingSnap.data();
      if (existing?.uid && existing.uid !== uid) {
        if (idStatus) idStatus.textContent = "このIDは使用されています。";
        return;
      }
    }
    await setDoc(usernameRef, { uid, username: raw, updatedAt: serverTimestamp() }, { merge: true });
    await setDoc(profileRef, { username: raw, usernameLower: normalized, updatedAt: serverTimestamp() }, { merge: true });
    if (prevUsername && prevUsername.toLowerCase() !== normalized) {
      try {
        await deleteDoc(doc(db, "usernames", prevUsername.toLowerCase()));
      } catch (_) {
        // ignore: old mapping might be missing or not owned by user
      }
    }
    profileCache.set(uid, { ...(profileCache.get(uid) || {}), username: raw, usernameLower: normalized });
    updateUserBadgeFromProfile({ ...(profileCache.get(uid) || {}), username: raw }, auth.currentUser);
    if (profileUid) profileUid.textContent = `id: ${raw}`;
    if (idStatus) idStatus.textContent = "保存しました。";
    idModal?.close();
    const current = profileCache.get(uid) || {};
    requireProfileSetup = !isProfileSetupComplete(current);
    if (!current.displayName) {
      openNicknameModal("");
    } else {
      maybeOpenInviteModal();
    }
  } catch (e) {
    if (idStatus) {
      if (e?.code === "permission-denied") {
        idStatus.textContent = "保存権限がありません。ログイン状態かルールを確認してください。";
      } else {
        idStatus.textContent = e.message || "保存に失敗しました。";
      }
    }
  } finally {
    if (idSave) idSave.disabled = false;
  }
});


btnLogin?.addEventListener("click", async () => {
  const accepted = localStorage.getItem("mobby_terms_accepted") === "1";
  if (!accepted) {
    termsAgreeRow?.classList.add("hidden");
    if (termsAgree) termsAgree.checked = false;
    if (termsAccept) termsAccept.disabled = true;
    if (termsContent) termsContent.scrollTop = 0;
    termsModal?.showModal();
    return;
  }
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

termsContent?.addEventListener("scroll", () => {
  if (!termsContent || !termsAgreeRow) return;
  const atBottom = termsContent.scrollTop + termsContent.clientHeight >= termsContent.scrollHeight - 2;
  if (atBottom) {
    termsAgreeRow.classList.remove("hidden");
  }
});

termsAgree?.addEventListener("change", () => {
  if (termsAccept) termsAccept.disabled = !termsAgree.checked;
});

termsAccept?.addEventListener("click", async () => {
  if (!termsAgree?.checked) return;
  localStorage.setItem("mobby_terms_accepted", "1");
  termsModal?.close();
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
    requireProfileSetup = !isProfileSetupComplete({ ...(profileCache.get(uid) || {}), displayName: name });
    maybeOpenInviteModal();
  } catch (e) {
    alert("ニックネーム保存に失敗: " + e.message);
    if (nicknameStatus) nicknameStatus.textContent = "";
  } finally {
    if (nicknameSave) nicknameSave.disabled = false;
  }
});

inviteSave?.addEventListener("click", async () => {
  if (!uid) {
    alert("ログインが必要");
    return;
  }
  const code = (inviteInput?.value || "").trim();
  if (!code) {
    if (inviteStatus) inviteStatus.textContent = "招待コードを入力してください。";
    return;
  }
  try {
    if (inviteSave) inviteSave.disabled = true;
    if (inviteStatus) inviteStatus.textContent = "保存中...";
    const profileRef = doc(db, "profiles", uid);
    await setDoc(profileRef, { inviteCode: code, inviteLocked: true, updatedAt: serverTimestamp() }, { merge: true });
    profileCache.set(uid, { ...(profileCache.get(uid) || {}), inviteCode: code, inviteLocked: true });
    if (inviteStatus) inviteStatus.textContent = "保存しました。";
    inviteModal?.close();
  } catch (e) {
    alert("招待コード保存に失敗: " + e.message);
    if (inviteStatus) inviteStatus.textContent = "";
  } finally {
    if (inviteSave) inviteSave.disabled = false;
  }
});

inviteSkip?.addEventListener("click", async () => {
  if (!uid) {
    inviteModal?.close();
    return;
  }
  try {
    if (inviteSave) inviteSave.disabled = true;
    if (inviteStatus) inviteStatus.textContent = "保存中...";
    const profileRef = doc(db, "profiles", uid);
    await setDoc(profileRef, { inviteLocked: true, updatedAt: serverTimestamp() }, { merge: true });
    profileCache.set(uid, { ...(profileCache.get(uid) || {}), inviteLocked: true });
    inviteModal?.close();
  } catch (e) {
    alert("招待コード保存に失敗: " + e.message);
    if (inviteStatus) inviteStatus.textContent = "";
  } finally {
    if (inviteSave) inviteSave.disabled = false;
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
    const hasMobby = usedNames.some((name) => MOBBY_NAME_RE.test(name));
    if (!hasLogo || !hasMobby) {
      alert("モビーのステッカーを1つ以上と、Logoステッカーを使用してください。");
      if (publishStatus) publishStatus.textContent = "";
      return;
    }

    let blob = await editor.exportPngBlob({ hideUi: true });
    if (!blob) throw new Error("画像の書き出しに失敗しました");

    if (publishStatus) publishStatus.textContent = "サムネ生成中...";
    const thumb = await createThumbDataUrlFromBlob(blob, 320);
    const state = editor.getState?.() || {};

    if (publishStatus) publishStatus.textContent = "投稿登録中...";

    const designsCol = collection(db, "designs");
    await addDoc(designsCol, {
      title: (titleInput?.value || "").trim(),
      thumb,
      state,
      uid,
      likes: 0,
      createdAt: serverTimestamp()
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
