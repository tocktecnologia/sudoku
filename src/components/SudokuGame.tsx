import React, { useState, useEffect, useCallback } from 'react';
import { Sudoku, Difficulty, DIFFICULTY_PARAMS } from '@/src/lib/sudoku';
import { SudokuGrid } from './SudokuGrid';
import { Theme } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Timer, Heart, Trophy, RefreshCcw, Home as HomeIcon, Undo2, Eraser, Pencil, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SudokuGameProps {
  difficulty: Difficulty;
  theme: Theme;
  onFinish: (time: number) => void;
  onQuit: () => void;
}

export const SudokuGame: React.FC<SudokuGameProps> = ({
  difficulty,
  theme,
  onFinish,
  onQuit
}) => {
  const [game, setGame] = useState(() => Sudoku.generate(difficulty));
  const [currentBoard, setCurrentBoard] = useState<number[][]>(() => game.board.map(r => [...r]));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [time, setTime] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [errorCells, setErrorCells] = useState<[number, number][]>([]);

  const params = DIFFICULTY_PARAMS[difficulty];

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isGameOver) setTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver]);

  const handleNumberInput = useCallback((num: number) => {
    if (!selectedCell || isGameOver) return;
    const [r, c] = selectedCell;
    if (game.board[r][c] !== 0) return; // Cannot edit initial clues

    if (game.solution[r][c] === num) {
      const newBoard = currentBoard.map(row => [...row]);
      newBoard[r][c] = num;
      setCurrentBoard(newBoard);
      
      // Check for win
      const won = newBoard.every((row, ri) => 
        row.every((val, ci) => val === game.solution[ri][ci])
      );
      
      if (won) {
        setIsGameOver(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        onFinish(time);
        toast.success("Parabéns! Você completou o Sudoku!");
      }
    } else {
      setMistakes(prev => {
        const next = prev + 1;
        if (next >= params.mistakes) {
          setIsGameOver(true);
          toast.error("Fim de Jogo! Você cometeu muitos erros.");
        }
        return next;
      });
      setErrorCells(prev => [...prev, [r, c]]);
      setTimeout(() => {
        setErrorCells(prev => prev.filter(cell => !(cell[0] === r && cell[1] === c)));
      }, 1000);
    }
  }, [selectedCell, isGameOver, currentBoard, game.board, game.solution, onFinish, params.mistakes, time]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberInput]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Count how many of each number are on board
  const counts = Array(10).fill(0);
  currentBoard.forEach(row => row.forEach(val => { if (val > 0) counts[val]++; }));

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-1">
      {/* Game Title */}
      <div className="flex flex-col items-center mt-4 mb-2">
        <h1 className="text-3xl font-bold text-[#2C3E50]">Sudoku Clássico</h1>
      </div>

      {/* Stats Bar */}
      <div className="w-full flex justify-between px-2 mb-4 text-[#7F8C8D]">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-tighter">Dificuldade</span>
          <span className="text-sm font-medium text-[#2C3E50] capitalize">{difficulty}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-tighter">Erros</span>
          <span className="text-sm font-medium text-[#2C3E50]">{mistakes}/{params.mistakes}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-tighter">Pontuação</span>
          <span className="text-sm font-medium text-[#2C3E50]">{currentBoard.flat().filter(v => v > 0).length * 10}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-tighter">Tempo</span>
          <span className="text-sm font-medium text-[#2C3E50] font-mono">{formatTime(time)}</span>
        </div>
      </div>

      {/* Main Board */}
      <SudokuGrid
        board={currentBoard}
        initialBoard={game.board}
        selectedCell={selectedCell}
        onCellClick={(r, c) => setSelectedCell([r, c])}
        errorCells={errorCells}
        theme={theme}
      />

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-8 w-full max-w-sm mt-8 mb-6">
        <button className="flex flex-col items-center gap-1 group">
           <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 group-hover:bg-blue-50 transition-colors">
              <Undo2 className="w-5 h-5 text-[#2C3E50]" />
           </div>
           <span className="text-[11px] font-medium text-[#7F8C8D]">Desfazer</span>
        </button>
        <button onClick={() => {
          if (selectedCell) {
            const [r, c] = selectedCell;
            if (game.board[r][c] === 0) {
              const newBoard = currentBoard.map(row => [...row]);
              newBoard[r][c] = 0;
              setCurrentBoard(newBoard);
            }
          }
        }} className="flex flex-col items-center gap-1 group">
           <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 group-hover:bg-blue-50 transition-colors">
              <Eraser className="w-5 h-5 text-[#2C3E50]" />
           </div>
           <span className="text-[11px] font-medium text-[#7F8C8D]">Apagar</span>
        </button>
        <button className="flex flex-col items-center gap-1 group">
           <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 group-hover:bg-blue-50 transition-colors">
              <Pencil className="w-5 h-5 text-[#2C3E50]" />
           </div>
           <span className="text-[11px] font-medium text-[#7F8C8D]">Notas</span>
        </button>
        <button onClick={() => {
            // Find an empty cell and fill it
            const emptyCells: [number, number][] = [];
            currentBoard.forEach((row, ri) => row.forEach((val, ci) => {
              if (val === 0) emptyCells.push([ri, ci]);
            }));
            if (emptyCells.length > 0) {
              const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
              const newBoard = currentBoard.map(row => [...row]);
              newBoard[r][c] = game.solution[r][c];
              setCurrentBoard(newBoard);
              setSelectedCell([r, c]);
            }
        }} className="flex flex-col items-center gap-1 group">
           <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 group-hover:bg-blue-50 transition-colors relative">
              <Lightbulb className="w-5 h-5 text-[#2C3E50]" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">1</div>
           </div>
           <span className="text-[11px] font-medium text-[#7F8C8D]">Dica</span>
        </button>
      </div>

      {/* Bottom Number Pad */}
      <div className="w-full flex justify-between gap-1 mt-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
          const isFull = counts[num] >= 9;
          return (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className={cn(
                "flex-1 py-1 rounded-lg transition-all active:scale-95",
                isFull ? "opacity-20 pointer-events-none" : "hover:bg-blue-50"
              )}
            >
              <span className="text-4xl text-[#3498DB] font-light leading-none">{num}</span>
            </button>
          );
        })}
      </div>
      
      {/* Footer / Back link */}
      <Button variant="ghost" onClick={onQuit} className="mt-8 mb-4 text-[#7F8C8D] hover:text-[#2C3E50]">
        Sair do Jogo
      </Button>
    </div>
  );
};
