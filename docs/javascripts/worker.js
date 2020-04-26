import Team from './team.js'
import Player from './player.js';

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

const generateUUID = () => {
  let array = new Uint8Array(16);
  self.crypto.getRandomValues(array);
  // debugger
  // lifted from Ruby SecureRandom::uuid
  // array = [223, 113, 86, 88, 40, 243, 24, 189, 137, 133, 40, 220, 178, 217, 161, 12]
  array = Array.from(array);
  let a = ((array[6] << 8) + array[7]) & 0x0fff | 0x4000;
  array[6] = a >> 8;
  array[7] = a - (array[6] << 8);
  let b = ((array[8] << 8) + array[9]) & 0x3fff | 0x8000;
  array[8] = b >> 8;
  array[9] = b - (array[8] << 8);
  const dashIndices = [3,5,7,9];
  return array.map((x,i) => {
    let str = x.toString(16);
    if (str.length === 1) {
      str = `0${str}`;
    }
    return dashIndices.includes(i) ? `${str}-` : str;
  }).join('');
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