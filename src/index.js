/* eslint-disable function-paren-newline,no-param-reassign,prefer-template */
const m = require('mithril');
const JSZip = require('jszip');
const naturalSort = require('javascript-natural-sort');
const fattoPixelSrc = require('./fatto-pixel.png');
const stickerSrc = require('./fatto-sticker.svg');
require('./style.css');

const audioContext = new AudioContext();
const outputNode = audioContext.createAnalyser();
outputNode.fftSize = 128;
outputNode.connect(audioContext.destination);
let samples = [];
let canvas = null;
const initTime = +new Date();

const keys = 'qwertyuiopasdfghjklzxcvbnm1234567890';
const fattoPixelImage = Object.assign(new Image(), { src: fattoPixelSrc });


function basename(p) {
  const lastSlashIndex = p.lastIndexOf('/');
  return lastSlashIndex !== -1 ? p.substr(lastSlashIndex + 1) : p;
}

function getSamplesFromZip(data) {
  return JSZip.loadAsync(data).then((zip) => (
    Object.values(zip.files).filter((f) => {
      if (f.dir) return false;
      if (f.name.includes('__MACOSX')) return false;
      if (!f.name.endsWith('.wav')) return false;
      if (f.name.includes('._')) return false;
      return true;
    })
  ).sort((a, b) => naturalSort(a.name, b.name)));
}

function decodeSamples(zipFiles) {
  return Promise.all(
    zipFiles.map((wf) =>
      wf.async('arraybuffer')
        .then((rawData) => audioContext.decodeAudioData(rawData))
        .then((audioData) => ({ name: basename(wf.name), audioData }))
        .catch((error) => ({ name: basename(wf.name), error }))
    )
  );
}

function loadZip(file) {
  if (!file) return;
  const fr = new FileReader();
  fr.onload = (e) => {
    const data = e.target.result;
    getSamplesFromZip(data)
      .then(decodeSamples)
      .then((newSamples) => {
        samples = newSamples;
        m.redraw();
      });
  };
  fr.readAsArrayBuffer(file);
}

function playSample(sample) {
  if (sample.audioData) {
    const audioNode = audioContext.createBufferSource();
    audioNode.buffer = sample.audioData;
    audioNode.connect(outputNode);
    audioNode.start();
  }
  if (sample.buttonContainerElement) {
    sample.buttonContainerElement.classList.add('pressed');
    setTimeout(() => sample.buttonContainerElement.classList.remove('pressed'), 500);
  }
}

function updateCanvas() {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const time = (+new Date() - initTime);
  ctx.clearRect(0, 0, 128, 32);
  ctx.globalAlpha = 0.7;
  if (!samples.length) {
    const prob = Math.min(time / 3000, 1);
    if(Math.random() <= prob) {
      const x = 38 + Math.sin(+new Date() / 1000) * prob * 20;
      ctx.drawImage(fattoPixelImage, Math.round(x), 2);
    }
  } else {
    const dataArray = new Uint8Array(outputNode.fftSize);
    outputNode.getByteTimeDomainData(dataArray);
    ctx.fillStyle = 'black';
    ctx.beginPath();
    for (let i = 0; i < dataArray.length; i++) {
      const y = Math.round(dataArray[i] / 255.0 * 32);
      ctx.rect(i, y, 1, 1);
    }
    ctx.fill();
  }
}

const sampleButton = (sample, index) => (
  m(
    '.button-ctr',
    {
      key: sample.name,
      oncreate: (vnode) => {
        sample.buttonContainerElement = vnode.dom;
      },
    },
    [
      m(
        'button',
        {
          disabled: !!sample.error,
          onclick: () => playSample(sample),
          oncreate: (vnode) => {
            sample.buttonElement = vnode.dom;
          },
        },
        [
          m('span', sample.name.replace('.wav', '')),
          m('kbd', (keys[index] || '').toUpperCase()),
        ],
      ),
      m('.button-3d'),
    ]
  )
);

const view = () => m('main', [
  m('div#disp', [
    m('img#sticker', {src: stickerSrc}),
    m('canvas', {
      width: 128,
      height: 32,
      oncreate: (vnode) => {
        canvas = vnode.dom;
        setInterval(updateCanvas, 1000 / 30);
      },
    }),
  ]),
  m(
    'div#pad',
    samples.map((sample, index) => sampleButton(sample, index)),
  ),
  m('div#drive', [
    m('#drive-wrap', [
      (samples.length ? null : m('span', ['Insert ZIP file'])),
      m('input', { type: 'file', onchange: (e) => loadZip(e.target.files[0]) }),
    ]),
  ]),
]);

function initFakeSamples(n = 16) {
  for (let i = 0; i < n; i++) {
    samples.push({ name: i });
  }
}

// initFakeSamples();
m.mount(document.body, { view });

window.addEventListener('keydown', (e) => {
  const keyIndex = keys.indexOf(e.key);
  if (keyIndex !== -1) {
    const sample = samples[keyIndex];
    if (sample) {
      playSample(sample);
    }
    e.preventDefault();
  }
}, false);
