const f0 = 440;//A₄ 440 Hz
const a = 2 ** (1 / 12);
const notes = {
  C: 1,
  D: 3,
  E: 5,
  F: 6,
  G: 8,
  A: 10,
  B: 12,
}

class Organ {

  constructor(context) {
    this.context = context;
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 0.05;
    this.gainNode.connect(this.context.destination);
    // https://github.com/lukehorvat/web-audio-oscillators/blob/master/lib/organ.js
    const imag = [0,1,1,1,1,0,1,0,1,0,0,0,1];
    const real = imag.map(() => 0);
    this.wave = this.context.createPeriodicWave(Float32Array.from(real), Float32Array.from(imag));
  }

  makeOscillator() {
    let oscillator = this.context.createOscillator();
    oscillator.connect(this.gainNode);
    oscillator.setPeriodicWave(this.wave);
    // oscillator.type = 'square'
    return oscillator;
  }

  playNote(note, time, hold=0.25) {
    let oscillator = this.makeOscillator();
    oscillator.frequency.value = this.freq(note);
    oscillator.start(time);
    oscillator.stop(time + hold);
  }

  play(notes) {
    let beat = 0.25;
    let now = this.context.currentTime;
    let offset = 0
    for (let [i, note] of Object.entries(notes.split(' '))) {
      let hold = beat;
      let pause = 0;
      if ((/-$/).test(note)) {
        pause = beat;
        note = note.slice(0,-1);
      }
      if ((/\+$/).test(note)) {
        hold *= 2;
        note = note.slice(0,-1);
      }
      this.playNote(note, now + offset, hold);
      offset += beat + pause + (hold - beat);
    }
    setTimeout(() => {
      this.context.close();
    }, offset * 1000)
  }
  freq(note) {
    let [l, x] = note.split('');
    x = Number(x);
    let n = (x * 12) + notes[l.toUpperCase()];
    const a4 = 58;
    n = n - a4;
    return f0 * (a ** n);
  }

  static ballGame() {
    let context = new (self.AudioContext || self.webkitAudioContext)();
    let organ = new Organ(context);
    organ.play("c4- c5 a4 g4 e4 g4+- d4+ c4- c5 a4 g4 e4 g4+-")
  }
}

export default Organ;
