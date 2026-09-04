export const el = {
  startScreen: document.getElementById("start-screen"),
  arScreen: document.getElementById("ar-screen"),
  giftBox: document.getElementById("gift-box"),
  permissionError: document.getElementById("permission-error"),

  webcam: document.getElementById("webcam"),
  canvas: document.getElementById("output-canvas"),
  cameraWrap: document.getElementById("camera-wrap"),

  missionCard: document.getElementById("mission-card"),
  missionDots: document.getElementById("mission-dots"),
  missionStep: document.getElementById("mission-current-text"),
  missionTitle: document.getElementById("mission-title"),
  missionDesc: document.getElementById("mission-desc"),

  successBadge: document.getElementById("success-badge"),
  successBadgeImg: document.getElementById("success-badge-img"),

  audio: document.getElementById("bg-audio"),
  audioToggle: document.getElementById("audio-toggle"),
  audioToggleIcon: document.getElementById("audio-toggle-icon"),

  modal: document.getElementById("photocard-modal"),
  keepPlaying: document.getElementById("keep-playing"),
};

export function goToArScreen() {
  el.startScreen.classList.remove("screen--active");
  el.arScreen.classList.add("screen--active");
}

export function goToStartScreen() {
  el.arScreen.classList.remove("screen--active");
  el.startScreen.classList.add("screen--active");
}

export function renderMissionDots(missions, currentIndex) {
  el.missionDots.innerHTML = missions
    .map((_, i) => {
      const cls = i < currentIndex ? "is-done" : i === currentIndex ? "is-current" : "";
      return `<span class="${cls}"></span>`;
    })
    .join("");
}

export function renderMission(mission, index, total) {
  el.missionStep.textContent = String(index + 1);
  el.missionTitle.textContent = `${mission.icon} ${mission.title}`;
  el.missionDesc.textContent = mission.desc;
}

let successBadgeHideTimeout = null;

export function showSuccessBadge(imgSrc, altText) {
  el.successBadgeImg.src = imgSrc;
  el.successBadgeImg.alt = altText;
  el.successBadge.hidden = false;

  // Se reinicia la animación (clase + reflow) en vez de reasignar
  // style.animation, para que también funcione si el badge anterior
  // todavía estaba visible cuando llega una nueva misión.
  el.successBadge.classList.remove("success-badge--play");
  void el.successBadge.offsetWidth;
  el.successBadge.classList.add("success-badge--play");

  // Si ya había un hide programado de una llamada anterior, se cancela para
  // que no oculte el badge que acabamos de mostrar antes de tiempo.
  if (successBadgeHideTimeout) {
    clearTimeout(successBadgeHideTimeout);
  }
  successBadgeHideTimeout = window.setTimeout(() => {
    el.successBadge.hidden = true;
    successBadgeHideTimeout = null;
  }, 1200);
}

export function blurCamera(isBlurred) {
  el.cameraWrap.classList.toggle("is-blurred", isBlurred);
}

export function showPhotocardModal() {
  el.missionCard.hidden = true;
  el.modal.hidden = false;
}

export function hidePhotocardModal() {
  el.modal.hidden = true;
  el.missionCard.hidden = false;
  blurCamera(false);
}

export function setAudioIcon(isPlaying) {
  el.audioToggleIcon.textContent = isPlaying ? "🔊" : "🔇";
}

export function showPermissionError() {
  el.permissionError.hidden = false;
}
