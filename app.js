const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzTVtAxa3YyQXKK9ThnJ_sRWGl-e3GbpGk4VE4b3liZ17S1whFoEGe-_hlrOzsQUatg/exec";
const LOCAL_DEMO_STORAGE_KEY = "body-palette-survey-responses";

const prizes = [
  {
    id: "custom-session",
    name: "カスタムセッション",
    summary: "貴社の健康経営課題に合わせた個別設計セッション",
  },
  {
    id: "protein",
    name: "プロテインプレゼント",
    summary: "日々のコンディショニングを支援",
  },
  {
    id: "executive-training",
    name: "エグゼクティブパーソナルトレーニング体験チケット",
    summary: "経営層向けの集中トレーニング体験",
  },
  {
    id: "personal-pilates",
    name: "パーソナルピラティス体験チケット",
    summary: "姿勢と動作を整えるマンツーマン体験",
  },
];

const forcedPrizeId = "custom-session";
const spinDurationMs = 5900;
const victoryOverlayDurationMs = 5200;

const surveyScreen = document.querySelector("#surveyScreen");
const rouletteScreen = document.querySelector("#rouletteScreen");
const surveyForm = document.querySelector("#surveyForm");
const surveySubmit = document.querySelector("#surveySubmit");
const formStatus = document.querySelector("#formStatus");
const wheel = document.querySelector("#wheel");
const stage = document.querySelector("#rouletteStage");
const spinButton = document.querySelector("#spinButton");
const surveyCheck = document.querySelector("#surveyCheck");
const statusText = document.querySelector("#statusText");
const resultTicket = document.querySelector("#resultTicket");
const victoryOverlay = document.querySelector("#victoryOverlay");
const prizeList = document.querySelector("#prizeList");
const canvas = document.querySelector("#confettiCanvas");
const ctx = canvas.getContext("2d");

let currentRotation = 0;
let isSpinning = false;
let hasResult = false;
let particles = [];
let confettiFrame = 0;

function setCanvasSize() {
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function setStatus(message) {
  statusText.textContent = message;
}

function setFormStatus(message, type = "idle") {
  formStatus.textContent = message;
  formStatus.dataset.type = type;
}

function setSpinAvailability() {
  spinButton.disabled = isSpinning || hasResult || !surveyCheck.checked;
  if (surveyCheck.checked && !isSpinning && !hasResult) {
    setStatus("アンケート送信が完了しました。中央のボタンをタップしてください。");
  }
}

function highlightPrize(prizeId) {
  prizeList.querySelectorAll("li").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.prizeId === prizeId);
  });
}

function getEndpointConfigured() {
  return /^https:\/\/script\.google\.com\/macros\/s\//.test(SHEET_WEB_APP_URL);
}

function getSurveyPayload() {
  const data = new FormData(surveyForm);
  return {
    fullName: String(data.get("fullName") || "").trim(),
    companyName: String(data.get("companyName") || "").trim(),
    email: String(data.get("email") || "").trim(),
    satisfaction: String(data.get("satisfaction") || "").trim(),
    healthAction: String(data.get("healthAction") || "").trim(),
    healthSatisfaction: String(data.get("healthSatisfaction") || "").trim(),
    seminarFeedback: String(data.get("seminarFeedback") || "").trim(),
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    submittedAt: new Date().toISOString(),
  };
}

function saveLocalDemoResponse(payload) {
  const current = JSON.parse(localStorage.getItem(LOCAL_DEMO_STORAGE_KEY) || "[]");
  current.push(payload);
  localStorage.setItem(LOCAL_DEMO_STORAGE_KEY, JSON.stringify(current.slice(-100)));
}

