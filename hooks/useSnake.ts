import { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 20;
const ROWS = 20;
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const useSnake = () => {
  const [snake, setSnake] = useState<{x: number, y: number}[]>([{x: 10, y: 10}]);
  const [food, setFood] = useState<{x: number, y: number}>({x: 15, y: 15});
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT'); // Buffer to prevent self-collision on rapid keypress
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const speedRef = useRef(150);

  const generateFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS)
      };
      // Check collision with snake
      const collision = currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
      if (!collision) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}]);
    setFood(generateFood([{x: 10, y: 10}]));
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    speedRef.current = 150;
  };

  const changeDirection = (dir: Direction) => {
    // Prevent 180 turns
    if (direction === 'UP' && dir === 'DOWN') return;
    if (direction === 'DOWN' && dir === 'UP') return;
    if (direction === 'LEFT' && dir === 'RIGHT') return;
    if (direction === 'RIGHT' && dir === 'LEFT') return;
    setNextDirection(dir);
  };

  const move = useCallback(() => {
    if (gameOver || isPaused) return;
    
    setDirection(nextDirection);

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      
      switch (nextDirection) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Wall collision
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        setGameOver(true);
        return prevSnake;
      }

      // Self collision
      if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Eat food
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
        speedRef.current = Math.max(50, speedRef.current - 2); // Increase speed
      } else {
        newSnake.pop(); // Remove tail
      }

      return newSnake;
    });
  }, [nextDirection, gameOver, isPaused, food, generateFood]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!gameOver && !isPaused) {
      timerRef.current = window.setInterval(move, speedRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [move, gameOver, isPaused]);

  // Initial setup
  useEffect(() => {
    resetGame();
  }, []); // eslint-disable-line

  return { snake, food, direction: nextDirection, changeDirection, gameOver, score, restart: resetGame, isPaused, setIsPaused, gridSize: {rows: ROWS, cols: COLS} };
};