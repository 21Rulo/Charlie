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
  missionStep: document.getElementById("mission-step"),
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

export function showSuccessBadge(imgSrc, altText) {
  el.successBadgeImg.src = imgSrc;
  el.successBadgeImg.alt = altText;
  el.successBadge.hidden = false;

  // Se reinicia la animación CSS (badge-pop) en cada misión.
  el.successBadge.style.animation = "none";
  void el.successBadge.offsetWidth;
  el.successBadge.style.animation = "";

  window.setTimeout(() => {
    el.successBadge.hidden = true;
  }, 1100);
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
