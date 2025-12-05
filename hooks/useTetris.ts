import { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 10;
const ROWS = 20;

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' },
};

type TetrominoType = keyof typeof TETROMINOS;

const randomTetromino = () => {
  const keys = Object.keys(TETROMINOS) as TetrominoType[];
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return {
    type: randKey,
    shape: TETROMINOS[randKey].shape,
    color: TETROMINOS[randKey].color,
    x: Math.floor(COLS / 2) - Math.floor(TETROMINOS[randKey].shape[0].length / 2),
    y: 0,
  };
};

export const useTetris = () => {
  const [grid, setGrid] = useState<(string | null)[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
  const [piece, setPiece] = useState(randomTetromino());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);
  const dropInterval = useRef<number>(800);

  const checkCollision = (p: typeof piece, g: typeof grid, moveX = 0, moveY = 0) => {
    for (let y = 0; y < p.shape.length; y++) {
      for (let x = 0; x < p.shape[y].length; x++) {
        if (p.shape[y][x] !== 0) {
          const newX = p.x + x + moveX;
          const newY = p.y + y + moveY;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && g[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = () => {
    if (gameOver || isPaused) return;
    const rotatedShape = piece.shape[0].map((_, index) => piece.shape.map(row => row[index]).reverse());
    const newPiece = { ...piece, shape: rotatedShape };
    
    // Wall kick (basic)
    if (!checkCollision(newPiece, grid)) {
      setPiece(newPiece);
    } else if (!checkCollision(newPiece, grid, -1, 0)) {
       setPiece({...newPiece, x: newPiece.x - 1});
    } else if (!checkCollision(newPiece, grid, 1, 0)) {
       setPiece({...newPiece, x: newPiece.x + 1});
    }
  };

  const move = (dir: -1 | 1) => {
    if (gameOver || isPaused) return;
    if (!checkCollision(piece, grid, dir, 0)) {
      setPiece(p => ({ ...p, x: p.x + dir }));
    }
  };

  const drop = useCallback(() => {
    if (gameOver || isPaused) return false;
    if (!checkCollision(piece, grid, 0, 1)) {
      setPiece(p => ({ ...p, y: p.y + 1 }));
      return false;
    } else {
      // Lock piece
      if (piece.y <= 0) {
        setGameOver(true);
        return true;
      }

      const newGrid = grid.map(row => [...row]);
      piece.shape.forEach((row, y) => {
        row.forEach((val, x) => {
          if (val !== 0) {
            newGrid[piece.y + y][piece.x + x] = piece.color;
          }
        });
      });

      // Clear lines
      let linesCleared = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (newGrid[y].every(cell => cell !== null)) {
          newGrid.splice(y, 1);
          newGrid.unshift(Array(COLS).fill(null));
          linesCleared++;
          y++; // Check same row index again
        }
      }

      if (linesCleared > 0) {
        setScore(s => s + [0, 100, 300, 500, 800][linesCleared]);
        dropInterval.current = Math.max(100, 800 - (score + linesCleared * 100) / 10);
      }

      setGrid(newGrid);
      setPiece(randomTetromino());
      return true;
    }
  }, [piece, grid, gameOver, isPaused, score]);

  const update = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    dropCounterRef.current += deltaTime;
    if (dropCounterRef.current > dropInterval.current) {
      drop();
      dropCounterRef.current = 0;
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [drop]);

  const restart = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setPiece(randomTetromino());
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    dropInterval.current = 800;
  };

  return { grid, piece, score, gameOver, isPaused, setIsPaused, move, rotate, drop, restart, TETROMINOS };
};