// ============================================================
// NexusOS — Audio Recorder with Live Waveform & Playback
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { cn } from '../../lib/utils';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
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
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
  };

  const confirmRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const accentColorClass: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light shadow-purple/30',
    indigo: 'bg-indigo hover:bg-indigo-light shadow-indigo/30',
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
        <div className="flex flex-col items-center gap-4 py-4">
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
              Tap to Record Voice
            </h4>
            <p className="text-xs text-text-muted mt-1 max-w-xs">
              Supports Malayalam, English, and Manglish audio for automated structured extraction.
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

          <div className="w-full max-w-sm p-4 bg-obsidian rounded-xl border border-border flex items-center justify-between">
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
                  'w-10 h-10 rounded-full text-white flex items-center justify-center cursor-pointer shadow-md',
                  accentColorClass[accentColor]
                )}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div>
                <p className="text-xs font-semibold text-text-primary">Recording Ready</p>
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
