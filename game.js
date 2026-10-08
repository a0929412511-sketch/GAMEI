(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const timeEl = document.getElementById('time');
  const livesEl = document.getElementById('lives');
  const overlay = document.getElementById('overlay');
  const startButton = document.getElementById('startButton');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText = document.getElementById('overlayText');
  const overlayEmoji = document.getElementById('overlayEmoji');
  const W = canvas.width, H = canvas.height;
  const keys = new Set();
  let basket, items, score, lives, seconds, running, lastTime, spawnClock, elapsed, soundOn = false, audio;

  function reset() {
    basket = { x: W / 2, y: H - 55, w: 96, h: 53, speed: 410 };
    items = []; score = 0; lives = 3; seconds = 30; elapsed = 0; spawnClock = 0; lastTime = 0;
    updateHud();
  }
  function updateHud() {
    scoreEl.textContent = String(score).padStart(3, '0');
    timeEl.textContent = String(Math.max(0, Math.ceil(seconds)));
    livesEl.textContent = `${'♥ '.repeat(Math.max(0, lives))}${'♡ '.repeat(3 - Math.max(0, lives))}`.trim();
    livesEl.style.color = lives <= 1 ? '#ff7386' : '';
  }
  function start() {
    reset(); running = true; overlay.classList.add('hidden');
    requestAnimationFrame(loop);
  }
  function end(reason) {
    running = false;
    overlayEmoji.textContent = score >= 12 ? '🏆' : score >= 6 ? '🎉' : '🥡';
    overlayTitle.textContent = reason === 'time' ? '收攤時間到！' : '哎呀，辣到啦！';
    overlayText.innerHTML = `你接到了 <strong>${score}</strong> 籠小籠包。<br>${score >= 12 ? '夜市接包王就是你！' : '再來一局，挑戰更高分！'}`;
    startButton.innerHTML = '再玩一次 <span>↻</span>';
    overlay.classList.remove('hidden');
    if (score >= 6) sound('win');
  }
  function sound(kind) {
    if (!soundOn) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.connect(gain); gain.connect(audio.destination);
      osc.type = kind === 'bad' ? 'sawtooth' : 'sine';
      osc.frequency.value = kind === 'bad' ? 170 : kind === 'win' ? 690 : 520;
      gain.gain.setValueAtTime(.055, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .13);
      osc.start(); osc.stop(audio.currentTime + .14);
    } catch (_) { /* Audio is optional. */ }
  }
  function spawn() {
    const pepper = Math.random() < .23;
    items.push({ x: 24 + Math.random() * (W - 48), y: -32, r: pepper ? 19 : 20,
      emoji: pepper ? '🌶️' : (Math.random() < .22 ? '🍡' : '🥟'), bad: pepper,
      speed: 145 + Math.random() * 70 + Math.min(elapsed * 2.4, 100), spin: (Math.random() - .5) * 2 });
  }
  function drawBackdrop() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#352540'); sky.addColorStop(1, '#211d35');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // Lantern glow and a distant row of night-market roofs.
    for (let i = 0; i < 5; i++) {
      const x = 65 + i * 170;
      ctx.globalAlpha = .10; ctx.fillStyle = '#ffc979'; ctx.beginPath(); ctx.arc(x, 66, 52, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.font = '25px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🏮', x, 52 + Math.sin(elapsed * 1.5 + i) * 3);
    }
    ctx.fillStyle = '#171729'; ctx.beginPath(); ctx.moveTo(0, 164); ctx.lineTo(120, 121); ctx.lineTo(240, 164); ctx.lineTo(380, 126); ctx.lineTo(520, 164); ctx.lineTo(670, 119); ctx.lineTo(800, 160); ctx.lineTo(800, H); ctx.lineTo(0, H); ctx.fill();
    // Stall awnings.
    for (let i = 0; i < 4; i++) {
      const x = i * 220 - 30;
      ctx.fillStyle = i % 2 ? '#a45160' : '#d17c61'; ctx.fillRect(x, 205, 190, 12);
      ctx.fillStyle = '#4a334e'; ctx.fillRect(x + 8, 217, 174, 100);
      ctx.fillStyle = '#e4b471'; ctx.globalAlpha = .42; ctx.fillRect(x + 23, 232, 140, 2); ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffcf80'; ctx.globalAlpha = .6; ctx.fillRect(x + 25, 255, 19, 25); ctx.fillRect(x + 82, 255, 19, 25); ctx.fillRect(x + 139, 255, 19, 25); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#252038'; ctx.fillRect(0, 318, W, H - 318);
    ctx.fillStyle = '#33283d'; ctx.fillRect(0, 319, W, 4);
    // Soft floor stripes.
    ctx.strokeStyle = '#554054'; ctx.globalAlpha = .28; ctx.lineWidth = 1;
    for (let y = 350; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  function drawBasket() {
    const x = basket.x, y = basket.y;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#e79f70'; ctx.beginPath(); ctx.ellipse(0, 8, 42, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2bb86'; ctx.beginPath(); ctx.ellipse(0, 0, 42, 15, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c67b62'; ctx.fillRect(-40, 0, 80, 10);
    ctx.strokeStyle = '#ffdb9e'; ctx.lineWidth = 2;
    for (let x = -30; x <= 30; x += 12) { ctx.beginPath(); ctx.moveTo(x, 2); ctx.lineTo(x + 5, 9); ctx.stroke(); }
    ctx.font = '23px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🥟', 0, -7);
    ctx.restore();
  }
  function draw() {
    drawBackdrop();
    items.forEach(item => {
      ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(item.spin * elapsed);
      ctx.font = `${item.r * 1.8}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(item.emoji, 0, 0); ctx.restore();
    });
    drawBasket();
  }
  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - (lastTime || now)) / 1000, .035); lastTime = now;
    elapsed += dt; seconds -= dt; spawnClock += dt;
    if (spawnClock > Math.max(.48, .88 - elapsed * .009)) { spawnClock = 0; spawn(); }
    if (keys.has('ArrowLeft') || keys.has('a')) basket.x -= basket.speed * dt;
    if (keys.has('ArrowRight') || keys.has('d')) basket.x += basket.speed * dt;
    basket.x = Math.max(50, Math.min(W - 50, basket.x));
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]; item.y += item.speed * dt;
      const caught = item.y > basket.y - 22 && item.y < basket.y + 13 && Math.abs(item.x - basket.x) < 48;
      if (caught) {
        if (item.bad) { lives--; sound('bad'); }
        else { score += item.emoji === '🥟' ? 1 : 2; sound('good'); }
        items.splice(i, 1); updateHud();
      } else if (item.y > H + 30) items.splice(i, 1);
    }
    updateHud(); draw();
    if (lives <= 0) return end('lives');
    if (seconds <= 0) return end('time');
    requestAnimationFrame(loop);
  }
  function setBasketFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    basket.x = Math.max(50, Math.min(W - 50, (event.clientX - rect.left) / rect.width * W));
  }
  window.addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowLeft', 'ArrowRight', ' '].includes(key)) e.preventDefault();
    keys.add(key);
  });
  window.addEventListener('keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  window.addEventListener('blur', () => keys.clear());
  canvas.addEventListener('pointerdown', e => { if (running) { canvas.setPointerCapture(e.pointerId); setBasketFromPointer(e); } });
  canvas.addEventListener('pointermove', e => { if (running && e.buttons) setBasketFromPointer(e); });
  document.getElementById('leftButton').addEventListener('pointerdown', e => { e.preventDefault(); keys.add('ArrowLeft'); });
  document.getElementById('rightButton').addEventListener('pointerdown', e => { e.preventDefault(); keys.add('ArrowRight'); });
  for (const id of ['leftButton', 'rightButton']) for (const type of ['pointerup', 'pointerleave', 'pointercancel']) document.getElementById(id).addEventListener(type, () => { keys.clear(); });
  document.getElementById('soundButton').addEventListener('click', e => {
    soundOn = !soundOn; e.currentTarget.setAttribute('aria-pressed', String(soundOn));
    e.currentTarget.setAttribute('aria-label', soundOn ? '關閉音效' : '開啟音效');
    e.currentTarget.querySelector('span').textContent = soundOn ? '音效開啟' : '音效關閉';
    if (soundOn) sound('good');
  });
  startButton.addEventListener('click', start);
  reset(); draw();
})();
