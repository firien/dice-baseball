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
  }

  init() {
    this.oscillator = this.context.createOscillator();
    // https://github.com/lukehorvat/web-audio-oscillators/blob/master/lib/organ.js
    const imag = [0,1,1,1,1,0,1,0,1,0,0,0,1];
    const real = imag.map(() => 0);
    let gainNode = this.context.createGain();
    gainNode.gain.value = 0.05;
    this.oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    const wave = this.context.createPeriodicWave(Float32Array.from(real), Float32Array.from(imag));
    this.oscillator.setPeriodicWave(wave);
  }

  play(note, time, hold=0.25) {
    this.init();
    this.oscillator.frequency.value = this.freq(note);
    this.oscillator.start(time);
    this.oscillator.stop(time + hold);
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
    let now = context.currentTime;
    organ.play("C4", now);
    organ.play("C5", now + 0.5);
    organ.play("A4", now + 0.75);
    organ.play("G4", now + 1);
    organ.play("E4", now + 1.25);
    organ.play("G4", now + 1.5, 0.5);
    organ.play("D4", now + 2.25, 0.5);
    setTimeout(() => {
      context.close();
    }, 3000)
  }
}

export default Organ;
