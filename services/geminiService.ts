import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DirectorStyle, Chapter, Character } from '../types';
import { DIRECTOR_SAMPLES } from '../constants';

const getModel = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Switched to gemini-2.5-flash for better availability and speed
  return ai.models;
};

const formatCharacters = (characters: Character[]): string => {
  if (characters.length === 0) return "No specific character profiles provided. Infer from outline.";
  return characters.map(c => `- NAME: ${c.name} (${c.archetype})\n  TRAITS: ${c.description}`).join("\n");
};

/**
 * Stage 1: Style DNA Extraction
 * The model reads the corpus and outputs a "Style Report" (Style DNA).
 * CRITICAL UPDATE: Enforce ABSTRACTION to avoid surface-level mimicry.
 */
export const extractStyleDNA = async (
  style: DirectorStyle,
  customCorpus: string
): Promise<string> => {
  const models = getModel();
  
  const referenceMaterial = style === DirectorStyle.CUSTOM 
    ? customCorpus 
    : (customCorpus ? customCorpus + "\n\n" + DIRECTOR_SAMPLES[style] : DIRECTOR_SAMPLES[style]);

  if (!referenceMaterial || referenceMaterial.length < 50) {
    return "语料不足。请粘贴更多剧本原文或选择预设风格。";
  }

  const prompt = `
  ROLE: You are an expert Film Theorist and Stylistic Analyst.

  TASK:
  Deeply read the provided "Screenplay Corpus" and extract the **ABSTRACT DIRECTING PRINCIPLES** (Style DNA).
  
  *** CRITICAL INSTRUCTION FOR STYLE TRANSFER ***
  You must separate **CONTENT** (WHAT is happening, e.g., cooking, kung fu, 1960s) from **FORM** (HOW it is shown, e.g., static shots, rapid cuts, silence, repression).
  We want to apply this director's FORM to completely different genres (e.g., Sci-Fi, Cult).
  
  **⛔ PROHIBITED:** Do not list specific props or settings (e.g., "He likes Qipaos" or "He likes cooking scenes").
  **✅ REQUIRED:** Extract the FUNCTION of the scene (e.g., "He uses complex physical rituals to mask repressed emotional tension" or "He uses costumes as a cage for the character").

  ANALYSIS TARGETS:
  1. **The Mechanism of Subtext**: How do characters avoid saying what they mean? (e.g., "talking about the weather instead of love").
  2. **Visual Grammar**: Static vs Handheld? Wide vs Close? Depth of field? Framing (e.g., "shooting through doorways to create voyeurism").
  3. **Pacing & Rhythm**: The "Heartbeat" of the scene.
  4. **Thematic Abstractions**: (e.g. "Ritual vs Chaos", not "Food vs Hunger").

  CORPUS:
  ${referenceMaterial.substring(0, 20000)}

  OUTPUT:
  Return a concise "Style DNA Report". 
  Language: Chinese.
  Start with: "【风格基因提取报告】"
  `;

  try {
    const response = await models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "无法提取风格。";
  } catch (error) {
    console.error("Style extraction failed:", error);
    throw new Error("风格学习失败，请检查网络或API Key。");
  }
};

/**
 * Stage 2: Blueprint Generation (Feasibility + Chapters)
 */
