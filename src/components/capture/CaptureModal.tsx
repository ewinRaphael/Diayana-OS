// ============================================================
// NexusOS — Multimodal Voice & Text Capture Modal
// Malayalam / English / Manglish processing with Gemini
// ============================================================

import { useState, useRef, type ChangeEvent } from 'react';
import {
  Mic,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  ListTodo,
  TrendingUp,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { AudioRecorder } from './AudioRecorder';
import { Badge } from '../ui/Badge';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useSettings } from '../../hooks/useSettings';
import { useEntries } from '../../hooks/useEntries';
import { useTasks } from '../../hooks/useTasks';
import { useMetrics } from '../../hooks/useMetrics';
import { processAudioCapture, processTextCapture, extractOfflineStructuredData } from '../../lib/gemini';
import type { GeminiResponse, Workspace, EntryCategory } from '../../lib/types';
import { cn } from '../../lib/utils';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'record' | 'upload' | 'type';

export function CaptureModal({ isOpen, onClose }: CaptureModalProps) {
  const { activeWorkspace, accentColor } = useWorkspace();
  const { settings } = useSettings();
  const { createEntry } = useEntries();
  const { createTask } = useTasks();
  const { addAchievement, addTimeWaster } = useMetrics();

  const [mode, setMode] = useState<Mode>('record');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace>(
    activeWorkspace === 'all' ? 'hashadz' : activeWorkspace
  );
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [geminiResult, setGeminiResult] = useState<GeminiResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setErrorMsg(null);
    }
  };

  const handleRecordComplete = (blob: Blob) => {
    setRecordedBlob(blob);
    setErrorMsg(null);
  };

  const runGeminiAI = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let result: GeminiResponse;

      if (mode === 'record') {
        if (!recordedBlob) {
          throw new Error('Please record audio first before processing.');
        }
        result = await processAudioCapture(recordedBlob, settings, selectedWorkspace);
      } else if (mode === 'upload') {
        if (!uploadedFile) {
          throw new Error('Please select an audio file to upload.');
        }
        result = await processAudioCapture(uploadedFile, settings, selectedWorkspace);
      } else {
        if (!textInput.trim()) {
          throw new Error('Please enter some text or notes to process.');
        }
        result = await processTextCapture(textInput, settings, selectedWorkspace);
      }

      setGeminiResult(result);
    } catch (err: any) {
      console.error('[CaptureModal] AI processing error:', err);
      setErrorMsg(err.message || 'Failed to process capture with AI.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isCreditsError = Boolean(
    errorMsg &&
      (errorMsg.includes('402') ||
        errorMsg.includes('RESOURCE_EXHAUSTED') ||
        errorMsg.includes('prepayment credits') ||
        errorMsg.includes('billing#prepay') ||
        errorMsg.includes('credits are depleted'))
  );

  const handleRunOfflineParser = () => {
    setErrorMsg(null);
    const offlineResult = extractOfflineStructuredData(
      textInput || 'Spoken Voice Note',
      selectedWorkspace,
      true
    );
    setGeminiResult(offlineResult);
  };

  // Direct manual save without AI (Fallback)
  const saveFallbackManual = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const title = textInput.trim().slice(0, 50) || 'Manual Note';
      const content = textInput.trim() || 'Quick note captured without AI processing.';

      await createEntry({
        workspace: selectedWorkspace,
        category: selectedWorkspace === 'personal' ? 'journal' : 'active_log',
        project_id: null,
        title,
        raw_transcript: textInput,
        structured_content: `- ${content}`,
        audio_url: null,
        source: 'pwa',
        entry_date: today,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save entry.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save and Auto-distribute AI Structured Data
  const saveAndDistribute = async () => {
    if (!geminiResult) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const ws = geminiResult.workspace as Workspace;
      const cat = geminiResult.category as EntryCategory;
      const today = new Date().toISOString().split('T')[0];

      // 1. Save entry
      await createEntry({
        workspace: ws,
        category: cat,
        project_id: null,
        title: geminiResult.title,
        raw_transcript: geminiResult.raw_transcript,
        structured_content: geminiResult.structured_summary,
        audio_url: null,
        source: 'pwa',
        entry_date: today,
      });

      // 2. Extract and auto-distribute tasks
      for (const t of geminiResult.extracted_tasks) {
        if (t.title) {
          await createTask({
            workspace: ws,
            project_id: null,
            title: t.title,
            status: 'todo',
            priority: (t.priority as any) || 'medium',
            due_date: t.due_date || today,
            reminder_at: t.reminder_at || null,
          });
        }
      }

      // 3. Auto-distribute personal daily metrics
      if (ws === 'personal' && geminiResult.extracted_metrics) {
        for (const ach of geminiResult.extracted_metrics.achievements || []) {
          if (ach) await addAchievement(ach);
        }
        for (const tw of geminiResult.extracted_metrics.time_wasters || []) {
          if (tw) await addTimeWaster(tw);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err: any) {
      console.error('[CaptureModal] Save distribution error:', err);
      setErrorMsg(err.message || 'Failed to distribute entry and tasks.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setGeminiResult(null);
    setRecordedBlob(null);
    setUploadedFile(null);
    setTextInput('');
    setErrorMsg(null);
    setSaveSuccess(false);
    onClose();
  };

  const accentColorClass: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-white',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-light" />
          <span>Multimodal Voice & Text Capture</span>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Workspace Selector Override */}
        <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
          <span className="text-text-muted">Target Workspace:</span>
          <div className="flex items-center gap-1.5">
            {(['hashadz', 'slash', 'personal'] as Workspace[]).map((ws) => (
              <button
                key={ws}
                type="button"
                onClick={() => setSelectedWorkspace(ws)}
                className={cn(
                  'px-3 py-1 rounded-md capitalize font-medium transition-all cursor-pointer',
                  selectedWorkspace === ws
                    ? ws === 'hashadz'
                      ? 'bg-indigo/20 text-indigo-light border border-indigo/40'
                      : ws === 'slash'
                      ? 'bg-emerald/20 text-emerald-light border border-emerald/40'
                      : 'bg-amber/20 text-amber-light border border-amber/40'
                    : 'text-text-muted hover:text-text-primary bg-obsidian'
                )}
              >
                {ws}
              </button>
            ))}
          </div>
        </div>

        {/* Input Mode Switcher */}
        {!geminiResult && (
          <div className="flex items-center gap-2 p-1 bg-obsidian rounded-xl border border-border">
            <button
              type="button"
              onClick={() => {
                setMode('record');
                setErrorMsg(null);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                mode === 'record'
                  ? 'bg-charcoal text-text-primary shadow-sm border border-border'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Mic className="w-4 h-4" />
              <span>Record Audio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('upload');
                setErrorMsg(null);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                mode === 'upload'
                  ? 'bg-charcoal text-text-primary shadow-sm border border-border'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Audio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('type');
                setErrorMsg(null);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                mode === 'type'
                  ? 'bg-charcoal text-text-primary shadow-sm border border-border'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <FileText className="w-4 h-4" />
              <span>Type Notes</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          isCreditsError ? (
            <div className="p-3.5 bg-amber/10 border border-amber/30 text-xs rounded-xl space-y-2.5 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-light shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-text-primary text-xs">
                    Google Gemini API Credits Depleted (HTTP 402)
                  </h4>
                  <p className="text-text-muted mt-0.5 leading-relaxed">
                    Your Google AI Studio account has used up its prepaid credits or free quota for this API key. You can continue immediately using the Diayana OS Smart Local Parser to extract tasks and save your notes without losing any data!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber/20">
                <button
                  type="button"
                  onClick={handleRunOfflineParser}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber/20 hover:bg-amber/30 text-amber-light font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract & Process with Smart Local Parser</span>
                </button>

                <button
                  type="button"
                  onClick={saveFallbackManual}
                  className="px-3 py-1.5 bg-obsidian border border-border text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                >
                  Save as Plain Note
                </button>

                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-purple-light hover:underline ml-auto"
                >
                  <span>Google AI Studio Billing</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 text-xs bg-error/15 border border-error/30 text-error rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="break-all">{errorMsg}</span>
            </div>
          )
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <div className="flex items-center gap-2 p-3 text-xs bg-success/15 border border-success/30 text-success rounded-xl">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Entry and extracted tasks successfully distributed!</span>
          </div>
        )}

        {/* Mode 1: Record */}
        {!geminiResult && mode === 'record' && (
          <div>
            <AudioRecorder onRecordingComplete={handleRecordComplete} />
            {recordedBlob && (
              <div className="mt-3 flex items-center justify-between p-3 bg-obsidian rounded-xl border border-border text-xs">
                <span className="text-text-muted">Audio captured ready for AI processing</span>
                <span className="text-success font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Upload */}
        {!geminiResult && mode === 'upload' && (
          <div className="flex flex-col items-center justify-center p-8 bg-charcoal rounded-xl border-2 border-dashed border-border text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept=".mp3,.wav,.ogg,.m4a,.webm"
              onChange={handleFileUpload}
              className="hidden"
            />
            <UploadCloud className="w-10 h-10 text-text-muted mb-3 opacity-60" />
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              {uploadedFile ? uploadedFile.name : 'Select or drop voice recording'}
            </h4>
            <p className="text-xs text-text-muted mb-4">
              Accepts .mp3, .wav, .m4a, .webm, .ogg (up to 25MB)
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-semibold bg-obsidian border border-border hover:border-border-light text-text-primary rounded-lg transition-all cursor-pointer"
            >
              {uploadedFile ? 'Change File' : 'Browse Files'}
            </button>
          </div>
        )}

        {/* Mode 3: Direct Type */}
        {!geminiResult && mode === 'type' && (
          <div className="space-y-3">
            <textarea
              rows={6}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type or paste notes in Malayalam, English, or Manglish (e.g., 'Innathe client meetingil Al-Noor projectinte HVAC approval vannu, next Tuesday inspection vekkanam...')"
              className="w-full p-4 bg-obsidian border border-border rounded-xl text-text-primary placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 resize-none font-sans"
            />
          </div>
        )}

        {/* Action Bar before processing */}
        {!geminiResult && (
          <div className="flex items-center justify-between pt-2">
            {mode === 'type' && textInput.trim() && (
              <button
                type="button"
                onClick={saveFallbackManual}
                disabled={isSaving}
                className="text-xs text-text-muted hover:text-text-primary underline cursor-pointer"
              >
                Save as plain text (skip AI)
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runGeminiAI}
                disabled={isProcessing}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer',
                  accentColorClass[accentColor],
                  isProcessing && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Multimodal AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Process with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* AI Result Review Card */}
        {geminiResult && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-obsidian rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="workspace" value={geminiResult.workspace} />
                  <Badge variant="status" value={geminiResult.category} />
                </div>
                <span className="text-[11px] font-mono text-text-muted">
                  Auto-Classified by Gemini
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] text-text-muted uppercase font-mono tracking-wider">
                  Summary Title
                </label>
                <input
                  type="text"
                  value={geminiResult.title}
                  onChange={(e) =>
                    setGeminiResult({ ...geminiResult, title: e.target.value })
                  }
                  className="w-full text-base font-semibold bg-charcoal border border-border rounded-lg px-3 py-1.5 text-text-primary mt-1 focus:outline-none focus:ring-1 focus:ring-purple/30"
                />
              </div>

              {/* Structured Notes */}
              <div>
                <label className="text-[10px] text-text-muted uppercase font-mono tracking-wider">
                  Structured Summary
                </label>
                <div className="p-3 bg-charcoal rounded-lg border border-border text-xs text-text-primary whitespace-pre-wrap leading-relaxed mt-1 max-h-40 overflow-y-auto">
                  {geminiResult.structured_summary}
                </div>
              </div>

              {/* Raw Transcript */}
              {geminiResult.raw_transcript && (
                <div>
                  <label className="text-[10px] text-text-muted uppercase font-mono tracking-wider">
                    Raw Transcript
                  </label>
                  <p className="text-xs text-text-muted italic mt-0.5 line-clamp-3">
                    "{geminiResult.raw_transcript}"
                  </p>
                </div>
              )}

              {/* Extracted Tasks */}
              {geminiResult.extracted_tasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary mb-2">
                    <ListTodo className="w-4 h-4 text-info" />
                    <span>Extracted Tasks ({geminiResult.extracted_tasks.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {geminiResult.extracted_tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-charcoal border border-border text-xs"
                      >
                        <span className="font-medium text-text-primary truncate">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-text-muted">
                            {task.due_date}
                          </span>
                          <Badge variant="priority" value={task.priority} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Metrics Wins / Distractions */}
              {geminiResult.workspace === 'personal' &&
                geminiResult.extracted_metrics && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
                    <div className="p-2.5 rounded-lg bg-emerald/10 border border-emerald/20 text-xs">
                      <div className="flex items-center gap-1 text-emerald-light font-semibold mb-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Wins & Progress</span>
                      </div>
                      <ul className="list-disc list-inside text-text-muted space-y-0.5 text-[11px]">
                        {geminiResult.extracted_metrics.achievements.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-lg bg-error/10 border border-error/20 text-xs">
                      <div className="flex items-center gap-1 text-error font-semibold mb-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Time Wasters</span>
                      </div>
                      <ul className="list-disc list-inside text-text-muted space-y-0.5 text-[11px]">
                        {geminiResult.extracted_metrics.time_wasters.map((tw, i) => (
                          <li key={i}>{tw}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
            </div>

            {/* Commit / Discard Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGeminiResult(null)}
                className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer"
              >
                Back / Re-analyze
              </button>
              <button
                type="button"
                onClick={saveAndDistribute}
                disabled={isSaving}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer',
                  accentColorClass[accentColor],
                  isSaving && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Distributing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm & Distribute</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default CaptureModal;
