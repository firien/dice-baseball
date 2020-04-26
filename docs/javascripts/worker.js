import Team from './team.js'
import Player from './player.js';
import { generateUUID } from './utils.js';
import Router from './router.js';

let database;
/*
worker in name only
safari (and firefox?) do not yet support imports on workers
so this will be run on the main thread
but it has been written to act like a worker,
so it can very easily be transferred to a Web Worker when available
*/
const defaultTeam = (name, teamStore, playerStore) => {
  let team = new Team(name);
  team.uuid = generateUUID();
  let request = teamStore.add(team);
  request.onsuccess = (e) => {
    let teamId = team.uuid;
    for (let i=0; i<9; i++) {
      let player = new Player(`Player ${i+1}`)
      player.uuid = generateUUID();
      player.teamId = teamId;
      playerStore.add(player);
    }
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
      playerStore.createIndex('teamId', 'teamId');
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

const teamPlayers = (data, params) => {
  console.log(data, params);
  let trxn = database.transaction(['teams'], 'readonly')
  let store = trxn.objectStore('teams')
  // let source = store.index('team');
}

const router = new Router();
router.post("/database", open);
router.get("/teams/:id/players", teamPlayers);

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