async function submitToSpreadsheet(payload) {
  if (!getEndpointConfigured()) {
    saveLocalDemoResponse(payload);
    return { mode: "demo" };
  }

  await fetch(SHEET_WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  return { mode: "spreadsheet" };
}

function showRoulette(mode) {
  surveyScreen.hidden = true;
  rouletteScreen.hidden = false;
  surveyCheck.checked = true;
  setSpinAvailability();
  if (mode === "demo") {
    setStatus("デモ保存が完了しました。中央のボタンをタップしてください。");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function handleSurveySubmit(event) {
  event.preventDefault();

  if (!surveyForm.reportValidity()) return;

  const payload = getSurveyPayload();
  surveySubmit.disabled = true;
  setFormStatus("送信しています。少しだけお待ちください。", "loading");

  try {
    const result = await submitToSpreadsheet(payload);
    if (result.mode === "demo") {
      setFormStatus("デモ保存しました。Apps Script URLを設定するとスプレッドシートへ追記されます。", "success");
    } else {
      setFormStatus("送信が完了しました。", "success");
    }
    showRoulette(result.mode);
  } catch (error) {
    surveySubmit.disabled = false;
    setFormStatus("送信できませんでした。通信環境を確認してもう一度お試しください。", "error");
  }
}

function startSpin() {
  if (isSpinning || hasResult || !surveyCheck.checked) return;

  isSpinning = true;
  spinButton.disabled = true;
  resultTicket.hidden = true;
  victoryOverlay.classList.remove("is-visible");
  stage.classList.remove("is-winner");
  stage.classList.add("is-spinning");
  highlightPrize("");
  setStatus("抽選中です。ルーレットが止まるまでお待ちください。");

  const remainder = ((currentRotation % 360) + 360) % 360;
  const correctionToCustom = (360 - remainder) % 360;
  currentRotation += 360 * 8 + correctionToCustom;
  wheel.style.setProperty("--wheel-rotation", `${currentRotation}deg`);

  window.setTimeout(() => {
    revealForcedPrize();
  }, spinDurationMs);
}

function revealForcedPrize() {
  const prize = prizes.find((item) => item.id === forcedPrizeId) || prizes[0];
  isSpinning = false;
  hasResult = true;
  stage.classList.remove("is-spinning");
  stage.classList.add("is-winner");
  resultTicket.hidden = false;
  highlightPrize(prize.id);
  setStatus(`${prize.name}が当選しました。`);

  victoryOverlay.classList.add("is-visible");
  burstConfetti(260);
  vibrateWin();

  window.setTimeout(() => {
    victoryOverlay.classList.remove("is-visible");
    resultTicket.scrollIntoView({ behavior: "smooth", block: "start" });
  }, victoryOverlayDurationMs);
}

function vibrateWin() {
  if (!navigator.vibrate) return;
  navigator.vibrate([80, 45, 120, 45, 180]);
}

function burstConfetti(amount) {
  const colors = ["#f1d58a", "#ffffff", "#a7d8c9", "#4a83c4", "#d96e58"];
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.38;

  for (let i = 0; i < amount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 10;
    particles.push({
      x: originX + (Math.random() - 0.5) * 120,
      y: originY + (Math.random() - 0.5) * 80,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 5 - Math.random() * 6,
      size: 5 + Math.random() * 9,
      rotation: Math.random() * Math.PI,
      rotationSpeed: -0.22 + Math.random() * 0.44,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 120 + Math.random() * 70,
      shape: Math.random() > 0.82 ? "circle" : "rect",
    });
  }

  if (!confettiFrame) {
    confettiFrame = window.requestAnimationFrame(drawConfetti);
  }
}

function drawConfetti() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles = particles.filter((particle) => {
    particle.life -= 1;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.18;
    particle.vx *= 0.992;
    particle.rotation += particle.rotationSpeed;
    return particle.life > 0 && particle.y < window.innerHeight + 40;
  });

  particles.forEach((particle) => {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = Math.max(0, Math.min(1, particle.life / 80));
    ctx.fillStyle = particle.color;
    if (particle.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, particle.size * 0.48, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.62);
    }
    ctx.restore();
  });

  if (particles.length) {
    confettiFrame = window.requestAnimationFrame(drawConfetti);
  } else {
    confettiFrame = 0;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

surveyForm.addEventListener("submit", handleSurveySubmit);
spinButton.addEventListener("click", startSpin);
window.addEventListener("resize", setCanvasSize);

setCanvasSize();
setSpinAvailability();
