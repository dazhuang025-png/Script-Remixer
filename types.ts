export enum DirectorStyle {
  ANG_LEE = 'ANG_LEE',
  WONG_KAR_WAI = 'WONG_KAR_WAI',
  EDWARD_YANG = 'EDWARD_YANG',
  STEPHEN_CHOW = 'STEPHEN_CHOW',
  CUSTOM = 'CUSTOM',
}

export interface DirectorProfile {
  id: DirectorStyle;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
  color: string;
}

export interface Character {
  id: string;
  name: string;
  archetype: string; // e.g. "The Repressed Father"
  description: string; // Detailed bio/flaw
}

export interface Chapter {
  id: number;
  title: string;
  summary: string; // The "beat" or outline for this specific section
  content: string; // The generated full script text
  status: 'pending' | 'generating' | 'completed' | 'error';
}

export enum GenerationStage {
  // PHASE 1: STYLE
  STYLE_INPUT = 'STYLE_INPUT',         // User selects style / pastes corpus
  STYLE_ANALYZING = 'STYLE_ANALYZING', // AI is extracting DNA
  STYLE_CONFIRMED = 'STYLE_CONFIRMED', // User reviews DNA report

  // PHASE 2: BLUEPRINT
  BLUEPRINT_INPUT = 'BLUEPRINT_INPUT', // User inputs outline & chars
  BLUEPRINT_ANALYZING = 'BLUEPRINT_ANALYZING', // AI is creating blueprint
  BLUEPRINT_REVIEW = 'BLUEPRINT_REVIEW', // User reviews feasibility & chapters

  // PHASE 3: PRODUCTION
  PRODUCTION = 'PRODUCTION',           // The writing loop
}

export interface ScriptState {
  // Input Data
  inputOutline: string;
  customCorpus: string; 
  characters: Character[]; 
  entropy: number; 
  selectedStyle: DirectorStyle;

  // Analysis Data (The "Learned" Context)
  styleDNA: string; // The extracted style analysis text
  feasibilityReport: string; // The logic of how to adapt the story

  // Production Data
  stage: GenerationStage;
  chapters: Chapter[];
  currentChapterId: number | null;
  error: string | null;
}