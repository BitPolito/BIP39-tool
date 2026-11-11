import { useState, useRef } from 'react';
import type { Language } from '../../App';
import {
  hexToBinaryString,
  calculateSha256,
  bytesToBinaryString,
  extractEntropyFromImageData,
} from '../../utils/entropyUtils';

interface EntropyPhotoProps {
  lang?: Language;
  targetBits: number;
  onBitsGenerated: (bits: string, sourceInfo: string) => void;
}

const TEXT = {
  title: '4. Photo (Photo Entropy)',
  desc: 'Write down or paste the entropy data obtained from a physical photo (64-character SHA-256 hex hash or hex sequence).',
  inputLabel: 'Write down or paste your photo’s SHA-256 hash or hex string:',
  inputPlaceholder: 'E.g.: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855...',
  dropzoneText: 'Or drag & drop an image file (PNG/JPEG) to compute its local hash',
  btnClear: 'Clear',
  btnSample: 'Load Sample Hash',
  statsChars: 'Hex characters',
  statsBits: 'Entropy bits provided',
  hashStatusValid: 'Valid SHA-256 hash (256 bits)',
  hashStatusPartial: 'Partial string hashed via SHA-256',
  lowEntropyWarningTitle: 'Warning: Low visual entropy detected!',
  lowEntropyWarningDesc:
    'The provided image shows near-zero color variation (flat solid color or pitch black). Ensure you use a photo rich in detail, varied textures, and sensor noise.',
  biasAdviceTitle: 'Detecting bias in photos:',
  biasAdviceText:
    'Use a photo with sufficient visual detail, complex textures, or high-ISO sensor noise. Avoid completely black photos (lens covered), uniform solid backgrounds, or blank images, as they lack the physical entropy required for cryptographic security.',
};

