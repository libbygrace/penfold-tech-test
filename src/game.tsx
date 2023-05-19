import { useState } from 'react';
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from './types';
import { log } from 'console';

//UI Elements
const CardBackImage = () => (
  <img src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: 'player_turn',
  };
};

//Scoring
const calculateHandScore = (hand: Hand): number => {
  let total = 0;

  total += hand.reduce((n, { rank }) => {
    if (rank !== CardRank.Ace) {
      let rankValue: number;
      switch (rank) {
        case CardRank.Jack:
        case CardRank.Queen:
        case CardRank.King:
          rankValue = 10;
          break;
        default:
          rankValue = parseInt(rank, 10);
      }
      return n + rankValue;
    }

    return n;
  }, 0);

  const aces: Hand = hand.filter(({ rank }) => rank === CardRank.Ace);

  aces.forEach(() => {
    if (total + 11 > 21) {
      total += 1;
    } else if (total + 11 === 21) {
      if (aces.length > 1) {
        total += 1;
      } else {
        total += 11;
      }
    } else {
      total += 11;
    }
  });

  return total;
};

const determineBlackJack = (hand: Hand): boolean => hand.length === 2;

const determineGameResult = (state: GameState): GameResult => {
  const dealerHandTotal = calculateHandScore(state.dealerHand);
  const playerHandTotal = calculateHandScore(state.playerHand);

  if (dealerHandTotal > 21 && playerHandTotal > 21) {
    //If both hands bust
    return 'no_result';
  } else if (
    playerHandTotal > 21 ||
    (dealerHandTotal > playerHandTotal && dealerHandTotal <= 21)
  ) {
    //If player hand bust or dealer hand valid score but higher than player
    return 'dealer_win';
  } else if (
    dealerHandTotal > 21 ||
    (playerHandTotal > dealerHandTotal && playerHandTotal <= 21)
  ) {
    //If dealer hand bust or player hand valid score but higher than dealer
    return 'player_win';
  } else if (playerHandTotal === dealerHandTotal) {
    if (playerHandTotal === 21) {
      //Determine if blackjack
      const playerHand = determineBlackJack(state.playerHand);

      const dealerHand = determineBlackJack(state.dealerHand);

      if (playerHand && dealerHand) {
        // If both player hand and dealer hand equals blackjack
        return 'draw';
      } else if (playerHand && !dealerHand) {
        // If player has blackjack but the dealer doesn't
        return 'player_win';
      } else if (!playerHand && dealerHand) {
        // If dealer has blackjack but the player doesn't
        return 'dealer_win';
      }
    } else {
      //If both score the same
      return 'draw';
    }
  }
  return 'no_result';
};

//Player Actions
const playerStands = (state: GameState): GameState => {
  const dealerTotal = calculateHandScore(state.dealerHand);

  if (dealerTotal <= 16) {
    const { card, remaining } = takeCard(state.cardDeck);
    return {
      ...state,
      cardDeck: remaining,
      dealerHand: [...state.dealerHand, card],
      turn: 'dealer_turn',
    };
  }

  return {
    ...state,
    turn: 'dealer_turn',
  };
};

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};

//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === 'dealer_turn'}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === 'dealer_turn'}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === 'player_turn' && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}
      {state.turn === 'dealer_turn' &&
      determineGameResult(state) != 'no_result' ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};
