import Player from './player.js';

class Team {
  constructor(name) {
    this.name = name;
    this.players = [];
  }
  static from(params) {
    let team = new Team(params.name);
    Object.assign(team, params);
    return team;
  }
  lineup() {
    return this.players.sort((a,b) => a.order - b.order);
  }
  get currentBatter() {
    return this.players.find(p => p.base === 0);
  }
  set currentBatter(order) {
    for (let player of this.players) {
      if (player.order === order) {
        player.base = 0;
      } else if (player.base === 0) {
        player.base = null;
      }
    }
  }
  onDeck() {
    let order = this.currentBatter.order
    return (order === 9) ? 1 : ++order;
  }
  clearBases() {
    for (let player of this.players) {
      if (player.base > 0) {
        player.base = null;
      }
    }
  }
  playerOn(base) {
    return this.players.find(p => p.base === base)
  }
  get totalRuns() {
    return this.players.reduce((sum, p) => sum += p.runs, 0);
  }
  get totalHits() {
    return this.players.reduce((sum, p) => sum += p.hitCount, 0);
  }
  serialize() {
    return {
      uuid: this.uuid,
      name: this.name
    }
  }
}

export default Team;
