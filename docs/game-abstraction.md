# Game Abstraction

How Tic Tac Toe, Connect 4, Checkers, Chess, and Ludo all sit on the same
architecture without the room/runtime layer knowing the rules of any of
them.

## The shared contract

Everything funnels through `GameEngine<TBoard, TPayload>`
(`src/features/games/core/types.ts`):

```ts
interface GameEngine<TBoard, TPayload> {
  config: GameConfig;
  createInitialState: (players: Player[]) => GameState<TBoard>;
  applyAction: (state: GameState<TBoard>, action: GameAction<TPayload>) => GameState<TBoard>;
  isValidAction: (state: GameState<TBoard>, action: GameAction<TPayload>) => boolean;
  checkWinner: (state: GameState<TBoard>) => PlayerId | "draw" | null;
}
```

The room/runtime layer (rooms, realtime sync, the future UI shell) only
ever calls these four functions and reads `GameState`/`GameAction`. It
never touches a board cell, a chess square, or a Connect 4 column directly.
That's what makes it game-agnostic: swap which `GameEngine` is loaded for
a room, and the same room/lobby/realtime code works unmodified.

Each concrete game's only job (in a later phase) is to pick its own
`TBoard` and `TPayload` and implement those four functions. **None of the
sketches below are implemented in this phase** — they exist purely to show
that the same `GameEngine` shape genuinely fits all three games.

## Tic Tac Toe

```ts
type Cell = "X" | "O" | null;
type TicTacToeBoard = Cell[]; // length 9

interface TicTacToeMove {
  cell: number; // 0–8
}
```

- `createInitialState` → 9 `null` cells, two players seated at 0/1.
- `applyAction` → sets `board[payload.cell]` to the moving player's mark.
- `isValidAction` → cell index in range, cell currently `null`, it's that
  player's `currentTurn`.
- `checkWinner` → checks the 8 standard win lines, or `"draw"` if all 9
  cells are filled with no winner.

## Connect 4

```ts
type Cell = "R" | "Y" | null;
type ConnectFourBoard = Cell[][]; // 6 rows x 7 columns

interface ConnectFourMove {
  column: number; // 0–6
}
```

- `createInitialState` → empty 6×7 grid.
- `applyAction` → drops the player's disc into the lowest empty row of
  `payload.column` (the action only names a column; the engine computes
  which row it lands in — this is exactly the kind of game-specific logic
  that lives inside `applyAction` and nowhere else).
- `isValidAction` → column in range and not already full.
- `checkWinner` → checks for 4-in-a-row horizontally, vertically, and on
  both diagonals.

## Chess

```ts
type Square = string; // e.g. "e4"
type ChessBoard = Record<Square, Piece | null>;

interface Piece {
  type: "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
  color: "white" | "black";
}

interface ChessMove {
  from: Square;
  to: Square;
  promotion?: Piece["type"];
}
```

- `createInitialState` → standard starting position, white seated at 0.
- `applyAction` → moves the piece at `from` to `to`, handling captures,
  castling, en passant, and promotion inside this one function — chess has
  by far the most game-specific complexity of the three, and that
  complexity is fully contained here. The generic `GameState` wrapper
  around it doesn't grow any new fields to accommodate chess specifically;
  chess-only data (e.g. castling rights, en passant target) lives in
  `GameState.meta`, which exists for precisely this.
- `isValidAction` → legal-move generation: piece movement rules, check/
  pin detection, whose turn it is.
- `checkWinner` → checkmate, stalemate (`"draw"`), or other draw
  conditions (threefold repetition, 50-move rule).

## Why this holds together

The three games above differ enormously in rule complexity — Tic Tac Toe's
`applyAction` is a one-line array write, Chess's is a small rules engine.
The architecture doesn't try to make that complexity uniform; it only
requires that complexity stay **behind** the same four-function interface.
`GameState<TBoard>` and `GameAction<TPayload>` are generic specifically so
each game can be as simple or as complex as its rules demand, while
`GameConfig` (a plain data object: `id`, `name`, `minPlayers`,
`maxPlayers`, `isTurnBased`) is enough for the lobby/room UI to list,
describe, and seat players for *any* of them without importing a single
game's engine until a room actually starts that game.
