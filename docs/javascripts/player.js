class Player {
  constructor() {
    this.name = '';
    this.base = null;
    this.runs = 0;
    this.position;
    this.order;
    this.atBats = [];
  }
  atBatCount() {
    return this.atBats.filter((ab) => {
      return ab !== 'BB';
    }).length;
  }

  hitCount() {
    let hits = ['1B', '2B', '3B', 'HR'];
    return this.atBats.filter((ab) => {
      return hits.includes(ab)
    }).length;
  }

  advanceBase(x, init) {
    let run = 0;
    if (this.base || init) {
      this.base += x;
      if (this.base > 3) {
        this.base = null;
        //add a run
        run = 1;
      }
    }
    this.runs += run;
    return run;
  }
}

export default Player;
