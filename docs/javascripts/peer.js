import {noop, chunkParam, unChunkParam, logger, empty} from './utils.js'
// import {test, roll, test2} from './dice.js'
import Game from './game.js';
import Die from './die.js';
import Team from './team.js';

const sdpConstraints = { optional: [{RtpDataChannels: true}] };
const configuration = { iceServers: [{
  urls: [
    "stun:stun.l.google.com:19302",
  ]}]
};

const peerConnection = new RTCPeerConnection(configuration);

let storageOffer;
window.addEventListener('storage', () => {
  if (peerConnection.remoteDescription == null) {
    let description = localStorage.getItem('answer');
    if (description) {
      storageOffer = JSON.parse(atob(description));
      localStorage.removeItem('answer');
    }
  }
});

document.addEventListener('visibilitychange', (e) => {
  // I have no idea how iOS executes storage events in background tabs
  // do allow some time for this to happen
  setTimeout(() => {
    if (storageOffer) {
      let offer = new RTCSessionDescription(storageOffer);
      peerConnection.setRemoteDescription(offer);
      storageOffer = null;
    }
  }, 500)
})

let dataChannel;

peerConnection.onicecandidate = (e) => {
  if (e.candidate) return;
  let param = (peerConnection.remoteDescription == null) ? 'offer' : 'answer';
  let offer = btoa(JSON.stringify(peerConnection.localDescription));
  let pathname = location.pathname + (param === 'offer' ? '' : 'answer.html')
  let url = new URL(`${location.protocol}//${location.host}${pathname}`)
  // iMessage does not like large query params, so have to break it up
  chunkParam(url, param, offer);
  let link = document.createElement('a');
  link.href = url;
  link.textContent = 'Share Link';
  link.addEventListener('click', async (e) => {
    noop(e);
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.textContent,
          // text: 'offer',
          url: url,
        });
        link.parentElement.removeChild(link);
      } catch {
        //nothing
      }
    } else {
      navigator.clipboard.writeText(url);
    }
    if (param === 'offer') {
      let formAnswer = document.querySelector('form#answer');
      formAnswer.classList.remove('hidden');
    }
  })
  document.body.appendChild(link);
}
peerConnection.oniceconnectionstatechange = (e) => {
  let state = peerConnection.iceConnectionState;
  logger(state);
  // if (state === 'connected') {
  //   // let span = document.createElement('span');
  //   // span.textContent = 'Connection Made';
  //   // document.body.appendChild(span);
  // }
};
const onMessage = (e) => {
  let span = document.createElement('span');
  span.classList.add('response')
  span.textContent = e.data;
  let list = document.querySelector('#messages')
  list.appendChild(span);
}
const createOfferSDP = async (e) => {
  let button = e.target;
  button.disabled = true;
  // let formResponse = document.querySelector('form#response');
  // formResponse.classList.remove('hidden');
  dataChannel = peerConnection.createDataChannel("chat");
  let sessionDescription = await peerConnection.createOffer();
  peerConnection.setLocalDescription(sessionDescription);
  dataChannel.onopen = (e) => {
    let button = document.querySelector('form#chat button');
    button.disabled = false;
    logger('Connection Made');
  }
  dataChannel.onmessage = onMessage;
};

peerConnection.ondatachannel = (e) => {
  dataChannel = e.channel;
  dataChannel.onopen = (e) => {
    let button = document.querySelector('form#chat button');
    button.disabled = false;
    logger('Connection Made');
  }
  dataChannel.onmessage = onMessage;
}

const updateScoreboard = (game) => {
  let homeRuns = document.querySelector('#home-runs');
  let runs = game.homeTeam.players.reduce((sum, p) => sum += p.runs, 0);
  homeRuns.textContent = runs;
  let awayRuns = document.querySelector('#away-runs');
  runs = game.awayTeam.players.reduce((sum, p) => sum += p.runs, 0);
  awayRuns.textContent = runs;

}

document.addEventListener('DOMContentLoaded', async (e) => {
  let button = document.querySelector('#create');
  button.addEventListener('click', createOfferSDP);

  // was it loaded with offer?
  let url = new URL(window.location);
  let paramOffer = unChunkParam(url, 'offer');
  if (paramOffer) {
    button.classList.add('hidden');
    let offer = new RTCSessionDescription(JSON.parse(atob(paramOffer)));
    peerConnection.setRemoteDescription(offer);
    let sessionDescription = await peerConnection.createAnswer(sdpConstraints)
    peerConnection.setLocalDescription(sessionDescription);
  }
  let formAnswer = document.querySelector('form#answer');
  formAnswer.addEventListener('submit', async (e) => {
    noop(e);
    let url = new URL(formAnswer.data.value);
    let paramAnswer = JSON.parse(atob(unChunkParam(url, 'answer')));
    let offer = new RTCSessionDescription(paramAnswer);
    peerConnection.setRemoteDescription(offer);
    formAnswer.classList.add('hidden');
  })
  let formChat = document.querySelector('form#chat');
  formChat.addEventListener('submit', async (e) => {
    if (formChat.reportValidity()) {
      noop(e);
      dataChannel.send(formChat.message.value);
      let span = document.createElement('span');
      span.classList.add('sent');
      span.textContent = formChat.message.value;
      let list = document.querySelector('#messages')
      list.appendChild(span);
      formChat.reset();
    }
  })
  // document.querySelector('#roll').addEventListener('input', (e) => {
  //   let form = e.currentTarget;
  //   // test(Number(form.n.value), Number(form.add.value));
  //   test2()
  // })
  let game = new Game();
  let roller = document.querySelector('button#roll')
  let div = document.createElement('div');
  div.id = 'roll-result'
  roller.addEventListener('click', (e) => {
    empty(div);
    let roll = game.roll();
    for (let number of roll) {
      let text = String.fromCharCode(Die.faces[number]);
      let span = document.createElement('span');
      span.classList.add('die');
      span.textContent = text;
      div.appendChild(span);
    }
    document.body.appendChild(div);
    game.bat(roll);
    //update field
    for (let base=1; base<=3; base++) {
      let player = game.currentTeam.playerOn(base);
      let rect = document.querySelector(`rect[data-base='${base}']`)
      rect.classList.toggle('occupied', !!player);
    }
    //update scoreboard
    updateScoreboard(game);
  })
})