export const generateBlueprint = async (
  styleDNA: string,
  outline: string, 
  characters: Character[],
  entropy: number
): Promise<{ feasibility: string, chapters: Chapter[] }> => {
  const models = getModel();
  const characterContext = formatCharacters(characters);

  const prompt = `
  ROLE: You are "Script-Remixer", an elite script doctor specializing in GENRE MASHUPS.
  
  TASK: 
  1. Analyze the user's "Raw Outline" (Content) against the "Style DNA" (Form).
  2. Create a "Feasibility & Adaptation Strategy".
  
  *** THE GOLDEN RULE: STRUCTURAL EQUIVALENCE MAPPING ***
  The User's Outline determines the **SUBJECT (WHAT)**.
  The Style DNA determines the **LENS (HOW)**.
  
  **⛔ STRICT PROHIBITION:** 
  Do NOT force the director's specific props into the user's world.
  - If Ang Lee + Cyberpunk: Do NOT make a cyborg cook food.
  - If Wong Kar-wai + Zombie Apocalypse: Do NOT make a zombie wear a Qipao.
  
  **✅ REQUIREMENT:** 
  Find the **FUNCTIONAL EQUIVALENT** in the user's world.
  - Ang Lee's "Cooking" (Ritual) -> Cyberpunk's "Maintainance/Repair" (Ritual).
  - Wong Kar-wai's "Expiration Date" (Time Anxiety) -> Zombie's "Rotting Flesh" (Time Anxiety).
  
  INPUT DATA:
  [STYLE DNA (THE LENS)]:
  ${styleDNA}

  [CHARACTER GRAVITY PROFILES]:
  ${characterContext}

  [USER'S RAW OUTLINE (THE SUBJECT)]:
  ${outline}

  OUTPUT SCHEMA (JSON):
  Return an object with:
  - "feasibilityReport": A string (markdown) explaining the "Genre Bending" strategy. Explain explicitly what specific elements from the outline will be treated with what specific techniques from the style.
  - "sequences": An array of objects { "title": string, "summary": string }.
    The 'summary' must describe the VISUALS and SUBTEXT of the scene, utilizing the mashup logic.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      feasibilityReport: { type: Type.STRING, description: "Strategy for adapting the story to the style." },
      sequences: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING, description: "Detailed visual beat sheet." }
          },
          required: ["title", "summary"]
        }
      }
    },
    required: ["feasibilityReport", "sequences"]
  };

  try {
    const response = await models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: entropy,
      },
    });

    const jsonText = response.text || "{}";
    const parsed = JSON.parse(jsonText);
    
    const chapters = (parsed.sequences || []).map((item: any, index: number) => ({
      id: index + 1,
      title: item.title,
      summary: item.summary,
      content: '',
      status: 'pending'
    }));

    return {
      feasibility: parsed.feasibilityReport || "分析完成。",
      chapters
    };

  } catch (error) {
    console.error("Blueprint generation failed:", error);
    throw new Error("剧情解构失败，请重试。");
  }
};

/**
 * Stage 3: Write Chapter
 */
export const writeChapter = async (
  chapterIndex: number,
  chapters: Chapter[],
  styleDNA: string,
  outline: string,
  characters: Character[],
  entropy: number
): Promise<string> => {
  const models = getModel();

  const currentChapter = chapters[chapterIndex];
  const previousChapters = chapters.slice(0, chapterIndex);
  
  const storyContext = previousChapters.map(c => `[SEQUENCE ${c.id}: ${c.title}]\n${c.content}`).join("\n\n");
  const characterContext = formatCharacters(characters);

  const prompt = `
  TASK: Write the FULL script content for SEQUENCE ${currentChapter.id}: "${currentChapter.title}".
  
  *** CORE DIRECTIVE: SEPARATION OF SUBJECT & LENS ***
  You are a director shooting the USER'S GENRE (Subject) using the DIRECTOR'S LENS (Style).
  
  RULES OF ENGAGEMENT:
  
  1. **FOCUS SHIFT (Focus on Micro-Emotion)**
     - Do not focus on the "Plot Event" (e.g., The bomb exploding).
     - Focus on the "Human Reaction" (e.g., The trembling hand holding the tea cup *before* the explosion).
     - If Ang Lee: The tension must be domestic/familial, even in space.
     - If Wong Kar-wai: The tension must be about time/isolation.
     
  2. **SPATIAL GROUNDING (Life Traces)**
     - Even in High-Concept settings (Sci-Fi/Fantasy), find the "Flaws".
     - **NO** pristine, shiny holograms. **YES** to mold in the corner, cigarette butts on the spaceship floor, a half-eaten bowl of noodles next to the quantum computer.
     - Make the world feel "Lived In" and "Weary".
  
  3. **DIALOGUE RE-CODING (Subtext Only)**
     - **STRICT PROHIBITION:** Characters must NEVER say exactly what they mean.
     - Use "Object Correlatives": Talk about an object (a broken umbrella, a stale can of pineapple) to express feelings.
     - Example: Instead of "I love you", say "I bought extra noodles."
     - Example: Instead of "I'm scared of dying", say "This rain never stops."
  
  DATA:
  [STYLE DNA]:
  ${styleDNA}
  
  [CHARACTER PROFILES]:
  ${characterContext}

  [FULL STORY OUTLINE]:
  ${outline}

  [STORY SO FAR]:
  ${storyContext}

  [CURRENT SEQUENCE BLUEPRINT]:
  ${currentChapter.summary}

  ACTION:
  Write the screenplay for this sequence now. 
  Format: Standard Screenplay (Scene Headings, Action, Dialogue).
  Length: 3000-4000 Chinese characters. Be extremely detailed in visual description.
  Language: Simplified Chinese.
  `;

  try {
    const response = await models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: entropy,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Chapter generation failed:", error);
    throw new Error(`Failed to write chapter ${currentChapter.id}.`);
  }
};

/**
 * Stage 3.5: Refine/Rewrite Chapter (The "Director's Note" Feature)
 */
export const refineChapter = async (
  currentContent: string,
  instruction: string,
  styleDNA: string,
  characters: Character[]
): Promise<string> => {
  const models = getModel();
  const characterContext = formatCharacters(characters);

  const prompt = `
  ROLE: You are the AI Assistant Director.
  
  TASK: Rewrite the provided script segment based on the DIRECTOR'S NOTE.
  
  [DIRECTOR'S NOTE (USER INSTRUCTION)]:
  "${instruction}"
  
  [STYLE DNA]:
  ${styleDNA}

  [CHARACTERS]:
  ${characterContext}

  [CURRENT SCRIPT]:
  ${currentContent}

  ACTION:
  Rewrite the script. Improve it. Apply the instruction strictly.
  Maintain the screenplay format.
  Language: Simplified Chinese.
  `;

  try {
    const response = await models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || currentContent;
  } catch (error) {
    console.error("Refine failed:", error);
    throw new Error("AI精修失败，请重试。");
  }
};