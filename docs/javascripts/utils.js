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

export const unChunkParam = (url, name) => {
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

export const empty = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export const generateUUID = () => {
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
