import { ensureAnonLogin, db, storage } from "./firebase.js";
import { createEditor } from "./editor.js";
import { createGallery } from "./gallery.js";

import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const tabDesign = document.getElementById("tabDesign");
const tabGallery = document.getElementById("tabGallery");
const viewDesign = document.getElementById("viewDesign");
const viewGallery = document.getElementById("viewGallery");

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

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

modalClose?.addEventListener("click", () => modal.close());
modal?.addEventListener("click", (e) => {
  const rect = modal.querySelector(".modalInner").getBoundingClientRect();
  const inside =
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) modal.close();
});

// ---- assets list ----
const STICKERS = [\n  { name: "heart", url: "assets/stickers/heart.png" },\n  { name: "Logo", url: "assets/stickers/Logo.png" },\n  { name: "star", url: "assets/stickers/star.png" },\n  { name: "カップル自撮りモビィ", url: "assets/stickers/モビィ透過済女/カップル自撮りモビィ.png" },\n  { name: "ストーリー撮影班モビィ", url: "assets/stickers/モビィ透過済女/ストーリー撮影班モビィ.png" },\n  { name: "ストーリー匂わせモビィ", url: "assets/stickers/モビィ透過済女/ストーリー匂わせモビィ.png" },\n  { name: "ネイルこだわりモビィ", url: "assets/stickers/モビィ透過済女/ネイルこだわりモビィ.png" },\n  { name: "プリクラ拡散モビィ", url: "assets/stickers/モビィ透過済女/プリクラ拡散モビィ.png" },\n  { name: "ロッカー手紙モビィ", url: "assets/stickers/モビィ透過済女/ロッカー手紙モビィ.png" },\n  { name: "屋上ひみつ恋モビィ", url: "assets/stickers/モビィ透過済女/屋上ひみつ恋モビィ.png" },\n  { name: "帰り道デートモビィ", url: "assets/stickers/モビィ透過済女/帰り道デートモビィ.png" },\n  { name: "購買前溜まり場モビィ", url: "assets/stickers/モビィ透過済女/購買前溜まり場モビィ.png" },\n  { name: "図書室まったりモビィ", url: "assets/stickers/モビィ透過済女/図書室まったりモビィ.png" },\n  { name: "昼休みお弁当会モビィ", url: "assets/stickers/モビィ透過済女/昼休みお弁当会モビィ.png" },\n  { name: "匂わせプリクラモビィ", url: "assets/stickers/モビィ透過済女/匂わせプリクラモビィ.png" },\n  { name: "文化祭広報モビィ", url: "assets/stickers/モビィ透過済女/文化祭広報モビィ.png" },\n  { name: "放課後こっそり通話モビィ", url: "assets/stickers/モビィ透過済女/放課後こっそり通話モビィ.png" },\n  { name: "放課後即レスモビィ", url: "assets/stickers/モビィ透過済女/放課後即レスモビィ.png" },\n  { name: "もしランキングモビィ", url: "assets/stickers/モビィ透過済男/もしランキングモビィ.png" },\n  { name: "応援団長モビィ", url: "assets/stickers/モビィ透過済男/応援団長モビィ.png" },\n  { name: "屋上自由時間モビィ", url: "assets/stickers/モビィ透過済男/屋上自由時間モビィ.png" },\n  { name: "学級委員モビィ", url: "assets/stickers/モビィ透過済男/学級委員モビィ.png" },\n  { name: "教科書落書きモビィ", url: "assets/stickers/モビィ透過済男/教科書落書きモビィ.png" },\n  { name: "自習室モビィ", url: "assets/stickers/モビィ透過済男/自習室モビィ.png" },\n  { name: "図書委員モビィ", url: "assets/stickers/モビィ透過済男/図書委員モビィ.png" },\n  { name: "制服アレンジモビィ", url: "assets/stickers/モビィ透過済男/制服アレンジモビィ.png" },\n  { name: "成績掲示板モビィ", url: "assets/stickers/モビィ透過済男/成績掲示板モビィ.png" },\n  { name: "体育祭モビィ", url: "assets/stickers/モビィ透過済男/体育祭モビィ.png" },\n  { name: "舞台袖実行委員モビィ", url: "assets/stickers/モビィ透過済男/舞台袖実行委員モビィ.png" },\n  { name: "部室たまり場モビィ", url: "assets/stickers/モビィ透過済男/部室たまり場モビィ.png" },\n  { name: "文化祭センターステージモビィ", url: "assets/stickers/モビィ透過済男/文化祭センターステージモビィ.png" },\n  { name: "理科室研究モビィ", url: "assets/stickers/モビィ透過済男/理科室研究モビィ.png" },\n  { name: "裏垢拡散モビィ", url: "assets/stickers/モビィ透過済男/裏垢拡散モビィ.png" },\n  { name: "廊下ランウェイモビィ", url: "assets/stickers/モビィ透過済男/廊下ランウェイモビィ.png" },\n];

function showDesign() {
  tabDesign?.classList.add("active");
  tabGallery?.classList.remove("active");
  viewDesign?.classList.remove("hidden");
  viewGallery?.classList.add("hidden");
}
function showGallery() {
  tabGallery?.classList.add("active");
  tabDesign?.classList.remove("active");
  viewGallery?.classList.remove("hidden");
  viewDesign?.classList.add("hidden");
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

tabDesign?.addEventListener("click", showDesign);
tabGallery?.addEventListener("click", async () => {
  showGallery();
  await gallery?.fetchTop?.();
});
btnRefresh?.addEventListener("click", async () => {
  await gallery?.fetchTop?.();
});

try {
  const user = await ensureAnonLogin();
  uid = user.uid;
  if (userBadge) userBadge.textContent = `uid: ${uid.slice(0, 6)}...`;

  gallery = createGallery({
    db, uid,
    gridEl: galleryGrid,
    statusEl: galleryStatus,
    modalEl: modal,
    modalBodyEl: modalBody
  });
  if (viewGallery && !viewGallery.classList.contains("hidden")) {
    await gallery.fetchTop();
  }
} catch (e) {
  if (userBadge) userBadge.textContent = "login failed";
  if (galleryStatus) galleryStatus.textContent = "ログインに失敗しました。再読み込みしてください。";
}

// ---- publish ----
btnPublish?.addEventListener("click", async () => {
  try {
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
    if (!blob) throw new Error("逕ｻ蜒冗函謌舌↓螟ｱ謨励＠縺ｾ縺励◆");

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


