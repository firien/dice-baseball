import Die from './die.js';
import Team from './team.js';
import Inning from './inning.js';

const results = [
  'HBP',//3
  'HR',//4
  'BB',//5
  '2B',//6
  'OUT',//7
  '1B',//8
  'DP',//9
  'BB',//10
  'OUT',//11
  '1B',//12
  'K',//13
  'OUT',//14
  'K',//15
  'SAC',//16
  '3B',//17
  'HR',//18
]

class Game {
  constructor() {
    this.homeTeam = new Team();
    this.awayTeam = new Team();
    this.innings = [];
    // debugger
    for (let i=0; i<=8; i++) {
      let inning = new Inning();
      this.innings.push(inning);
    }
    this.currentInning = this.innings[0];
  }

  bat() {
    let team = this.homeTeam;
    let nextBatter = team.onDeck(); 
    let dice = this.roll();
    let total = 0;
    for (let die of dice) {
      total += die;
    }
    let runs = 0;
    let outs = 0;
    let advance = 0;
    let includeBatter = true;
    switch(results[total-3]) {
      case '1B', 'BB', 'HBP':
        advance = 1;
        break;
      case '2B':
        advance = 2;
        break;
      case '3B':
        advance = 3;
        break;
      case 'HR':
        advance = 4;
        break;
      case 'SAC':
        includeBatter = false;
        advance = 1;
        break;
      case 'DP':
        outs = 1;
        if (team.players.some(p => p.base === 1)) {
          outs++;
        }
        // man on first?
        break;
      default:
        outs = 1;
    }
    team.currentBatter.atBats.push(results[total-3]);
    if (advance) {
      for (let player of team.players) {
        if (player.base === 0) {
          if (includeBatter) {
            runs += player.advanceBase(advance);
          }
        } else {
          runs += player.advanceBase(advance);
        }
      }
    }
    // next batter
    team.currentBatter = nextBatter;
    //add runs to inning
    this.currentInning.addOuts(outs);
    if (this.currentInning.addRuns(runs)) {
      //next inning
    }
  }

  roll() {
    return [Die.roll(), Die.roll(), Die.roll()];
  }

}

export default Game;
