import './style.css';
import { gsap } from 'gsap';
import { memories } from './data/memories.js';
import { gardenMemories } from './data/gardenMemories.js';

const $ = (selector) => document.querySelector(selector);
const universeScreen = $('#universe-screen');
const universeCanvas = $('#universe-canvas');
const universeEnterButton = $('#universe-enter-button');
const universeInstruction = $('#universe-instruction');
const introScreen = $('#intro-screen');
const storyScreen = $('#story-screen');
const finalScreen = $('#final-screen');
const wishScreen = $('#wish-screen');
const wishLantern = $('#wish-lantern');
const wishAfter = $('#wish-after');
const wishTitle = $('#wish-title');
const wishCopy = $('#wish-copy');
const gardenScreen = $('#garden-screen');
const gardenHearts = $('#garden-hearts');
const gardenMemoryDetail = $('#garden-memory-detail');
const gardenMemoryCard = $('#garden-memory-card');
const gardenMemoryImage = $('#garden-memory-image');
const gardenMemoryTitle = $('#garden-memory-title');
const gardenMemoryMessage = $('#garden-memory-message');
const gardenMemoryEnglish = $('#garden-memory-english');
const gardenProgressLabel = $('#garden-progress-label');
const memoryView = $('#memory-view');
const tulipView = $('#tulip-view');
const scratchView = $('#scratch-view');
const audio = $('#story-audio');
const beginButton = $('#begin-button');
const pauseButton = $('#pause-button');
const musicControl = $('#music-control');
const musicIconButton = $('#music-icon-button');
const volumeControl = $('#volume-control');
const progressFill = $('#progress-fill');
const progressLabel = $('#progress-label');
const timeLabel = $('#time-label');
const sceneCounter = $('#scene-counter');
const imageElement = $('#memory-image');
const memoryFlipCard = $('#memory-flip-card');
const memoryFlipImage = $('#memory-flip-image');
const memoryFlipTitle = $('#memory-flip-title');
const memoryFlipMessage = $('#memory-flip-message');
const memoryFlipEnglish = $('#memory-flip-english');
const modalFlipCard = $('#modal-flip-card');
const modalFlipImage = $('#modal-flip-image');
const modalFlipTitle = $('#modal-flip-title');
const modalFlipMessage = $('#modal-flip-message');
const modalFlipEnglish = $('#modal-flip-english');
const cinemaControls = $('#cinema-controls');
const cinemaPlayButton = $('#cinema-play-button');
const cinemaPlayIcon = $('#cinema-play-icon');
const cinemaBackButton = $('#cinema-back-button');
const cinemaForwardButton = $('#cinema-forward-button');
const openGardenButton = $('#open-garden-button');
const gardenReturnButton = $('#garden-return-button');
const gardenBackFinalButton = $('#garden-back-final');
const backdropElement = $('#photo-backdrop');
const photoFrame = $('.photo-frame');
const photoIndex = $('#photo-index');
const memoryKicker = $('#memory-kicker');
const memoryTitle = $('#memory-title');
const memoryMessage = $('#memory-message');
const memoryEnglish = $('#memory-english');
const nextButton = $('#next-button');
const previousButton = $('#previous-button');
const expandPhotoButton = $('#expand-photo');
const photoModal = $('#photo-modal');
const photoModalCard = $('#photo-modal-card');
const modalImage = $('#modal-image');
const cinemaEffectLayer = $('#cinema-effect-layer');
const closeModalButton = $('#close-modal');
const modalKicker = $('#modal-kicker');
const modalTitle = $('#modal-title');
const modalMessage = $('#modal-message');
const modalEnglish = $('#modal-english');
const tulipButton = $('#tulip-button');
const tulipPetalBurst = $('#tulip-petal-burst');
const scratchCanvas = $('#scratch-canvas');
const scratchImage = $('#scratch-image');
const replayButton = $('#replay-button');

const FALLBACK_DURATION = 231.12;
const INTRO_DURATION = 2;
const DEFAULT_PHOTO_DURATION = 6.5;
const LONG_PHOTO_DURATION = 7.5;
const MIN_WISH_DURATION = 12; // keep the lantern interlude near 12 seconds; extra time is shared by the photos
const FLIP_MEMORY_IDS = new Set([12, 22]);
const PHOTO_COUNT = memories.length;
const TULIP_MEMORY_ID = 16;
const SCRATCH_MEMORY_ID = 24;
const SCRATCH_PASSES_REQUIRED = 3;
const EFFECT_BY_MEMORY = {
  5: 'effect-stardust',
  10: 'effect-camera',
  15: 'effect-hearts',
  20: 'effect-sweep',
  25: 'effect-focus',
  30: 'effect-gather'
};
const EFFECT_CLASSES = Object.values(EFFECT_BY_MEMORY);

let timeline = [];
let activeScene = null;
let experienceStarted = false;
let experienceFinished = false;
let animationFrame = 0;
let stars = [];
let heartStars = [];
let starCanvasContext = null;
let scratchContext = null;
let scratchPointerDown = false;
let lastScratchPoint = null;
let scratchStrokeDistance = 0;
let scratchPasses = 0;
let scratchCanvasWidth = 0;
let scratchCanvasHeight = 0;
let starCanvasWidth = 0;
let starCanvasHeight = 0;
let cinemaMode = false;
let tulipTimer = 0;
let tulipRevealTimer = 0;
let scratchTimer = 0;
let scratchRevealTimer = 0;
let tulipBloomStarted = false;
let scratchRevealStarted = false;
let svgHeartCounter = 0;
let universeParticles = [];
let universeFrame = 0;
let universeStartTime = 0;
let universeReadyTimer = 0;
let universeHeartReady = false;
let universeWidth = 0;
let universeHeight = 0;
let universeCtx = null;
let universePointer = { x: -1000, y: -1000, active: false, time: 0 };
let wishAutoTimer = 0;
let wishFinishTimer = 0;
let wishStarted = false;
let wishAudioFinished = false;
let wishSequenceComplete = false;
let cinemaControlsTimer = 0;
let selectedGardenButton = null;
let selectedGardenMemory = null;
let gardenVisitedIds = loadGardenVisited();
let gardenAnimationCleanup = null;

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const remainder = String(safe % 60).padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function getDuration() {
  return Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : FALLBACK_DURATION;
}

function getMemoryDuration(memory) {
  return Number(memory.duration) === LONG_PHOTO_DURATION ? LONG_PHOTO_DURATION : DEFAULT_PHOTO_DURATION;
}

function buildTimeline(duration) {
  // Keep every photograph at its authored duration where possible. The complete
  // remaining soundtrack becomes the wish scene; the final letter is revealed
  // only after the lantern has been released and the music has reached its end.
  const safeDuration = Math.max(duration, INTRO_DURATION + PHOTO_COUNT * 4 + MIN_WISH_DURATION);
  const desiredDurations = memories.map(getMemoryDuration);
  const desiredPhotoTotal = desiredDurations.reduce((sum, value) => sum + value, 0);
  const availableForPhotos = Math.max(PHOTO_COUNT * 4, safeDuration - INTRO_DURATION - MIN_WISH_DURATION);
  const scale = desiredPhotoTotal > availableForPhotos ? availableForPhotos / desiredPhotoTotal : 1;
  const actualDurations = desiredDurations.map((value) => value * scale);
  const photoTotal = actualDurations.reduce((sum, value) => sum + value, 0);
  const wishDuration = Math.max(MIN_WISH_DURATION, safeDuration - INTRO_DURATION - photoTotal);
  const scenes = [];
  let cursor = 0;
  const add = (scene, seconds) => {
    scenes.push({ ...scene, start: cursor, end: cursor + seconds });
    cursor += seconds;
  };

  add({ id: 'intro', type: 'intro', label: 'THE BEGINNING' }, INTRO_DURATION);
  memories.forEach((memory, index) => {
    add({ id: `memory-${memory.id}`, type: 'memory', memory, label: memory.kicker }, actualDurations[index]);
  });
  add({ id: 'wish', type: 'wish', label: 'MAKE A WISH' }, wishDuration);
  if (scenes.length) scenes[scenes.length - 1].end = safeDuration;
  return scenes;
}

function getSceneAt(time) {
  if (!timeline.length) timeline = buildTimeline(getDuration());
  return timeline.find((scene) => time >= scene.start && time < scene.end) || timeline[timeline.length - 1];
}

function setVisible(element, visible) {
  if (element) element.classList.toggle('is-hidden', !visible);
}

