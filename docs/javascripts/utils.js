export const noop = (e) => {
  e.preventDefault();
  e.stopPropagation();
}

export const chunkParam = (url, param, offer) => {
  const size = 250;
  const chunks = Math.floor(offer.length / size);
  for (let i=0; i<chunks; i++) {
    let start = i*size;
    let end = i === (chunks - 1) ? undefined : start + size;
    let chunk = offer.slice(start, end);
    url.searchParams.set(`${param}${i}`, chunk);
  }
}

export const unChunkParam = (name) => {
  let url = new URL(window.location);
  if (url.searchParams.has(`${name}0`)) {
    const chunks = 5;
    let string = '';
    for (let i=0; i<chunks; i++) {
      let param = `${name}${i}`;
      if (url.searchParams.has(param)) {
        string += url.searchParams.get(param);
      } else {
        break;
      }
    }
    return string;
  }
  return null;
}

export const logger = (message) => {
  console.log(message);
  let container = document.querySelector('#console');
  if (container) {
    let div = document.createElement('div');
    div.textContent = message;
    container.appendChild(div);
  }
}
