import "./style.css";
import { DrawingUtils, GestureRecognizer, FaceLandmarker } from "@mediapipe/tasks-vision";

import { startWebcam } from "./js/camera.js";
import {
  initGestureRecognizer,
  detectGestures,
  closeGestureRecognizer,
} from "./js/gestures.js";
import { initFaceLandmarker, detectFace, closeFaceLandmarker } from "./js/face.js";
import { MISSIONS, createHoldTracker } from "./js/missions.js";
import { burst, greenRain, grandFinale } from "./js/confetti.js";
import * as ui from "./js/ui.js";

const ctx = ui.el.canvas.getContext("2d");
const drawingUtils = new DrawingUtils(ctx);

let activeTracker = null; // "hands" | "face"
let currentMissionIndex = 0;
let holdTracker = null;
let sandboxMode = false;
let rafId = null;
let snapshots = [];

// ---------------------------------------------------------------------------
// Arranque: click en el regalo -> permiso de cámara + audio + pantalla AR
// ---------------------------------------------------------------------------
ui.el.giftBox.addEventListener("click", handleGiftBoxClick);
ui.el.audioToggle.addEventListener("click", toggleAudio);
ui.el.keepPlaying.addEventListener("click", enterSandboxMode);
ui.el.downloadCollage.addEventListener("click", downloadCollage);

// El canvas sólo puede medirse contra dimensiones reales del video
// (videoWidth/videoHeight), y esas sólo existen una vez que el propio
// <video> las expone — no antes. Se registra una única vez, a nivel de
// módulo, en vez de re-suscribirse en cada click del regalo.
ui.el.webcam.addEventListener("loadedmetadata", resizeCanvasToVideo);
ui.el.webcam.addEventListener("playing", resizeCanvasToVideo);
window.addEventListener("resize", resizeCanvasToVideo);

async function handleGiftBoxClick() {
  ui.el.giftBox.disabled = true;

  // Se dispara dentro del propio gesto de click para que el navegador
  // permita el autoplay con sonido.
  ui.el.audio.play().catch((err) => console.warn("Audio placeholder no disponible aún:", err));
  ui.setAudioIcon(true);

  // Mostramos el contenedor AR ANTES de pedir la cámara: si el <video> se
  // asigna mientras su ancestro sigue en display:none, algunos navegadores
  // (Chromium/Edge incluidos) no llegan a decodificar frames ni a exponer
  // videoWidth/videoHeight, y el canvas queda a 0x0.
  ui.goToArScreen();

  try {
    await startWebcam(ui.el.webcam);
  } catch (err) {
    console.error("No se pudo acceder a la cámara:", err);
    ui.goToStartScreen();
    ui.showPermissionError();
    ui.el.giftBox.disabled = false;
    return;
  }

  await startMissionFlow();
}

function resizeCanvasToVideo() {
  const { videoWidth, videoHeight } = ui.el.webcam;
  if (!videoWidth || !videoHeight) return;

  ui.el.canvas.width = videoWidth;
  ui.el.canvas.height = videoHeight;
}

function toggleAudio() {
  if (ui.el.audio.paused) {
    ui.el.audio.play().catch(() => {});
    ui.setAudioIcon(true);
  } else {
    ui.el.audio.pause();
    ui.setAudioIcon(false);
  }
}

// ---------------------------------------------------------------------------
// Flujo de misiones
// ---------------------------------------------------------------------------
async function startMissionFlow() {
  currentMissionIndex = 0;
  await enterMission(0);
  loop();
}

async function enterMission(index) {
  const mission = MISSIONS[index];
  ui.renderMission(mission, index, MISSIONS.length);
  ui.renderMissionDots(MISSIONS, index);

  await ensureTracker(mission.tracker);

  holdTracker = createHoldTracker(() => onMissionSuccess(mission, index));
}

