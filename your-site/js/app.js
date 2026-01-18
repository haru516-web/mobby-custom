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
const STICKERS = [
  { name: "Star", url: "assets/stickers/star.png" },
  { name: "Heart", url: "assets/stickers/heart.png" },
  { name: "Logo", url: "assets/stickers/Logo.png" },

  { name: "驛ｨ螳､縺溘∪繧雁ｴ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/驛ｨ螳､縺溘∪繧雁ｴ繝｢繝薙ぅ.png" },
  { name: "陬丞椶諡｡謨｣繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/陬丞椶諡｡謨｣繝｢繝薙ぅ.png" },
  { name: "闊槫床陲門ｮ溯｡悟ｧ泌藤繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/闊槫床陲門ｮ溯｡悟ｧ泌藤繝｢繝薙ぅ.png" },
  { name: "閾ｪ鄙貞ｮ､繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/閾ｪ鄙貞ｮ､繝｢繝薙ぅ.png" },
  { name: "逅・ｧ大ｮ､遐皮ｩｶ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/逅・ｧ大ｮ､遐皮ｩｶ繝｢繝薙ぅ.png" },
  { name: "譁・喧逾ｭ繧ｻ繝ｳ繧ｿ繝ｼ繧ｹ繝・・繧ｸ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/譁・喧逾ｭ繧ｻ繝ｳ繧ｿ繝ｼ繧ｹ繝・・繧ｸ繝｢繝薙ぅ.png" },
  { name: "謨咏ｧ第嶌關ｽ譖ｸ縺阪Δ繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/謨咏ｧ第嶌關ｽ譖ｸ縺阪Δ繝薙ぅ.png" },
  { name: "謌千ｸｾ謗ｲ遉ｺ譚ｿ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/謌千ｸｾ謗ｲ遉ｺ譚ｿ繝｢繝薙ぅ.png" },
  { name: "蠢懈抄蝗｣髟ｷ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/蠢懈抄蝗｣髟ｷ繝｢繝薙ぅ.png" },
  { name: "蟒贋ｸ九Λ繝ｳ繧ｦ繧ｧ繧､繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/蟒贋ｸ九Λ繝ｳ繧ｦ繧ｧ繧､繝｢繝薙ぅ.png" },
  { name: "螻倶ｸ願・逕ｱ譎る俣繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/螻倶ｸ願・逕ｱ譎る俣繝｢繝薙ぅ.png" },
  { name: "蟄ｦ邏壼ｧ泌藤繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/蟄ｦ邏壼ｧ泌藤繝｢繝薙ぅ.png" },
  { name: "蝗ｳ譖ｸ蟋泌藤繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/蝗ｳ譖ｸ蟋泌藤繝｢繝薙ぅ.png" },
  { name: "蛻ｶ譛阪い繝ｬ繝ｳ繧ｸ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/蛻ｶ譛阪い繝ｬ繝ｳ繧ｸ繝｢繝薙ぅ.png" },
  { name: "菴楢ご逾ｭ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/菴楢ご逾ｭ繝｢繝薙ぅ.png" },
  { name: "繧ゅ＠繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂育塙/繧ゅ＠繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ繝｢繝薙ぅ.png" },

  { name: "蝗ｳ譖ｸ螳､縺ｾ縺｣縺溘ｊ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/蝗ｳ譖ｸ螳､縺ｾ縺｣縺溘ｊ繝｢繝薙ぅ.png" },
  { name: "蛹ゅｏ縺帙・繝ｪ繧ｯ繝ｩ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/蛹ゅｏ縺帙・繝ｪ繧ｯ繝ｩ繝｢繝薙ぅ.png" },
  { name: "繝ｭ繝・き繝ｼ謇狗ｴ吶Δ繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/繝ｭ繝・き繝ｼ謇狗ｴ吶Δ繝薙ぅ.png" },
  { name: "繝励Μ繧ｯ繝ｩ諡｡謨｣繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/繝励Μ繧ｯ繝ｩ諡｡謨｣繝｢繝薙ぅ.png" },
  { name: "繝阪う繝ｫ縺薙□繧上ｊ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/繝阪う繝ｫ縺薙□繧上ｊ繝｢繝薙ぅ.png" },
  { name: "繧ｹ繝医・繝ｪ繝ｼ謦ｮ蠖ｱ迴ｭ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/繧ｹ繝医・繝ｪ繝ｼ謦ｮ蠖ｱ迴ｭ繝｢繝薙ぅ.png" },
  { name: "繧ｹ繝医・繝ｪ繝ｼ蛹ゅｏ縺帙Δ繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/繧ｹ繝医・繝ｪ繝ｼ蛹ゅｏ縺帙Δ繝薙ぅ.png" },
  { name: "繧ｫ繝・・繝ｫ閾ｪ謦ｮ繧翫Δ繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/繧ｫ繝・・繝ｫ閾ｪ謦ｮ繧翫Δ繝薙ぅ.png" },
  { name: "謾ｾ隱ｲ蠕悟叉繝ｬ繧ｹ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/謾ｾ隱ｲ蠕悟叉繝ｬ繧ｹ繝｢繝薙ぅ.png" },
  { name: "謾ｾ隱ｲ蠕後％縺｣縺昴ｊ騾夊ｩｱ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/謾ｾ隱ｲ蠕後％縺｣縺昴ｊ騾夊ｩｱ繝｢繝薙ぅ.png" },
  { name: "蟶ｰ繧企％繝・・繝医Δ繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/蟶ｰ繧企％繝・・繝医Δ繝薙ぅ.png" },
  { name: "螻倶ｸ翫・縺ｿ縺､諱九Δ繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/螻倶ｸ翫・縺ｿ縺､諱九Δ繝薙ぅ.png" },
  { name: "譏ｼ莨代∩縺雁ｼ∝ｽ謎ｼ壹Δ繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/譏ｼ莨代∩縺雁ｼ∝ｽ謎ｼ壹Δ繝薙ぅ.png" },
  { name: "譁・喧逾ｭ蠎・ｱ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/譁・喧逾ｭ蠎・ｱ繝｢繝薙ぅ.png" },
  { name: "雉ｼ雋ｷ蜑肴ｺ懊∪繧雁ｴ繝｢繝薙ぅ", url: "assets/stickers/繝｢繝薙ぅ騾城℃貂亥･ｳ/雉ｼ雋ｷ蜑肴ｺ懊∪繧雁ｴ繝｢繝薙ぅ.png" },
];

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
await editor.loadTemplate(templateSelect.value);

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

