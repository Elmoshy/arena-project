"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { Game } from "@/types/game";
import Badge from "@/components/ui/Badge";
import { fadeUp, viewportOnce } from "@/lib/animations";

const games: Game[] = [
  { id: "chess", status: "coming-soon" },
  { id: "checkers", status: "coming-soon" },
  { id: "connect-4", status: "coming-soon" },
  { id: "tic-tac-toe", status: "coming-soon" },
];

function ChessGlyph() {
  const cells = Array.from({ length: 16 });
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
      {cells.map((_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const dark = (row + col) % 2 === 0;
        return (
          <rect
            key={i}
            x={col * 16}
            y={row * 16}
            width="16"
            height="16"
            fill={dark ? "var(--color-primary)" : "transparent"}
            fillOpacity={dark ? 0.85 : 0}
          />
        );
      })}
      <rect x="0.5" y="0.5" width="63" height="63" rx="6" stroke="var(--color-border)" />
    </svg>
  );
}

function CheckersGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
      <rect x="0.5" y="0.5" width="63" height="63" rx="6" stroke="var(--color-border)" />
      {[8, 24, 40, 56].map((y, row) =>
        [8, 24, 40, 56].map((x, col) =>
          (row + col) % 2 === 0 ? (
            <circle
              key={`${row}-${col}`}
              cx={x}
              cy={y}
              r="6.5"
              fill="var(--color-primary)"
              fillOpacity={row < 2 ? 0.85 : 0.35}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

function ConnectFourGlyph() {
  const positions = [8, 24, 40, 56];
  const filled: Record<string, number> = {
    "0-1": 0.85,
    "1-1": 0.85,
    "2-1": 0.85,
    "0-2": 0.35,
    "1-3": 0.35,
  };
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
      <rect x="0.5" y="0.5" width="63" height="63" rx="6" stroke="var(--color-border)" />
      {positions.map((y, row) =>
        positions.map((x, col) => (
          <circle
            key={`${row}-${col}`}
            cx={x}
            cy={y}
            r="6.5"
            fill="var(--color-primary)"
            fillOpacity={filled[`${row}-${col}`] ?? 0.12}
          />
        )),
      )}
    </svg>
  );
}

function TicTacToeGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
      <rect x="0.5" y="0.5" width="63" height="63" rx="6" stroke="var(--color-border)" />
      <path d="M21.3 4V60M42.7 4V60M4 21.3H60M4 42.7H60" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d="M11 11L19 19M19 11L11 19" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="48" cy="15" r="5" stroke="var(--color-primary)" strokeWidth="2.5" fillOpacity="0" />
      <path d="M11 45L19 53M19 45L11 53" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

const glyphs: Record<Game["id"], () => React.ReactElement> = {
  chess: ChessGlyph,
  checkers: CheckersGlyph,
  "connect-4": ConnectFourGlyph,
  "tic-tac-toe": TicTacToeGlyph,
};

export default function GameCardGrid() {
  const t = useTranslations("Games");

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {games.map((game, index) => {
        const Glyph = glyphs[game.id];
        return (
          <motion.div
            key={game.id}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            custom={index * 0.08}
            viewport={viewportOnce}
            className="group relative rounded-2xl p-px"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/60 group-hover:via-primary/10 group-hover:to-transparent group-hover:opacity-100" />
            <div className="relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-transform duration-300 group-hover:-translate-y-1">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
              />
              <div className="relative flex items-start justify-between">
                <Glyph />
                {game.status === "coming-soon" ? (
                  <Badge variant="outline">{t("comingSoon")}</Badge>
                ) : null}
              </div>
              <div className="relative">
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-text">
                  {t(`items.${game.id}.name`)}
                </h3>
                <p className="mt-1.5 text-sm text-muted">
                  {t(`items.${game.id}.description`)}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
