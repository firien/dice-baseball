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
document.addEventListener('DOMContentLoaded', (e) => {
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
            positionBaseTags();
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

