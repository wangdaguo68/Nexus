import { GameMetadata } from '../types';
import Game2048 from './2048/Game2048';
import GameTetris from './tetris/GameTetris';
import GameSnake from './snake/GameSnake';
import GameMinesweeper from './minesweeper/GameMinesweeper';
import GameShooter from './shooter/GameShooter';
import GameNpcRoyale from './npc-royale/GameNpcRoyale';
import Game10000Years from './10000-years/Game10000Years';
import GameMarketIO from './market-io/GameMarketIO';

// This is where we register new games. 
// To add a new game, simply import it and add it to this array.
export const GAME_REGISTRY: GameMetadata[] = [
  {
    id: 'market-io',
    name: '股市操盘手 IO',
    description: '3分钟极速交易模拟。在疯狂的 K 线图中，与其他（AI）散户博弈。发表情包带节奏，做多做空，体验贪婪与恐惧的过山车！',
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=600&auto=format&fit=crop', // Stock chart / Trading screen
    category: 'Strategy',
    component: GameMarketIO,
  },
  {
    id: '10000-years',
    name: '一万年文明',
    description: '从公元前10000年开始的宏大史诗。见证人类从石器时代到星际文明的演变。你的每一个决策都将决定文明的命运。',
    thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=600&auto=format&fit=crop', // History / Old paper / Time
    category: 'Strategy',
    component: Game10000Years,
  },
  {
    id: 'npc-royale',
    name: '我就在人群中',
    description: '一场演技的生死对决。混入 100 个 NPC 之中，模仿他们的行为，找出隐藏的杀手并暗杀他们。切记：不要奔跑，不要暴露！',
    thumbnail: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=600&auto=format&fit=crop', // Crowd / Top down view
    category: 'Strategy',
    component: GameNpcRoyale,
  },
  {
    id: 'shooter',
    name: '星际突围',
    description: '驾驶战机，在无尽的弹幕和敌人中生存下来！基于 HTML5 Canvas 的高性能射击体验。',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600&auto=format&fit=crop', // Abstract colorful space
    category: 'Arcade',
    component: GameShooter,
  },
  {
    id: 'tetris',
    name: '俄罗斯方块',
    description: '经典永不过时。堆叠方块，消除行数，挑战最高分！',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop', // Retro tech/pixels
    category: 'Puzzle',
    component: GameTetris,
  },
  {
    id: 'minesweeper',
    name: '逻辑扫雷',
    description: '运用逻辑推理，避开所有地雷。插旗标记，步步为营。',
    thumbnail: 'https://images.unsplash.com/photo-1636955840493-f43a02bfa064?q=80&w=600&auto=format&fit=crop', // Grid/Cyber pattern
    category: 'Strategy',
    component: GameMinesweeper,
  },
  {
    id: 'snake',
    name: '霓虹贪吃蛇',
    description: '控制小蛇吞噬能量块，小心不要撞到墙壁或自己。反应速度的大考验！',
    thumbnail: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=600&auto=format&fit=crop', // Neon lights
    category: 'Action',
    component: GameSnake,
  },
  {
    id: '2048',
    name: '2048',
    description: '移动方块，合并数字，向着 2048 冲刺！经典的逻辑益智游戏。',
    thumbnail: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=600&auto=format&fit=crop', // Abstract blocks
    category: 'Puzzle',
    component: Game2048,
  },
];

export const getGameById = (id: string): GameMetadata | undefined => {
  return GAME_REGISTRY.find(g => g.id === id);
};