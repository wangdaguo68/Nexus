import { useState, useEffect, useCallback } from 'react';
import { Game2048State, Direction } from '../types';

const GRID_SIZE = 4;

const getEmptyGrid = () => Array(GRID_SIZE).fill(Array(GRID_SIZE).fill(0));

const deepClone = (grid: number[][]) => JSON.parse(JSON.stringify(grid));

export const use2048 = () => {
  const [state, setState] = useState<Game2048State>({
    grid: getEmptyGrid(),
    score: 0,
    bestScore: parseInt(localStorage.getItem('2048-best') || '0'),
    gameOver: false,
    won: false
  });

  const initializeGame = useCallback(() => {
    let newGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setState({
      grid: newGrid,
      score: 0,
      bestScore: parseInt(localStorage.getItem('2048-best') || '0'),
      gameOver: false,
      won: false
    });
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const addRandomTile = (grid: number[][]) => {
    const emptyCells: { r: number; c: number }[] = [];
    grid.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val === 0) emptyCells.push({ r, c });
      });
    });

    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const move = useCallback((direction: Direction) => {
    if (state.gameOver) return;

    setState(prevState => {
      let newGrid = deepClone(prevState.grid);
      let newScore = prevState.score;
      let moved = false;

      const slide = (row: number[]) => {
        let arr = row.filter(val => val);
        let missing = GRID_SIZE - arr.length;
        let zeros = Array(missing).fill(0);
        return arr.concat(zeros);
      };

      const combine = (row: number[]) => {
        for (let i = 0; i < GRID_SIZE - 1; i++) {
          if (row[i] !== 0 && row[i] === row[i + 1]) {
            row[i] *= 2;
            newScore += row[i];
            row[i + 1] = 0;
            moved = true; // Score change counts as a move usually, but we need meaningful grid change
          }
        }
        return row;
      };

      const processRow = (row: number[]) => {
        let original = [...row];
        let slided = slide(row);
        let combined = combine(slided);
        let final = slide(combined); // Slide again after combining
        
        if (JSON.stringify(original) !== JSON.stringify(final)) {
          moved = true;
        }
        return final;
      };

      // Transform grid based on direction to simplify logic (always process left-to-right)
      if (direction === 'RIGHT') {
        newGrid = newGrid.map((row: number[]) => processRow(row.reverse()).reverse());
      } else if (direction === 'LEFT') {
        newGrid = newGrid.map((row: number[]) => processRow(row));
      } else if (direction === 'UP') {
        // Transpose, process, transpose back
        let transposed = newGrid[0].map((_: any, colIndex: number) => newGrid.map((row: number[]) => row[colIndex]));
        transposed = transposed.map((row: number[]) => processRow(row));
        newGrid = transposed[0].map((_: any, colIndex: number) => transposed.map((row: number[]) => row[colIndex]));
      } else if (direction === 'DOWN') {
        // Transpose, process reverse, transpose back
        let transposed = newGrid[0].map((_: any, colIndex: number) => newGrid.map((row: number[]) => row[colIndex]));
        transposed = transposed.map((row: number[]) => processRow(row.reverse()).reverse());
        newGrid = transposed[0].map((_: any, colIndex: number) => transposed.map((row: number[]) => row[colIndex]));
      }

      if (moved) {
        addRandomTile(newGrid);
        
        // Check win/loss
        let won = false;
        let gameOver = false;
        
        // Check 2048
        if (newGrid.flat().includes(2048) && !prevState.won) {
          won = true;
        }

        // Check if no moves possible
        const canMove = (grid: number[][]) => {
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (grid[r][c] === 0) return true;
                    if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
                    if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
                }
            }
            return false;
        };
        
        if (!canMove(newGrid)) {
            gameOver = true;
        }

        // Update local storage best score
        const finalBest = Math.max(newScore, prevState.bestScore);
        localStorage.setItem('2048-best', finalBest.toString());

        return {
          ...prevState,
          grid: newGrid,
          score: newScore,
          bestScore: finalBest,
          won: prevState.won || won,
          gameOver
        };
      }

      return prevState;
    });
  }, [state.gameOver, state.won]);

  return { state, move, restart: initializeGame };
};