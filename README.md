# Wayang Duel

An original Indonesian shadow-puppet card duel. You face **Dalang Seta**, the
puppet master, across the kelir screen: 20 life each, gamelan-beat energy that
grows every round, and a deck of wayang heroes and dalang tricks.

## How to play

- **Play a card:** click it, or press keys `1`–`7`. A card costs energy;
  energy refills and grows each round (up to 10).
- **End your turn:** click *Akhiri Giliran* or press `Space` / `Enter`. The
  dalang answers with his own cards, then a new round begins.
- **Hero cards** attack at once: their attack value hits the other side,
  reduced by shields.
- **Elements:** Api (fire, ▲ red) beats Angin, Angin (wind, ◆ teal) beats
  Tanah, Tanah (earth, ■ amber) beats Air, Air (water, ● blue) beats Api.
  Attacking into the other side's guard element deals **+2 damage**.
- **Combos:** playing two cards of the same element in one turn gives the
  second one **+1 damage**.
- **Action cards:** Keris Pusaka (damage), Perisai Gamelan (shield), Tari
  Topeng (draw), Bayangan (damage + draw), Gending Rampak (energy), Topeng
  Rangda (damage).
- Win by bringing the dalang to 0 life. Lose if your own life reaches 0.
  Press `R` (or click) on the end screen to play again.

## Screens

Title, table (your hand below, the dalang's hand above, both life totals),
win, and loss — all drawn in code, with keyboard and mouse play.

## Run it

```sh
node serve.ts   # serves game/ at http://localhost:8080
```

No build step, no network: every file the game loads lives under `game/`.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

An entry for the make.fun "Make the best card game" bounty
(best-card-game-20261122-1826). All art, names and sounds are original.
