class Player {
  constructor(name) {
    this.name = name;
    this.base = null;
    this.runs = 0;
    this.position;
    this.order;
    this.atBats = [];
  }

  static from(params) {
    let player = new Player(params.name);
    Object.assign(player, params);
    return player;
  }

  get stats() {
    return `${this.hitCount} for ${this.atBatCount}`;
  }

  get atBatCount() {
    const nonAtBats = ['BB', 'HBP']
    return this.atBats.filter((ab) => {
      return !nonAtBats.includes(ab);
    }).length;
  }

  get hitCount() {
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
