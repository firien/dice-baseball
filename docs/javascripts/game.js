import Die from './die.js';
import Team from './team.js';
import Inning from './inning.js';
import {logger} from './utils.js'

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
    this.homeTeam = new Team('Home');
    this.awayTeam = new Team('Away');
    this.innings = [];
    for (let i=0; i<=17; i++) {
      let inning = new Inning();
      this.innings.push(inning);
    }
    this._currentInning = 0;
  }

  nextInning() {
    this._currentInning++;
    console.log(`inning change ${this._currentInning}`)
  }

  get currentTeam() {
    return this._currentInning % 2 === 0 ? this.awayTeam : this.homeTeam;
  }

  get currentInning() {
    return this.innings[this._currentInning];
  }
  bat(dice) {
    let team = this.currentTeam;
    let nextBatter = team.onDeck(); 
    let total = 0;
    for (let die of dice) {
      total += die;
    }
    let runs = 0;
    let outs = 0;
    let advance = 0;
    let includeBatter = true;
    let outcome = results[total-3];
    switch(outcome) {
      case '1B':
      case 'BB':
      case 'HBP':
        advance = 1;
        break;
      case 'BB':
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
        // man on first?
        if (team.players.some(p => p.base === 1)) {
          outs++;
        }
        break;
      default:
        outs = 1;
    }
    team.currentBatter.atBats.push(outcome);
    if (advance) {
      let runners = team.players.filter(p => p.base > 0).sort((a,b) => {
        return a.base - b.base;
      });
      if (includeBatter) {
        runs += team.currentBatter.advanceBase(advance, true);
      }
      if (outcome === 'BB') {
        // only advance runners if necessary
        for (let runner of runners) {
          runs += runner.advanceBase(advance);
        }
      } else {
        for (let runner of runners) {
          runs += runner.advanceBase(advance);
        }
      }
    }
    // next batter
    team.currentBatter = nextBatter;
    //add runs to inning
    console.log(`${outcome} - ${outs} - ${runs}`)
    this.currentInning.addRuns(runs);
    if (this.currentInning.addOuts(outs)) {
      team.clearBases();
      this.nextInning();
    }
  }

  roll() {
    return [Die.roll(), Die.roll(), Die.roll()];
  }

}

export default Game;
