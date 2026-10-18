const video = document.getElementById('cam-video');
const canvas = document.getElementById('cam-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const terminal = document.getElementById('terminal');
const asciiOutput = document.getElementById('ascii-output');
const startOverlay = document.getElementById('start-overlay');

const hudStatus = document.getElementById('hud-status');
const hudRes = document.getElementById('hud-res');
const hudFps = document.getElementById('hud-fps');
const hudFt = document.getElementById('hud-ft');

const btnStart = document.getElementById('btn-start');
const btnTheme = document.getElementById('btn-theme');
const btnInvert = document.getElementById('btn-invert');
const btnMirror = document.getElementById('btn-mirror');
const btnPause = document.getElementById('btn-pause');
const btnSave = document.getElementById('btn-save');

const ASCII_CHARS = "  ..::--==++**##%%@@";
let cols = 160;
let rows = 0;

let isMirrored = false;
let isInverted = false;
let isPaused = false;
//const isColorMode = false;

const themes = ['wine', 'matrix', 'amber', 'cyan'];
let currentThemeIndex = 0;

//let lastFrameTime = performance.now();
let frameCount = 0;
let fpsTimer = performance.now();

// 1. Инициализация захвата (DisplayMedia для окон/экрана или UserMedia для вебки)
async function startCapture() {
  try {
    let stream;
    try {
      // Сначала пробуем запросить веб-камеру
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      isMirrored = true; // Для веб-камеры по дефолту удобнее зеркало
      btnMirror.classList.add('active');
    } catch (e) {
      // Если вебкамера недоступна (Wayland/V4L2) — открываем селектор окон
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: false
      });
      isMirrored = false;
      btnMirror.classList.remove('active');
    }

    video.srcObject = stream;
    await video.play();

    const checkReady = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        clearInterval(checkReady);
        updateGridDimensions();
        startOverlay.style.display = 'none';

        hudStatus.className = 'hud-badge live';
        hudStatus.textContent = '● LIVE';

        requestAnimationFrame(processFrame);
      }
    }, 50);

    stream.getVideoTracks()[0].onended = () => {
      hudStatus.className = 'hud-badge standby';
      hudStatus.textContent = '⊘ STOPPED';
      startOverlay.style.display = 'flex';
    };

  } catch (err) {
    console.error("Capture Error:", err);
    asciiOutput.textContent = `[ERR] Access rejected: ${err.message}`;
  }
}

// 2. Расчет сетки и шрифта
function updateGridDimensions() {
  if (!video.videoWidth) return;
  const aspectRatio = video.videoHeight / video.videoWidth;
  rows = Math.floor(cols * aspectRatio * 0.48);

  canvas.width = cols;
  canvas.height = rows;
  hudRes.textContent = `${cols}×${rows}`;
  autoScaleFont();
}

function autoScaleFont() {
  if (!rows || !cols) return;
  const viewport = document.getElementById('viewport');
  const availableWidth = viewport.clientWidth - 20;
  const availableHeight = viewport.clientHeight - 20;

  const fontSizeX = availableWidth / (cols * 0.60);
  const fontSizeY = availableHeight / (rows * 0.95);
  const optimalSize = Math.max(Math.min(fontSizeX, fontSizeY), 4);

  asciiOutput.style.fontSize = `${optimalSize.toFixed(1)}px`;
  asciiOutput.style.lineHeight = `${(optimalSize * 0.68).toFixed(1)}px`;
}

// 3. Главный цикл обработки кадров
function processFrame(now) {
  if (isPaused) return;

  const frameStart = performance.now();

  // FPS счетчик
  frameCount++;
  if (now - fpsTimer >= 1000) {
    hudFps.textContent = `${frameCount} FPS`;
    frameCount = 0;
    fpsTimer = now;
  }

  if (video.readyState >= 2) {
    // Рендеринг на скрытый канвас
    if (isMirrored) {
      ctx.save();
      ctx.translate(cols, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, cols, rows);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, cols, rows);
    }

    const imgData = ctx.getImageData(0, 0, cols, rows);
    const data = imgData.data;
    let outputStr = '';

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = (y * cols + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        let brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        if (isInverted) brightness = 255 - brightness;

        const normalized = (brightness / 255) ** 1.3;
        const charIdx = Math.floor(normalized * (ASCII_CHARS.length - 1));
        outputStr += ASCII_CHARS[charIdx];
      }
      outputStr += '\n';
    }

    asciiOutput.textContent = outputStr;
  }

  const frameTime = (performance.now() - frameStart).toFixed(1);
  hudFt.textContent = `${frameTime}ms`;

  requestAnimationFrame(processFrame);
}

// 4. Темы
function setTheme(index) {
  currentThemeIndex = (index + themes.length) % themes.length;
  const themeName = themes[currentThemeIndex];
  terminal.setAttribute('data-theme', themeName);
  btnTheme.textContent = `THEME: ${themeName.toUpperCase()}`;
}

// 5. Обработчики кнопок
btnStart.addEventListener('click', startCapture);

btnTheme.addEventListener('click', () => setTheme(currentThemeIndex + 1));

btnInvert.addEventListener('click', () => {
  isInverted = !isInverted;
  btnInvert.classList.toggle('active', isInverted);
});

btnMirror.addEventListener('click', () => {
  isMirrored = !isMirrored;
  btnMirror.classList.toggle('active', isMirrored);
});

btnPause.addEventListener('click', () => {
  isPaused = !isPaused;
  btnPause.textContent = isPaused ? '▶' : '⏸';
  btnPause.classList.toggle('active', isPaused);
  hudStatus.className = isPaused ? 'hud-badge paused' : 'hud-badge live';
  hudStatus.textContent = isPaused ? '⏸ PAUSED' : '● LIVE';
  if (!isPaused) requestAnimationFrame(processFrame);
});

btnSave.addEventListener('click', () => {
  const blob = new Blob([asciiOutput.textContent], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ascii_art_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// 6. Хоткеи
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;

  switch (e.key) {
    case '1': setTheme(0); break;
    case '2': setTheme(1); break;
    case '3': setTheme(2); break;
    case '4': setTheme(3); break;
    case 'i': case 'I': case 'ш': case 'Ш':
      btnInvert.click();
      break;
    case 'm': case 'M': case 'ь': case 'Ь':
      btnMirror.click();
      break;
    case ' ':
      e.preventDefault();
      btnPause.click();
      break;
    case 's': case 'S': case 'і': case 'І':
      btnSave.click();
      break;
    case '+': case '=':
      cols = Math.min(cols + 20, 240);
      updateGridDimensions();
      break;
    case '-': case '_':
      cols = Math.max(cols - 20, 80);
      updateGridDimensions();
      break;
  }
});

window.addEventListener('resize', autoScaleFont);