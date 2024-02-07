interface Player {
    name: string;
    passCount: number;
}

interface Bid {
    player: Player;
    suit: Suit | null; // Null indikerer et pass
    level: number;
}

interface Contract {
    suit: Suit;
    level: number;
}

enum Suit {
    Hearts = "Hearts",
    Diamonds = "Diamonds",
    Clubs = "Clubs",
    Spades = "Spades",
    NoSuit = "NoSuit" // For spill uten trumf
}

let currentBid: Bid | null = null;
let bids: Bid[] = [];
const players: Player[] = [
    { name: "Jonas", passCount: 0 },
    { name: "Marius", passCount: 0 },
];

function startBidding(players: Player[]): void {
    nextBid(players, 0);
}

function nextBid(players: Player[], playerIndex: number): void {
    const player = players[playerIndex];
    const bid = getBidFromPlayer(player);

    if (!isValidBid(bid)) {
        console.log(`Ugyldig bud fra ${player.name}. Prøv igjen.`);
        nextBid(players, playerIndex); // Prøv samme spiller igjen
        return;
    }

    currentBid = bid;
    bids.push(bid);

    if (isBiddingOver(players)) {
        const { winningBid, contract } = determineContract(bids);
        playHand(winningBid.player, contract);
    } else {
        nextBid(players, (playerIndex + 1) % players.length);
    }
}

function getBidFromPlayer(player: Player): Bid {
    // Dette er en stub. I en ekte implementasjon ville du hente input fra spilleren.
    return { player, suit: Suit.Hearts, level: 1 };
}

export function isValidBid(bid: Bid): boolean {
    if (bid.suit !== null && !Object.values(Suit).includes(bid.suit)) {
        return false;
    }
    if (bid.level < 1 || bid.level > 7) {
        return false;
    }
    return true;
}

export function isBiddingOver(players: Player[]): boolean {
    let consecutivePasses = 0;
    for (const bid of bids) {
        if (bid.suit) {
            consecutivePasses = 0; // Tilbakestill hvis et bud har en farge
        } else {
            consecutivePasses++;
            if (consecutivePasses >= 3) {
                return true;
            }
        }
    }
    return false; // Ingen 3 påfølgende pass funnet
}


function determineContract(bids: Bid[]): { winningBid: Bid; contract: Contract } {
    let winningBid = bids[0];
    for (const bid of bids) {
        if (bid.suit === winningBid.suit && bid.level > winningBid.level) {
            winningBid = bid;
        }
    }

    const contract: Contract = {
        suit: winningBid.suit!,
        level: winningBid.level,
    };

    return { winningBid, contract };
}

function playHand(player: Player, contract: Contract): void {
    console.log(`Kontrakten spilles av ${player.name} med ${contract.suit} som trumf og nivå ${contract.level}.`);
}

startBidding(players);
