class Deck {
  constructor() {
    this.drawPile = this.createDrawPile();
    this.discardPile = [];
    this.activeCard = "none";
    this.shuffle(this.drawPile);
  }

  createDrawPile() {
    const cards = [];
    const cardTypes = [
      { type: "1", count: 5 },
      { type: "2", count: 4 },
      { type: "3", count: 4 },
      { type: "4", count: 4 },
      { type: "5", count: 4 },
      { type: "7", count: 4 },
      { type: "8", count: 4 },
      { type: "10", count: 4 },
      { type: "11", count: 4 },
      { type: "12", count: 4 },
      { type: "sorry", count: 4 },
    ];

    cardTypes.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        cards.push(type);
      }
    });

    return cards;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  drawCard() {
    if (this.drawPile.length === 0) {
      this.resetDrawPile();
    }
    const card = this.drawPile.pop();
    this.activeCard = card;
    return card;
  }

  discardCard(card) {
    this.activeCard = "none";
    this.discardPile.push(card);
  }

  resetDrawPile() {
    this.drawPile = this.discardPile;
    this.discardPile = [];
    this.shuffle(this.drawPile);
  }

  getCards() {
    const cards = [];

    this.drawPile.forEach((cardType) => {
      cards.push({ type: cardType, isUsed: false });
    });

    this.discardPile.forEach((cardType) => {
      cards.push({ type: cardType, isUsed: true });
    });

    return cards;
  }

  initializeFromCards(cards) {
    this.drawPile = [];
    this.discardPile = [];

    cards.forEach((card) => {
      if (card.is_used) {
        this.discardPile.push(card.card_type);
      } else {
        this.drawPile.push(card.card_type);
      }
    });
  }
}

module.exports = Deck;