// Cross-dissolve: keep the previous frame above the incoming image, then fade it away.
function crossfadeImage(image, nextSource, duration = 1150) {
  if (!image || !nextSource) return;
  const currentSource = image.getAttribute('src');
  if (!currentSource) {
    image.src = nextSource;
    return;
  }

  const currentUrl = new URL(currentSource, document.baseURI).href;
  const nextUrl = new URL(nextSource, document.baseURI).href;
  if (currentUrl === nextUrl) return;

  const parent = image.parentElement;
  if (!parent) {
    image.src = nextSource;
    return;
  }

  parent.querySelectorAll(':scope > .image-crossfade-layer').forEach((layer) => layer.remove());
  const previousFrame = image.cloneNode(false);
  previousFrame.removeAttribute('id');
  previousFrame.removeAttribute('alt');
  previousFrame.setAttribute('aria-hidden', 'true');
  previousFrame.draggable = false;
  previousFrame.className = 'image-crossfade-layer';
  previousFrame.src = currentSource;
  previousFrame.style.setProperty('--crossfade-duration', `${duration}ms`);
  parent.appendChild(previousFrame);

  image.src = nextSource;
  requestAnimationFrame(() => requestAnimationFrame(() => previousFrame.classList.add('is-fading')));
  window.setTimeout(() => previousFrame.remove(), duration + 120);
}

// Move the existing interactive overlays into the cinema layer when a special
// memory is enlarged. This preserves the same buttons/canvas and their events.
function moveSpecialOverlaysForCinema(shouldShow) {
  if (!photoFrame || !photoModal || !photoIndex) return;
  if (shouldShow) {
    if (tulipView.parentElement !== photoModal) photoModal.append(tulipView, tulipPetalBurst, scratchView);
    return;
  }

  if (tulipView.parentElement !== photoFrame) {
    photoFrame.insertBefore(tulipView, photoIndex);
    photoFrame.insertBefore(tulipPetalBurst, photoIndex);
    photoFrame.insertBefore(scratchView, photoIndex);
  }
}

function transitionText(element, text) {
  if (!element) return;
  element.classList.remove('text-enter');
  void element.offsetWidth;
  element.textContent = text;
  element.classList.add('text-enter');
}

function preloadNearbyImages(memoryId) {
  memories
    .filter((memory) => memory.id > memoryId && memory.id <= memoryId + 3)
    .forEach((memory) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = memory.image;
    });
}

function clearSpecialTimers() {
  window.clearTimeout(tulipTimer);
  window.clearTimeout(tulipRevealTimer);
  window.clearTimeout(scratchTimer);
  window.clearTimeout(scratchRevealTimer);
  tulipTimer = 0;
  tulipRevealTimer = 0;
  scratchTimer = 0;
  scratchRevealTimer = 0;
  tulipBloomStarted = false;
  scratchRevealStarted = false;
  tulipView?.classList.remove('is-blooming');
  scratchView?.classList.remove('is-revealing');
  if (tulipPetalBurst) tulipPetalBurst.innerHTML = '';
}

