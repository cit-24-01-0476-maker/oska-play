import {probeGPU, describeGPU} from "./gpu.mjs";

const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const welcome = document.getElementById("welcome");
const running = document.getElementById("running");
const stage = document.getElementById("stage");
const message = document.getElementById("message");
const hints = document.getElementById("input-hints");
const graphicsInfo = document.getElementById("graphics-info");
const gpuDialog = document.getElementById("gpu-dialog");
let gpuName = "WebGPU";
let frame = null;
let releaseSession = null;
let pending = false;
let gpuAvailable = true;
const requestedSize = new URLSearchParams(location.search).get("RECOMP_WEB_RESOLUTION");
const sizeMatch = requestedSize?.match(/^(\d{3,4})x(\d{3,4})$/);
let renderSize = sizeMatch && +sizeMatch[1] >= 320 && +sizeMatch[2] >= 240 && +sizeMatch[1] <= 3840 && +sizeMatch[2] <= 2160
  ? [+sizeMatch[1], +sizeMatch[2]] : null;
const fullscreenButton = document.getElementById("fullscreen");
const credit = document.getElementById("web-credit");

// The game's size, chosen before launch. "game" leaves it to Options -> Video;
// a fixed size overrides that until "game" is chosen again. Remembered here.
const resolutionSelect = document.getElementById("resolution");
const resolutionKey = "nfsmw-resolution";
function evenSize(n) { return Math.max(2, Math.round(n / 2) * 2); }
const screenSize = [evenSize(screen.width * devicePixelRatio), evenSize(screen.height * devicePixelRatio)];
const resolutionChoices = [["game", "Game setting (Options → Video)"],
  [screenSize.join("x"), `Screen · ${screenSize.join("×")}`]];
for (const [w, h] of [[1280, 720], [1366, 768], [1600, 900], [1920, 1080], [2560, 1440], [3840, 2160]])
  if (`${w}x${h}` !== resolutionChoices[1][0]) resolutionChoices.push([`${w}x${h}`, `${w}×${h}`]);
for (const [value, label] of resolutionChoices) resolutionSelect.add(new Option(label, value));
try { const saved = localStorage.getItem(resolutionKey); if (resolutionChoices.some(([v]) => v === saved)) resolutionSelect.value = saved; } catch {}
resolutionSelect.addEventListener("change", () => { try { localStorage.setItem(resolutionKey, resolutionSelect.value); } catch {} });

function isFullscreen() { return !!document.fullscreenElement; }
async function enterFullscreen() {
  if (isFullscreen() || !document.fullscreenEnabled) return;
  try { await document.documentElement.requestFullscreen({navigationUI: "hide"}); } catch {}
}
function fullscreenChanged() {
  document.body.classList.toggle("fullscreen", isFullscreen());
  fullscreenButton.hidden = !frame || isFullscreen() || !document.fullscreenEnabled;
  fitRuntime();
  frame?.focus();
}
document.addEventListener("fullscreenchange", fullscreenChanged);
fullscreenButton.addEventListener("click", enterFullscreen);

function showGPU(result) {
  gpuName = result.name;
  document.getElementById("gpu-name").textContent = `Graphics card: ${gpuName}`;
  const warning = document.getElementById("gpu-warning");
  warning.hidden = !result.warning;
  warning.querySelector("span").textContent = result.warning;
  warning.dataset.kind = result.kind;
  document.getElementById("gpu-help").hidden = result.kind === "dedicated";
  gpuAvailable = result.kind !== "unavailable";
  startButton.disabled = !gpuAvailable || pending;
}
probeGPU().then(showGPU);
document.getElementById("gpu-help").addEventListener("click", () => gpuDialog.showModal());
gpuDialog.querySelector(".dialog-close").addEventListener("click", () => gpuDialog.close());
gpuDialog.addEventListener("click", event => {
  if (event.target !== gpuDialog) return;
  const r = gpuDialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) gpuDialog.close();
});

