class Board {
    constructor() {
      this.startZones = {// 1 is a pawn, 0 is empty
        red: [1, 1, 1, 1],
        blue: [1, 1, 1, 1],
        green: [1, 1, 1, 1],
        yellow: [1, 1, 1, 1],
      };
      
      this.boardSpaces = new Array(60).fill(null);
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
  // 59                                           16
  // 58                                           17
  // 57                                           18
  // 56                                           19
  // 55                                           20
  // 54                                           21
  // 53                                           22
  // 52                                           23
  // 51                                           24
  // 50                                           25
  // 49                                           26
  // 48                                           27
  // 47                                           28
  // 46                                           29
  // 45 44 43 42 41 40 39 38 37 36 35 34 33 32 31 30
  
      this.safetyZones = {
        red: [null, null, null, null, null],
        blue: [null, null, null, null, null],
        green: [null, null, null, null, null],
        yellow: [null, null, null, null, null],
      };
  
      this.homeZones = {
        red: [null, null, null, null],
        blue: [null, null, null, null],
        green: [null, null, null, null],
        yellow: [null, null, null, null],
      };
    }

    getPawns() {
        const pawns = [];
        const colors = ['red', 'blue', 'green', 'yellow'];
    
        // Get pawns from startZones
        colors.forEach((color) => {
          this.startZones[color].forEach((pawn, index) => {
            if (pawn === 1) {
              pawns.push({ color, zone: 'start', position: index });
            }
          });
        });
    
        // Get pawns from boardSpaces
        this.boardSpaces.forEach((pawn, index) => {
          if (pawn !== null) {
            pawns.push({ color: pawn, zone: 'board', position: index });
          }
        });
    
        // Get pawns from safetyZones
        colors.forEach((color) => {
          this.safetyZones[color].forEach((pawn, index) => {
            if (pawn !== null) {
              pawns.push({ color, zone: 'safety', position: index });
            }
          });
        });
    
        // Get pawns from homeZones
        colors.forEach((color) => {
          this.homeZones[color].forEach((pawn, index) => {
            if (pawn !== null) {
              pawns.push({ color, zone: 'home', position: index });
            }
          });
        });
    
        return pawns;
      }
  }

  module.exports = Board;