function setEffectClasses(element, memoryId) {
  if (!element) return;
  element.classList.remove(...EFFECT_CLASSES, 'effect-scratch-reveal', 'effect-tulip-reveal');
  const effect = EFFECT_BY_MEMORY[memoryId];
  if (effect) element.classList.add(effect);
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function addFloatingPhotoHearts(imageUrl, target) {
  if (!target) return;
  target.querySelectorAll('.floating-photo-heart').forEach((node) => node.remove());
  const positions = [
    { x: '2%', y: '13%', size: 'clamp(56px, 8vw, 94px)', delay: '-1.2s', duration: '7.4s' },
    { x: '83%', y: '22%', size: 'clamp(48px, 7vw, 82px)', delay: '-4.1s', duration: '8.1s' },
    { x: '7%', y: '66%', size: 'clamp(42px, 6vw, 70px)', delay: '-2.8s', duration: '7.8s' },
    { x: '86%', y: '70%', size: 'clamp(55px, 7.6vw, 88px)', delay: '-5.3s', duration: '8.6s' },
    { x: '47%', y: '4%', size: 'clamp(34px, 4.5vw, 53px)', delay: '-3.3s', duration: '7s' }
  ];
  const heartPath = 'M50 88 C43 80 8 54 8 30 C8 13 20 3 34 3 C42 3 48 8 50 17 C55 8 63 3 72 3 C87 3 96 14 96 30 C96 53 66 78 50 88 Z';

  positions.forEach((position, index) => {
    svgHeartCounter += 1;
    const uniqueId = `heart-glass-${svgHeartCounter}`;
    const svg = createSvgElement('svg', {
      class: `floating-photo-heart heart-float-${index + 1}`,
      viewBox: '0 0 100 92',
      role: 'presentation',
      'aria-hidden': 'true'
    });
    svg.style.left = position.x;
    svg.style.top = position.y;
    svg.style.width = position.size;
    svg.style.setProperty('--heart-delay', position.delay);
    svg.style.setProperty('--heart-duration', position.duration);

    const defs = createSvgElement('defs');
    const clip = createSvgElement('clipPath', { id: `${uniqueId}-clip` });
    clip.appendChild(createSvgElement('path', { d: heartPath }));
    const baseGradient = createSvgElement('linearGradient', { id: `${uniqueId}-base`, x1: '0', y1: '0', x2: '1', y2: '1' });
    baseGradient.append(
      createSvgElement('stop', { offset: '0', 'stop-color': '#ffb3c2' }),
      createSvgElement('stop', { offset: '.34', 'stop-color': '#e52d55' }),
      createSvgElement('stop', { offset: '.72', 'stop-color': '#8b082d' }),
      createSvgElement('stop', { offset: '1', 'stop-color': '#ff6b85' })
    );
    const shineGradient = createSvgElement('linearGradient', { id: `${uniqueId}-shine`, x1: '0', y1: '0', x2: '0.85', y2: '1' });
    shineGradient.append(
      createSvgElement('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '.65' }),
      createSvgElement('stop', { offset: '.42', 'stop-color': '#fff', 'stop-opacity': '.08' }),
      createSvgElement('stop', { offset: '1', 'stop-color': '#ffc1d0', 'stop-opacity': '.18' })
    );
    defs.append(clip, baseGradient, shineGradient);
    svg.appendChild(defs);
    svg.appendChild(createSvgElement('path', { d: heartPath, fill: `url(#${uniqueId}-base)` }));
    svg.appendChild(createSvgElement('image', {
      href: imageUrl,
      x: '0', y: '0', width: '100', height: '92',
      preserveAspectRatio: 'xMidYMid slice',
      'clip-path': `url(#${uniqueId}-clip)`,
      opacity: '.5'
    }));
    svg.appendChild(createSvgElement('path', { d: heartPath, fill: `url(#${uniqueId}-shine)`, stroke: 'rgba(255,232,240,.85)', 'stroke-width': '1.7' }));
    svg.appendChild(createSvgElement('path', { d: 'M20 26 C25 12 39 8 47 21', fill: 'none', stroke: 'rgba(255,255,255,.88)', 'stroke-width': '3.2', 'stroke-linecap': 'round' }));
    svg.appendChild(createSvgElement('path', { d: 'M16 38 C18 31 22 28 27 25', fill: 'none', stroke: 'rgba(255,255,255,.36)', 'stroke-width': '1.6', 'stroke-linecap': 'round' }));
    target.appendChild(svg);
  });
}

function addGatheringStars(target) {
  if (!target) return;
  target.querySelectorAll('.gathering-star').forEach((node) => node.remove());
  for (let index = 0; index < 34; index += 1) {
    const star = document.createElement('span');
    star.className = `gathering-star${index % 6 === 0 ? ' is-cross' : ''}`;
    star.style.setProperty('--star-left', `${5 + Math.random() * 90}%`);
    star.style.setProperty('--star-top', `${7 + Math.random() * 86}%`);
    star.style.setProperty('--star-size', `${2 + Math.random() * (index % 6 === 0 ? 4.5 : 2.5)}px`);
    star.style.setProperty('--star-delay', `${-Math.random() * 3.5}s`);
    star.style.setProperty('--star-duration', `${1.5 + Math.random() * 2.4}s`);
    target.appendChild(star);
  }
}

function setMemoryEffect(memoryId, imageUrl) {
  setEffectClasses(memoryView, memoryId);
  setEffectClasses(photoModalCard, memoryId);
  const memoryLayer = $('#memory-effect-layer');
  if (memoryLayer) memoryLayer.innerHTML = '';
  if (cinemaEffectLayer) cinemaEffectLayer.innerHTML = '';
  if (memoryId === 15) {
    addFloatingPhotoHearts(imageUrl, memoryLayer);
    if (cinemaMode) addFloatingPhotoHearts(imageUrl, cinemaEffectLayer);
  }
  if (memoryId === 30) {
    addGatheringStars(memoryLayer);
    if (cinemaMode) addGatheringStars(cinemaEffectLayer);
  }
}

function resetFlipCardState(card) {
  if (!card) return;
  card.classList.remove('is-flipped');
  if (card === memoryFlipCard) memoryView?.classList.remove('memory-flipped');
  if (card === modalFlipCard) photoModalCard?.classList.remove('modal-flip-active');
  const inner = card.querySelector('.memory-flip-inner');
  if (inner) {
    gsap.killTweensOf(inner);
    gsap.set(inner, { rotateY: 0, clearProps: 'transform' });
  }
}

function fillFlipCard(card, image, title, message, english) {
  if (!card) return;
  resetFlipCardState(card);
  const img = card.querySelector('img');
  if (img) {
    img.src = image;
    img.alt = title;
  }
  const root = card.id === 'memory-flip-card' ? memoryFlipCard : modalFlipCard;
  if (root === memoryFlipCard) {
    if (memoryFlipTitle) memoryFlipTitle.textContent = title;
    if (memoryFlipMessage) memoryFlipMessage.textContent = message;
    if (memoryFlipEnglish) memoryFlipEnglish.textContent = english;
  } else {
    if (modalFlipTitle) modalFlipTitle.textContent = title;
    if (modalFlipMessage) modalFlipMessage.textContent = message;
    if (modalFlipEnglish) modalFlipEnglish.textContent = english;
  }
}

function toggleFlipCard(card) {
  if (!card || card.classList.contains('is-hidden')) return;
  const inner = card.querySelector('.memory-flip-inner');
  const flipped = !card.classList.contains('is-flipped');
  card.classList.toggle('is-flipped', flipped);
  if (card === memoryFlipCard) memoryView?.classList.toggle('memory-flipped', flipped);
  if (card === modalFlipCard) photoModalCard?.classList.toggle('modal-flip-active', flipped);
  if (inner) gsap.to(inner, { rotateY: flipped ? 180 : 0, duration: 0.95, ease: 'power2.inOut', overwrite: true });
}

function updateCinemaMemory(memory) {
  moveSpecialOverlaysForCinema(Boolean(cinemaMode && memory && [TULIP_MEMORY_ID, SCRATCH_MEMORY_ID].includes(memory.id)));
  if (!cinemaMode || !memory) return;
  crossfadeImage(modalImage, memory.image);
  modalImage.alt = `Recuerdo ${memory.id}: ${memory.title}`;
  resetFlipCardState(modalFlipCard);
  const showFlip = Boolean(memory.flip || FLIP_MEMORY_IDS.has(memory.id));
  setVisible(modalFlipCard, showFlip);
  modalImage.classList.toggle('is-under-flip', showFlip);
  if (showFlip) fillFlipCard(modalFlipCard, memory.image, memory.title, memory.message, memory.english);
  transitionText(modalKicker, `MEMORY ${String(memory.id).padStart(2, '0')} · ${memory.kicker}`);
  transitionText(modalTitle, memory.title);
  transitionText(modalMessage, memory.message);
  transitionText(modalEnglish, memory.english);
  setEffectClasses(photoModalCard, memory.id);
  if (cinemaEffectLayer) cinemaEffectLayer.innerHTML = '';
  if (memory.id === 15) addFloatingPhotoHearts(memory.image, cinemaEffectLayer);
  if (memory.id === 30) addGatheringStars(cinemaEffectLayer);
}

function showMemory(memory) {
  clearSpecialTimers();
  setVisible(memoryView, true);
  setVisible(tulipView, false);
  setVisible(scratchView, false);
  setMemoryEffect(memory.id, memory.image);
  resetFlipCardState(memoryFlipCard);
  const showFlip = Boolean(memory.flip || FLIP_MEMORY_IDS.has(memory.id));
  setVisible(memoryFlipCard, showFlip);
  imageElement.classList.toggle('is-under-flip', showFlip);
  if (showFlip) fillFlipCard(memoryFlipCard, memory.image, memory.title, memory.message, memory.english);

  crossfadeImage(imageElement, memory.image);
  imageElement.classList.remove('photo-enter');
  backdropElement.classList.remove('photo-enter');
  imageElement.loading = 'eager';
  imageElement.decoding = 'async';
  backdropElement.src = memory.image;
  imageElement.alt = `Recuerdo ${memory.id}: ${memory.title}`;
  photoIndex.textContent = `MEMORY ${String(memory.id).padStart(2, '0')}`;
  transitionText(memoryKicker, memory.kicker);
  transitionText(memoryTitle, memory.title);
  transitionText(memoryMessage, memory.message);
  transitionText(memoryEnglish, memory.english);
  requestAnimationFrame(() => {
    imageElement.classList.add('photo-enter');
    backdropElement.classList.add('photo-enter');
  });
  sceneCounter.innerHTML = `${String(memory.id).padStart(2, '0')} <i>/ ${PHOTO_COUNT}</i>`;
  progressLabel.textContent = memory.kicker;
  preloadNearbyImages(memory.id);
  updateCinemaMemory(memory);

  if (memory.id === TULIP_MEMORY_ID) beginTulipMemory();
  if (memory.id === SCRATCH_MEMORY_ID) beginScratchMemory(memory);
}

function beginTulipMemory() {
  setVisible(tulipView, true);
  tulipButton.classList.remove('bloomed', 'is-blooming');
  if (tulipPetalBurst) tulipPetalBurst.innerHTML = '';
  tulipTimer = window.setTimeout(revealTulip, 2850);
}

function createTulipPetals() {
  if (!tulipPetalBurst) return;
  tulipPetalBurst.innerHTML = '';
  for (let index = 0; index < 17; index += 1) {
    const petal = document.createElement('span');
    petal.className = 'bloom-petal';
    const angle = (index * (360 / 17) + Math.random() * 12) * Math.PI / 180;
    const distance = 72 + Math.random() * 125;
    petal.style.setProperty('--petal-x', `${Math.cos(angle) * distance}px`);
    petal.style.setProperty('--petal-y', `${Math.sin(angle) * distance}px`);
    petal.style.setProperty('--petal-delay', `${Math.random() * 180}ms`);
    petal.style.setProperty('--petal-scale', `${0.65 + Math.random() * 0.65}`);
    tulipPetalBurst.appendChild(petal);
  }
}

function revealTulip() {
  if (activeScene?.type !== 'memory' || activeScene.memory.id !== TULIP_MEMORY_ID || tulipBloomStarted) return;
  tulipBloomStarted = true;
  window.clearTimeout(tulipTimer);
  tulipButton.classList.add('bloomed', 'is-blooming');
  createTulipPetals();
  tulipView.classList.add('is-blooming');
  tulipRevealTimer = window.setTimeout(() => {
    if (activeScene?.memory?.id !== TULIP_MEMORY_ID) return;
    setVisible(tulipView, false);
    memoryView.classList.add('effect-tulip-reveal');
  }, 1850);
}

function beginScratchMemory(memory) {
  setVisible(scratchView, true);
  scratchImage.src = memory.image;
  scratchImage.alt = `Recuerdo ${memory.id} esperando ser revelado`;
  scratchPasses = 0;
  scratchPointerDown = false;
  lastScratchPoint = null;
  scratchStrokeDistance = 0;
  scratchRevealStarted = false;
  scratchView.classList.remove('is-revealing');
  drawScratchSurface();
  updateScratchProgress();
  // Respaldo automático: si no se utiliza la raspadita, el recuerdo se revela para no detener la historia.
  scratchTimer = window.setTimeout(revealScratch, 4400);
}

function createWishSparks() {
  const field = $('#wish-particle-field');
  if (!field) return gsap.timeline();
  field.innerHTML = '';

  const heartCount = 64;
  const ambientCount = 66;
  const points = [];
  // Use one pixel scale for both axes so the constellation keeps an upright,
  // natural heart shape in portrait and landscape screens (not a flattened heart).
  const heartScale = Math.min(window.innerWidth, window.innerHeight) * 0.022;
  for (let index = 0; index < heartCount; index += 1) {
    const t = (index / heartCount) * Math.PI * 2;
    const heartX = 16 * Math.pow(Math.sin(t), 3);
    const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    points.push({
      x: 50 + ((heartX * heartScale) / window.innerWidth) * 100,
      y: 47 + ((heartY * heartScale) / window.innerHeight) * 100,
      heart: true,
      cross: index % 7 === 0
    });
  }
  for (let index = 0; index < ambientCount; index += 1) {
    points.push({ x: 7 + Math.random() * 86, y: 7 + Math.random() * 84, heart: false, cross: index % 13 === 0 });
  }

  const starsTimeline = gsap.timeline({
    onComplete: () => {
      setVisible(wishAfter, true);
      gsap.fromTo(wishAfter, { autoAlpha: 0, y: 20, scale: 0.97 }, {
        autoAlpha: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out',
        onComplete: () => {
          // Keep the formed constellation visible. Combined with the lantern
          // flight, star formation and text reveal, this makes the full wish scene
          // last about 12 seconds after she releases the lantern.
          window.clearTimeout(wishFinishTimer);
          wishFinishTimer = window.setTimeout(() => {
            wishSequenceComplete = true;
            const soundtrackHasEnded = wishAudioFinished || audio.ended || audio.currentTime >= getDuration() - 0.08;
            const storyIsRunningWithoutMusic = audio.paused;
            if (soundtrackHasEnded || storyIsRunningWithoutMusic) {
              wishAudioFinished = true;
              completeExperienceAfterWish();
            }
          }, 3700);
        }
      });
    }
  });

  points.forEach((point, index) => {
    const spark = document.createElement('span');
    spark.className = `wish-spark${point.heart ? ' is-constellation' : ' is-ambient'}${point.cross ? ' is-cross' : ''}`;
    spark.style.left = '50%';
    spark.style.top = '54%';
    field.appendChild(spark);
    const dx = ((point.x - 50) / 100) * window.innerWidth;
    const dy = ((point.y - 54) / 100) * window.innerHeight;
    const duration = 2.35 + Math.random() * 0.8;
    const tween = gsap.fromTo(spark,
      { x: 0, y: 0, scale: 0.12, autoAlpha: 0 },
      {
        x: dx, y: dy, scale: point.heart ? 0.9 + Math.random() * 1.1 : 0.55 + Math.random() * 1.1,
        autoAlpha: point.heart ? 0.98 : 0.65 + Math.random() * 0.3,
        duration, ease: 'power3.out',
        onComplete: () => {
          gsap.to(spark, {
            autoAlpha: point.heart ? 0.42 : 0.18,
            scale: point.heart ? 0.7 : 0.45,
            duration: 1.1 + Math.random() * 1.2,
            repeat: -1, yoyo: true, ease: 'sine.inOut', delay: Math.random() * 0.7
          });
        }
      }
    );
    starsTimeline.add(tween, index < heartCount ? (index % 8) * 0.055 : 0.25 + (index % 11) * 0.035);
  });
  return starsTimeline;
}

function completeExperienceAfterWish() {
  if (experienceFinished || !wishSequenceComplete || !wishAudioFinished) return;
  window.clearTimeout(wishFinishTimer);
  wishFinishTimer = 0;
  const wishField = $('#wish-particle-field');
  wishField?.querySelectorAll('.wish-spark').forEach((spark) => gsap.killTweensOf(spark));
  if (wishField) wishField.innerHTML = '';
  moveSpecialOverlaysForCinema(false);
  experienceFinished = true;
  audio.pause();
  showFinale();
  finalScreen.classList.add('is-finished');
  $('#finished-label').textContent = 'THE MUSIC HAS ENDED. OUR STORY NEVER DOES.';
  setVisible(openGardenButton, true);
  gsap.fromTo(openGardenButton, { autoAlpha: 0, scale: 0.45, y: 16 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.8)' });
  updateAudioButtons();
}

function launchWish() {
  if (wishStarted || activeScene?.type !== 'wish') return;
  wishStarted = true;
  window.clearTimeout(wishAutoTimer);
  if (wishLantern) wishLantern.disabled = true;
  wishLantern?.classList.add('is-released');
  setVisible(wishAfter, false);
  wishScreen.classList.add('wish-is-releasing');

  const release = gsap.timeline({
    onComplete: () => {
      wishScreen.classList.add('wish-stars-visible');
      createWishSparks();
    }
  });
  release.to(wishLantern, { y: -Math.max(320, window.innerHeight * 0.78), scale: 0.18, rotation: 9, autoAlpha: 0, duration: 3.45, ease: 'power2.inOut' }, 0);
  release.to($('.lantern-halo'), { scale: 3.2, opacity: 0, duration: 2.1, ease: 'power2.out' }, 0);
  release.to(wishTitle, { y: -18, opacity: 0.1, duration: 1.15, ease: 'power2.out' }, 0.35);
  release.to(wishCopy, { opacity: 0, y: -12, duration: 0.9, ease: 'power2.out' }, 0.35);
}

function showWish() {
  clearSpecialTimers();
  window.clearTimeout(cinemaControlsTimer);
  window.clearTimeout(wishAutoTimer);
  window.clearTimeout(wishFinishTimer);
  wishFinishTimer = 0;
  cinemaMode = false;
  moveSpecialOverlaysForCinema(false);
  setVisible(photoModal, false);
  cinemaControls?.classList.remove('is-visible');
  wishStarted = false;
  wishAudioFinished = false;
  wishSequenceComplete = false;
  setVisible(introScreen, false);
  setVisible(storyScreen, false);
  setVisible(finalScreen, false);
  setVisible(wishScreen, true);
  setVisible(gardenScreen, false);
  setVisible(musicControl, true);
  setVisible(photoModal, false);
  wishScreen.classList.remove('is-music-ended', 'wish-is-releasing', 'wish-stars-visible');
  if (wishLantern) {
    gsap.killTweensOf(wishLantern);
    gsap.set(wishLantern, { clearProps: 'all' });
    wishLantern.classList.remove('is-released');
    wishLantern.disabled = false;
  }
  if (wishTitle) gsap.set(wishTitle, { clearProps: 'all' });
  if (wishCopy) {
    gsap.set(wishCopy, { clearProps: 'all' });
    wishCopy.textContent = 'Si pudiera pedir un deseo, sería seguir creando recuerdos contigo.';
  }
  if (wishAfter) {
    setVisible(wishAfter, false);
    gsap.set(wishAfter, { clearProps: 'all' });
  }
  const touchLabel = wishLantern?.querySelector('.wish-touch-label');
  if (touchLabel) touchLabel.innerHTML = 'TOUCH TO RELEASE <b>✧</b>';
  const field = $('#wish-particle-field');
  field?.querySelectorAll('.wish-spark').forEach((spark) => gsap.killTweensOf(spark));
  if (field) field.innerHTML = '';
}

function showFinale() {
  clearSpecialTimers();
  window.clearTimeout(wishAutoTimer);
  window.clearTimeout(cinemaControlsTimer);
  cinemaMode = false;
  cinemaControls?.classList.remove('is-visible');
  moveSpecialOverlaysForCinema(false);
  setVisible(introScreen, false);
  setVisible(storyScreen, false);
  setVisible(wishScreen, false);
  setVisible(gardenScreen, false);
  setVisible(finalScreen, true);
  setVisible(openGardenButton, false);
  setVisible(musicControl, true);
  setVisible(photoModal, false);
  cinemaMode = false;
  sceneCounter.innerHTML = `♡ <i>/ ${PHOTO_COUNT}</i>`;
  resizeStarfield();
  if (!animationFrame) animateStarfield();
}

function renderScene(scene) {
  if (!scene || activeScene?.id === scene.id) return;
  activeScene = scene;

  if (scene.type === 'intro') {
    clearSpecialTimers();
    setVisible(introScreen, true);
    setVisible(storyScreen, false);
    setVisible(finalScreen, false);
    setVisible(musicControl, false);
  } else if (scene.type === 'memory') {
    setVisible(introScreen, false);
    setVisible(storyScreen, true);
    setVisible(finalScreen, false);
    setVisible(musicControl, true);
    showMemory(scene.memory);
  } else if (scene.type === 'wish') {
    showWish();
  } else if (scene.type === 'finale') {
    showFinale();
  }
  updateNavigationState();
}

function updateNavigationState() {
  if (!activeScene) return;
  const index = timeline.findIndex((scene) => scene.id === activeScene.id);
  previousButton.disabled = index <= 1;
  nextButton.disabled = index >= timeline.length - 1;
  nextButton.querySelector('i').textContent = 'CONTINUE';
}

function updateProgress() {
  const duration = getDuration();
  const current = Math.min(audio.currentTime || 0, duration);
  const ratio = duration > 0 ? current / duration : 0;
  progressFill.style.width = `${ratio * 100}%`;
  timeLabel.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  const scene = getSceneAt(current);
  renderScene(scene);
  if (current >= duration - 0.08 && experienceStarted && !experienceFinished) finishExperience();
}

function enterEnvelope() {
  if (!universeScreen || universeScreen.classList.contains('is-hidden')) return;
  universeEnterButton.disabled = true;
  gsap.timeline({ defaults: { ease: 'power2.inOut' } })
    .to(universeScreen, { autoAlpha: 0, scale: 1.06, duration: 0.85 })
    .add(() => {
      setVisible(universeScreen, false);
      setVisible(introScreen, true);
      gsap.set(universeScreen, { clearProps: 'all' });
      universeEnterButton.disabled = false;
      gsap.fromTo($('.intro-content'), { autoAlpha: 0, y: 24, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.0, ease: 'power3.out' });
      universeInstruction.textContent = 'A little journey is waiting inside';
    });
}

async function startExperience() {
  if (experienceStarted) return;
  experienceStarted = true;
  experienceFinished = false;
  introScreen.classList.add('started');
  timeline = buildTimeline(getDuration());
  audio.currentTime = 0;
  audio.volume = Number(volumeControl.value);
  beginButton.disabled = true;
  beginButton.innerHTML = '<span>Our story is beginning…</span><span class="button-arrow">♡</span>';
  try {
    await audio.play();
  } catch (error) {
    console.warn('Audio playback could not start:', error);
    experienceStarted = false;
    beginButton.disabled = false;
    beginButton.innerHTML = '<span>Tap to begin with music</span><span class="button-arrow">♡</span>';
    return;
  }
  setVisible(musicControl, true);
  updateAudioButtons();
  updateProgress();
}

function showCinemaControls(stayVisible = false) {
  if (!cinemaMode || !cinemaControls) return;
  cinemaControls.classList.add('is-visible');
  window.clearTimeout(cinemaControlsTimer);
  if (!stayVisible && !audio.paused) {
    cinemaControlsTimer = window.setTimeout(() => cinemaControls.classList.remove('is-visible'), 2100);
  }
}

function skipCinema(seconds) {
  if (!cinemaMode || !experienceStarted) return;
  audio.currentTime = Math.max(0, Math.min(getDuration() - 0.02, audio.currentTime + seconds));
  showCinemaControls(audio.paused);
  updateProgress();
}

function updateAudioButtons() {
  const paused = audio.paused;
  pauseButton.classList.toggle('is-paused', paused);
  pauseButton.setAttribute('aria-label', paused ? 'Reanudar música' : 'Pausar música');
  pauseButton.title = paused ? 'Reanudar música' : 'Pausar música';
  musicIconButton.setAttribute('aria-label', paused ? 'Reanudar música' : 'Pausar música');
  musicIconButton.classList.toggle('is-paused', paused);
  if (cinemaPlayIcon) cinemaPlayIcon.textContent = paused ? '▶' : 'Ⅱ';
  if (cinemaPlayButton) cinemaPlayButton.setAttribute('aria-label', paused ? 'Reanudar historia' : 'Pausar historia');
  const musicHasEnded = wishAudioFinished && activeScene?.type === 'wish';
  if (musicIconButton) musicIconButton.disabled = musicHasEnded;
  if (pauseButton) pauseButton.disabled = musicHasEnded;
  if (paused && cinemaMode) showCinemaControls(true);
}

function toggleAudio() {
  if (!experienceStarted || experienceFinished) return;
  if (wishAudioFinished && activeScene?.type === 'wish') return;
  if (audio.paused) {
    audio.play().then(updateAudioButtons).catch((error) => console.warn('No se pudo reanudar el audio:', error));
  } else {
    audio.pause();
  }
}

function moveToAdjacentScene(direction) {
  if (!activeScene || !timeline.length) return;
  const currentIndex = timeline.findIndex((scene) => scene.id === activeScene.id);
  const nextIndex = Math.min(timeline.length - 1, Math.max(0, currentIndex + direction));
  if (nextIndex === currentIndex) return;
  const wasPaused = audio.paused;
  audio.currentTime = Math.min(getDuration() - 0.02, timeline[nextIndex].start + 0.03);
  updateProgress();
  if (!wasPaused && !experienceFinished) audio.play().catch(() => {});
}

function finishExperience() {
  if (experienceFinished) return;
  wishAudioFinished = true;
  audio.pause();

  // The soundtrack ends on the wish screen. Never skip the lantern/star moment:
  // she can take her time, release the lantern, watch the constellation form,
  // and only then reveal the final letter.
  if (activeScene?.type === 'wish' && !wishSequenceComplete) {
    wishScreen.classList.add('is-music-ended');
    wishCopy.textContent = 'La música llega a su última nota. Tómate todo el tiempo que necesites para pedir tu deseo.';
    const touchLabel = wishLantern?.querySelector('.wish-touch-label');
    if (touchLabel && !wishStarted) touchLabel.innerHTML = 'WHEN YOU ARE READY <b>✧</b>';
    updateAudioButtons();
    return;
  }

  if (activeScene?.type === 'wish' && wishSequenceComplete) {
    completeExperienceAfterWish();
    return;
  }

  // Defensive fallback for a manual seek to the very end.
  wishSequenceComplete = true;
  completeExperienceAfterWish();
}

function replayExperience() {
  moveSpecialOverlaysForCinema(false);
  window.clearTimeout(wishAutoTimer);
  window.clearTimeout(cinemaControlsTimer);
  experienceStarted = false;
  experienceFinished = false;
  cinemaMode = false;
  wishStarted = false;
  wishAudioFinished = false;
  wishSequenceComplete = false;
  window.clearTimeout(wishFinishTimer);
  wishFinishTimer = 0;
  clearSpecialTimers();
  activeScene = null;
  audio.pause();
  audio.currentTime = 0;
  finalScreen.classList.remove('is-finished');
  beginButton.disabled = false;
  beginButton.innerHTML = '<span>Open our story</span><span class="button-arrow">↗</span>';
  timeline = buildTimeline(getDuration());
  setVisible(finalScreen, false);
  setVisible(openGardenButton, false);
  setVisible(wishScreen, false);
  setVisible(gardenScreen, false);
  setVisible(storyScreen, false);
  setVisible(introScreen, false);
  setVisible(universeScreen, true);
  setVisible(musicControl, false);
  universeEnterButton.disabled = false;
  universeHeartReady = false;
  gsap.set(universeScreen, { clearProps: 'all' });
  initUniverse();
  setVisible(photoModal, false);
  setVisible(tulipView, false);
  setVisible(scratchView, false);
  progressFill.style.width = '0%';
  timeLabel.textContent = `00:00 / ${formatTime(getDuration())}`;
  updateAudioButtons();
}

function openPhotoModal() {
  const selected = activeScene?.type === 'memory' ? activeScene.memory : null;
  if (!selected) return;
  cinemaMode = true;
  setVisible(photoModal, true);
  updateCinemaMemory(selected);
  showCinemaControls();
  closeModalButton.focus({ preventScroll: true });
}

function closePhotoModal() {
  if (photoModal.classList.contains('is-hidden')) return;
  setVisible(photoModal, false);
  cinemaMode = false;
  window.clearTimeout(cinemaControlsTimer);
  cinemaControls?.classList.remove('is-visible');
  moveSpecialOverlaysForCinema(false);
  cinemaEffectLayer.innerHTML = '';
  expandPhotoButton.focus({ preventScroll: true });
}

// ---------- Scratch-to-reveal: three deliberate strokes, without pausing the song. ----------
function drawScratchSurface() {
  const rect = scratchCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  scratchCanvas.width = width;
  scratchCanvas.height = height;
  scratchCanvasWidth = width;
  scratchCanvasHeight = height;
  scratchContext = scratchCanvas.getContext('2d', { willReadFrequently: true });
  scratchContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rect.width;
  const h = rect.height;
  const gradient = scratchContext.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#f2eaf5');
  gradient.addColorStop(.18, '#b8a5c6');
  gradient.addColorStop(.36, '#e7dce9');
  gradient.addColorStop(.56, '#8f7c9f');
  gradient.addColorStop(.78, '#d9c9df');
  gradient.addColorStop(1, '#766487');
  scratchContext.fillStyle = gradient;
  scratchContext.fillRect(0, 0, w, h);
  scratchContext.save();
  scratchContext.globalAlpha = .34;
  scratchContext.strokeStyle = '#fff';
  scratchContext.lineWidth = 1;
  for (let y = 10; y < h; y += 13) {
    scratchContext.beginPath();
    scratchContext.moveTo(0, y);
    scratchContext.lineTo(w, y + 7);
    scratchContext.stroke();
  }
  scratchContext.restore();
  for (let index = 0; index < 220; index += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const radius = Math.random() * 1.4 + .25;
    scratchContext.beginPath();
    scratchContext.arc(x, y, radius, 0, Math.PI * 2);
    scratchContext.fillStyle = `rgba(255,255,255,${Math.random() * .5 + .18})`;
    scratchContext.fill();
  }
  scratchCanvas.classList.remove('scratch-cleared');
}

function scratchPoint(event) {
  const rect = scratchCanvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function updateScratchProgress() {
  const completed = Math.min(100, Math.round((scratchPasses / SCRATCH_PASSES_REQUIRED) * 100));
  $('#scratch-progress-fill').style.width = `${completed}%`;
  $('#scratch-progress-label').textContent = scratchPasses >= SCRATCH_PASSES_REQUIRED
    ? 'A memory uncovered ♡'
    : `Scratch ${scratchPasses + 1} of ${SCRATCH_PASSES_REQUIRED} · ${completed}%`;
}

function scratchAt(x, y) {
  if (!scratchContext || scratchRevealStarted) return;
  scratchContext.save();
  scratchContext.globalCompositeOperation = 'destination-out';
  scratchContext.lineWidth = 52;
  scratchContext.lineCap = 'round';
  scratchContext.lineJoin = 'round';
  if (lastScratchPoint) {
    scratchContext.beginPath();
    scratchContext.moveTo(lastScratchPoint.x, lastScratchPoint.y);
    scratchContext.lineTo(x, y);
    scratchContext.stroke();
    scratchStrokeDistance += Math.hypot(x - lastScratchPoint.x, y - lastScratchPoint.y);
  }
  scratchContext.beginPath();
  scratchContext.arc(x, y, 26, 0, Math.PI * 2);
  scratchContext.fill();
  scratchContext.restore();
  lastScratchPoint = { x, y };
}

function onScratchStart(event) {
  if (activeScene?.type !== 'memory' || activeScene.memory.id !== SCRATCH_MEMORY_ID || scratchRevealStarted) return;
  scratchPointerDown = true;
  scratchStrokeDistance = 0;
  lastScratchPoint = scratchPoint(event);
  scratchCanvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  scratchAt(lastScratchPoint.x, lastScratchPoint.y);
}

function onScratchMove(event) {
  if (!scratchPointerDown || scratchRevealStarted) return;
  const point = scratchPoint(event);
  scratchAt(point.x, point.y);
  event.preventDefault();
}

function onScratchEnd() {
  if (!scratchPointerDown) return;
  scratchPointerDown = false;
  lastScratchPoint = null;
  if (scratchStrokeDistance > 90) {
    scratchPasses += 1;
    updateScratchProgress();
    if (scratchPasses >= SCRATCH_PASSES_REQUIRED) revealScratch();
  }
  scratchStrokeDistance = 0;
}

function revealScratch() {
  if (scratchRevealStarted || activeScene?.memory?.id !== SCRATCH_MEMORY_ID) return;
  scratchRevealStarted = true;
  window.clearTimeout(scratchTimer);
  scratchPointerDown = false;
  scratchCanvas.classList.add('scratch-cleared');
  scratchView.classList.add('is-revealing');
  updateScratchProgress();
  scratchRevealTimer = window.setTimeout(() => {
    if (activeScene?.memory?.id !== SCRATCH_MEMORY_ID) return;
    setVisible(scratchView, false);
    memoryView.classList.add('effect-scratch-reveal');
  }, 700);
}

// ---------- Soft falling petals for the invitation and the tulip bloom. ----------
function createPetals() {
  const container = $('#petals');
  for (let index = 0; index < 17; index += 1) {
    const petal = document.createElement('span');
    petal.className = 'petal-fall';
    petal.style.setProperty('--left', `${Math.random() * 100}%`);
    petal.style.setProperty('--delay', `${Math.random() * -22}s`);
    petal.style.setProperty('--duration', `${17 + Math.random() * 15}s`);
    petal.style.setProperty('--drift', `${-55 + Math.random() * 110}px`);
    petal.style.setProperty('--scale', `${0.55 + Math.random() * 0.8}`);
    container.appendChild(petal);
  }
}

// ---------- Final starfield and heart constellation. ----------
function heartPoint(t, scale, centerX, centerY) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x: centerX + x * scale, y: centerY - y * scale };
}

function initStarfield() {
  stars = Array.from({ length: 185 }, () => ({
    x: Math.random(), y: Math.random(), r: Math.random() * 1.15 + 0.2,
    phase: Math.random() * Math.PI * 2, speed: 0.4 + Math.random() * 1.3,
    alpha: 0.18 + Math.random() * 0.56
  }));
  heartStars = Array.from({ length: 64 }, (_, index) => {
    const t = (index / 64) * Math.PI * 2;
    const wobble = 0.94 + Math.random() * 0.12;
    return { t, wobble, phase: Math.random() * Math.PI * 2, speed: 0.65 + Math.random() * 0.9, r: Math.random() * 1.0 + 0.45 };
  });
}

function resizeStarfield() {
  const canvas = $('#star-canvas');
  const rect = finalScreen.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  starCanvasWidth = rect.width;
  starCanvasHeight = rect.height;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  starCanvasContext = canvas.getContext('2d');
  starCanvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function animateStarfield(now = 0) {
  const ctx = starCanvasContext;
  if (!ctx || finalScreen.classList.contains('is-hidden')) {
    animationFrame = 0;
    return;
  }
  ctx.clearRect(0, 0, starCanvasWidth, starCanvasHeight);
  const centerX = starCanvasWidth * 0.5;
  const centerY = starCanvasHeight * 0.13;
  const heartScale = Math.min(starCanvasWidth, starCanvasHeight) * 0.0065;
  stars.forEach((star) => {
    const twinkle = 0.34 + (Math.sin(now * 0.001 * star.speed + star.phase) + 1) * 0.30;
    ctx.beginPath();
    ctx.arc(star.x * starCanvasWidth, star.y * starCanvasHeight, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(226,218,255,${star.alpha * twinkle})`;
    ctx.fill();
  });
  const pulse = 0.91 + Math.sin(now * 0.0011) * 0.08;
  heartStars.forEach((star) => {
    const point = heartPoint(star.t, heartScale * star.wobble, centerX, centerY);
    const twinkle = 0.54 + (Math.sin(now * 0.001 * star.speed + star.phase) + 1) * 0.22;
    ctx.save();
    ctx.shadowBlur = 4 + twinkle * 4;
    ctx.shadowColor = 'rgba(207,166,255,.58)';
    ctx.beginPath();
    ctx.arc(point.x, point.y, star.r * pulse, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(239,220,255,${0.30 + twinkle * 0.28})`;
    ctx.fill();
    ctx.restore();
  });
  for (let index = 0; index < 12; index += 1) {
    const t = (index / 12) * Math.PI * 2 + now * 0.00004;
    const point = heartPoint(t, heartScale * 0.43, centerX, centerY);
    const glow = 0.16 + (Math.sin(now * 0.0014 + index) + 1) * 0.10;
    ctx.save();
    ctx.shadowBlur = 7;
    ctx.shadowColor = 'rgba(193,139,255,.55)';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 0.7 + glow, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(230,197,255,${0.22 + glow})`;
    ctx.fill();
    ctx.restore();
  }
  animationFrame = requestAnimationFrame(animateStarfield);
}

// ---------- Interactive universe gate: particles react to mouse and touch, then gather as a heart. ----------
function createUniverseParticles() {
  universeParticles = Array.from({ length: 620 }, (_, index) => {
    const t = Math.random() * Math.PI * 2;
    const fill = Math.sqrt(Math.random());
    const scale = 0.86 + Math.random() * 0.14;
    return {
      x: Math.random(), y: Math.random(),
      tx: 16 * Math.pow(Math.sin(t), 3) * fill * scale,
      ty: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * fill * scale,
      size: 0.7 + Math.random() * (index % 15 === 0 ? 2.9 : 1.5),
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.6,
      alpha: 0.38 + Math.random() * 0.62
    };
  });
}

function resizeUniverse() {
  if (!universeCanvas) return;
  const rect = universeCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  universeWidth = rect.width;
  universeHeight = rect.height;
  universeCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  universeCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  universeCtx = universeCanvas.getContext('2d', { alpha: true });
  universeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getUniverseHeartLayout() {
  // Treat compact tablets in landscape as a compact layout too; the previous
  // 500px height cutoff missed common tablet/browser preview sizes.
  const compactLandscape = universeWidth > universeHeight
    && universeWidth <= 1200
    && universeHeight <= 720;
  const compactPortrait = universeWidth <= 760 && universeHeight >= universeWidth;

  const heartScale = compactLandscape
    ? Math.min(universeWidth * 0.01, universeHeight * 0.0095, 3.4)
    : compactPortrait
      ? Math.min(universeWidth * 0.014, universeHeight * 0.0076, 5.2)
      : Math.min(universeWidth * 0.019, universeHeight * 0.012, 9.5);

  // Keep the particle heart well below the heading and subtitle.
  const centerY = compactLandscape
    ? universeHeight * 0.515
    : compactPortrait
      ? universeHeight * 0.515
      : universeHeight * 0.59;

  return {
    heartScale,
    centerX: universeWidth * 0.5,
    centerY,
    compactLandscape,
    compactPortrait
  };
}

function animateUniverse(now = 0) {
  if (!universeCtx || universeScreen.classList.contains('is-hidden')) { universeFrame = 0; return; }
  if (!universeStartTime) universeStartTime = now;
  const elapsed = now - universeStartTime;
  const ctx = universeCtx;
  ctx.clearRect(0, 0, universeWidth, universeHeight);
  const rawFormation = Math.max(0, Math.min(1, (elapsed - 650) / 5700));
  const formation = rawFormation * rawFormation * (3 - 2 * rawFormation);
  const { heartScale, centerX, centerY } = getUniverseHeartLayout();
  const heartbeat = 1 + Math.sin(now * 0.00165) * 0.018 * formation;
  universeParticles.forEach((particle) => {
    const gentleX = Math.sin(now * 0.00062 * particle.speed + particle.phase) * (2.2 * formation);
    const gentleY = Math.cos(now * 0.00074 * particle.speed + particle.phase * 1.3) * (2.8 * formation);
    const targetX = centerX + particle.tx * heartScale * heartbeat + gentleX;
    const targetY = centerY + particle.ty * heartScale * heartbeat + gentleY;
    let x = particle.x * universeWidth;
    let y = particle.y * universeHeight;
    const pointerAge = now - universePointer.time;
    if (universePointer.active && pointerAge < 850) {
      const dx = x - universePointer.x;
      const dy = y - universePointer.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      if (distance < 115) {
        const force = (1 - distance / 115) * 2.6;
        x += (dx / distance) * force;
        y += (dy / distance) * force;
      }
    }
    const scatter = Math.sin(now * 0.0007 * particle.speed + particle.phase) * (1 - formation) * 13;
    const easing = 0.006 + formation * 0.082;
    x += (targetX + scatter - x) * easing;
    y += (targetY + scatter * 0.45 - y) * easing;
    particle.x = x / universeWidth;
    particle.y = y / universeHeight;
    const twinkle = 0.52 + (Math.sin(now * 0.00135 * particle.speed + particle.phase) + 1) * 0.24;
    const glow = particle.size > 1.9 ? 11 : 4;
    ctx.save();
    ctx.shadowBlur = glow * twinkle;
    ctx.shadowColor = 'rgba(226,190,255,.98)';
    ctx.beginPath();
    ctx.arc(x, y, particle.size * (0.92 + formation * 0.28), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245,226,255,${particle.alpha * twinkle})`;
    ctx.fill();
    ctx.restore();
  });
  universeFrame = requestAnimationFrame(animateUniverse);
}

function initUniverse() {
  if (!universeCanvas) return;
  if (universeFrame) cancelAnimationFrame(universeFrame);
  window.clearTimeout(universeReadyTimer);
  universeFrame = 0;
  universeStartTime = 0;
  universeHeartReady = false;
  universePointer = { x: -1000, y: -1000, active: false, time: 0 };
  createUniverseParticles();
  resizeUniverse();
  setVisible(universeEnterButton, false);
  setVisible(universeInstruction, false);
  universeInstruction.textContent = 'The stars are finding their shape';
  if (!universeFrame) universeFrame = requestAnimationFrame(animateUniverse);
  // Leave the particles scattered long enough to explore, then let the heart
  // finish forming and keep it gently alive before showing the invitation.
  universeReadyTimer = window.setTimeout(() => {
    if (!universeScreen.classList.contains('is-hidden')) {
      universeHeartReady = true;
      universeInstruction.textContent = 'The stars have found their heart';
      setVisible(universeInstruction, true);
      setVisible(universeEnterButton, true);
      gsap.fromTo([universeInstruction, universeEnterButton], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.0, stagger: 0.12, ease: 'power2.out' });
    }
  }, 6800);
}

function loadGardenVisited() {
  try {
    const stored = JSON.parse(localStorage.getItem('our-story-garden-visited') || '[]');
    return new Set(Array.isArray(stored) ? stored : []);
  } catch { return new Set(); }
}

function saveGardenVisited() {
  try { localStorage.setItem('our-story-garden-visited', JSON.stringify([...gardenVisitedIds])); } catch { /* private browsing can disable storage */ }
}

function updateGardenProgress() {
  if (gardenProgressLabel) gardenProgressLabel.textContent = `${gardenVisitedIds.size} OF ${gardenMemories.length} MEMORIES DISCOVERED`;
}

function createGardenFlowers() {
  const field = $('#garden-flower-field');
  if (!field || field.dataset.ready === 'true') return;
  field.dataset.ready = 'true';
  const placements = [
    ['8%','21%','54px','.28','-12deg'], ['88%','18%','68px','.32','14deg'],
    ['16%','75%','72px','.22','8deg'], ['81%','76%','58px','.3','-18deg'],
    ['48%','10%','38px','.2','22deg'], ['52%','88%','66px','.24','-7deg'],
    ['3%','49%','36px','.19','11deg'], ['94%','48%','43px','.2','-15deg']
  ];
  placements.forEach(([left,top,size,opacity,rotation]) => {
    const flower = document.createElement('span');
    flower.className = 'garden-flower';
    flower.style.left = left; flower.style.top = top;
    flower.style.setProperty('--flower-size', size);
    flower.style.setProperty('--flower-opacity', opacity);
    flower.style.setProperty('--flower-rotation', rotation);
    for (let index = 0; index < 6; index += 1) {
      const petal = document.createElement('span');
      petal.style.setProperty('--petal-index', index);
      flower.appendChild(petal);
    }
    field.appendChild(flower);
  });
}

function renderGardenHearts() {
  if (!gardenHearts) return;
  gardenHearts.innerHTML = '';
  gardenMemories.forEach((memory, index) => {
    const visited = gardenVisitedIds.has(memory.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `garden-heart${visited ? ' is-viewed' : ''}`;
    button.dataset.gardenMemory = memory.id;
    button.setAttribute('aria-label', `${memory.title}${visited ? ', already discovered' : ', discover memory'}`);
    button.style.setProperty('--heart-delay', `${index * -0.55}s`);
    button.innerHTML = `<span class="garden-heart-glow"></span><svg viewBox="0 0 100 92" aria-hidden="true"><path d="M50 88 C43 80 8 54 8 30 C8 13 20 3 34 3 C42 3 48 8 50 17 C55 8 63 3 72 3 C87 3 96 14 96 30 C96 53 66 78 50 88Z"/><path class="garden-heart-shine" d="M20 28 C24 14 38 9 46 20"/></svg><span class="garden-heart-title">${memory.title}</span><span class="garden-heart-state">${visited ? 'DISCOVERED' : 'A LITTLE SECRET'}</span>`;
    gardenHearts.appendChild(button);
  });
  updateGardenProgress();
}

function openGarden() {
  if (!experienceFinished) return;
  createGardenFlowers();
  setVisible(finalScreen, false);
  setVisible(gardenScreen, true);
  setVisible(gardenMemoryDetail, false);
  setVisible(musicControl, false);
  renderGardenHearts();
  gsap.fromTo('.garden-heading', { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.85, ease: 'power2.out' });
  gsap.fromTo('.garden-heart', { autoAlpha: 0, y: 32, scale: 0.75 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.12, delay: 0.2, ease: 'back.out(1.5)' });
}

function openGardenMemory(memory, button) {
  if (!memory || !button) return;
  selectedGardenButton = button;
  selectedGardenMemory = memory;
  const rect = button.getBoundingClientRect();
  const dx = rect.left + rect.width / 2 - window.innerWidth / 2;
  const dy = rect.top + rect.height / 2 - window.innerHeight / 2;
  gardenMemoryImage.src = memory.image;
  gardenMemoryImage.alt = memory.alt;
  gardenMemoryTitle.textContent = memory.title;
  gardenMemoryMessage.textContent = memory.message;
  gardenMemoryEnglish.textContent = memory.english;
  setVisible(gardenMemoryDetail, true);
  button.classList.add('is-viewed');
  button.querySelector('.garden-heart-state').textContent = 'DISCOVERED';
  button.setAttribute('aria-label', `${memory.title}, already discovered`);
  gardenVisitedIds.add(memory.id);
  saveGardenVisited();
  updateGardenProgress();
  gsap.fromTo(gardenMemoryCard,
    { x: dx, y: dy, scale: 0.13, rotateY: -28, autoAlpha: 0, transformOrigin: 'center center' },
    { x: 0, y: 0, scale: 1, rotateY: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', clearProps: 'transform' }
  );
  gsap.fromTo(gardenMemoryImage, { scale: 1.12 }, { scale: 1, duration: 1.15, ease: 'power2.out' });
}

function returnToGarden() {
  if (!selectedGardenButton || !selectedGardenMemory) return;
  const rect = selectedGardenButton.getBoundingClientRect();
  const dx = rect.left + rect.width / 2 - window.innerWidth / 2;
  const dy = rect.top + rect.height / 2 - window.innerHeight / 2;
  gsap.to(gardenMemoryCard, {
    x: dx, y: dy, scale: 0.12, rotateY: 32, autoAlpha: 0, duration: 0.78, ease: 'power3.in',
    onComplete: () => {
      setVisible(gardenMemoryDetail, false);
      gsap.set(gardenMemoryCard, { clearProps: 'all' });
      gsap.fromTo(selectedGardenButton, { scale: 0.82, filter: 'brightness(1.8)' }, { scale: 1, filter: 'brightness(1.25)', duration: 0.65, ease: 'back.out(2)' });
      selectedGardenButton = null;
      selectedGardenMemory = null;
    }
  });
}

function closeGarden() {
  const finishClose = () => {
    setVisible(gardenScreen, false);
    setVisible(finalScreen, true);
    resizeStarfield();
    if (!animationFrame) animateStarfield();
    gsap.fromTo(finalScreen.querySelector('.final-content'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' });
  };
  if (gardenMemoryDetail && !gardenMemoryDetail.classList.contains('is-hidden')) {
    gsap.to(gardenMemoryCard, { autoAlpha: 0, scale: 0.92, duration: 0.35, onComplete: () => { setVisible(gardenMemoryDetail, false); finishClose(); } });
  } else finishClose();
}

// Event listeners.
universeEnterButton.addEventListener('click', enterEnvelope);
  universeCanvas.addEventListener('pointermove', (event) => { const rect = universeCanvas.getBoundingClientRect(); universePointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true, time: performance.now() }; });
  universeCanvas.addEventListener('pointerleave', () => { universePointer.active = false; });
  universeCanvas.addEventListener('pointerdown', (event) => {
    const rect = universeCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    universePointer = { x, y, active: true, time: performance.now() };
    const { heartScale, centerX, centerY } = getUniverseHeartLayout();
    const insideHeart = Math.abs(x - centerX) <= heartScale * 17.2 && Math.abs(y - centerY) <= heartScale * 17.8;
    if (universeHeartReady && insideHeart) enterEnvelope();
  });
  universeCanvas.addEventListener('pointerup', () => { universePointer.active = false; });
  universeCanvas.addEventListener('pointercancel', () => { universePointer.active = false; });
beginButton.addEventListener('click', startExperience);
pauseButton.addEventListener('click', toggleAudio);
musicIconButton.addEventListener('click', toggleAudio);
nextButton.addEventListener('click', () => moveToAdjacentScene(1));
previousButton.addEventListener('click', () => moveToAdjacentScene(-1));
expandPhotoButton.addEventListener('click', openPhotoModal);
imageElement.addEventListener('click', openPhotoModal);
closeModalButton.addEventListener('click', closePhotoModal);
photoModal.addEventListener('pointerdown', (event) => {
  if (event.target.closest('.cinema-controls, .modal-close, .special-overlay, .memory-flip-card')) return;
  showCinemaControls();
});
cinemaPlayButton.addEventListener('click', () => { toggleAudio(); showCinemaControls(audio.paused); });
cinemaBackButton.addEventListener('click', () => skipCinema(-10));
cinemaForwardButton.addEventListener('click', () => skipCinema(10));
memoryFlipCard.addEventListener('click', () => toggleFlipCard(memoryFlipCard));
modalFlipCard.addEventListener('click', () => toggleFlipCard(modalFlipCard));
memoryFlipCard.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleFlipCard(memoryFlipCard); } });
modalFlipCard.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleFlipCard(modalFlipCard); } });
photoModal.addEventListener('click', (event) => { if (event.target === photoModal) showCinemaControls(); });
tulipButton.addEventListener('click', revealTulip);
replayButton.addEventListener('click', replayExperience);
openGardenButton.addEventListener('click', openGarden);
gardenBackFinalButton.addEventListener('click', closeGarden);
gardenReturnButton.addEventListener('click', returnToGarden);
gardenHearts.addEventListener('click', (event) => {
  const button = event.target.closest('[data-garden-memory]');
  if (!button) return;
  const memory = gardenMemories.find((item) => item.id === button.dataset.gardenMemory);
  openGardenMemory(memory, button);
});
wishLantern.addEventListener('click', launchWish);
volumeControl.addEventListener('input', () => { audio.volume = Number(volumeControl.value); });

