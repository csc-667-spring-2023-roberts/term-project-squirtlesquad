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

      this.safetyZoneEntryPositions = {
        red: 2,
        blue: 17,
        yellow: 32,
        green: 47
      };
      this.startPositions = {
        red: 4,
        blue: 19,
        yellow: 34,
        green: 49,
      };
      this.slidePositions = {
        red: {small : {start: 1, end: 4}, large: {start: 9, end: 13}},
        blue: {small : {start: 16, end: 19}, large: {start: 22, end: 26}},
        yellow: {small : {start: 31, end: 34}, large: {start: 39, end: 43}},
        green: {small : {start: 46, end: 49}, large: {start: 54, end: 58}},
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

    getNextStartPosition(color) {
      for (let i = 0; i < 4; i++) {
        if (this.startZones[color][i] === null) {
          return i;
        }
      }
      return null;
    }

    checkForSlide(pawnColor, position){
      for (let color in this.slidePositions) {
        if (color !== pawnColor) {
          // Check the small slide
          if (position === this.slidePositions[color].small.start) {
            return { slideColor: color, slideType: 'small', slideLength: 4, start: this.slidePositions[color].small.start, end: this.slidePositions[color].small.end };
          }
          // Check the large slide
          if (position === this.slidePositions[color].large.start) {
            return { slideColor: color, slideType: 'large', slideLength: 5, start: this.slidePositions[color].large.start, end: this.slidePositions[color].large.end };
          }
        }
      }
    }

    changePawnPosition(beginPosition, beginZone, beginZoneColor, endPosition, endZone, endZoneColor) {
      let pawnColor = null;
      if (beginZone === 'start') {
        pawnColor = this.startZones[beginZoneColor][beginPosition];
        this.startZones[beginZoneColor][beginPosition] = null;
      }
      else if (beginZone === 'board') {
        pawnColor = this.boardSpaces[beginPosition];
        this.boardSpaces[beginPosition] = null;
      }
      else if (beginZone === 'safety') {
        pawnColor = this.safetyZones[beginZoneColor][beginPosition];
        this.safetyZones[beginZoneColor][beginPosition] = null;
      }
      else if (beginZone === 'home') {
        pawnColor = this.homeZones[beginZoneColor][beginPosition];
        this.homeZones[beginZoneColor][beginPosition] = null;
      }
      else {
        throw new Error('Invalid pawn zone');
      }

      if (endZone === 'start') {
        this.startZones[endZoneColor][endPosition] = pawnColor;
      }
      else if (endZone === 'board') {
        this.boardSpaces[endPosition] = pawnColor;
      }
      else if (endZone === 'safety') {
        this.safetyZones[endZoneColor][endPosition] = pawnColor;
      }
      else if (endZone === 'home') {
        this.homeZones[endZoneColor][endPosition] = pawnColor;
      }
      else {
        throw new Error('Invalid pawn zone');
      }
    }

    swapPawnPositions(pawn1Position, pawn1Zone, pawn1ZoneColor, pawn2Position, pawn2Zone, pawn2ZoneColor) {
      let pawn1Color = this.getPawnAtPosition(pawn1Position, pawn1Zone, pawn1ZoneColor);
      let pawn2Color = this.getPawnAtPosition(pawn2Position, pawn2Zone, pawn2ZoneColor);

      if (pawn1Zone === 'start') {
        this.startZones[pawn1ZoneColor][pawn1Position] = pawn2Color;
      }
      else if (pawn1Zone === 'board') {
        this.boardSpaces[pawn1Position] = pawn2Color;
      }
      else if (pawn1Zone === 'safety') {
        this.safetyZones[pawn1ZoneColor][pawn1Position] = pawn2Color;
      }
      else if (pawn1Zone === 'home') {
        this.homeZones[pawn1ZoneColor][pawn1Position] = pawn2Color;
      }
      else {
        throw new Error('Invalid pawn zone');
      }
      if (pawn2Zone === 'start') {
        this.startZones[pawn2ZoneColor][pawn2Position] = pawn1Color;
      }
      else if (pawn2Zone === 'board') {
        this.boardSpaces[pawn2Position] = pawn1Color;
      }
      else if (pawn2Zone === 'safety') {
        this.safetyZones[pawn2ZoneColor][pawn2Position] = pawn1Color;
      }
      else if (pawn2Zone === 'home') {
        this.homeZones[pawn2ZoneColor][pawn2Position] = pawn1Color;
      }
      else {
        throw new Error('Invalid pawn zone');
      }

    }
  }

  

  module.exports = Board;