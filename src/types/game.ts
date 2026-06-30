export type GameStatus = "live" | "coming-soon";

export interface Game {
  id: "chess" | "checkers" | "connect-4" | "tic-tac-toe";
  status: GameStatus;
}
