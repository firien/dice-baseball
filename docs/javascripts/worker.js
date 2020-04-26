import Team from './team.js'
import Player from './player.js';
import { generateUUID } from './utils.js';

let database;
/*
worker in name only
safari (and firefox?) do not yet support imports on workers
*/
const defaultTeam = (name, teamStore, playerStore) => {
  let team = new Team(name);
  let request = teamStore.add(team);
  request.onsuccess = (e) => {
    let teamId = e.target.result;
    for (let i=0; i<9; i++) {
      let player = new Player(`Player ${i+1}`)
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
    let teamStore;
    if (!database.objectStoreNames.contains('teams')) {
      teamStore = database.createObjectStore('teams', {keyPath: 'id', autoIncrement: true});
    }
    let playerStore;
    if (!database.objectStoreNames.contains('players')) {
      playerStore = database.createObjectStore('players', {keyPath: 'id', autoIncrement: true});
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

export const sendMessage = () => {
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
    open({promiseId})
    //route
  })
}