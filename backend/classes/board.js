class Board {
    constructor() {
      this.startZones = {
        red: ['red', 'red', 'red', 'red'],
        blue: ['blue', 'blue', 'blue', 'blue'],
        green: ['green', 'green', 'green', 'green'],
        yellow: ['yellow', 'yellow', 'yellow', 'yellow'],
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

    clearBoard(){
      this.startZones = {
        red: [null, null, null, null],
        blue: [null, null, null, null],
        green: [null, null, null, null],
        yellow: [null, null, null, null],
      };
      
      this.boardSpaces = new Array(60).fill(null);

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
            if (pawn !== null) {
              pawns.push({ color: pawn, zone: 'start', position: index });
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

    initializeFromPawns(pawns, currentPlayerIdToColor) {
        this.clearBoard();
        
        //Iterate through pawns and set their positions on the board
        pawns.forEach((pawn) => {
          const color = currentPlayerIdToColor.get(pawn.current_player_id);
          const zone = pawn.zone;
          const position = pawn.position;

          if (zone === 'start') {
            this.startZones[color][position] = color;
          }
          else if (zone === 'board') {
            this.boardSpaces[position] = color;
          }
          else if (zone === 'safety') {
            this.safetyZones[color][position] = color;
          }
          else if (zone === 'home') {
            this.homeZones[color][position] = color;
          }
          else {
            throw new Error('Invalid pawn zone');
          }
        });
    }

    getPawnAtPosition(position, zone, zonecolor) {
        if (zone === 'start') {
          return this.startZones[zonecolor][position];
        }
        else if (zone === 'board') {
          return this.boardSpaces[position];
        }
        else if (zone === 'safety') {
          return this.safetyZones[zonecolor][position];
        }
        else if (zone === 'home') {
          return this.homeZones[zonecolor][position];
        }
        else {
          throw new Error('Invalid pawn zone');
        }
    }

    getNextHomePosition(color) {
      for (let i = 0; i < 4; i++) {
        if (this.homeZones[color][i] === null) {
          return i;
        }
      }
      return null;
    }
  }

  

  module.exports = Board;