import React, { useState, useEffect, useRef } from 'react';
import { Hourglass, Users, Zap, BookOpen, Sparkles, RotateCcw, Skull, ScrollText } from 'lucide-react';
import { playSound } from '../../utils/audio';

// --- Types ---
interface GameState {
  year: number; // Negative for BC, Positive for AD
  population: number;
  science: number;
  culture: number;
  magic: number;
  tags: Set<string>;
  log: string[];
  status: 'PLAYING' | 'EVENT' | 'GAME_OVER' | 'VICTORY';
  ending?: string;
  speed: number;
}

interface GameEvent {
  id: string;
  triggerYear?: number; // Condition: Year >= triggerYear
  triggerMaxYear?: number; // Condition: Year <= triggerMaxYear (optional)
  triggerCondition?: (state: GameState) => boolean;
  title: string;
  description: string;
  optionA: {
    text: string;
    effect: (state: GameState) => Partial<GameState>;
    log: string;
  };
  optionB: {
    text: string;
    effect: (state: GameState) => Partial<GameState>;
    log: string;
  };
}

// --- Events Database ---
// Timeline: 10,000 BC -> 3000 AD
const EVENTS: GameEvent[] = [
  // --- Stone Age (-10000 ~ -4000) ---
  {
    id: 'cave_painting',
    triggerYear: -9000,
    title: '洞穴壁画',
    description: '族人在岩壁上涂抹赭石，描绘狩猎的场景。',
    optionA: {
      text: '记录狩猎技巧',
      effect: (s) => ({ science: s.science + 5, population: s.population + 10, tags: new Set(s.tags).add('hunting_knowledge') }),
      log: '壁画成为了最早的教科书，狩猎效率提升。'
    },
    optionB: {
      text: '描绘神灵与图腾',
      effect: (s) => ({ culture: s.culture + 10, magic: s.magic + 5, tags: new Set(s.tags).add('animism') }),
      log: '抽象思维诞生了，万物有灵的信仰开始流传。'
    }
  },
  {
    id: 'agriculture',
    triggerYear: -8000,
    title: '奇异的种子',
    description: '采集队发现一种野草的种子可以食用，并且洒落的地方会长出新的。',
    optionA: {
      text: '定居下来，开始种植',
      effect: (s) => ({ population: s.population + 200, science: s.science + 5, tags: new Set(s.tags).add('agriculture') }),
      log: '农业革命开启，部落开始定居，人口开始增长。'
    },
    optionB: {
      text: '太麻烦了，继续游猎',
      effect: (s) => ({ culture: s.culture + 15, magic: s.magic + 10, population: s.population - 50, tags: new Set(s.tags).add('nomad') }),
      log: '你们选择了自由的游猎生活，与自然之灵更加亲近。'
    }
  },
  {
    id: 'pottery',
    triggerYear: -6000,
    title: '泥土的固化',
    description: '有人发现被火烧过的泥土会变得坚硬不漏水。',
    optionA: {
      text: '制作容器储存粮食',
      effect: (s) => ({ population: s.population * 1.1, science: s.science + 10, tags: new Set(s.tags).add('storage') }),
      log: '余粮的储存让你们能度过寒冬。'
    },
    optionB: {
      text: '制作精美的陶俑',
      effect: (s) => ({ culture: s.culture + 20, tags: new Set(s.tags).add('art') }),
      log: '艺术开始萌芽，陶器成为了审美的载体。'
    }
  },
  // --- Bronze Age (-4000 ~ -1200) ---
  {
    id: 'wheel',
    triggerYear: -4000,
    title: '滚动的圆木',
    description: '工匠发现圆形的木头可以减少搬运的力气。',
    optionA: {
      text: '制造手推车和陶轮',
      effect: (s) => ({ science: s.science + 20, population: s.population + 100, tags: new Set(s.tags).add('wheel_tool') }),
      log: '生产效率大幅提升，贸易范围扩大。'
    },
    optionB: {
      text: '制造战车',
      effect: (s) => ({ population: s.population - 50, science: s.science + 10, tags: new Set(s.tags).add('chariot_warfare') }),
      log: '战车的轰鸣声震慑了周边的部落。'
    }
  },
  {
    id: 'writing',
    triggerYear: -3200,
    title: '刻痕与符号',
    description: '事务繁杂，祭司建议用符号来记录粮食数量。',
    optionA: {
      text: '发明文字记录账目',
      effect: (s) => ({ science: s.science + 30, tags: new Set(s.tags).add('writing_admin') }),
      log: '文字的诞生标志着信史时代的开始，官僚体系雏形出现。'
    },
    optionB: {
      text: '刻画符文沟通神灵',
      effect: (s) => ({ magic: s.magic + 30, culture: s.culture + 20, tags: new Set(s.tags).add('runes') }),
      log: '神秘的符文赋予了祭司无上的权力。'
    }
  },
  {
    id: 'pyramid',
    triggerYear: -2500,
    triggerCondition: (s) => s.tags.has('agriculture'),
    title: '巨大的陵墓',
    description: '领袖希望死后也能享受荣华富贵，要求建造巨大的陵墓。',
    optionA: {
      text: '举国之力建造',
      effect: (s) => ({ culture: s.culture + 50, population: s.population * 0.9, tags: new Set(s.tags).add('monument') }),
      log: '宏伟的奇观拔地而起，凝聚了文明的向心力，但也耗尽了民力。'
    },
    optionB: {
      text: '这太劳民伤财了',
      effect: (s) => ({ population: s.population + 200, science: s.science + 10, tags: new Set(s.tags).add('pragmatism') }),
      log: '节省下来的资源用于改善民生，人口稳步增长。'
    }
  },
  // --- Iron Age / Classical (-1200 ~ 500) ---
  {
    id: 'code_of_law',
    triggerYear: -1700,
    title: '石柱上的规则',
    description: '城邦人口众多，纠纷不断。需要一套统一的规则。',
    optionA: {
      text: '以牙还牙，以眼还眼',
      effect: (s) => ({ culture: s.culture + 30, tags: new Set(s.tags).add('strict_law') }),
      log: '严酷的法典确立了秩序，但也带来了恐惧。'
    },
    optionB: {
      text: '通过公民辩论解决',
      effect: (s) => ({ culture: s.culture + 50, science: s.science + 10, tags: new Set(s.tags).add('democracy_roots') }),
      log: '早期的民主辩论在广场上回响，哲学思想迸发。'
    }
  },
  {
    id: 'philosophy',
    triggerYear: -500,
    title: '轴心时代',
    description: '智者们开始思考世界的本源和人生的意义。',
    optionA: {
      text: '研究自然与逻辑',
      effect: (s) => ({ science: s.science + 40, tags: new Set(s.tags).add('rationalism') }),
      log: '理性的光辉照亮了蒙昧，科学方法论萌芽。'
    },
    optionB: {
      text: '探讨道德与社会',
      effect: (s) => ({ culture: s.culture + 40, population: s.population * 1.05, tags: new Set(s.tags).add('humanism') }),
      log: '伦理道德成为社会的基石，文明更加稳定。'
    }
  },
  // --- Middle Ages (500 ~ 1400) ---
  {
    id: 'black_death',
    triggerYear: 1340,
    title: '黑色死神',
    description: '商船带来了一种可怕的瘟疫，人们身上长出黑斑，痛苦死去。',
    optionA: {
      text: '隔离病人，研究医学',
      effect: (s) => ({ population: s.population * 0.6, science: s.science + 30, tags: new Set(s.tags).add('medicine_advance') }),
      log: '惨痛的代价换来了公共卫生观念的觉醒。'
    },
    optionB: {
      text: '这是天谴，忏悔吧',
      effect: (s) => ({ population: s.population * 0.5, magic: s.magic + 30, tags: new Set(s.tags).add('divine_intervention') }),
      log: '宗教狂热席卷大地，但在绝望中似乎真的有神迹显现。'
    }
  },
  // --- Early Modern (1400 ~ 1800) ---
  {
    id: 'printing_press',
    triggerYear: 1440,
    title: '金属活字',
    description: '一位金匠发明了可以快速印刷书籍的机器。',
    optionA: {
      text: '普及知识，打破垄断',
      effect: (s) => ({ science: s.science + 50, culture: s.culture + 30, tags: new Set(s.tags).add('mass_literacy') }),
      log: '知识不再是贵族的特权，思想解放的浪潮不可阻挡。'
    },
    optionB: {
      text: '用来印制赎罪券和经文',
      effect: (s) => ({ culture: s.culture + 50, magic: s.magic + 10, tags: new Set(s.tags).add('theocracy_print') }),
      log: '教会的力量通过印刷术得到了空前的加强。'
    }
  },
  {
    id: 'steam_engine',
    triggerYear: 1760,
    title: '蒸汽的力量',
    description: '矿井里的抽水机被改良了，蒸汽可以驱动巨大的机械。',
    optionA: {
      text: '建造工厂，发展工业',
      effect: (s) => ({ science: s.science + 100, population: s.population * 1.5, tags: new Set(s.tags).add('industry') }),
      log: '工业革命爆发，烟囱林立，生产力呈指数级飞跃。'
    },
    optionB: {
      text: '这是亵渎自然，禁止它',
      effect: (s) => ({ magic: s.magic + 50, culture: s.culture + 30, tags: new Set(s.tags).add('druidism') }),
      log: '你们拒绝了机器的轰鸣，选择了德鲁伊的道路，森林覆盖了城市。'
    }
  },
  // --- Modern (1800 ~ 2000) ---
  {
    id: 'electricity',
    triggerYear: 1880,
    triggerCondition: (s) => s.tags.has('industry'),
    title: '捕捉雷电',
    description: '科学家发现如何产生和传输电流，点亮黑夜。',
    optionA: {
      text: '构建电网，驱动世界',
      effect: (s) => ({ science: s.science + 80, population: s.population * 1.2, tags: new Set(s.tags).add('electrification') }),
      log: '世界被点亮了，电气时代来临。'
    },
    optionB: {
      text: '用来复活尸体（科学怪人）',
      effect: (s) => ({ science: s.science + 40, magic: s.magic + 40, tags: new Set(s.tags).add('necromancy_science') }),
      log: '电流被用于禁忌的生命实验，科学与黑魔法的界限变得模糊。'
    }
  },
  {
    id: 'nuclear',
    triggerYear: 1945,
    triggerCondition: (s) => s.tags.has('industry'),
    title: '原子的裂变',
    description: '物理学家打开了物质深处的潘多拉魔盒。',
    optionA: {
      text: '制造终极武器震慑敌人',
      effect: (s) => ({ science: s.science + 100, population: s.population * 0.9, tags: new Set(s.tags).add('nuclear_deterrence') }),
      log: '恐怖平衡维持了脆弱的和平，但也时刻面临毁灭。'
    },
    optionB: {
      text: '开发无限的清洁能源',
      effect: (s) => ({ science: s.science + 120, population: s.population * 1.1, tags: new Set(s.tags).add('clean_energy') }),
      log: '能源危机解除，人类进入了富足的时代。'
    }
  },
  // --- Future (2000+) ---
  {
    id: 'ai_awakening',
    triggerYear: 2040,
    triggerCondition: (s) => s.tags.has('electrification'),
    title: '硅基觉醒',
    description: '全球网络中诞生了一个超级智能，它在向人类问好。',
    optionA: {
      text: '与之融合，机械飞升',
      effect: (s) => ({ science: s.science + 500, culture: s.culture - 50, tags: new Set(s.tags).add('cyborg') }),
      log: '血肉苦弱，机械飞升。人类抛弃了肉体，实现了永生。'
    },
    optionB: {
      text: '将其视为伙伴，共同进化',
      effect: (s) => ({ culture: s.culture + 200, science: s.science + 200, tags: new Set(s.tags).add('ai_symbiosis') }),
      log: '人类与AI建立了深刻的共生关系，文明进入了双核驱动时代。'
    }
  },
  {
    id: 'magic_return',
    triggerYear: 2012,
    triggerCondition: (s) => s.magic > 100, // Only if high magic path taken earlier
    title: '灵气复苏',
    description: '沉寂千年的古老封印解开，魔法元素重回地球。',
    optionA: {
      text: '建立魔法学院',
      effect: (s) => ({ magic: s.magic + 500, science: s.science - 100, tags: new Set(s.tags).add('magocracy') }),
      log: '科学法则失效，法师塔取代了摩天大楼。'
    },
    optionB: {
      text: '魔导科技（魔科融合）',
      effect: (s) => ({ magic: s.magic + 200, science: s.science + 200, tags: new Set(s.tags).add('magitech') }),
      log: '符文电路板和法力引擎驱动着浮空战舰。'
    }
  },
  {
    id: 'space_colonization',
    triggerYear: 2200,
    triggerCondition: (s) => s.science > 500 || s.magic > 500,
    title: '星辰大海',
    description: '地球资源已开发殆尽，目光投向了深空。',
    optionA: {
      text: '世代飞船殖民',
      effect: (s) => ({ population: s.population * 0.5, science: s.science + 200, tags: new Set(s.tags).add('interstellar') }),
      log: '无数种子飞船驶向黑暗森林，人类文明开枝散叶。'
    },
    optionB: {
      text: '戴森球计划',
      effect: (s) => ({ science: s.science + 1000, tags: new Set(s.tags).add('dyson_sphere') }),
      log: '包裹恒星的巨构完工，我们成为了二级文明。'
    }
  }
];

