class Rules {
    
    constructor(board, currentPlayer, action) {
      this.board = board;
      this.currentPlayer = currentPlayer;
      this.pawn = action.pawn;
      this.card = action.card;
      this.target = action.target;
    }
  
    calculateExpectedDestination(direction, spacesToMove, playerColor, currentPosition, currentZone) {
        let newPosition = currentPosition;
        let newZone = currentZone;
      
        for (let i = 0; i < spacesToMove; i++) {
          const result = this.simulateMovement(direction, playerColor, newPosition, newZone);
          newPosition = result.position;
          newZone = result.zone;
        }
      
        return { position: newPosition, zone: newZone };
      }

    // Simulates moving one space in the given direction from the given position and zone
    simulateMovement(direction, playerColor, currentPosition, currentZone) {
        
        const entryPosition = this.board.safetyZoneEntryPositions[playerColor];
        let newPosition = currentPosition;
        let newZone = currentZone;

        if (currentZone === 'board') {
            if (direction === 'forward') {
              if (currentPosition === 59) {
                newPosition = 0;
              } 
              else if (currentPosition === entryPosition) {
                newZone = 'safety';
                newPosition = 0;
              }
              else {
                newPosition = currentPosition + 1;
              }
            } else { // direction === 'backward'
              if (currentPosition === 0) {
                newPosition = 59;
              } else {
                newPosition = currentPosition - 1;
              }
            }
          } else if (currentZone === 'safety') {
            if (direction === 'forward') {
              if (currentPosition === 4) {
                newZone = 'home';
                newPosition = this.board.getNextHomePosition(playerColor);
                if (newPosition === null) {
                  throw new Error('No home position available');
                }
              }
              else {
                newPosition++;
              }
            } else { // direction === 'backward'
              if (currentPosition === 0) {
                newZone = 'board';
                newPosition = entryPosition + 1;
              }
              else {
                newPosition--;
              }
            }
          } else if (currentZone === 'home') {
            // No movement allowed in the home zone
            return { position: currentPosition, zone: currentZone };
          }
        
          return { position: newPosition, zone: newZone };
    }
    
    isValidDestination(currentPlayer, pawn, card, destination) {
        let expectedDestination;
        switch (card) {
            case '1':
                expectedDestination = this.calculateExpectedDestination('forward', 1, currentPlayer.player_color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '2':
                expectedDestination = this.calculateExpectedDestination('forward', 2, currentPlayer.player_color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '3':
                expectedDestination = this.calculateExpectedDestination('forward', 3, currentPlayer.player_color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '4':
                expectedDestination = this.calculateExpectedDestination('backward', 4, currentPlayer.player_color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '5':
                expectedDestination = this.calculateExpectedDestination('forward', 5, currentPlayer.player_color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '7':
                //For each possible number of spaces to move between 1 - 7, calculate the expected destination
                const possibleDestinations = [];
                for (let i = 1; i <= 7; i++) {
                    const expectedDestination = this.calculateExpectedDestination('forward', i, currentPlayer.player_color, pawn.position, pawn.zone);
                    possibleDestinations.push(expectedDestination);
                }

                if (!possibleDestinations.some(dest => dest.position === destination.position && dest.zone === destination.zone)) {
                    return false;
                }
                break;
            case '8':
                expectedDestination = this.calculateExpectedDestination('forward', 8, currentPlayer.player_color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '10':
                //Possible destinations are 10 spaces forward or 1 space backward
                const expectedDestinationForward = this.calculateExpectedDestination('forward', 10, currentPlayer.player_color, pawn.position, pawn.zone);
                const expectedDestinationBackward = this.calculateExpectedDestination('backward', 1, currentPlayer.player_color, pawn.position, pawn.zone);
                if ((expectedDestinationForward.position !== destination.position || expectedDestinationForward.zone !== destination.zone) &&
                    (expectedDestinationBackward.position !== destination.position || expectedDestinationBackward.zone !== destination.zone)) {
                    return false;
                }
                break;
            case '11':
                expectedDestination = this.calculateExpectedDestination('forward', 11, currentPlayer.player_color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '12':
                expectedDestination = this.calculateExpectedDestination('forward', 12, currentPlayer.player_color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            default:
                return true;
            }
    }
    
    isMoveValid(){
        /* move action = {
            pawn: { color: 'red', position: 4, zone: 'board' },
            card: '2',
            destination: { position: 6, zone: 'board' },
          } */
  
        //Check if move is being made by the correct player
        if (this.pawn.color !== this.currentPlayer.player_color) {
          return false;
        }
  
        //Check that pawn is not in start zone
        if (this.pawn.zone === 'start') {
          return false;
        }
  
        //Check that pawn is not in home zone
        if (this.pawn.zone === 'home') {
          return false;
        }
  
        //Check if the destination is a valid position/zone based on the card played and current state of the board
        if (!this.isValidDestination(this.currentPlayer, this.pawn, this.card, this.target)) {
            return false;
        }

        //Check if the destination is occupied by another pawn of the same color
        const colorOfPawnAtDestination = this.board.getPawnAtPosition(this.target.position, this.target.zone, this.currentPlayer.player_color);
        if (colorOfPawnAtDestination === this.currentPlayer.player_color) {
            return false;
        }

        return true;

      }

      isSwapValid(){
        /* swap action = {
    pawn: { color: 'red', position: 4, zone: 'board' },
    target: { color: 'blue', position: 6, zone: 'board' },
    card: '11',
  } */

        //Check if swap is being made by the correct player
        if (this.pawn.color !== this.currentPlayer.player_color) {
            return false;
        }

        //Check that pawn is not in start zone
        if (this.pawn.zone === 'start') {
            return false;
        }

        //Check that pawn is not in home zone
        if (this.pawn.zone === 'home') {
            return false;
        }

        //Check that target is not the same color as the pawn
        if (this.pawn.color === this.target.color) {
            return false;
        }

        //Check that target is not in start, home, or safe zone
        if (this.target.zone === 'start' || this.target.zone === 'home' || this.target.zone === 'safe') {
            return false;
        }

        //Check that card is an 11
        if (this.card !== '11') {
            return false;
        }

        return true;

      }
    
    canMoveOutOfStart(){
      /* start action = {
    pawn: { color: 'red', position: 1, zone: 'start' },
    card: '1',
    target: { position: 1, zone: 'board' },
  } */
      //Check if start is being made by the correct player
      if (this.pawn.color !== this.currentPlayer.player_color) {
        return false;
      }

      //Check that pawn is in start zone
      if (this.pawn.zone !== 'start') {
        return false;
      }

      //Check that card is a 1 or 2
      if (this.card !== '1' && this.card !== '2') {
        return false;
      }

      //Check if the destination is a valid start position and zone for the color of the pawn 
      if (this.target.position !== this.board.startPositions[this.pawn.color] || this.target.zone !== 'board') {
        return false;
      }

      //Check if the destination is occupied by another pawn of the same color
      const colorOfPawnAtDestination = this.board.getPawnAtPosition(this.target.position, this.target.zone, this.currentPlayer.player_color);
      if (colorOfPawnAtDestination === this.currentPlayer.player_color) {
        return false;
      }

      return true;
    }

    
}

module.exports = Rules;