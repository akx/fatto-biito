/* eslint-disable function-paren-newline,no-param-reassign,prefer-template */
const m = require('mithril');
const JSZip = require('jszip');
const naturalSort = require('javascript-natural-sort');
require('./style.css');

const audioContext = new AudioContext();
let samples = [];
const playAnimKeyframes = [
  { transform: 'scale(0.9)' },
  { transform: 'scale(1)' },
];

const playAnimTiming = {
  duration: 350,
  iterations: 1,
};

const keys = 'qwertyuiopasdfghjklzxcvbnm';


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
        .then((audioData) => {
          return { name: basename(wf.name), audioData };
        })
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
  const audioNode = audioContext.createBufferSource();
  audioNode.buffer = sample.audioData;
  audioNode.connect(audioContext.destination);
  audioNode.start();
  if (sample.buttonElement) {
    sample.buttonElement.animate(playAnimKeyframes, playAnimTiming);
  }
}

const view = () => m('main', [
  m('input', { type: 'file', onchange: (e) => loadZip(e.target.files[0]) }),
  m(
    'div',
    samples.map((sample, index) => (
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
          m('span', sample.name),
          m('kbd', keys[index].toUpperCase()),
        ],
      ))
    )
  ),
]);


m.mount(document.body, { view });

window.addEventListener('keydown', (e) => {
  const keyIndex = keys.indexOf(e.key);
  if (keyIndex !== -1) {
    const sample = samples[keyIndex];
    if (sample) {
      playSample(sample);
    }
  }
}, false);