const Game10000Years: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [state, setState] = useState<GameState>({
    year: -10000,
    population: 100,
    science: 0,
    culture: 0,
    magic: 0,
    tags: new Set(),
    log: ['[-10000年] 一群智人走出非洲，在荒野中点燃了文明的微光...'],
    status: 'PLAYING',
    speed: 1
  });

  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const timerRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.log]);

  // Main Game Loop
  useEffect(() => {
    if (state.status !== 'PLAYING') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setState(prev => {
        // Dynamic Time Speed based on Era
        // Stone age is fast, Modern age is slow (to allow for more events/decisions)
        let yearIncrement = 20; // Default
        if (prev.year < -4000) yearIncrement = 50;
        else if (prev.year < 0) yearIncrement = 20;
        else if (prev.year < 1800) yearIncrement = 10;
        else yearIncrement = 2; // Very detailed in modern era

        let nextYear = prev.year + yearIncrement;
        
        // Handle BC/AD transition cleanly (skip year 0)
        if (prev.year < 0 && nextYear >= 0) nextYear = 1;

        // Auto resource growth
        let nextPop = prev.population;
        const growthRate = 1.001 + (prev.science * 0.00001);
        nextPop *= growthRate;
        if (prev.tags.has('agriculture')) nextPop *= 1.002;
        if (prev.tags.has('medicine_advance')) nextPop *= 1.005;
        if (prev.tags.has('nuclear_deterrence')) nextPop *= 0.999; // Fear factor?

        // Check Defeat
        if (prev.population <= 0) {
            return { ...prev, status: 'GAME_OVER', ending: '灭绝：你的文明消逝在历史的长河中。', log: [...prev.log, '最后一个人倒下了，文明终结。'] };
        }
        
        // Check Victory
        if (nextYear >= 3000) {
            let ending = '星际流浪者：文明遍布银河系。';
            if (prev.tags.has('cyborg')) ending = '机械神格：意识上传，获得永恒。';
            else if (prev.tags.has('magocracy')) ending = '位面主宰：你们征服了多元宇宙。';
            else if (prev.tags.has('ai_symbiosis')) ending = '超智慧共同体：超越了生物的极限。';
            else if (prev.tags.has('druidism')) ending = '盖亚意识：整个星球成为了一个生命体。';
            else if (prev.population < 1000) ending = '废土幸存者：虽然辉煌不再，但至少还活着。';
            
            return { ...prev, status: 'VICTORY', ending, log: [...prev.log, '历史的车轮继续滚滚向前，但那是另一个故事了。'] };
        }

        // Check Events
        const triggeredEvent = EVENTS.find(e => {
            if (prev.tags.has(`event_${e.id}`)) return false; // Already happened
            // Year trigger
            if (e.triggerYear !== undefined && prev.year >= e.triggerYear) {
                if (e.triggerMaxYear !== undefined && prev.year > e.triggerMaxYear) return false; // Missed window
                if (!e.triggerCondition || e.triggerCondition(prev)) return true;
            }
            return false;
        });

        if (triggeredEvent) {
            setCurrentEvent(triggeredEvent);
            return { ...prev, year: nextYear, population: Math.floor(nextPop), status: 'EVENT' };
        }

        return { ...prev, year: nextYear, population: Math.floor(nextPop) };
      });
    }, 50); // Tick rate

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status]);

  const handleChoice = (option: 'A' | 'B') => {
    if (!currentEvent) return;
    
    const choice = option === 'A' ? currentEvent.optionA : currentEvent.optionB;
    playSound('select');

    setState(prev => {
        const effects = choice.effect(prev);
        const newTags = new Set([...prev.tags, ...(effects.tags || []), `event_${currentEvent.id}`]);
        const yearStr = formatYear(prev.year);
        
        return {
            ...prev,
            ...effects,
            tags: newTags,
            log: [...prev.log, `[${yearStr}] ${choice.log}`],
            status: 'PLAYING'
        };
    });
    setCurrentEvent(null);
  };

  const formatYear = (y: number) => {
      if (y < 0) return `公元前 ${Math.abs(y)} 年`;
      return `公元 ${y} 年`;
  };

  // Format large numbers
  const fmt = (n: number) => {
    if (n > 1000000000) return (n / 1000000000).toFixed(2) + '亿'; // Should be '十亿' but let's stick to chinese scale
    if (n > 100000000) return (n / 100000000).toFixed(1) + '亿';
    if (n > 10000) return (n / 10000).toFixed(1) + '万';
    return Math.floor(n).toString();
  };

  const getEraName = (y: number, tags: Set<string>) => {
      if (y < -4000) return '石器时代';
      if (y < -1200) return '青铜时代';
      if (y < 500) return '铁器时代';
      if (y < 1400) return '中世纪';
      if (y < 1800) return '大航海时代';
      if (tags.has('industry')) {
          if (y < 1900) return '蒸汽时代';
          if (y < 2000) return '电气时代';
      }
      if (tags.has('magocracy')) return '魔法纪元';
      if (y >= 2000 && y < 2100) return '信息时代';
      if (y >= 2100) return '未来纪元';
      return '未知时代';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-black text-slate-200 font-mono p-4 relative overflow-hidden">
        
        {/* Background ambience */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,#1e293b_0%,#000000_100%)]"></div>

        {/* Main Interface */}
        <div className="z-10 w-full max-w-4xl flex flex-col h-[85vh] gap-6">
            
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
                <div className="flex flex-col items-center border-r border-slate-800/50 last:border-0">
                    <span className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Hourglass size={12}/> 纪年</span>
                    <span className="text-2xl md:text-3xl font-bold text-white tabular-nums tracking-tighter">{formatYear(state.year)}</span>
                    <span className="text-xs text-indigo-400 mt-1 font-bold px-2 py-0.5 bg-indigo-900/30 rounded-full">{getEraName(state.year, state.tags)}</span>
                </div>
                <div className="flex flex-col items-center border-r border-slate-800/50 last:border-0">
                    <span className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={12}/> 文明人口</span>
                    <span className="text-2xl font-bold text-white tabular-nums">{fmt(state.population)}</span>
                </div>
                <div className="flex flex-col items-center border-r border-slate-800/50 last:border-0">
                    <span className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><BookOpen size={12}/> 科技指数</span>
                    <span className="text-2xl font-bold text-cyan-400 tabular-nums">{Math.floor(state.science)}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles size={12}/> 神秘指数</span>
                    <span className="text-2xl font-bold text-purple-400 tabular-nums">{Math.floor(state.magic)}</span>
                </div>
            </div>

            {/* Log Area - Designed like a history book */}
            <div className="flex-1 relative bg-[#0c0a09] border border-stone-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600"></div>
                <div className="bg-stone-900/50 p-2 border-b border-stone-800 flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-widest">
                    <ScrollText size={14} /> 文明编年史
                </div>
                <div 
                    ref={scrollRef}
                    className="flex-1 p-6 overflow-y-auto space-y-4 scroll-smooth font-serif"
                >
                    {state.log.map((entry, i) => {
                        // Highlight years
                        const parts = entry.match(/^(\[.*?\])(.*)/);
                        if (parts) {
                             return (
                                <div key={i} className={`flex gap-4 animate-fade-in ${i === state.log.length - 1 ? 'opacity-100' : 'opacity-60'}`}>
                                    <span className="text-indigo-400 font-bold whitespace-nowrap text-sm mt-1">{parts[1]}</span>
                                    <span className="text-stone-300 text-lg leading-relaxed">{parts[2]}</span>
                                </div>
                             )
                        }
                        return (
                            <div key={i} className="text-stone-500">{entry}</div>
                        );
                    })}
                    {state.status === 'PLAYING' && (
                        <div className="flex justify-center py-4">
                           <span className="animate-pulse text-indigo-500/30 text-2xl">• • •</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Event Modal - More Immersive */}
        {state.status === 'EVENT' && currentEvent && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-2xl w-full shadow-2xl relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    <div className="relative z-10 text-center mb-10">
                        <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-widest rounded-full mb-4 uppercase">
                            关键历史节点：{formatYear(state.year)}
                        </span>
                        <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight">{currentEvent.title}</h2>
                        <p className="text-slate-300 text-xl leading-relaxed max-w-lg mx-auto font-serif italic">
                            "{currentEvent.description}"
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <button 
                            onClick={() => handleChoice('A')}
                            className="group relative p-6 bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-indigo-500 rounded-xl transition-all text-left hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                        >
                            <span className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">A</span>
                            <div className="text-white font-bold mb-2 text-lg group-hover:text-indigo-300 transition-colors">{currentEvent.optionA.text}</div>
                        </button>
                        
                        <button 
                            onClick={() => handleChoice('B')}
                            className="group relative p-6 bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-purple-500 rounded-xl transition-all text-left hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
                        >
                            <span className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">B</span>
                            <div className="text-white font-bold mb-2 text-lg group-hover:text-purple-300 transition-colors">{currentEvent.optionB.text}</div>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Game Over / Victory Screen */}
        {(state.status === 'GAME_OVER' || state.status === 'VICTORY') && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
                <div className="text-center max-w-xl border border-slate-800 p-12 rounded-3xl bg-slate-900/50">
                    <div className="mb-8">
                        {state.status === 'VICTORY' ? (
                            <div className="inline-flex p-4 rounded-full bg-yellow-500/10 mb-6 ring-1 ring-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                                <Zap size={48} className="text-yellow-400"/>
                            </div>
                        ) : (
                            <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-6 ring-1 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                <Skull size={48} className="text-red-500"/>
                            </div>
                        )}
                        <h2 className={`text-6xl font-black mb-4 tracking-tighter ${state.status === 'VICTORY' ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600' : 'text-red-500'}`}>
                            {state.status === 'VICTORY' ? '文明不朽' : '文明终结'}
                        </h2>
                        <div className="w-16 h-1 bg-slate-800 mx-auto mb-6"></div>
                        <p className="text-2xl text-white font-bold mb-3">{state.ending}</p>
                        <p className="text-slate-500 font-mono">最终年代: {formatYear(state.year)}</p>
                    </div>
                    
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => setState({ year: -10000, population: 100, science: 0, culture: 0, magic: 0, tags: new Set(), log: ['[-10000年] 新的轮回开始了...'], status: 'PLAYING', speed: 1 })}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95"
                        >
                            <RotateCcw size={20}/> 开启新纪元
                        </button>
                        <button 
                            onClick={onExit}
                            className="px-8 py-4 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            退出
                        </button>
                    </div>
                </div>
             </div>
        )}

    </div>
  );
};

export default Game10000Years;