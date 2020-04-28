import { sendMessage } from './worker.js';
import Game from './game.js';
import Die from './die.js';
import Organ from './organ.js';

const positionBaseTags = () => {
  for (let base=1; base<=3; base++) {
    let rect = document.querySelector(`rect[data-base='${base}']`);
    let box = rect.getBoundingClientRect();
    let span = document.querySelector(`#runners span:nth-child(${base})`)
    if (base === 1) {
      span.style.top = `${box.bottom + 15}px`;
      span.style.left = `${box.x + 15}px`;
    } else if (base === 2) {
      span.style.top = `${box.top - 40}px`;
      span.style.left = '50%';
    } else {
      span.style.right = `${window.innerWidth - box.x}px`;
      span.style.top = `${box.bottom + 15}px`;
    }
  }
}

// service worker
if ('serviceWorker' in navigator) {
  const showUpdateButton = (worker) => {
    let button = document.querySelector('#updates');
    button.classList.remove('hidden');
    const skipWaiting = (e) => {
      button.disabled = true;
      if (worker.state === 'activated') {
        button.classList.add('hidden');
      } else {
        worker.postMessage({action: 'skipWaiting'})
      }
      button.removeEventListener('click', skipWaiting);
    }
    button.addEventListener('click', skipWaiting);
  }
  navigator.serviceWorker.register('/dice-baseball/service.js', {scope: '/dice-baseball/'}).then((registration) => {
    if (registration.waiting) {
      showUpdateButton(registration.waiting)
    }
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          showUpdateButton(newWorker)
        }
        if (newWorker.state === 'activated') {
          document.querySelector('#updates').classList.add('hidden');
        }
      })
    })
  })
  navigator.serviceWorker.addEventListener('controllerchange', (e) => {
    window.location.reload();
  })
}

const updateScoreboard = (scoreBoard) => {
  let { homeTeam, awayTeam, topOfInning } = scoreBoard;
  let homeRuns = document.querySelector('#home-runs');
  homeRuns.textContent = homeTeam.totalRuns;
  let awayRuns = document.querySelector('#away-runs');
  awayRuns.textContent = awayTeam.totalRuns;
  //hits
  let homeHits = document.querySelector('#home-hits');
  homeHits.textContent = homeTeam.totalHits;
  let awayHits = document.querySelector('#away-hits');
  awayHits.textContent = awayTeam.totalHits;
  //
  document.querySelector('#home-team').classList.toggle('atbat', !topOfInning)
  document.querySelector('#away-team').classList.toggle('atbat', topOfInning)
  //
  return
  let tag = topOfInning ? 'a' : 'h';
  let id = `#${tag}${game.inningNumber}`
  if (game.currentInning) {
    document.querySelector(id).textContent = game.currentInning.runs;
  }
  try {
    document.querySelector('#info').textContent = game.inningTitle;
  } catch (e) {
    //game is probably over
  }
}

const updateBatter = (batter) => {
  document.querySelector('#batter #name').textContent = batter.name;
  document.querySelector('#batter #stat').textContent = batter.stats;
  document.querySelector('#batter #bats').textContent = batter.atBats.join(", ");
}

window.addEventListener('inningChange', () => {
  let keyFrame = {
    transform: ["scale(1)", "scale(3)", "scale(1)"],
  }
  let options = {
    easing: "ease-in-out", duration: 2000
  }
  document.querySelector('#info').animate(keyFrame, options)
});
let gameOver = false;
window.addEventListener('gameOver', () => {
  document.querySelector('svg').classList.add('gameover');
  gameOver = true;
  document.querySelector('button#roll').textContent = 'New Game?'
})

const loadPlayerList = (players, id) => {
  let form = document.querySelector(`#${id} form`);
  for (let player of players) {
    let input = document.createElement('input');
    input.value = player.name;
    form.appendChild(input);
  }
}

