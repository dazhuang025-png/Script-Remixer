import React, { useState, useRef, useEffect } from 'react';
import { DIRECTORS } from './constants';
import DirectorCard from './components/DirectorCard';
import OutputDisplay from './components/OutputDisplay';
import { DirectorStyle, GenerationStage, Chapter, Character } from './types';
import { extractStyleDNA, generateBlueprint, writeChapter, refineChapter } from './services/geminiService';
import { Sparkles, PenTool, BookOpen, Layers, PlayCircle, StopCircle, Save, Film, ArrowRight, Users, Plus, Trash2, Gauge, BrainCircuit, CheckCircle, ChevronRight, RefreshCcw, X, FileText, Lock, Key, Unlock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const appPassword = process.env.APP_PASSWORD;
    const storedAuth = localStorage.getItem('script_remixer_auth');
    
    // If no password is set in env, we assume open access
    if (!appPassword) {
      setIsAuthenticated(true);
      return;
    }

    // If previously authenticated
    if (storedAuth === appPassword) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    const appPassword = process.env.APP_PASSWORD;
    if (passwordInput === appPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('script_remixer_auth', passwordInput);
      setAuthError(false);
    } else {
      setAuthError(true);
      // Shake animation trigger could go here
    }
  };

  // --- APP STATE ---
  // Data State
  const [inputOutline, setInputOutline] = useState('');
  const [customCorpus, setCustomCorpus] = useState('');
  const [characters, setCharacters] = useState<Character[]>([
    { id: '1', name: '', archetype: '', description: '' }
  ]);
  const [entropy, setEntropy] = useState<number>(0.7);
  const [selectedStyle, setSelectedStyle] = useState<DirectorStyle>(DirectorStyle.WONG_KAR_WAI);
  
  // Analysis State
  const [styleDNA, setStyleDNA] = useState<string>('');
  const [feasibilityReport, setFeasibilityReport] = useState<string>('');

  // Workflow State
  const [stage, setStage] = useState<GenerationStage>(GenerationStage.STYLE_INPUT);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBible, setShowBible] = useState(false);
  
  // Refs
  const isGeneratingRef = useRef(false);

  // --- HANDLERS ---

  // Character Management
  const handleAddCharacter = () => {
    setCharacters([...characters, { id: Date.now().toString(), name: '', archetype: '', description: '' }]);
  };
  const handleRemoveCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };
  const handleUpdateCharacterState = (id: string, field: keyof Character, value: string) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // PHASE 1: Style Analysis
  const handleExtractStyle = async () => {
    setError(null);
    setStage(GenerationStage.STYLE_ANALYZING);
    try {
      const dna = await extractStyleDNA(selectedStyle, customCorpus);
      setStyleDNA(dna);
      setStage(GenerationStage.STYLE_CONFIRMED);
    } catch (err: any) {
      setError(err.message);
      setStage(GenerationStage.STYLE_INPUT);
    }
  };

  // PHASE 2: Blueprinting
  const handleCreateBlueprint = async () => {
    if (!inputOutline.trim()) {
      setError("请输入故事大纲");
      return;
    }
    setError(null);
    setStage(GenerationStage.BLUEPRINT_ANALYZING);

    const validCharacters = characters.filter(c => c.name.trim() !== '');
    try {
      const result = await generateBlueprint(styleDNA, inputOutline, validCharacters, entropy);
      setFeasibilityReport(result.feasibility);
      setChapters(result.chapters);
      setStage(GenerationStage.BLUEPRINT_REVIEW);
    } catch (err: any) {
      setError(err.message || "生成大纲失败");
      setStage(GenerationStage.BLUEPRINT_INPUT);
    }
  };

  const handleStartProduction = () => {
    if (chapters.length > 0) {
      setCurrentChapterId(chapters[0].id);
      setStage(GenerationStage.PRODUCTION);
    }
  };

  // PHASE 3: Production
  const handleWriteChapter = async (chapterId: number) => {
    const chapterIndex = chapters.findIndex(c => c.id === chapterId);
    if (chapterIndex === -1) return;

    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, status: 'generating' } : c));
    setError(null);
    isGeneratingRef.current = true;
    
    const validCharacters = characters.filter(c => c.name.trim() !== '');

    try {
      const content = await writeChapter(chapterIndex, chapters, styleDNA, inputOutline, validCharacters, entropy);
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, status: 'completed', content } : c));
    } catch (err: any) {
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, status: 'error' } : c));
      setError(`章节 ${chapterId} 写入失败: ${err.message}`);
    } finally {
      isGeneratingRef.current = false;
    }
  };

  const handleWriteAllRemaining = async () => {
    const pendingChapters = chapters.filter(c => c.status === 'pending' || c.status === 'error');
    for (const chapter of pendingChapters) {
       if (!isGeneratingRef.current) {
         setCurrentChapterId(chapter.id);
         await handleWriteChapter(chapter.id);
         await new Promise(r => setTimeout(r, 1000));
       }
    }
  };

  // PHASE 3.5: Refine
  const handleRefineChapter = async (chapterId: number, instruction: string, currentContent: string) => {
    if (!instruction.trim()) return;
    setError(null);
    const validCharacters = characters.filter(c => c.name.trim() !== '');
    
    try {
       // Temporarily show loading state (optional, or handle inside component)
       const newContent = await refineChapter(currentContent, instruction, styleDNA, validCharacters);
       setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, content: newContent } : c));
    } catch (err: any) {
      setError(`AI精修失败: ${err.message}`);
    }
  };

  const handleUpdateChapter = (chapterId: number, newContent: string) => {
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, content: newContent } : c));
  };

  const handleDownload = () => {
    const fullScript = chapters.map(c => `\n\n=== 第 ${c.id} 场: ${c.title} ===\n\n${c.content || '(未生成)'}`).join("\n");
    const blob = new Blob([fullScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Script-Remix-${selectedStyle}-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
  };

  // --- RENDERERS ---

  // LOCK SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-stone-200 text-center space-y-8 animate-in zoom-in-95 duration-300">
           <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto shadow-lg">
             <Lock className="w-8 h-8 text-amber-400" />
           </div>
           
           <div className="space-y-2">
             <h1 className="text-2xl font-serif-sc font-bold text-stone-800 tracking-wide">Script-Remixer Studio</h1>
             <p className="text-stone-500 text-sm">Private Workspace Access</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                 <Key className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input 
                   type="password"
                   className={`w-full pl-10 pr-4 py-3 bg-stone-50 border rounded-lg outline-none focus:ring-2 transition-all text-sm font-mono
                     ${authError ? 'border-red-300 focus:ring-red-100 text-red-800' : 'border-stone-200 focus:border-amber-400 focus:ring-amber-100 text-stone-800'}
                   `}
                   placeholder="Enter Access Code..."
                   value={passwordInput}
                   onChange={(e) => { setPasswordInput(e.target.value); setAuthError(false); }}
                   autoFocus
                 />
              </div>
              
              {authError && <p className="text-xs text-red-500 font-bold animate-pulse">Access Denied. Incorrect Password.</p>}

              <button 
                type="submit"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Unlock className="w-4 h-4 text-amber-300" /> Enter Studio
              </button>
           </form>
           
           <div className="text-[10px] text-stone-300 uppercase tracking-widest pt-4">
             Authorized Personnel Only
           </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP RENDER ---
  const renderStepIndicator = () => {
    const steps = [
      { id: 1, label: '风格学习', activeStates: [GenerationStage.STYLE_INPUT, GenerationStage.STYLE_ANALYZING, GenerationStage.STYLE_CONFIRMED] },
      { id: 2, label: '剧情解构', activeStates: [GenerationStage.BLUEPRINT_INPUT, GenerationStage.BLUEPRINT_ANALYZING, GenerationStage.BLUEPRINT_REVIEW] },
      { id: 3, label: '全剧摄制', activeStates: [GenerationStage.PRODUCTION] },
    ];

    const currentStepIndex = steps.findIndex(s => s.activeStates.includes(stage));

    return (
      <div className="flex items-center justify-center gap-4 mb-8">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;
          return (
            <div key={step.id} 
              onClick={() => {
                 if (isCompleted) {
                    if (step.id === 1) setStage(GenerationStage.STYLE_CONFIRMED);
                    if (step.id === 2) setStage(GenerationStage.BLUEPRINT_REVIEW);
                 }
              }}
              className={`flex items-center gap-2 cursor-pointer ${isCompleted ? 'hover:opacity-80' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${isActive ? 'bg-amber-600 text-white shadow-lg shadow-amber-200' : isCompleted ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-500'}
              `}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.id}
              </div>
              <span className={`text-sm font-serif-sc font-bold ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>
                {step.label}
              </span>
              {idx < steps.length - 1 && <div className="w-12 h-px bg-stone-200 mx-2" />}
            </div>
          );
        })}
      </div>
    );
  };

  // 1. STYLE LAB RENDER
  const renderStyleLab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-4 space-y-6">
        <h3 className="text-xl font-serif-sc font-bold text-stone-800 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-amber-600" /> 选择风格母本
        </h3>
        <p className="text-stone-500 text-sm">选择预设大师风格，或者上传剧本原文供模型深度学习。</p>
        <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {DIRECTORS.map((director) => (
            <DirectorCard
              key={director.id}
              director={director}
              isSelected={selectedStyle === director.id}
              onSelect={setSelectedStyle}
            />
          ))}
        </div>
      </div>
      
      <div className="lg:col-span-8 flex flex-col h-full space-y-4">
        <div className="bg-white border border-stone-200 rounded-xl flex-1 flex flex-col shadow-sm overflow-hidden">
           {stage === GenerationStage.STYLE_CONFIRMED ? (
             <div className="flex-1 flex flex-col p-8 bg-stone-50/50">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-bold font-serif-sc text-stone-800">风格基因报告 (Style DNA)</h3>
                   <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 border border-green-200">
                     <CheckCircle className="w-3 h-3" /> 学习完成
                   </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar prose prose-stone prose-sm max-w-none bg-white p-6 rounded-lg border border-stone-100 shadow-inner">
                   <ReactMarkdown>{styleDNA}</ReactMarkdown>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                   <button 
                     onClick={() => setStage(GenerationStage.STYLE_INPUT)}
                     className="px-4 py-2 text-stone-500 hover:text-stone-800 text-sm"
                   >
                     重新学习
                   </button>
                   <button 
                     onClick={() => setStage(GenerationStage.BLUEPRINT_INPUT)}
                     className="px-6 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 flex items-center gap-2 shadow-lg"
                   >
                     下一步：剧情解构 <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center justify-between mb-2">
                   <label className="text-sm font-bold text-stone-500 uppercase">语料输入区 (Corpus Input)</label>
                   {selectedStyle !== DirectorStyle.CUSTOM && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">已自动加载 {DIRECTORS.find(d=>d.id===selectedStyle)?.name} 经典片段</span>}
                </div>
                <textarea
                  className="w-full flex-1 p-4 rounded-lg bg-stone-50 border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none text-stone-700 font-serif-sc text-sm leading-relaxed"
                  placeholder={selectedStyle === DirectorStyle.CUSTOM ? "请在此粘贴 5000字+ 的剧本原文或小说文本..." : "系统已预置该导演的经典文本。如果需要，你也可以在此补充粘贴更多原文以增强学习效果。"}
                  value={customCorpus}
                  onChange={(e) => setCustomCorpus(e.target.value)}
                />
                <button
                  onClick={handleExtractStyle}
                  disabled={stage === GenerationStage.STYLE_ANALYZING}
                  className="mt-4 w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stage === GenerationStage.STYLE_ANALYZING ? (
                    <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> 正在提取风格基因...</>
                  ) : (
                    <><BrainCircuit className="w-5 h-5" /> 深度学习：提取风格 DNA</>
                  )}
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );

  // 2. BLUEPRINT LAB RENDER
  const renderBlueprintLab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 pb-10">
      {/* Inputs */}
      <div className="lg:col-span-5 space-y-6">
         {/* Character Gravity */}
         <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" /> 人物引力井
              </h4>
              <button onClick={handleAddCharacter} className="text-xs bg-stone-100 hover:bg-stone-200 p-1.5 rounded"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {characters.map((char, index) => (
                <div key={char.id} className="bg-stone-50 p-3 rounded border border-stone-200 relative group">
                  <div className="flex gap-2 mb-2">
                    <input 
                      className="flex-1 bg-white border border-stone-200 rounded px-2 py-1 text-sm focus:border-amber-400 outline-none"
                      placeholder="姓名"
                      value={char.name}
                      onChange={(e) => handleUpdateCharacterState(char.id, 'name', e.target.value)}
                    />
                    <input 
                      className="flex-1 bg-white border border-stone-200 rounded px-2 py-1 text-sm focus:border-amber-400 outline-none"
                      placeholder="原型/身份"
                      value={char.archetype}
                      onChange={(e) => handleUpdateCharacterState(char.id, 'archetype', e.target.value)}
                    />
                  </div>
                  <textarea 
                     className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-sm resize-none focus:border-amber-400 outline-none"
                     placeholder="核心欲望或性格缺陷..."
                     rows={2}
                     value={char.description}
                     onChange={(e) => handleUpdateCharacterState(char.id, 'description', e.target.value)}
                  />
                  {characters.length > 1 && (
                    <button onClick={() => handleRemoveCharacter(char.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
              ))}
            </div>
         </div>

         {/* Outline Input */}
         <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3 flex-1">
             <h4 className="font-bold text-stone-700 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-600" /> 原始大纲
             </h4>
             <textarea
              className="w-full h-40 p-3 rounded-lg bg-stone-50 border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none text-stone-800 placeholder-stone-400 text-sm leading-relaxed"
              placeholder="在此输入你的狗血/中二大纲..."
              value={inputOutline}
              onChange={(e) => setInputOutline(e.target.value)}
            />
         </div>

         {/* Entropy */}
         <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
           <div className="flex items-center justify-between text-stone-600 text-sm mb-2">
              <span className="flex items-center gap-2 font-bold"><Gauge className="w-4 h-4" /> 混乱度 (Entropy)</span>
              <span className="font-mono text-xs">{entropy.toFixed(1)}</span>
           </div>
           <input type="range" min="0.2" max="1.5" step="0.1" value={entropy} onChange={(e) => setEntropy(parseFloat(e.target.value))} className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-amber-600" />
         </div>

         <button
            onClick={handleCreateBlueprint}
            disabled={stage === GenerationStage.BLUEPRINT_ANALYZING || !inputOutline.trim()}
            className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {stage === GenerationStage.BLUEPRINT_ANALYZING ? (
              <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> 分析可行性...</>
            ) : (
              <><Layers className="w-5 h-5 text-amber-200" /> 生成分场蓝图</>
            )}
          </button>
      </div>

      {/* Output / Review */}
      <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
         {stage === GenerationStage.BLUEPRINT_REVIEW ? (
           <div className="flex flex-col h-full">
              <div className="p-6 border-b border-stone-100 bg-amber-50/50">
                 <h3 className="text-lg font-bold font-serif-sc text-stone-800 mb-2">重塑策略 (Adaptation Strategy)</h3>
                 <div className="prose prose-sm prose-stone max-w-none text-stone-600">
                    <ReactMarkdown>{feasibilityReport}</ReactMarkdown>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
                 <h3 className="text-sm font-bold text-stone-500 uppercase mb-4 tracking-wider">拟定分场表 (Sequence List)</h3>
                 <div className="space-y-3">
                   {chapters.map((c) => (
                     <div key={c.id} className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
                        <div className="font-bold text-stone-800 mb-1">Seq {c.id}: {c.title}</div>
                        <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">{c.summary}</p>
                     </div>
                   ))}
                 </div>
              </div>
              <div className="p-4 border-t border-stone-200 bg-white flex justify-end gap-3">
                 <button onClick={() => setStage(GenerationStage.BLUEPRINT_INPUT)} className="px-4 py-2 text-stone-500 hover:text-stone-800">调整参数重试</button>
                 <button onClick={handleStartProduction} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2">
                   <CheckCircle className="w-4 h-4" /> 批准蓝图，进组拍摄
                 </button>
              </div>
           </div>
         ) : (
           <div className="flex items-center justify-center h-full text-stone-400 flex-col gap-4">
             <Layers className="w-12 h-12 opacity-20" />
             <p>等待大纲输入...</p>
           </div>
         )}
      </div>
    </div>
  );

  // 3. PRODUCTION SET RENDER
  const renderProductionSet = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-200px)] rounded-xl border border-stone-200 overflow-hidden bg-white shadow-2xl animate-in zoom-in-95 duration-500 relative">
      {/* Sidebar */}
      <div className="lg:col-span-3 border-r border-stone-200 bg-stone-50 flex flex-col min-h-0">
        <div className="p-4 border-b border-stone-200 bg-white space-y-3 shrink-0">
           <h3 className="font-serif-sc text-stone-800 font-bold flex items-center gap-2">
             <ClapperboardIcon /> 拍摄计划表
           </h3>
           <button 
             onClick={handleWriteAllRemaining}
             disabled={isGeneratingRef.current}
             className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded-lg text-sm transition-all shadow-md font-bold"
           >
             {isGeneratingRef.current ? <StopCircle className="w-4 h-4 animate-pulse" /> : <PlayCircle className="w-4 h-4 text-amber-300" />}
             全剧本自动摄制 (Auto-Film)
           </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => setCurrentChapterId(chapter.id)}
              className={`w-full text-left p-3 rounded-lg text-sm transition-all border group relative
                ${currentChapterId === chapter.id 
                  ? 'bg-white border-amber-400 text-stone-900 shadow-sm ring-1 ring-amber-100' 
                  : 'bg-transparent border-transparent text-stone-500 hover:bg-stone-200 hover:text-stone-800'
                }
              `}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-bold ${currentChapterId === chapter.id ? 'text-amber-600' : ''}`}>Seq {chapter.id}</span>
                {chapter.status === 'completed' && <span className="text-green-600 text-[10px] bg-green-100 px-1.5 py-0.5 rounded border border-green-200">DONE</span>}
                {chapter.status === 'generating' && <span className="text-amber-600 text-[10px] bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">REC</span>}
                {chapter.status === 'pending' && <span className="text-stone-400 text-[10px] border border-stone-200 px-1.5 py-0.5 rounded">TODO</span>}
              </div>
              <div className="line-clamp-1 opacity-80 font-serif-sc text-xs">{chapter.title}</div>
            </button>
          ))}
        </div>
        
        {/* Project Bible Toggle */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 text-center">
            <button 
                onClick={() => setShowBible(true)}
                className="text-xs text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 w-full"
            >
                <BookOpen className="w-3 h-3" /> 查看项目档案
            </button>
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-100 shrink-0">
           <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-600 py-3 rounded-lg text-sm transition-colors border border-stone-200 shadow-sm">
             <Save className="w-4 h-4" /> 导出完整剧本
           </button>
        </div>
      </div>

      {/* Main Content with Scroll Hidden on Container */}
      <div className="lg:col-span-9 bg-white flex flex-col relative overflow-hidden">
        {currentChapterId ? (
          <OutputDisplay 
            chapter={chapters.find(c => c.id === currentChapterId)!}
            onGenerate={() => handleWriteChapter(currentChapterId)}
            entropy={entropy}
            onRefine={(instruction, content) => handleRefineChapter(currentChapterId, instruction, content)}
            onUpdate={(content) => handleUpdateChapter(currentChapterId, content)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400">请选择左侧章节开始创作</div>
        )}
      </div>

      {/* Project Bible Modal Overlay */}
      {showBible && (
        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end">
           <div className="w-full max-w-lg bg-stone-50 h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-stone-200">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white">
                 <h3 className="font-serif-sc font-bold text-stone-800 flex items-center gap-2">
                   <BookOpen className="w-4 h-4 text-amber-600" /> 项目档案 (Project Bible)
                 </h3>
                 <button onClick={() => setShowBible(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-500"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                 <section>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <BrainCircuit className="w-3 h-3" /> 风格基因 (Style DNA)
                    </h4>
                    <div className="prose prose-sm prose-stone bg-white p-4 rounded-lg border border-stone-100 shadow-sm">
                       <ReactMarkdown>{styleDNA || "暂无数据"}</ReactMarkdown>
                    </div>
                 </section>
                 
                 <section>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <FileText className="w-3 h-3" /> 可行性报告 (Strategy)
                    </h4>
                    <div className="prose prose-sm prose-stone bg-white p-4 rounded-lg border border-stone-100 shadow-sm">
                       <ReactMarkdown>{feasibilityReport || "暂无数据"}</ReactMarkdown>
                    </div>
                 </section>

                 <section>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <Users className="w-3 h-3" /> 核心人物 (Characters)
                    </h4>
                    <div className="space-y-2">
                       {characters.map(c => (
                         <div key={c.id} className="bg-white p-3 rounded border border-stone-100 text-sm">
                            <span className="font-bold text-stone-700">{c.name}</span>
                            <span className="text-stone-400 mx-2">|</span>
                            <span className="text-amber-600">{c.archetype}</span>
                            <p className="text-stone-500 mt-1 text-xs">{c.description}</p>
                         </div>
                       ))}
                    </div>
                 </section>
              </div>
           </div>
        </div>
      )}
    </div>
  );

  // --- MAIN RETURN ---
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-stone-200 h-16">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-stone-900 border border-stone-800 p-2 rounded-lg shadow-sm">
              <Film className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-wide font-serif-sc text-stone-800 leading-none">Script-Remixer</h1>
              <span className="text-[10px] text-stone-400 tracking-[0.2em] uppercase mt-1">拒绝狗血 // 重塑经典</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if(window.confirm('确定要重置所有进度吗？')) {
                  setStage(GenerationStage.STYLE_INPUT);
                  setChapters([]);
                  setStyleDNA('');
                  setFeasibilityReport('');
                }
              }}
              className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-800 transition-colors"
            >
              <RefreshCcw className="w-3 h-3" /> 重置
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {renderStepIndicator()}

        {error && (
           <div className="fixed bottom-10 right-6 z-50 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm shadow-xl max-w-md animate-in slide-in-from-right flex items-center justify-between gap-4">
             <span>{error}</span>
             <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 font-bold">✕</button>
           </div>
        )}

        {/* Dynamic Stage Rendering */}
        {[GenerationStage.STYLE_INPUT, GenerationStage.STYLE_ANALYZING, GenerationStage.STYLE_CONFIRMED].includes(stage) && renderStyleLab()}
        
        {[GenerationStage.BLUEPRINT_INPUT, GenerationStage.BLUEPRINT_ANALYZING, GenerationStage.BLUEPRINT_REVIEW].includes(stage) && renderBlueprintLab()}
        
        {stage === GenerationStage.PRODUCTION && renderProductionSet()}

      </main>
    </div>
  );
};

const ClapperboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-600"><path d="M20.2 6 3 11l-.9-2.4c-.5-1.1-.2-2.4 1-2.9l10-3.8c1.1-.5 2.4-.2 2.9 1z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 2.8 3.1 3.9"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>
)

export default App;