audio.addEventListener('loadedmetadata', () => {
  timeline = buildTimeline(getDuration());
  timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(getDuration())}`;
});
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('seeked', updateProgress);
audio.addEventListener('play', () => { updateAudioButtons(); if (cinemaMode) showCinemaControls(); });
audio.addEventListener('pause', updateAudioButtons);
audio.addEventListener('ended', finishExperience);

scratchCanvas.addEventListener('pointerdown', onScratchStart);
scratchCanvas.addEventListener('pointermove', onScratchMove);
scratchCanvas.addEventListener('pointerup', onScratchEnd);
scratchCanvas.addEventListener('pointercancel', onScratchEnd);

window.addEventListener('resize', () => {
  if (activeScene?.type === 'memory' && activeScene.memory.id === SCRATCH_MEMORY_ID) {
    const previousPasses = scratchPasses;
    drawScratchSurface();
    scratchPasses = previousPasses;
    updateScratchProgress();
  }
  if (!finalScreen.classList.contains('is-hidden')) resizeStarfield();
  if (!universeScreen.classList.contains('is-hidden')) resizeUniverse();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !photoModal.classList.contains('is-hidden')) closePhotoModal();
  if (event.key === 'Escape' && !gardenScreen.classList.contains('is-hidden')) { if (!gardenMemoryDetail.classList.contains('is-hidden')) returnToGarden(); else closeGarden(); }
  if (event.key === 'ArrowRight' && experienceStarted && !experienceFinished && !storyScreen.classList.contains('is-hidden')) moveToAdjacentScene(1);
  if (event.key === 'ArrowLeft' && experienceStarted && !experienceFinished && !storyScreen.classList.contains('is-hidden')) moveToAdjacentScene(-1);
  if (event.code === 'Space' && experienceStarted && document.activeElement?.tagName !== 'BUTTON') {
    event.preventDefault();
    toggleAudio();
  }
});

createPetals();
initStarfield();
initUniverse();
createGardenFlowers();
renderGardenHearts();
timeline = buildTimeline(FALLBACK_DURATION);
audio.volume = Number(volumeControl.value);
timeLabel.textContent = `00:00 / ${formatTime(FALLBACK_DURATION)}`;
