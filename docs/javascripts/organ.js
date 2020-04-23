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
  }

  makeOscillator() {
    let oscillator = this.context.createOscillator();
    oscillator.connect(this.gainNode);
    oscillator.type = 'square';
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
    for (let note of notes.split(/ +/)) {
      note = note.trim();
      let hold = beat;
      let pause = 0;
      if ((/-$/).test(note)) {
        let h = note.match(/(-+)$/)[1].length;
        pause = beat * h;
        note = note.slice(0,-h);
      }
      if ((/\++$/).test(note)) {
        let h = note.match(/(\++)$/)[1].length;
        hold += (hold * h);
        note = note.slice(0,-h);
      }
      this.playNote(note, now + offset, hold);
      offset += beat + pause + (hold - beat);
    }
    setTimeout(() => {
      this.context.close();
    }, (offset * 1000) + 500)
  }
  freq(note) {
    let sharp = 0;
    if ((/#$/).test(note)) {
      sharp = 1;
      note = note.slice(0,-1);
    }
    let [l, x] = note.split('');
    x = Number(x);
    let n = (x * 12) + notes[l.toUpperCase()] + sharp;
    const a4 = 58;
    n = n - a4;
    return f0 * (a ** n);
  }

  static ballGame() {
    let context = new (self.AudioContext || self.webkitAudioContext)();
    let organ = new Organ(context);
    organ.play(`c4- c5 a4 g4 e4 g4+- d4+-
                c4- c5 a4 g4 e4 g4++-
                a4 g4# a4 e4 f4 g4 a4+ f4 d4+-
                a4- a4 a4 b4 c5 d5 b4 a4 g4 e4 d4
                c4- c5 a4 g4 e4 g4+- d4- d4
                c4- d4 e4 f4 g4 a4+- a4 a4 b4
                c5+- c5+- c5 b4 a4 g4 f4# g4
                a4+- b4+- c5++`)
  }

  static charge() {
    let context = new (self.AudioContext || self.webkitAudioContext)();
    let organ = new Organ(context);
    organ.play(`g3 c4 e4 g4- e4 g4+`);
  }
}

export default Organ;
