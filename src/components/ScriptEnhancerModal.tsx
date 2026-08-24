import { useState } from "react";
import { Sparkles, Wand2, Check, X, ArrowRight, Loader2 } from "lucide-react";

interface ScriptEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
  onApplyEnhancedText: (newText: string) => void;
}

export function ScriptEnhancerModal({
  isOpen,
  onClose,
  currentText,
  onApplyEnhancedText,
}: ScriptEnhancerModalProps) {
  const [selectedAction, setSelectedAction] = useState<string>("make-engaging");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const actions = [
    {
      id: "make-engaging",
      title: "More Engaging & Expressive",
      desc: "Vivid imagery and natural emotional emphasis for dynamic reading",
    },
    {
      id: "add-pauses",
      title: "Natural Breathing & Cadence",
      desc: "Insert rhythmic pauses, commas, and ellipses for speech realism",
    },
    {
      id: "simplify",
      title: "Clarify & Simplify",
      desc: "Streamline sentence structure for crystal-clear spoken listening",
    },
    {
      id: "story-dialogue",
      title: "Format as 2-Speaker Dialogue",
      desc: "Split narrative into a back-and-forth conversation (Alex & Jordan)",
    },
  ];

  const handleEnhance = async () => {
    if (!currentText.trim()) {
      setErrorMsg("Please enter some text in the main box first.");
      return;
    }
    setIsEnhancing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/enhance-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentText,
          action: selectedAction,
        }),
      });
      const data = await res.json();
      if (res.ok && data.refinedText) {
        setEnhancedResult(data.refinedText);
      } else {
        setErrorMsg(data.error || "Failed to refine script.");
      }
    } catch (err: any) {
      setErrorMsg("Network error communicating with script assistant.");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div
        id="script-enhancer-modal"
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-white">
                Script Voiceover Assistant
              </h3>
              <p className="text-xs text-zinc-600">
                Polish punctuation, pacing, and tone for spoken acoustic perfection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Selectors */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
              Choose Enhancement Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actions.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setSelectedAction(act.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedAction === act.id
                      ? "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-500 ring-2 ring-zinc-500/20"
                      : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                    {act.title}
                  </span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 block mt-0.5 leading-snug">
                    {act.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Original Text Preview */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-zinc-600">
              Input Text:
            </span>
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 max-h-24 overflow-y-auto">
              {currentText || "No text provided yet."}
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>
          )}

          {/* Generated Result */}
          {enhancedResult && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Refined Version:
              </span>
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-zinc-800 dark:text-zinc-100 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {enhancedResult}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!enhancedResult ? (
              <button
                id="run-enhance-btn"
                type="button"
                onClick={handleEnhance}
                disabled={isEnhancing || !currentText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-600 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Polishing script...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Enhance Script</span>
                  </>
                )}
              </button>
            ) : (
              <button
                id="apply-enhanced-text-btn"
                type="button"
                onClick={() => {
                  onApplyEnhancedText(enhancedResult);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Editor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
