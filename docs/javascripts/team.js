import Player from './player.js';

class Team {
  constructor(name) {
    this.name = name;
    this.players = [];
    for (let i=1; i<=9; i++) {
      let player = new Player();
      player.order = i;
      if (i === 1) {
        player.base = 0;
      }
      this.players.push(player);
    }
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
}

export default Team;
