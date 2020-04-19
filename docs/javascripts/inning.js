class Inning {
  constructor() {
    this.outs = 0;
    this.runs = 0;
  }
  addRuns(x) {
    this.runs += x;
  }
  //returns true if inning is over
  addOuts(x) {
    this.outs += x;
    return this.outs >= 3;
  }
}

export default Inning;
