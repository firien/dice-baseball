import Game from './game.js';
import Team from './team.js'
import Player from './player.js';
import { generateUUID } from './utils.js';
import Router from './router.js';

let database;
let currentGame;

// good for one and done IDBRequests
// like add, delete, & put
const requestPromise = (request) => {
  return new Promise((resolve, reject) => {
    request.onsuccess = resolve
    request.onerror = reject
  })
}

/*
worker in name only
safari (and firefox?) do not yet support imports on workers
so this will be run on the main thread
but it has been written to act like a worker,
so it can very easily be transferred to a Web Worker when available
*/
const defaultTeam = async (name, teamStore, playerStore) => {
  let team = new Team(name);
  team.uuid = generateUUID();
  let request = teamStore.add(team.serialize());
  await requestPromise(request);
  let teamId = team.uuid;
  for (let i=0; i<9; i++) {
    let player = new Player(`Player ${i+1}`)
    player.order = i + 1;
    if (i === 0) {
      player.base = 0;
    }
    player.uuid = generateUUID();
    player.teamId = teamId;
    playerStore.add(player);
  }
}

const postMessage = (detail) => {
  let evt = new CustomEvent('fauxWorkerMessage', {detail});
  self.dispatchEvent(evt);
}

const open = (data) => {
  let request = indexedDB.open('dicebaseball', 1);
  request.onupgradeneeded = (e) => {
    let database = request.result;
    if (!database.objectStoreNames.contains('games')) {
      database.createObjectStore('games', {keyPath: 'uuid'});
    }
    let teamStore;
    if (!database.objectStoreNames.contains('teams')) {
      teamStore = database.createObjectStore('teams', {keyPath: 'uuid'});
    }
    let playerStore;
    if (!database.objectStoreNames.contains('players')) {
      playerStore = database.createObjectStore('players', {keyPath: 'uuid'});
      playerStore.createIndex('team', ['teamId', 'order']);
    }
    if (e.oldVersion < 1) {
      // add default teams
      defaultTeam('Home', teamStore, playerStore);
      defaultTeam('Away', teamStore, playerStore);
    }
  }
  request.onsuccess = (e) => {
    database = request.result;
    postMessage({promiseId: data.promiseId, status: 201})
  }
}

const teamPlayers = async (source, teamUUID) => {
  let request = source.getAll(IDBKeyRange.bound([teamUUID, 0], [teamUUID, 10]))
  let evt = await requestPromise(request);
  return evt.target.result.map(p => Player.from(p))
}

const newGame = async (data, params) => {
  let trxn = database.transaction(['games', 'teams', 'players'], 'readwrite');
  let store = trxn.objectStore('games');
  let game = new Game();
  game.uuid = generateUUID();
  let request = store.add(game);
  await requestPromise(request);
  let teamStore = trxn.objectStore('teams');
  let teamRequest = await requestPromise(teamStore.getAll());
  let playerStore = trxn.objectStore('players');
  let playerSource = playerStore.index('team');
  game.homeTeam = Team.from(teamRequest.target.result[0]);
  game.homeTeam.players = await teamPlayers(playerSource, game.homeTeam.uuid)
  game.awayTeam = Team.from(teamRequest.target.result[1]);
  game.awayTeam.players = await teamPlayers(playerSource, game.awayTeam.uuid)
  currentGame = game;
  postMessage({promiseId: data.promiseId, game, status: 201})
}

const roll = async (data, params) => {
  let roll = currentGame.roll();
  let outcome = currentGame.bat(roll);
  let playersOnBase = new Array(3);
  for (let player of currentGame.currentTeam.players) {
    if (player.base) {
      playersOnBase[player.base-1] = player;
    }
  }
  let result = {
    roll,
    outcome,
    playersOnBase,
    batter: currentGame.currentTeam.currentBatter,
    scoreBoard: {
      homeTeam: {
        totalRuns: currentGame.homeTeam.totalRuns,
        totalHits: currentGame.homeTeam.totalHits,
      },
      awayTeam: {
        totalRuns: currentGame.awayTeam.totalRuns,
        totalHits: currentGame.awayTeam.totalHits,
      },
      topOfInning: currentGame.topOfInning
    }
  };
  // TODO: commit to database
  postMessage({promiseId: data.promiseId, result, status: 201})
}

const router = new Router();
router.post("/database", open);
router.post("/games", newGame);
router.post("/games/roll", roll);

export const sendMessage = (opts) => {
  let url = new URL(`ww://${opts.url}`)
  delete opts.url
  let method = opts.method;
  delete opts.method;
  return new Promise((resolve, reject) => {
    let promiseId = generateUUID();
    const listener = (e) => {
      if (e.detail.promiseId === promiseId) {
        if ((/2\d+/).test(e.detail.status)) {
          resolve(e.detail);
        } else {
          reject(e.detail);
        } 
      }
      self.removeEventListener('fauxWorkerMessage', listener);
    }
    self.addEventListener('fauxWorkerMessage', listener);
    opts.promiseId = promiseId;
    router.route(url, method, opts);
  })
}