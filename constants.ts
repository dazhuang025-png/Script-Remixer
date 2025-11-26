import { DirectorStyle, DirectorProfile } from './types';

export const DIRECTORS: DirectorProfile[] = [
  {
    id: DirectorStyle.ANG_LEE,
    name: '李安模式 (Ang Lee)',
    icon: 'Film',
    description: '饮食男女，人之大欲。强调压抑的情感、家庭伦理与食物隐喻。',
    keywords: ['压抑', '伦理', '做饭', '父亲', '隐忍'],
    color: 'from-amber-100 to-orange-100 border-amber-200',
  },
  {
    id: DirectorStyle.WONG_KAR_WAI,
    name: '王家卫模式 (Wong Kar-wai)',
    icon: 'Clock',
    description: '重塑时间与记忆。强调独白、晃动的镜头、过期的凤梨罐头。',
    keywords: ['独白', '时间', '遗憾', '抽帧', '霓虹'],
    color: 'from-fuchsia-100 to-purple-100 border-purple-200',
  },
  {
    id: DirectorStyle.EDWARD_YANG,
    name: '杨德昌模式 (Edward Yang)',
    icon: 'Building2',
    description: '都市的冷静解剖。强调全景镜头、中产阶级困境与社会观察。',
    keywords: ['全景', '冷峻', '城市', '隔阂', '玻璃反射'],
    color: 'from-slate-100 to-stone-200 border-stone-300',
  },
  {
    id: DirectorStyle.STEPHEN_CHOW,
    name: '周星驰模式 (Stephen Chow)',
    icon: 'Laugh',
    description: '笑着哭最痛。强调小人物的心酸、无厘头解构与夸张。',
    keywords: ['无厘头', '小人物', '解构', '咸鱼', '逆袭'],
    color: 'from-yellow-100 to-red-100 border-red-200',
  },
  {
    id: DirectorStyle.CUSTOM,
    name: '自定义语料 (Custom Corpus)',
    icon: 'BookOpen',
    description: '高级模式：粘贴任意剧本/小说原文，模型将深度模仿其文风。',
    keywords: ['自定义', '深度学习', '模仿', '实验性'],
    color: 'from-stone-100 to-stone-200 border-stone-300',
  }
];

export const DIRECTOR_SAMPLES: Record<DirectorStyle, string> = {
  [DirectorStyle.CUSTOM]: "", 
  [DirectorStyle.ANG_LEE]: `
    [Style Sample: Ang Lee - Eat Drink Man Woman / Lust, Caution]
    THEME: Repressed emotion, family duty vs personal desire, food as metaphor.
    VISUAL: Static mid-shots of dining tables. Close-ups on hands preparing food.
    DIALOGUE: Characters speak about daily trivialities (soup, mahjong) to avoid talking about their real pain.
    SUBTEXT: "I cook for you" means "I love you but I can't say it".
  `,
  [DirectorStyle.WONG_KAR_WAI]: `
    [Style Sample: Wong Kar-wai - Chungking Express / In the Mood for Love]
    THEME: Time, expiration dates, loneliness, missed connections.
    VISUAL: Step-printing (slow shutter), neon lights, reflections in wet streets, claustrophobic framing.
    DIALOGUE: Heavy use of Voice Over (Monologue). Characters talk to objects (soap, towels). Obsession with specific numbers and dates.
  `,
  [DirectorStyle.EDWARD_YANG]: `
    [Style Sample: Edward Yang - Yi Yi / A Brighter Summer Day]
    THEME: Urban alienation, the complexity of modern life, the loss of innocence.
    VISUAL: Long shots through glass/windows (distancing effect). High angles looking down on city streets.
    DIALOGUE: Philosophical, detached, intellectual. Characters often lecture or question the meaning of life.
  `,
  [DirectorStyle.STEPHEN_CHOW]: `
    [Style Sample: Stephen Chow - Kung Fu Hustle / Shaolin Soccer]
    THEME: The underdog's journey, deconstruction of martial arts tropes, finding dignity in poverty.
    VISUAL: Cartoon physics in live action. Extreme close-ups on "ugly" details followed by epic wide shots.
    DIALOGUE: Nonsense (Mo Lei Tau), rapid-fire insults, mixing high-stakes drama with mundane complaints.
  `,
};

export const SYSTEM_INSTRUCTION = `
You are "Script-Remixer", an AI dedicated to the art of Screenwriting.
You respect the craft. You believe in "Show, Don't Tell".
You are an expert in Deconstruction and Style Transfer.
`;