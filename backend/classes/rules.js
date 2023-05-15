class Rules {
    
    calculateExpectedDestination(direction, spacesToMove, playerColor, currentPosition, currentZone) {
        let newPosition = currentPosition;
        let newZone = currentZone;
      
        for (let i = 0; i < spacesToMove; i++) {
          const result = moveOneSpace(direction, playerColor, newPosition, newZone);
          newPosition = result.position;
          newZone = result.zone;
        }
      
        return { position: newPosition, zone: newZone };
      }

    moveOneSpace(direction, playerColor, currentPosition, currentZone) {
        const safetyZoneEntryPositions = {
            red: 2,
            blue: 17,
            green: 32,
            yellow: 47
          };
        const entryPosition = safetyZoneEntryPositions[playerColor];
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
                newPosition = this.getNextHomePosition(playerColor);
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
                expectedDestination = this.calculateExpectedDestination('forward', 1, currentPlayer.color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '2':
                expectedDestination = this.calculateExpectedDestination('forward', 2, currentPlayer.color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '3':
                expectedDestination = this.calculateExpectedDestination('forward', 3, currentPlayer.color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '4':
                expectedDestination = this.calculateExpectedDestination('backward', 4, currentPlayer.color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '5':
                expectedDestination = this.calculateExpectedDestination('forward', 5, currentPlayer.color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '7':
                //For each possible number of spaces to move between 1 - 7, calculate the expected destination
                const possibleDestinations = [];
                for (let i = 1; i <= 7; i++) {
                    const expectedDestination = this.calculateExpectedDestination('forward', i, currentPlayer.color, pawn.position, pawn.zone);
                    possibleDestinations.push(expectedDestination);
                }

                if (!possibleDestinations.some(dest => dest.position === destination.position && dest.zone === destination.zone)) {
                    return false;
                }
                break;
            case '8':
                expectedDestination = this.calculateExpectedDestination('forward', 8, currentPlayer.color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '10':
                //Possible destinations are 10 spaces forward or 1 space backward
                const expectedDestinationForward = this.calculateExpectedDestination('forward', 10, currentPlayer.color, pawn.position, pawn.zone);
                const expectedDestinationBackward = this.calculateExpectedDestination('backward', 1, currentPlayer.color, pawn.position, pawn.zone);
                if ((expectedDestinationForward.position !== destination.position || expectedDestinationForward.zone !== destination.zone) &&
                    (expectedDestinationBackward.position !== destination.position || expectedDestinationBackward.zone !== destination.zone)) {
                    return false;
                }
                break;
            case '11':
                expectedDestination = this.calculateExpectedDestination('forward', 11, currentPlayer.color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            case '12':
                expectedDestination = this.calculateExpectedDestination('forward', 12, currentPlayer.color, pawn.position, pawn.zone);
                if (expectedDestination.position !== destination.position || expectedDestination.zone !== destination.zone) {
                    return false;
                }
                break;
            default:
                return true;
            }
    }
    
    isMoveValid(board, currentPlayer, move){
        /* move = {
            pawn: { color: 'red', position: 4, zone: 'board' },
            card: '2',
            destination: { position: 6, zone: 'board' },
          } */
        const pawn = move.pawn;
        const card = move.card;
        const destination = move.destination;
  
        //Check if move is being made by the correct player
        if (pawn.color !== currentPlayer.color) {
          return false;
        }
  
        //Check that pawn is not in start zone
        if (pawn.zone === 'start') {
          return false;
        }
  
        //Check that pawn is not in home zone
        if (pawn.zone === 'home') {
          return false;
        }
  
        //Check if the destination is a valid position/zone based on the card played and current state of the board
        if (!this.isValidDestination(currentPlayer, pawn, card, destination)) {
            return false;
        }

      }
}

module.exports = Rules;