import React from 'react';
import { cn } from '@/lib/utils';
import { Theme } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';

interface SudokuGridProps {
  board: number[][];
  initialBoard: number[][];
  selectedCell: [number, number] | null;
  onCellClick: (row: number, col: number) => void;
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
  const themeGridStyles: Record<string, {
    majorBorder: string;
    minorBorder: string;
    relatedCell: string;
    sameValueCell: string;
    initialNumber: string;
    playerNumber: string;
  }> = {
    Classic: {
      majorBorder: 'border-[#34495E]',
      minorBorder: 'border-[#BDC3C7]',
      relatedCell: 'bg-[#EBF5FB]',
      sameValueCell: 'bg-[#D8ECFF]',
      initialNumber: 'text-[#1A2B3B] font-semibold',
      playerNumber: 'text-[#1D72D8] font-semibold',
    },
    'Dark Slate': {
      majorBorder: 'border-slate-500',
      minorBorder: 'border-slate-600',
      relatedCell: 'bg-slate-700/70',
      sameValueCell: 'bg-sky-900/55',
      initialNumber: 'text-slate-100 font-semibold',
      playerNumber: 'text-sky-300 font-semibold',
    },
    Forest: {
      majorBorder: 'border-emerald-600',
      minorBorder: 'border-emerald-800/80',
      relatedCell: 'bg-emerald-800/65',
      sameValueCell: 'bg-emerald-700/75',
      initialNumber: 'text-emerald-50 font-semibold',
      playerNumber: 'text-emerald-300 font-semibold',
    },
    Minimalist: {
      majorBorder: 'border-black',
      minorBorder: 'border-gray-300',
      relatedCell: 'bg-gray-100',
      sameValueCell: 'bg-blue-100',
      initialNumber: 'text-black font-semibold',
      playerNumber: 'text-blue-700 font-semibold',
    },
  };

  const visual = themeGridStyles[theme.name] ?? themeGridStyles.Classic;
  const selectedValue = selectedCell ? board[selectedCell[0]][selectedCell[1]] : 0;
  const boardSize = 'min(98vw, calc(100dvh - clamp(220px, 34dvh, 360px)), 920px)';

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

  const isSameValue = (r: number, c: number) =>
    selectedValue !== 0 && board[r][c] === selectedValue;

  return (
    <div
      className="relative mx-auto"
      style={{ width: boardSize, height: boardSize, maxWidth: '100%' }}
    >
      <div className={cn(
        'grid grid-cols-9 border-[3px] w-full h-full shadow-sm',
        theme.cell,
        visual.majorBorder
      )}>
        {board.map((row, rIdx) => 
          row.map((val, cIdx) => {
            const isInitial = initialBoard[rIdx][cIdx] !== 0;
            const selected = isSelected(rIdx, cIdx);
            const related = isRelated(rIdx, cIdx);
            const error = isError(rIdx, cIdx);
            const sameValue = isSameValue(rIdx, cIdx);

            return (
              <motion.div
                key={`${rIdx}-${cIdx}`}
                id={`cell-${rIdx}-${cIdx}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCellClick(rIdx, cIdx)}
                className={cn(
                  'relative flex items-center justify-center text-[clamp(1.75rem,6.7vw,3.15rem)] cursor-pointer transition-all duration-100 border-[0.5px] h-full select-none',
                  theme.cell,
                  visual.minorBorder,
                  related && !selected && !sameValue && !error && visual.relatedCell,
                  sameValue && !selected && !error && visual.sameValueCell,
                  selected && !error && theme.selected,
                  error && theme.error,
                  rIdx % 3 === 0 && rIdx !== 0 && `border-t-[3px] ${visual.majorBorder}`,
                  cIdx % 3 === 0 && cIdx !== 0 && `border-l-[3px] ${visual.majorBorder}`
                )}
              >
                <AnimatePresence mode="wait">
                  {val !== 0 && (
                    <motion.span
                      key={val}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        isInitial ? visual.initialNumber : visual.playerNumber,
                        error && 'text-red-600 font-bold'
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