export default function EntropyPhoto({ targetBits, onBitsGenerated }: EntropyPhotoProps) {
  const t = TEXT;
  const [hexInput, setHexInput] = useState<string>('');
  const [photoInfo, setPhotoInfo] = useState<string | null>(null);
  const [isLowEntropyWarning, setIsLowEntropyWarning] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cleanHex = hexInput.replace(/[^0-9a-fA-F]/g, '');

  const computeBits = (hex: string): { bits: string } => {
    if (hex.length === 0) return { bits: '' };
    if (hex.length >= 64) {
      // 64 hex chars = 256 bits
      return {
        bits: hexToBinaryString(hex.slice(0, 64)).slice(0, targetBits),
      };
    }
    // If fewer than 64 hex chars, hash the string with SHA-256
    const hash = calculateSha256(hex);
    const bits = bytesToBinaryString(hash).slice(0, targetBits);
    return { bits };
  };

  const { bits: currentBits } = computeBits(cleanHex);

  const handleUpdate = (val: string) => {
    const clean = val.replace(/[^0-9a-fA-F]/g, '');
    setHexInput(clean);
    const { bits } = computeBits(clean);
    const info = `Photo (${clean.length} hex chars -> ${bits.length} bits)`;
    onBitsGenerated(bits, info);
  };

  const handleFileDrop = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = Math.min(800, img.width);
        canvas.height = Math.min(800, img.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = extractEntropyFromImageData(
            imgData.data,
            canvas.width,
            canvas.height,
            targetBits
          );
          setHexInput(result.hashHex);
          setIsLowEntropyWarning(result.isLowEntropy);
          setPhotoInfo(`${file.name} (${canvas.width}x${canvas.height}px)`);
          onBitsGenerated(result.bits, `Photo File: ${file.name} -> ${result.bits.length} bits`);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setHexInput('');
    setPhotoInfo(null);
    setIsLowEntropyWarning(false);
    onBitsGenerated('', 'Photo (empty)');
  };

  const handleUndo = () => {
    if (hexInput.length > 0) {
      handleUpdate(hexInput.slice(0, -1));
    }
  };

  const handleLoadSample = () => {
    const sample = 'c2e4785b8812c75a40b8a2135f6e80b2d6945a1e2f3c4d5e6f708192a3b4c5d6';
    setHexInput(sample);
    setPhotoInfo('Sample high-entropy photo hash');
    setIsLowEntropyWarning(false);
    handleUpdate(sample);
  };

  const progressPercent = Math.min(100, (currentBits.length / targetBits) * 100);

  return (
    <div className="space-y-5">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileDrop(e.target.files[0]);
          }
        }}
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/15 dark:border-white/20">
        <div>
          <h3 className="text-base font-bold text-bitpolito dark:text-white flex items-center gap-2">
            <span>📷</span>
            <span>{t.title}</span>
          </h3>
          <p className="text-xs sm:text-sm text-bitpolito/80 dark:text-white/80 mt-0.5">
            {t.desc}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-semibold text-bitpolito/70 dark:text-white/70">
            {t.statsBits}:{' '}
            <span className="text-sm font-bold text-bitpolito dark:text-white font-mono">
              {currentBits.length} / {targetBits}
            </span>
          </div>
          <div className="w-32 h-2 bg-bitpolito/20 dark:bg-white/20 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                currentBits.length >= targetBits ? 'bg-emerald-500' : 'bg-bitpolito dark:bg-white'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Textarea for writing down photo hash / hex */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-bitpolito dark:text-white">
            {t.inputLabel}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={hexInput.length === 0}
              className="text-xs px-2.5 py-1 rounded-lg border border-bitpolito/20 dark:border-white/20 hover:bg-bitpolito/10 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={hexInput.length === 0}
              className="text-xs px-2.5 py-1 rounded-lg border border-red-400/50 text-red-600 dark:text-red-300 hover:bg-red-500/10 disabled:opacity-40 cursor-pointer"
            >
              {t.btnClear}
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs px-2.5 py-1 rounded-lg border border-bitpolito/20 dark:border-white/20 hover:bg-bitpolito/10 dark:hover:bg-white/10 cursor-pointer"
            >
              {t.btnSample}
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={hexInput}
          onChange={(e) => handleUpdate(e.target.value)}
          placeholder={t.inputPlaceholder}
          className="w-full font-mono text-sm p-3.5 rounded-xl bg-white dark:bg-white/5 border-2 border-bitpolito/30 dark:border-white/30 focus:border-bitpolito dark:focus:border-white focus:outline-none transition-colors duration-150 text-bitpolito dark:text-white break-all tracking-wider resize-y"
        />

        <div className="flex items-center justify-between text-xs text-bitpolito/70 dark:text-white/70 mt-1">
          <span>
            {t.statsChars}: <b className="font-mono text-bitpolito dark:text-white">{cleanHex.length}</b>{' '}
            {cleanHex.length >= 64 ? `(${t.hashStatusValid})` : `(${t.hashStatusPartial})`}
          </span>
          {photoInfo && <span className="font-medium opacity-80">{photoInfo}</span>}
        </div>
      </div>

      {/* Optional file dropzone to extract hash from local photo file */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileDrop(e.dataTransfer.files[0]);
          }
        }}
        className="border border-dashed border-bitpolito/30 dark:border-white/30 rounded-xl p-3 text-center cursor-pointer hover:bg-bitpolito/5 dark:hover:bg-white/5 transition-all text-xs text-bitpolito/70 dark:text-white/70 flex items-center justify-center gap-2"
      >
        <span>🖼️</span>
        <span>{t.dropzoneText}</span>
      </div>

      {/* Low Entropy Warning if image was uniform */}
      {isLowEntropyWarning && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border-2 border-red-500/40 text-red-900 dark:text-red-200 text-xs">
          ⚠️ <b>{t.lowEntropyWarningTitle}</b> {t.lowEntropyWarningDesc}
        </div>
      )}

      {/* Bias Advice */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/20 dark:border-white/20 text-xs">
        <span className="text-base shrink-0">📷</span>
        <div>
          <span className="font-bold text-bitpolito dark:text-white">{t.biasAdviceTitle} </span>
          <span className="text-bitpolito/80 dark:text-white/80">{t.biasAdviceText}</span>
        </div>
      </div>
    </div>
  );
}
