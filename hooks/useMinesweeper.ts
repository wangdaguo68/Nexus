import { useState, useCallback } from 'react';

export interface Cell {
  x: number;
  y: number;
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  count: number;
}

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export const DIFFICULTY_SETTINGS: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  Beginner: { rows: 9, cols: 9, mines: 10 },
  Intermediate: { rows: 12, cols: 12, mines: 20 }, // Adjusted for mobile
  Advanced: { rows: 15, cols: 15, mines: 40 },
  Expert: { rows: 15, cols: 20, mines: 50 },
};

export const useMinesweeper = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const initBoard = useCallback((diff: Difficulty = difficulty) => {
    const { rows, cols } = DIFFICULTY_SETTINGS[diff];
    const newBoard: Cell[][] = [];
    for (let y = 0; y < rows; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < cols; x++) {
        row.push({ x, y, isMine: false, isOpen: false, isFlagged: false, count: 0 });
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setGameOver(false);
    setWon(false);
    setGameStarted(false);
  }, [difficulty]);

  const changeDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    initBoard(diff);
  };

  const placeMines = (safeX: number, safeY: number, currentBoard: Cell[][]) => {
    const { rows, cols, mines } = DIFFICULTY_SETTINGS[difficulty];
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      if (!currentBoard[y][x].isMine && (x !== safeX || y !== safeY)) {
        currentBoard[y][x].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate counts
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!currentBoard[y][x].isMine) {
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (y + dy >= 0 && y + dy < rows && x + dx >= 0 && x + dx < cols) {
                if (currentBoard[y + dy][x + dx].isMine) count++;
              }
            }
          }
          currentBoard[y][x].count = count;
        }
      }
    }
    return currentBoard;
  };

  const reveal = (x: number, y: number): 'mine' | 'safe' | 'ignore' => {
    if (gameOver || won) return 'ignore';

    let newBoard = [...board];
    const { rows, cols, mines } = DIFFICULTY_SETTINGS[difficulty];
    
    // First click initialization
    if (!gameStarted) {
      newBoard = placeMines(x, y, newBoard);
      setGameStarted(true);
    }

    const cell = newBoard[y][x];
    if (cell.isOpen || cell.isFlagged) return 'ignore';

    if (cell.isMine) {
      cell.isOpen = true;
      setBoard(newBoard);
      setGameOver(true);
      return 'mine';
    }

    // Flood fill
    const stack = [{x, y}];
    while (stack.length > 0) {
        const p = stack.pop()!;
        const c = newBoard[p.y][p.x];
        if (!c.isOpen && !c.isFlagged) {
            c.isOpen = true;
            if (c.count === 0) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = p.x + dx, ny = p.y + dy;
                        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !newBoard[ny][nx].isOpen) {
                            stack.push({x: nx, y: ny});
                        }
                    }
                }
            }
        }
    }

    setBoard([...newBoard]);

    // Check win
    let openCount = 0;
    newBoard.flat().forEach(c => { if(c.isOpen) openCount++; });
    if (openCount === (rows * cols - mines)) {
        setWon(true);
        return 'safe'; // Winning move is safe
    }
    return 'safe';
  };

  const toggleFlag = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (gameOver || won || !gameStarted) return;
    const newBoard = [...board];
    const cell = newBoard[y][x];
    if (!cell.isOpen) {
        cell.isFlagged = !cell.isFlagged;
        setBoard(newBoard);
    }
  };

  return { 
    board, 
    reveal, 
    toggleFlag, 
    gameOver, 
    won, 
    restart: () => initBoard(difficulty), 
    mineCount: DIFFICULTY_SETTINGS[difficulty].mines,
    difficulty,
    setDifficulty: changeDifficulty
  };
};