// Imports
const express = require('express');

// Konstanter
const REGLER = {
  "pass": "Pass",
  "1": "Har 1 kort i fargen",
  "2": "Har 2 kort i fargen",
  "1X": "Har 5 kort i fargen og 8 HP",
  "2X": "Har 5 kort i fargen og 10 HP",
  "X": "Har 8-10 kort i fargen",
  "XX": "Har 11-12 kort i fargen",
  "XXX": "Har 13 kort i fargen",
};

// Funksjoner
function toNumber(melding: string): number {
  switch (melding) {
    case "pass":
      return 0;
    case "1":
      return 1;
    case "2":
      return 2;
    case "1X":
      return 5;
    case "2X":
      return 5;
    case "X":
      return 8;
    case "XX":
      return 10;
    case "XXX":
      return 13;
    default:
      throw new Error(`Ukjent melding: ${melding}`);
  }
}

function spørre(melding: string): string {
  if (REGLER[melding]) {
    return REGLER[melding];
  }

  return "Hva betyr melding ${melding}?";
}

function oppdaterRegler(regler: Record<string, string>, melding: string, svar: string) {
  regler[melding] = svar;
  return regler;
}

// Server
const app = express();
app.use(express.json())    // <==== parse request body as JSON

// /melding
app.post("/melding", (req: any, res: any) => {
  console.log(req.body)
  const melding = req.body.melding;
  const antallKort = toNumber(melding);
  res.send({ antallKort });
});

// /spørre
app.post("/spørre", (req: any, res: any) => {
  const melding = req.body.melding;
  const svar = spørre(melding);
  res.send({ svar });
});


app.get("/", function (req: any, res: any) {
  res.render("index.html");
});


// Start server
app.listen(5500, () => {
  console.log("Server startet på port 5500");
});