// src/server.ts
import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

app.use(express.json());


enum Suit {
    Hearts = "Hearts",
    Diamonds = "Diamonds",
    Clubs = "Clubs",
    Spades = "Spades",
    NoSuit = "NoSuit"
}

interface Player {
    name: string;
    passCount: number;
}

interface Bid {
    player: Player;
    suit: Suit | null;
    level: number;
}

interface Contract {
    suit: Suit;
    level: number;
}

let currentBid: Bid | null = null;
let bids: Bid[] = [];
let gamePlayers: Player[] = []; // Har brukt et annet navn for å unngå konflikt med 'players' variabelen


let players: { name: string, mailboxId: number }[] = [];
let mailboxes: { id: number; name: string; messages: string[] }[] = [];
let contacts: string[] = [];



// Funksjoner for når bud er over og når man skal opprette kontrakt
function isBiddingOver(): boolean {
    // Sjekk om de siste tre budene er pass
    const passCount = bids.slice(-3).filter(bid => bid.suit === null).length;
    return passCount === 3;
}

function determineContract(bids: Bid[]): { winningBid: Bid; contract: Contract } {
    // Finn det siste gyldige budet før de tre påfølgende passene
    const lastNonPassBidIndex = bids.map(bid => bid.suit).lastIndexOf(null) - 3;
    const winningBid = bids[lastNonPassBidIndex];

    // Kontroller at vi faktisk fant et bud
    if (!winningBid) {
        throw new Error("Ingen vinnerbud funnet, noe er galt med logikken.");
    }

    const contract: Contract = {
        suit: winningBid.suit!,
        level: winningBid.level
    };

    return { winningBid, contract };
}


// Endpoint to register players
app.post('/register', (req: Request, res: Response) => {
    const playerName: string = req.body.playerName;

    if (!playerName) {
        return res.status(400).json({ success: false, error: 'Player name is required' });
    }

    // Create a unique ID for the mailbox
    const mailboxId = mailboxes.length + 1;

    // Create a mailbox for the player
    const newMailbox = { id: mailboxId, name: playerName, messages: [] };
    mailboxes.push(newMailbox);

    players.push({ name: playerName, mailboxId });
    return res.json({ success: true, message: `${playerName} registered successfully` });
});

// Endpoint to get the next player in turn
app.get('/nextPlayer', (req: Request, res: Response) => {
    if (players.length === 0) {
        return res.json({ success: false, error: 'No players registered' });
    }

    const nextPlayer = players.shift();
    return res.json({ success: true, nextPlayer });
});

// Start budgivningen og nullstill nødvendige variabler
app.post('/startBidding', (req: Request, res: Response) => {
    bids = [];
    currentBid = null;
    gamePlayers = []; //Her må vi kanskje fylle dette basert på app-behov
    // Legg til logikk her for å initialisere 'gamePlayers' basert på registrerte spillere eller en annen mekanisme
    return res.status(200).json({ success: true, message: 'Budgivningen startet' });
});

app.post('/placeBid', (req: Request, res: Response) => {
    const { name, suit, level } = req.body;
    const player = gamePlayers.find(p => p.name === name);

    if (!player) {
        return res.status(404).json({ success: false, message: 'Spiller ikke funnet' });
    }

    // Sjekk om 'suit' er en gyldig nøkkel i 'Suit' enum
    const isSuitValid = suit ? Object.values(Suit).includes(suit as Suit) : false;

    // Opprett 'bid' med sjekken for gyldig 'suit' eller null hvis ikke gyldig eller ikke oppgitt
    const bid: Bid = {
        player,
        suit: isSuitValid ? suit as Suit : null,
        level,
    };

    if (!isValidBid(bid)) {
        return res.status(400).json({ success: false, message: 'Ugyldig bud' });
    }

    bids.push(bid);
    currentBid = bid; // Oppdater gjeldende bud

    if (isBiddingOver()) {
        const { winningBid, contract } = determineContract(bids);
        return res.status(200).json({
            success: true,
            message: 'Budgivningen er over',
            winningBid: winningBid.player.name,
            contract
        });
    }

    return res.status(200).json({ success: true, message: 'Bud mottatt', bid });
});