/** Carga sólo el modelo que hace falta y libera el otro (ahorro de recursos). */
async function ensureTracker(tracker) {
  if (tracker === activeTracker) return;

  if (tracker === "hands") {
    closeFaceLandmarker();
    await initGestureRecognizer();
  } else {
    closeGestureRecognizer();
    await initFaceLandmarker();
  }
  activeTracker = tracker;
}

function captureSnapshot(video) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  // Mantener el efecto espejo
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

function onMissionSuccess(mission, index) {
  snapshots.push(captureSnapshot(ui.el.webcam));
  ui.showSuccessBadge(mission.badgeImg, `Misión completa: ${mission.title}`);

  if (mission.id === "peace-sign") {
    greenRain();
  } else {
    burst();
  }

  const isLastMission = index === MISSIONS.length - 1;

  window.setTimeout(async () => {
    if (isLastMission) {
      if (sandboxMode) {
        // En modo sandbox el ciclo de sonrisa vuelve a empezar sin modal.
        currentMissionIndex = 0;
        await enterMission(0);
      } else {
        await revealPhotocard();
      }
    } else {
      currentMissionIndex = index + 1;
      await enterMission(currentMissionIndex);
    }
  }, 900);
}

/** Dibuja `img` dentro de un rectángulo de `w`x`h` recortando el sobrante,
 * simulando el comportamiento de object-fit: cover. */
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generateCollage() {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");

  const cellW = 200;
  const cellH = 300;
  const images = await Promise.all(snapshots.slice(0, 4).map(loadImage));

  images.forEach((img, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawCover(ctx, img, col * cellW, row * cellH, cellW, cellH);
  });

  ui.el.photocardImg.src = canvas.toDataURL("image/jpeg", 0.9);
}

async function revealPhotocard() {
  ui.blurCamera(true);
  grandFinale();

  window.setTimeout(async () => {
    document.getElementById('mission-card').style.display = 'none';
    await generateCollage();
    ui.showPhotocardModal();
  }, 700);
}

function downloadCollage() {
  const link = document.createElement("a");
  link.href = ui.el.photocardImg.src;
  link.download = "Cumple_Charlie.jpg";
  link.click();
}

async function enterSandboxMode() {
  sandboxMode = true;
  snapshots = [];
  ui.hidePhotocardModal();
  document.getElementById('mission-card').style.display = 'block';
  currentMissionIndex = 0;
  await enterMission(0);
}

// ---------------------------------------------------------------------------
// Loop de detección: un único rAF que alimenta al tracker activo.
// ---------------------------------------------------------------------------
function loop() {
  const video = ui.el.webcam;

  if (video.readyState >= 2) {
    const timestampMs = performance.now();
    ctx.save();
    ctx.clearRect(0, 0, ui.el.canvas.width, ui.el.canvas.height);

    if (activeTracker === "hands") {
      const result = detectGestures(video, timestampMs);
      drawHands(result);
      holdTracker?.feed(MISSIONS[currentMissionIndex].detect(result));
    } else if (activeTracker === "face") {
      const result = detectFace(video, timestampMs);
      drawFace(result);
      holdTracker?.feed(MISSIONS[currentMissionIndex].detect(result));
    }

    ctx.restore();
  }

  rafId = requestAnimationFrame(loop);
}

function drawHands(result) {
  if (!result?.landmarks) return;
  for (const landmarks of result.landmarks) {
    drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
      color: "#A3B18A",
      lineWidth: 3,
    });
    drawingUtils.drawLandmarks(landmarks, { color: "#3A5A40", radius: 3 });
  }
}

function drawFace(result) {
  if (!result?.faceLandmarks) return;
  for (const landmarks of result.faceLandmarks) {
    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_CONTOURS, {
      color: "#588157",
      lineWidth: 1,
    });
  }
}

window.addEventListener("beforeunload", () => {
  if (rafId) cancelAnimationFrame(rafId);
  closeGestureRecognizer();
  closeFaceLandmarker();
});
