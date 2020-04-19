let randomValues = new Uint8Array(30);
let index = 0;
const refill = () => {
  self.crypto.getRandomValues(randomValues);
}
refill()
const getRandomValue = () => {
  let val = randomValues[index++];
  if (index === 30) {
    index = 0;
    refill();
  }
  return val;
}

class Die {
  static roll() {
    let i = getRandomValue();
    if (i > 251) {
      return this.roll();
    }
    return (i % 6) + 1;
  }
  static get faces() {
    return [
      null,
      0x2680,
      0x2681,
      0x2682,
      0x2683,
      0x2684,
      0x2685,
    ]
  }
}

export default Die;