// Endpoint to deal cards
app.post('/dealCards', (req: Request, res: Response) => {
    const players = req.body.players;
    const cards = [...Array(52)].map((_, i) => i);

    // Shuffle the cards
    cards.sort(() => Math.random() - 0.5);

    // Deal cards to players
    for (const player of players) {
        const playerCards = cards.splice(0, 13);
        player.cards = playerCards;
    }

    return res.json({ success: true, players });
});

// Endpoint to get the points of a hand
app.get('/getPoints', (req: Request, res: Response) => {
    // Extract the hand from the request body
    const hand: string[] = req.body.hand;

    // Convert the hand to an array of card values
    const cardValues = hand.map((card) => card[0]);

    // Create a map of card values to points
    const pointsMap: { [card: string]: number } = {
        'A': 4,
        'K': 3,
        'Q': 2,
        'J': 1,
    };

    // Calculate the points of the hand
    let points = 0;
    for (const cardValue of cardValues) {
        const pointsForCard = pointsMap[cardValue];
        if (pointsForCard) {
            points += pointsForCard;
        }
    }

    // Return the calculated points
    return res.json({ success: true, points });
});


// Endpoint to list mailboxes
app.get('/mailboxes', (req: Request, res: Response) => {
    return res.json({ success: true, mailboxes });
});

// Endpoint to list messages in a mailbox
app.get('/mailboxes/:mailboxId/messages', (req: Request, res: Response) => {
    const { mailboxId } = req.params;
    const selectedMailbox = mailboxes.find((mailbox) => mailbox.id === parseInt(mailboxId));

    if (!selectedMailbox) {
        return res.status(404).json({ success: false, error: 'Mailbox not found' });
    }

    return res.json({ success: true, messages: selectedMailbox.messages });
});

// Endpoint to get a message in a mailbox
app.get('/mailboxes/:mailboxId/messages/:messageId', (req: Request, res: Response) => {
    const { mailboxId, messageId } = req.params;
    const selectedMailbox = mailboxes.find((mailbox) => mailbox.id === parseInt(mailboxId));

    if (!selectedMailbox) {
        return res.status(404).json({ success: false, error: 'Mailbox not found' });
    }

    const selectedMessage = selectedMailbox.messages[parseInt(messageId)];

    if (!selectedMessage) {
        return res.status(404).json({ success: false, error: 'Message not found' });
    }

    return res.json({ success: true, message: selectedMessage });
});

// Endpoint to delete a message in a mailbox
app.delete('/mailboxes/:mailboxId/messages/:messageId', (req: Request, res: Response) => {
    const { mailboxId, messageId } = req.params;
    const selectedMailbox = mailboxes.find((mailbox) => mailbox.id === parseInt(mailboxId));

    if (!selectedMailbox) {
        return res.status(404).json({ success: false, error: 'Mailbox not found' });
    }

    const deletedMessage = selectedMailbox.messages.splice(parseInt(messageId), 1);

    if (!deletedMessage || deletedMessage.length === 0) {
        return res.status(404).json({ success: false, error: 'Message not found' });
    }

    return res.json({ success: true, message: 'Message deleted successfully' });
});

// Endpoint to send a message to a mailbox
app.post('/mailboxes/:mailboxId/messages', (req: Request, res: Response) => {
    const { mailboxId } = req.params;
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const selectedMailbox = mailboxes.find((mailbox) => mailbox.id === parseInt(mailboxId));

    if (!selectedMailbox) {
        return res.status(404).json({ success: false, error: 'Mailbox not found' });
    }

    selectedMailbox.messages.push(message);
    return res.json({ success: true, message: 'Message sent successfully' });
});

// Endpoint to list contacts
app.get('/contacts', (req: Request, res: Response) => {
    return res.json({ success: true, contacts });
});

// Endpoint to add a contact
app.post('/contacts', (req: Request, res: Response) => {
    const { contact } = req.body;

    if (!contact) {
        return res.status(400).json({ success: false, error: 'Contact is required' });
    }

    contacts.push(contact);
    return res.json({ success: true, message: 'Contact added successfully' });
});

app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});


// Denne brukes i powershell for å registrere bruker
//Invoke-RestMethod -Uri "http://localhost:3000/register" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"playerName": "Player1"}'

// neste spiller
//Invoke-RestMethod -Uri "http://localhost:3000/nextPlayer" -Method Get
