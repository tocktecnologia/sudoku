import React from 'react';
import { cn } from '@/lib/utils';
import { Theme } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';

interface SudokuGridProps {
  board: number[][];
  initialBoard: number[][];
  selectedCell: [number, number] | null;
  onCellClick: (row: number, col: number) => void;
  onNumberSelect: (num: number) => void;
  errorCells: [number, number][];
  theme: Theme;
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({
  board,
  initialBoard,
  selectedCell,
  onCellClick,
  errorCells,
  theme
}) => {
  const isSelected = (r: number, c: number) => 
    selectedCell?.[0] === r && selectedCell?.[1] === c;

  const isRelated = (r: number, c: number) => {
    if (!selectedCell) return false;
    const [sr, sc] = selectedCell;
    if (sr === r || sc === c) return true;
    const sBlockR = Math.floor(sr / 3);
    const sBlockC = Math.floor(sc / 3);
    const rBlockR = Math.floor(r / 3);
    const rBlockC = Math.floor(c / 3);
    return sBlockR === rBlockR && sBlockC === rBlockC;
  };

  const isError = (r: number, c: number) =>
    errorCells.some(([er, ec]) => er === r && ec === c);

  return (
    <div className="relative w-full max-w-[min(96vw,680px)] aspect-square mx-auto">
      <div className={cn(
        "grid grid-cols-9 border-[3px] w-full h-full shadow-sm bg-white",
        "border-[#34495E]"
      )}>
        {board.map((row, rIdx) => 
          row.map((val, cIdx) => {
            const isInitial = initialBoard[rIdx][cIdx] !== 0;
            const selected = isSelected(rIdx, cIdx);
            const related = isRelated(rIdx, cIdx);
            const error = isError(rIdx, cIdx);

            return (
              <motion.div
                key={`${rIdx}-${cIdx}`}
                id={`cell-${rIdx}-${cIdx}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCellClick(rIdx, cIdx)}
                className={cn(
                  "relative flex items-center justify-center text-[clamp(1.25rem,4.8vw,2.25rem)] cursor-pointer transition-all duration-100 border-[0.5px]",
                  "border-[#BDC3C7]",
                  theme.text,
                  related && !selected && !error && "bg-[#EBF5FB]",
                  selected && !error && "bg-[#AED6F1]",
                  error && "bg-red-50 text-red-500 font-bold",
                  rIdx % 3 === 0 && rIdx !== 0 && "border-t-[3px] border-t-[#34495E]",
                  cIdx % 3 === 0 && cIdx !== 0 && "border-l-[3px] border-l-[#34495E]",
                  "h-full select-none"
                )}
              >
                <AnimatePresence mode="wait">
                  {val !== 0 && (
                    <motion.span
                      key={val}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        isInitial ? "font-normal text-[#1A2B3B]" : "font-light text-[#3498DB]"
                      )}
                    >
                      {val}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
