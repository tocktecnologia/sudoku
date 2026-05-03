/**
 * Sudoku Utility for generating and solving puzzles.
 */

export type Difficulty = 'easy' | 'medium' | 'moderate' | 'hard';

export interface GameParams {
  clues: number;
  mistakes: number;
}

export const DIFFICULTY_PARAMS: Record<Difficulty, GameParams> = {
  easy: { clues: 40, mistakes: 5 },
  medium: { clues: 32, mistakes: 4 },
  moderate: { clues: 26, mistakes: 3 },
  hard: { clues: 22, mistakes: 3 },
};

export class Sudoku {
  static isValid(board: number[][], row: number, col: number, num: number): boolean {
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
      if (board[x][col] === num) return false;
    }

    const startRow = row - (row % 3);
    const startCol = col - (col % 3);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  }

  static solve(board: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (this.isValid(board, row, col, num)) {
              board[row][col] = num;
              if (this.solve(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  static generate(difficulty: Difficulty): { board: number[][], solution: number[][] } {
    const solution: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
    this.solve(solution);

    const board = solution.map(row => [...row]);
    const { clues } = DIFFICULTY_PARAMS[difficulty];
    let attempts = 81 - clues;

    while (attempts > 0) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if (board[row][col] !== 0) {
        board[row][col] = 0;
        attempts--;
      }
    }

    return { board, solution };
  }

  static serialize(board: number[][]): string {
    return board.flat().join('');
  }

  static deserialize(str: string): number[][] {
    const board: number[][] = [];
    for (let i = 0; i < 9; i++) {
      board.push(str.slice(i * 9, (i + 1) * 9).split('').map(Number));
    }
    return board;
  }
}
