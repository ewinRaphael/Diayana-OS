// ============================================================
// Diayana OS — Audio Recorder with Real-time Speech-to-Text,
// Live Waveform, Playback, and Multilingual (EN/ML) Recognition
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Check, Sparkles, Languages, Volume2 } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { cn } from '../../lib/utils';

// Access browser native speech recognition
const SpeechRecognitionClass =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, transcript?: string) => void;
  className?: string;
}

export function AudioRecorder({ onRecordingComplete, className }: AudioRecorderProps) {
  const { accentColor } = useWorkspace();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Speech Recognition state
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'ml-IN' | 'en-US'>('en-IN');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimText, setInterimText] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const drawWaveform = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = 3;
      const gap = 2;
      const barsCount = Math.floor(canvas.width / (barWidth + gap));
      const step = Math.floor(bufferLength / barsCount);

      for (let i = 0; i < barsCount; i++) {
        const val = dataArray[i * step] || 0;
        const barHeight = Math.max(4, (val / 255) * canvas.height);

        // Accent color gradient
        ctx.fillStyle =
          accentColor === 'emerald'
            ? '#10B981'
            : accentColor === 'indigo'
            ? '#6366F1'
            : accentColor === 'amber'
            ? '#F59E0B'
            : '#8B5CF6';

        const x = i * (barWidth + gap);
        const y = (canvas.height - barHeight) / 2;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };

    render();
  }, [accentColor]);

  const startRecording = async () => {
    setErrorMsg(null);
    setLiveTranscript('');
    setInterimText('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine supported mime type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      // Audio analysis for waveform
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);

        // Clean up stream tracks
        stream.getTracks().forEach((track) => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Start Browser Speech Recognition in parallel for 100% free offline live speech-to-text
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = speechLang;

          let accumulatedFinal = '';

          recognition.onresult = (event: any) => {
            let currentInterim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const item = event.results[i];
              if (item.isFinal) {
                accumulatedFinal += item[0].transcript + ' ';
              } else {
                currentInterim += item[0].transcript;
              }
            }
            setInterimText(currentInterim);
            setLiveTranscript(accumulatedFinal.trim());
          };

          recognition.onerror = (e: any) => {
            console.warn('[SpeechRecognition] Browser recognition warning:', e.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (recognitionErr) {
          console.warn('[SpeechRecognition] Could not start speech recognition:', recognitionErr);
        }
      }

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start drawing canvas waveform
      setTimeout(drawWaveform, 50);
    } catch (err: any) {
      console.error('[AudioRecorder] Error accessing microphone:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser.'
          : 'Failed to access microphone. Please check your audio hardware.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
      recognitionRef.current = null;
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
    setLiveTranscript('');
    setInterimText('');
  };

  const confirmRecording = () => {
    if (audioBlob) {
      const fullTranscript = (liveTranscript + (interimText ? ' ' + interimText : '')).trim();
      onRecordingComplete(audioBlob, fullTranscript);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignored
        }
      }
    };
  }, [audioUrl]);

  const accentColorClass: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light shadow-purple/30',
    indigo: 'bg-indigo hover:bg-indigo-indigo shadow-indigo/30',
    emerald: 'bg-emerald hover:bg-emerald-light shadow-emerald/30',
    amber: 'bg-amber hover:bg-amber-light shadow-amber/30',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 bg-charcoal rounded-xl border border-border', className)}>
      {errorMsg && (
        <div className="mb-4 p-3 text-xs bg-error/15 border border-error/30 text-error rounded-lg w-full text-center">
          {errorMsg}
        </div>
      )}

      {/* Case 1: Initial Idle State */}
      {!isRecording && !audioBlob && (
        <div className="flex flex-col items-center gap-4 py-3 w-full">
          {/* Recognition Language Selector */}
          <div className="flex items-center gap-2 text-xs bg-obsidian px-3 py-1.5 rounded-lg border border-border">
            <Languages className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted text-[11px]">Speech Language:</span>
            <select
              value={speechLang}
              onChange={(e) => setSpeechLang(e.target.value as any)}
              className="bg-transparent text-text-primary text-[11px] font-medium focus:outline-none cursor-pointer"
            >
              <option value="en-IN" className="bg-charcoal text-text-primary">English / Manglish (en-IN)</option>
              <option value="ml-IN" className="bg-charcoal text-text-primary">Malayalam (മലയാളം)</option>
              <option value="en-US" className="bg-charcoal text-text-primary">English US (en-US)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={startRecording}
            className={cn(
              'w-20 h-20 rounded-full text-white flex items-center justify-center shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer',
              accentColorClass[accentColor]
            )}
          >
            <Mic className="w-8 h-8" />
          </button>

          <div className="text-center">
            <h4 className="text-sm font-semibold text-text-primary">
              Tap to Record Voice Note
            </h4>
            <p className="text-xs text-text-muted mt-1 max-w-xs">
              Live speech recognition transcribes your words instantly into structured meetings, tasks, and journals.
            </p>
          </div>
        </div>
      )}

      {/* Case 2: Active Recording State */}
      {isRecording && (
        <div className="flex flex-col items-center gap-4 w-full py-2">
          {/* Live Waveform Canvas */}
          <canvas
            ref={canvasRef}
            width={320}
            height={60}
            className="w-full max-w-sm h-16 bg-obsidian rounded-lg border border-border/60"
          />

          {/* Timer Display */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping" />
            <span className="font-mono text-xl font-bold text-text-primary">
              {formatTimer(recordingTime)}
            </span>
          </div>

          {/* Live Real-time Transcribed Caption */}
          <div className="w-full max-w-sm p-3 bg-obsidian rounded-xl border border-border/70 text-left">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-text-muted mb-1">
              <Sparkles className="w-3 h-3 text-purple-light animate-pulse" />
              <span>Live Speech Stream</span>
            </div>
            <p className="text-xs text-text-primary italic min-h-[1.5rem] break-words">
              {liveTranscript || interimText ? (
                <>
                  <span>{liveTranscript} </span>
                  <span className="text-text-muted">{interimText}</span>
                </>
              ) : (
                <span className="text-text-muted">Listening... speak into your microphone...</span>
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-error hover:bg-error/90 text-white font-medium text-xs shadow-lg shadow-error/20 cursor-pointer transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Recording</span>
            </button>
          </div>
        </div>
      )}

      {/* Case 3: Recorded Preview State */}
      {audioBlob && audioUrl && (
        <div className="flex flex-col items-center gap-4 w-full py-2">
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onPlay={() => setIsPlayingAudio(true)}
            onPause={() => setIsPlayingAudio(false)}
            onEnded={() => setIsPlayingAudio(false)}
            className="hidden"
          />

          {/* Audio Playback Bar */}
          <div className="w-full max-w-sm p-3.5 bg-obsidian rounded-xl border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (audioElementRef.current) {
                    if (isPlayingAudio) {
                      audioElementRef.current.pause();
                    } else {
                      audioElementRef.current.play();
                    }
                  }
                }}
                className={cn(
                  'w-9 h-9 rounded-full text-white flex items-center justify-center cursor-pointer shadow-md',
                  accentColorClass[accentColor]
                )}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div>
                <p className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-text-muted" />
                  <span>Audio Recorded</span>
                </p>
                <p className="text-[11px] font-mono text-text-muted">
                  Duration: {formatTimer(recordingTime)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetRecording}
              className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-border/40 transition-colors cursor-pointer"
              title="Record again"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Editable Transcribed Speech Box */}
          <div className="w-full max-w-sm space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-light" />
                <span>Transcribed Voice Note</span>
              </span>
              <span className="text-[10px] text-emerald-light font-mono">Editable</span>
            </div>
            <textarea
              rows={3}
              value={liveTranscript}
              onChange={(e) => setLiveTranscript(e.target.value)}
              placeholder="Spoken words will appear here. You can also edit or add text manually before processing..."
              className="w-full p-3 text-xs bg-obsidian border border-border rounded-xl text-text-primary focus:outline-none focus:ring-1 focus:ring-purple/40 resize-none font-sans"
            />
          </div>

          {/* Discard & Use Recording Buttons */}
          <div className="flex items-center gap-3 w-full max-w-sm">
            <button
              type="button"
              onClick={resetRecording}
              className="flex-1 py-2.5 text-xs font-medium text-text-muted hover:text-text-primary border border-border hover:bg-border/30 rounded-xl transition-all cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={confirmRecording}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer',
                accentColorClass[accentColor]
              )}
            >
              <Check className="w-4 h-4" />
              <span>Use Recording</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioRecorder;
