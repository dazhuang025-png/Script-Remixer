import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Loader2, Sparkles, Clapperboard, FileText, Gauge, Edit3, Check, X, Wand2 } from 'lucide-react';
import { Chapter } from '../types';

interface OutputDisplayProps {
  chapter: Chapter;
  onGenerate: () => void;
  entropy?: number;
  onRefine?: (instruction: string, currentContent: string) => Promise<void>;
  onUpdate?: (newContent: string) => void;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ 
  chapter, 
  onGenerate, 
  entropy = 0.7,
  onRefine,
  onUpdate
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState('');
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    setLocalContent(chapter.content || '');
  }, [chapter.content]);

  const handleCopy = () => {
    if (!chapter.content) return;
    navigator.clipboard.writeText(chapter.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onUpdate) onUpdate(localContent);
    setIsEditing(false);
  };

  const handleRefineSubmit = async () => {
    if (!onRefine || !refineInstruction.trim()) return;
    setIsRefining(true);
    await onRefine(refineInstruction, localContent);
    setIsRefining(false);
    setRefineInstruction('');
    // The parent updates the chapter content, useEffect will update localContent
  };

  const isGenerating = chapter.status === 'generating';
  const hasContent = !!chapter.content;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Chapter Toolbar */}
      <div className="h-16 border-b border-stone-200 bg-white/90 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex flex-col">
           <span className="text-xs text-stone-400 font-mono uppercase tracking-widest">Sequence {chapter.id}</span>
           <h2 className="font-serif-sc text-lg text-stone-800 font-bold truncate max-w-2xl">
            {chapter.title}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          {hasContent && !isEditing && (
            <>
             <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-all text-xs flex items-center gap-2"
            >
              {copied ? <span className="text-green-600">已复制</span> : <><Copy className="w-4 h-4" /> 复制</>}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-all text-xs flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> 精修/调整
            </button>
            </>
          )}

          {isEditing && (
            <div className="flex items-center gap-2 animate-in fade-in">
                <button onClick={() => { setIsEditing(false); setLocalContent(chapter.content); }} className="p-2 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
                <button onClick={handleSave} className="px-3 py-1 bg-stone-800 text-white text-xs rounded flex items-center gap-1 hover:bg-stone-700"><Check className="w-3 h-3" /> 保存修改</button>
            </div>
          )}
          
          <div className="hidden sm:flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg mr-2">
            <Gauge className="w-3 h-3 text-stone-400" />
            <span className="text-xs font-mono text-stone-500">Entropy: {entropy.toFixed(1)}</span>
          </div>

          <button
            onClick={onGenerate}
            disabled={isGenerating || isEditing}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm
              ${isGenerating || isEditing
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200' 
                : hasContent 
                  ? 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-300'
                  : 'bg-stone-900 hover:bg-stone-800 text-white shadow-stone-900/10'
              }
            `}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 正在摄制...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {hasContent ? '重拍本场' : '开始摄制 (Action)'}</>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-stone-50 min-h-0">
        
        {/* Paper Texture - subtle grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.4] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

        {isGenerating ? (
           <div className="h-full flex flex-col items-center justify-center space-y-8 text-stone-400 animate-in fade-in duration-500 p-8">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin"></div>
                <Clapperboard className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-300" />
             </div>
             <div className="text-center font-serif-sc space-y-3 z-10">
               <h3 className="text-2xl text-stone-800 font-bold">正在根据风格重构剧本...</h3>
               <p className="text-stone-500">Accessing Long Context Window & Blueprint...</p>
               <div className="w-64 h-1 bg-stone-200 rounded-full mx-auto overflow-hidden mt-4">
                 <div className="h-full bg-amber-500 animate-progress"></div>
               </div>
               <p className="text-sm text-stone-500 italic mt-4 max-w-md mx-auto border-l-2 border-amber-500/30 pl-4">
                 "{chapter.summary.slice(0, 80)}..."
               </p>
             </div>
           </div>
        ) : !hasContent ? (
          <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto z-10 relative p-8">
             <div className="w-full bg-white border border-dashed border-stone-300 rounded-2xl p-10 text-center space-y-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group">
                <div className="bg-stone-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-stone-400 group-hover:text-amber-500 group-hover:bg-amber-50 transition-colors">
                  <FileText className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl text-stone-800 font-serif-sc font-bold">第 {chapter.id} 场剧本待生成</h3>
                  <p className="text-stone-500">预计生成字数：3000 - 4000 字</p>
                </div>

                <div className="text-left bg-stone-50 p-6 rounded-lg border border-stone-200 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="text-xs text-stone-400 uppercase font-bold mb-2 tracking-wider">本场剧情蓝图 (Blueprint)</p>
                  <p className="text-stone-600 font-serif-sc leading-relaxed text-sm">
                    {chapter.summary}
                  </p>
                </div>

                <button
                  onClick={onGenerate}
                  className="mt-4 px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-lg shadow-lg flex items-center gap-3 transition-transform hover:-translate-y-1 mx-auto w-full justify-center sm:w-auto"
                >
                  <Sparkles className="w-6 h-6 text-amber-300" />
                  开始撰写本章 (Start Writing)
                </button>
             </div>
          </div>
        ) : (
          <div className="relative max-w-4xl mx-auto h-full flex flex-col">
            {isEditing ? (
              <div className="flex-1 flex flex-col h-full bg-white z-20 shadow-xl border-x border-stone-200 animate-in slide-in-from-bottom-4">
                 <div className="bg-stone-100 p-2 text-xs text-stone-500 text-center font-mono border-b border-stone-200">
                    EDIT MODE ACTIVE
                 </div>
                 <textarea 
                    className="flex-1 w-full p-12 resize-none outline-none font-serif-sc text-lg leading-relaxed text-stone-800 custom-scrollbar"
                    value={localContent}
                    onChange={(e) => setLocalContent(e.target.value)}
                 />
                 {/* AI Refine Bar */}
                 <div className="p-4 bg-stone-50 border-t border-stone-200">
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         className="flex-1 border border-stone-300 rounded-lg px-4 py-2 text-sm focus:border-amber-500 outline-none shadow-sm"
                         placeholder="给AI导演下指令 (例如：把这段对话改得更隐晦一点，像王家卫那样...)"
                         value={refineInstruction}
                         onChange={(e) => setRefineInstruction(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleRefineSubmit()}
                       />
                       <button 
                         onClick={handleRefineSubmit}
                         disabled={isRefining || !refineInstruction}
                         className="bg-amber-500 hover:bg-amber-600 text-white px-4 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
                       >
                         {isRefining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                       </button>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="p-8 lg:p-12 pb-32 z-10 prose prose-lg prose-stone font-serif-sc">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-center text-stone-900 mb-12 mt-4 tracking-widest uppercase border-b-2 border-stone-200 pb-6" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-stone-800 mt-12 mb-6 uppercase tracking-wider pl-4 border-l-4 border-stone-800 bg-stone-100 py-2" {...props} />, // Scene Headings
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-center text-stone-500 mt-8 mb-2 uppercase" {...props} />, // Character names usually
                    p: ({node, ...props}) => {
                      return <p className="text-stone-800 leading-8 mb-6 text-justify" {...props} />
                    },
                    blockquote: ({node, ...props}) => <div className="pl-12 pr-12 my-6 text-center italic text-stone-500 bg-white/50 py-4 rounded-lg border-y border-stone-200" {...props} />,
                    strong: ({node, ...props}) => <strong className="text-stone-900 font-bold" {...props} />,
                  }}
                >
                  {localContent}
                </ReactMarkdown>

                {/* End of Chapter Marker */}
                <div className="flex items-center justify-center gap-4 mt-20 opacity-50">
                  <div className="h-px bg-stone-300 w-20"></div>
                  <span className="text-stone-400 font-mono text-sm">END OF SEQUENCE {chapter.id}</span>
                  <div className="h-px bg-stone-300 w-20"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputDisplay;