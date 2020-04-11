const sdpConstraints = { optional: [{RtpDataChannels: true}] };
const configuration = { iceServers: [{
  urls: [
    "stun:stun.l.google.com:19302"
  ]}]
};

const peerConnection = new RTCPeerConnection(configuration);
let dataChannel;

peerConnection.onicecandidate = (e) => {
  if (e.candidate) return;
  let offer = btoa(JSON.stringify(peerConnection.localDescription));
  let link = document.createElement('a');
  link.href = '#';
  link.textContent = 'Token'
  link.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: link.textContent,
        text: offer,
      });
    } else {
      navigator.clipboard.writeText(offer);
    }
  })
  document.body.appendChild(link);
}
peerConnection.oniceconnectionstatechange = (e) => {
  let state = peerConnection.iceConnectionState;
  console.log(state);
};

const createOfferSDP = async () => {
  let formResponse = document.querySelector('form#response');
  formResponse.classList.remove('hidden');
  dataChannel = peerConnection.createDataChannel("chat");
  let sessionDescription = await peerConnection.createOffer();
  peerConnection.setLocalDescription(sessionDescription);
  dataChannel.onopen = (e) => {
    console.log("opened")
  }
  dataChannel.onmessage = (e) => {
    let div = document.createElement('div');
    div.classList.add('response')
    div.textContent = e.data;
    document.body.appendChild(div);
  }
};

peerConnection.ondatachannel = (e) => {
  dataChannel = e.channel;
  dataChannel.onopen = (e) => {
    console.log("opened")
  }
  dataChannel.onmessage = (e) => {
    let div = document.createElement('div');
    div.classList.add('response')
    div.textContent = e.data;
    document.body.appendChild(div);
  }
}

document.addEventListener('DOMContentLoaded', (e) => {
  let button = document.querySelector('#create');
  button.addEventListener('click', createOfferSDP);

  let joinButton = document.querySelector('#join');
  joinButton.addEventListener('click', (e) => {
    let formAnswer = document.querySelector('form#answer');
    formAnswer.classList.remove('hidden');
  })
  let formAnswer = document.querySelector('form#answer');
  formAnswer.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    let offer = new RTCSessionDescription(JSON.parse(atob(formAnswer.data.value)));
    peerConnection.setRemoteDescription(offer);
    let sessionDescription = await peerConnection.createAnswer(sdpConstraints)
    peerConnection.setLocalDescription(sessionDescription);
  })

  let formResponse = document.querySelector('form#response');
  formResponse.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();  
    let offer = new RTCSessionDescription(JSON.parse(atob(formResponse.data.value)));
    peerConnection.setRemoteDescription(offer);
  })
  let formChat = document.querySelector('form#chat');
  formChat.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();  
    dataChannel.send(formChat.message.value);
    let div = document.createElement('div');
    div.textContent = formChat.message.value;
    document.body.appendChild(div);
    formChat.reset();
  })
})