function fitRuntime() {
  if (!frame || !renderSize) return;
  const [width, height] = renderSize;
  // Full screen: the whole screen, scaled up as well as down.
  const scale = isFullscreen() ? Math.min(innerWidth / width, innerHeight / height)
    : Math.min(1, Math.max(1, innerWidth - (innerWidth <= 760 ? 24 : 40)) / width,
      Math.max(1, innerHeight - 160) / height);
  Object.assign(stage.style, {position: "relative", width: `${width * scale}px`, height: `${height * scale}px`});
  Object.assign(frame.style, {position: "absolute", left: "0", top: "0", width: `${width}px`, height: `${height}px`,
    transformOrigin: "0 0", transform: `scale(${scale})`});
}
window.addEventListener("resize", fitRuntime);

startButton.addEventListener("click", async () => {
  if (pending || frame || !gpuAvailable) return;
  if (!navigator.locks) {
    message.textContent = "Open this page in Chrome or Edge to start the game.";
    return;
  }
  pending = true;
  // Inside the click: full screen needs the user's gesture.
  enterFullscreen();
  navigator.storage.persist?.().catch(() => {});
  startButton.disabled = true;
  message.textContent = "Starting…";
  try {
    await navigator.locks.request("recomp-player-nfsmw", {ifAvailable: true}, async lock => {
      if (!lock) {
        message.textContent = "The game is already running in another tab. Stop it there, then return here.";
        return;
      }
      await new Promise(resolve => {
        releaseSession = resolve;
        frame = document.createElement("iframe");
        frame.title = document.title;
        const query = new URLSearchParams(location.search);
        query.set("res", resolutionSelect.value);
        frame.src = `${document.body.dataset.runtime}?${query}`;
        frame.allow = "fullscreen; gamepad; autoplay";
        stage.append(frame);
        running.hidden = false;
        welcome.hidden = true;
        stopButton.hidden = false;
        document.body.classList.add("playing");
        fullscreenChanged();
      });
    });
  } catch (error) {
    stopGame();
    message.textContent = `Unable to start the game: ${error.message}`;
  } finally {
    pending = false;
    startButton.disabled = !gpuAvailable;
  }
});

function stopGame() {
  try { frame?.contentWindow?.recompStop?.(); }
  catch (error) { console.warn("Runtime cleanup:", error); }
  frame?.remove();
  frame = null;
  running.hidden = true;
  stage.removeAttribute("style");
  welcome.hidden = false;
  stopButton.hidden = true;
  fullscreenButton.hidden = true;
  if (isFullscreen()) document.exitFullscreen().catch(() => {});
  credit.hidden = true;
  hints.textContent = "";
  graphicsInfo.textContent = "";
  document.body.classList.remove("playing");
  releaseSession?.();
  releaseSession = null;
  message.textContent = "Game stopped. Your files and saves stay in this browser.";
  startButton.focus();
}
stopButton.addEventListener("click", stopGame);
window.addEventListener("pagehide", stopGame);
window.addEventListener("message", event => {
  if (event.origin !== location.origin || event.source !== frame?.contentWindow) return;
  if (event.data?.type === "recomp-input-hints") hints.textContent = event.data.text;
  if (event.data?.type === "recomp-gpu-info") {
    gpuName = event.data.text;
    if (event.data.info) showGPU(describeGPU(event.data.info));
    else document.getElementById("gpu-name").textContent = `Graphics card: ${gpuName}`;
  }
  if (event.data?.type === "recomp-display-size") {
    // The game window exists: show the credit once per run; CSS fades it out.
    credit.hidden = false;
    const {width, height} = event.data;
    if (Number.isInteger(width) && Number.isInteger(height) && width >= 320 && height >= 240 && width <= 8192 && height <= 8192) {
      renderSize = [width, height];
      fitRuntime();
    }
  }
  if (event.data?.type === "recomp-gpu-info" || event.data?.type === "recomp-display-size")
    graphicsInfo.textContent = `GPU: ${gpuName}${renderSize ? ` · ${renderSize.join("×")}` : ""}`;
});