const updateRollResult = (roll, outcome, roller, batter) => {
  if (outcome === 'HR') {
    Organ.charge();
  }
  let div = document.querySelector('div#roll-result');
  roll.forEach((number, i) => {
    let text = String.fromCharCode(Die.faces[number]);
    let span = div.querySelector(`.die:nth-child(${i+1})`);
    span.textContent = text;
  })
  document.querySelector('#outcome').textContent = outcome;
  let animation = div.animate({
    transform: ["translateY(0)", `translateY(-100%)`, `translateY(-100%)`, "translateY(0)"],
    offset: [0, 0.2, 0.8, 1]
  }, {
    easing: "ease-in-out", fill: 'forwards', duration: 2000
  });
  animation.onfinish = () => {
    roller.disabled = false;
    updateBatter(batter);
  };
}

const updateField = (playersOnBase) => {
  for (let base=1; base<=3; base++) {
    let player = playersOnBase[base - 1];
    let rect = document.querySelector(`rect[data-base='${base}']`);
    rect.classList.toggle('occupied', !!player);
    let span = document.querySelector(`#runners span:nth-child(${base})`);
    span.textContent = player ? player.name : '';
  }
}

document.addEventListener('DOMContentLoaded', async (e) => {
  //web worker
  await sendMessage({url: '/database', method: 'post'});
  // sendMessage({url: '/teams/away'}).then(loadTeam);
  let newSingleGame = document.querySelector('#new-single-game');
  newSingleGame.addEventListener('click', async (e) => {
    let request = await sendMessage({url: '/games', method: 'post'});
    loadPlayerList(request.game.homeTeam.players, 'home');
    loadPlayerList(request.game.awayTeam.players, 'away');
    document.querySelector('#roll').disabled = false;
    let width = window.innerWidth;
    let container = document.querySelector('#x-snap');
    let x = 0;
    let step = 16;
    let steps = Math.floor(width / step);
    const xScroll = () => {
      if (x === steps) {
        container.scrollBy(width - (steps * step), 0);
      } else {
        container.scrollBy(step, 0);
        window.requestAnimationFrame(xScroll);
      }
      x++;
    }
    window.requestAnimationFrame(xScroll)
  })

  const callback = function(entries, observer) {
    for (let entry of entries) {
      if (entry.isIntersecting && Math.abs(entry.intersectionRatio) > 0.9) {
        let text;
        switch (entry.target.id) {
          case 'menu':
            text = "\u25A0\u25CB\u25CB\u25CB"
            break;
          case 'board':
            // allow a little time for snap scrolling to finalize
            setTimeout(positionBaseTags, 250);
            text = "\u25A1\u25CF\u25CB\u25CB"
            break;
          case 'home':
            text = "\u25A1\u25CB\u25CF\u25CB"
            break;
          case 'away':
            text = "\u25A1\u25CB\u25CB\u25CF"
            break;
        }
        document.querySelector('#indicator').textContent =  text;
      }
    };
  };
  const observer = new IntersectionObserver(callback, { threshold: 0.9 });
  for (let element of document.querySelectorAll('#x-snap > div')) {
    observer.observe(element);
  };

  let roller = document.querySelector('button#roll');
  roller.addEventListener('click', async (e) => {
    roller.disabled = true;
    let response = await sendMessage({url: `/games/roll`, method: 'post'})
    let { roll, outcome, playersOnBase, batter, scoreBoard } = response.result
    updateRollResult(roll, outcome, roller, batter);
    updateField(playersOnBase);
    updateScoreboard(scoreBoard);
  })

  //ios homescreen check
  if ('standalone' in navigator) {
    if (navigator.standalone) {
      // iOS includes top status bar in 100vh calc
      // so, correct it with innerHeight
      document.querySelector('#x-snap').style.setProperty('height', `${window.innerHeight}px`);
    } else {
      let button = document.querySelector('#pwa');
      button.classList.remove('hidden');
      button.addEventListener('click', (e) => {
        navigator.share({
          title: document.title,
          url: window.location,
        });
      })
    }
  }

})

const mq = window.matchMedia("(min-width: 500px)");
mq.addListener((e) => {
  if (mq.matches) {
    let container = document.querySelector('#x-snap');
    container.scrollLeft = 0;
    //check game state
  }
})
