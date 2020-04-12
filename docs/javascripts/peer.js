const sdpConstraints = { optional: [{RtpDataChannels: true}] };
const configuration = { iceServers: [{
  urls: [
    "stun:stun.l.google.com:19302"
  ]}]
};

const peerConnection = new RTCPeerConnection(configuration);

window.addEventListener('storage', () => {
  if (peerConnection.remoteDescription == null) {
    let description = localStorage.getItem('answer');
    if (description) {
      let offer = new RTCSessionDescription(JSON.parse(atob(description)));
      peerConnection.setRemoteDescription(offer);
      localStorage.removeItem('answer');
    }
  }
});


const noop = (e) => {
  e.preventDefault();
  e.stopPropagation();
}
let dataChannel;

peerConnection.onicecandidate = (e) => {
  if (e.candidate) return;
  let param = (peerConnection.remoteDescription == null) ? 'offer' : 'answer';
  let offer = btoa(JSON.stringify(peerConnection.localDescription));
  let url = new URL(`${location.protocol}//${location.host}${location.pathname}`)
  url.searchParams.set(param, offer);
  let link = document.createElement('a');
  link.href = url;
  link.textContent = 'Share Link';
  link.addEventListener('click', (e) => {
    noop(e);
    if (navigator.share) {
      navigator.share({
        title: link.textContent,
        // text: 'offer',
        url: url.toString(),
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  })
  document.body.appendChild(link);
}
peerConnection.oniceconnectionstatechange = (e) => {
  let state = peerConnection.iceConnectionState;
  console.log(state);
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
const createOfferSDP = async () => {
  // let formResponse = document.querySelector('form#response');
  // formResponse.classList.remove('hidden');
  dataChannel = peerConnection.createDataChannel("chat");
  let sessionDescription = await peerConnection.createOffer();
  peerConnection.setLocalDescription(sessionDescription);
  dataChannel.onopen = (e) => {
    let span = document.createElement('span');
    span.textContent = 'Connection Made';
    document.body.appendChild(span);
  }
  dataChannel.onmessage = onMessage;
};

peerConnection.ondatachannel = (e) => {
  dataChannel = e.channel;
  dataChannel.onopen = (e) => {
    let span = document.createElement('span');
    span.textContent = 'Connection Made';
    document.body.appendChild(span);
  }
  dataChannel.onmessage = onMessage;
}

document.addEventListener('DOMContentLoaded', async (e) => {
  let button = document.querySelector('#create');
  button.addEventListener('click', createOfferSDP);

  // was it loaded with offer?
  let url = new URL(window.location);
  if (url.searchParams.has('offer')) {
    button.classList.add('hidden');
    let paramOffer = url.searchParams.get('offer');
    let offer = new RTCSessionDescription(JSON.parse(atob(paramOffer)));
    peerConnection.setRemoteDescription(offer);
    let sessionDescription = await peerConnection.createAnswer(sdpConstraints)
    peerConnection.setLocalDescription(sessionDescription);
  } else if (url.searchParams.has('answer')) {
    localStorage.setItem('answer', url.searchParams.get('answer'));
  }

  // let joinButton = document.querySelector('#join');
  // joinButton.addEventListener('click', (e) => {
  //   let formAnswer = document.querySelector('form#answer');
  //   formAnswer.classList.remove('hidden');
  // })
  // let formAnswer = document.querySelector('form#answer');
  // formAnswer.addEventListener('submit', async (e) => {
  //   noop(e);
  //   let offer = new RTCSessionDescription(JSON.parse(atob(formAnswer.data.value)));
  //   peerConnection.setRemoteDescription(offer);
  //   let sessionDescription = await peerConnection.createAnswer(sdpConstraints)
  //   peerConnection.setLocalDescription(sessionDescription);
  // })

  // let formResponse = document.querySelector('form#response');
  // formResponse.addEventListener('submit', async (e) => {
  //   noop(e);
  //   let offer = new RTCSessionDescription(JSON.parse(atob(formResponse.data.value)));
  //   peerConnection.setRemoteDescription(offer);
  // })
  let formChat = document.querySelector('form#chat');
  formChat.addEventListener('submit', async (e) => {
    noop(e);
    dataChannel.send(formChat.message.value);
    let span = document.createElement('span');
    span.classList.add('sent');
    span.textContent = formChat.message.value;
    let list = document.querySelector('#messages')
    list.appendChild(span);
    formChat.reset();
  })
})
