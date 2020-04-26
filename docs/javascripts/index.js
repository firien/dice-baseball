import { sendMessage } from './worker.js';

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
}

//ios homescreen check
if ('standalone' in navigator) {
  if (!navigator.standalone) {
    let button = document.querySelector('#pwa');
    button.classList.remove('hidden');
    document.addEventListener('click', (e) => {
      navigator.share({
        title: document.title,
        url: window.location,
      });
    })
  }
}

document.addEventListener('DOMContentLoaded', async (e) => {
  //web worker
  let response = await sendMessage('open');
  let newSingleGame = document.querySelector('#new-single-game');
  newSingleGame.addEventListener('click', (e) => {
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
})

const mq = window.matchMedia("(min-width: 500px)");
mq.addListener((e) => {
  if (mq.matches) {
    let container = document.querySelector('#x-snap');
    container.scrollLeft = 0;
    //check game state
  }
})

