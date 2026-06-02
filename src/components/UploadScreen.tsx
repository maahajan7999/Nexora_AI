import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, ChevronRight, Play, Zap, Shield, BarChart3 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ParsedData } from '../types';
import { generateSampleData } from '../utils/sampleData';
import { calculateDataQuality } from '../utils/businessUnderstanding';

interface Props {
  onDataReady: (data: ParsedData) => void;
}

type UploadState = 'idle' | 'uploading' | 'parsing' | 'processing' | 'success' | 'error';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

const SUPPORTED_FORMATS = ['CSV', 'XLSX', 'XLS', 'TSV'];
const ACCEPT_STRING = '.csv,.xlsx,.xls,.tsv';

export default function UploadScreen({ onDataReady }: Props) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; uploadTime: number } | null>(null);
  const [preview, setPreview] = useState<ParsedData | null>(null);
  const [dataQuality, setDataQuality] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(0);

  const processFile = useCallback(async (file: File) => {
    setErrorMsg('');
    setState('uploading');
    setProgress(0);
    startTimeRef.current = Date.now();

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'tsv'].includes(ext ?? '')) {
      setState('error');
      setErrorMsg(`Unsupported format ".${ext}". Please upload CSV, XLSX, XLS, or TSV files.`);
      return;
    }

    if (file.size === 0) {
      setState('error');
      setErrorMsg('This file appears to be empty. Please upload a file with data.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setState('error');
      setErrorMsg('File exceeds 50MB limit. Please upload a smaller file.');
      return;
    }

    for (let i = 0; i <= 30; i += 5) {
      await new Promise(r => setTimeout(r, 25));
      setProgress(i);
    }

    setState('parsing');
    setProgress(35);

    try {
      let headers: string[] = [];
      let rows: Record<string, string | number>[] = [];

      if (ext === 'csv' || ext === 'tsv') {
        await new Promise<void>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            delimiter: ext === 'tsv' ? '\t' : undefined,
            worker: false,
            complete: (result) => {
              if (result.errors.length > 0 && result.data.length === 0) {
                reject(new Error('Could not parse file. The file may be corrupted or use an unsupported encoding.'));
                return;
              }
              headers = result.meta.fields ?? [];
              rows = result.data as Record<string, string | number>[];
              resolve();
            },
            error: (err) => reject(new Error(err.message)),
          });
        });
      } else {
        const buffer = await file.arrayBuffer();
        setProgress(55);
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) throw new Error('No sheets found in the workbook.');
        const raw = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, { defval: '' });
        if (raw.length > 0) {
          headers = Object.keys(raw[0]);
          rows = raw;
        }
      }

      setProgress(70);
      setState('processing');

      if (headers.length === 0) {
        throw new Error('No column headers found. Please ensure your file has a header row.');
      }

      const emptyHeaders = headers.filter(h => !h || String(h).trim() === '');
      if (emptyHeaders.length > 0) {
        throw new Error(`${emptyHeaders.length} empty column header(s) detected. All columns must have names.`);
      }

      const duplicateHeaders = headers.filter((h, i) => headers.indexOf(h) !== i);
      if (duplicateHeaders.length > 0) {
        throw new Error(`Duplicate column headers detected: "${duplicateHeaders[0]}". Each column must have a unique name.`);
      }

      if (rows.length === 0) {
        throw new Error('No data rows found. The file contains headers but no data.');
      }

      const validRows = rows.filter(r =>
        Object.values(r).some(v => v !== null && v !== undefined && String(v).trim() !== '')
      );

      if (validRows.length === 0) {
        throw new Error('All rows appear to be empty. Please check the file content.');
      }

      const limitedRows = validRows.slice(0, 500);
      const uploadTime = Date.now() - startTimeRef.current;

      setProgress(90);
      await new Promise(r => setTimeout(r, 200));

      const parsed: ParsedData = {
        headers,
        rows: limitedRows,
        fileName: file.name,
        fileSize: file.size,
        uploadTime: new Date(),
        rowCount: limitedRows.length,
        columnCount: headers.length,
      };

      const quality = calculateDataQuality(parsed);
      setDataQuality(quality);

      setProgress(100);
      setFileInfo({ name: file.name, size: file.size, uploadTime });
      setPreview(parsed);
      setState('success');
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred while processing your file.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const reset = () => {
    setState('idle');
    setProgress(0);
    setErrorMsg('');
    setFileInfo(null);
    setPreview(null);
    setDataQuality(0);
  };

  const handleContinue = () => {
    if (preview) onDataReady(preview);
  };

  const handleLoadSample = useCallback(() => {
    const sampleData = generateSampleData();
    onDataReady(sampleData);
  }, [onDataReady]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#00E5FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/30 glow-primary">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-display-sm font-display">
            <span className="nexora-gradient">NEXORA</span>
            <span className="text-white/60 ml-1">AI</span>
          </h1>
        </div>
        <p className="text-[#00E5FF]/80 text-lg font-light tracking-wide">
          Transform Data Into Decisions
        </p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleLoadSample}
          className="mt-6 flex items-center gap-2 mx-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#6C63FF]/20 to-[#00E5FF]/20 border border-[#6C63FF]/30 text-white font-medium hover:from-[#6C63FF]/30 hover:to-[#00E5FF]/30 transition-all duration-300"
        >
          <Play className="w-4 h-4 text-[#00E5FF]" />
          Try Demo Dataset
        </motion.button>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <AnimatePresence mode="wait">
          {(state === 'idle' || state === 'error') && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 backdrop-blur-xl
                  ${dragOver
                    ? 'border-[#00E5FF] bg-[#00E5FF]/10 shadow-[0_0_40px_rgba(0,229,255,0.2)]'
                    : 'border-[#6C63FF]/40 bg-white/5 hover:border-[#6C63FF] hover:bg-[#6C63FF]/5 hover:shadow-[0_0_30px_rgba(108,99,255,0.15)]'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_STRING}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <motion.div
                  animate={{ y: dragOver ? -8 : 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
                    ${dragOver ? 'bg-[#00E5FF]/20 shadow-[0_0_30px_rgba(0,229,255,0.3)]' : 'bg-[#6C63FF]/20'}`}>
                    <Upload className={`w-9 h-9 transition-colors duration-300 ${dragOver ? 'text-[#00E5FF]' : 'text-[#6C63FF]'}`} />
                  </div>
                  <div>
                    <p className="text-white text-h4 font-h3 mb-2">
                      {dragOver ? 'Release to upload' : 'Drop your spreadsheet here'}
                    </p>
                    <p className="text-white/40 text-sm">or click to browse</p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {SUPPORTED_FORMATS.map(fmt => (
                      <span key={fmt} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-mono">
                        {fmt}
                      </span>
                    ))}
                  </div>
                  <p className="text-white/20 text-xs mt-1">Max 500 rows (Free Mode) · Max 50MB</p>
                </motion.div>
              </div>

              <AnimatePresence>
                {state === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-300 font-medium text-sm">Upload Failed</p>
                      <p className="text-red-400/70 text-sm mt-1">{errorMsg}</p>
                    </div>
                    <button onClick={reset} className="text-red-400/50 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {(state === 'uploading' || state === 'parsing' || state === 'processing') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border border-[#6C63FF]/30 rounded-3xl p-12 backdrop-blur-xl bg-white/5"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#ffffff10" strokeWidth="6" />
                    <circle
                      cx="48" cy="48" r="40" fill="none"
                      stroke="url(#nexoraGrad)" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                      className="transition-all duration-300"
                    />
                    <defs>
                      <linearGradient id="nexoraGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6C63FF" />
                        <stop offset="100%" stopColor="#00E5FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{progress}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">
                    {state === 'uploading' ? 'Uploading file...' : state === 'parsing' ? 'Parsing data...' : 'Processing intelligence...'}
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    {state === 'uploading' ? 'Reading file contents' : state === 'parsing' ? 'Extracting rows and columns' : 'Analyzing business patterns'}
                  </p>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <motion.div
                    className="h-1.5 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00E5FF]"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {state === 'success' && preview && fileInfo && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-xl bg-emerald-500/5"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">File Processed Successfully</h3>
                  <p className="text-white/40 text-sm mt-1 truncate max-w-xs">{fileInfo.name}</p>
                </div>
                <button onClick={reset} className="text-white/20 hover:text-white/60 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                {[
                  { label: 'File Size', value: formatBytes(fileInfo.size) },
                  { label: 'Upload Time', value: formatTime(fileInfo.uploadTime) },
                  { label: 'Rows', value: preview.rowCount.toLocaleString() },
                  { label: 'Columns', value: preview.columnCount.toString() },
                  { label: 'Data Quality', value: `${dataQuality}%`, highlight: true },
                ].map(item => (
                  <div key={item.label} className="bg-white/5 rounded-2xl p-3 text-center">
                    <p className={`font-bold text-lg ${item.highlight ? (dataQuality >= 80 ? 'text-emerald-400' : dataQuality >= 60 ? 'text-amber-400' : 'text-red-400') : 'text-[#00E5FF]'}`}>
                      {item.value}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-2xl p-4 mb-6">
                <p className="text-white/40 text-xs font-mono mb-2 uppercase tracking-wider">Detected Columns</p>
                <div className="flex flex-wrap gap-2">
                  {preview.headers.slice(0, 12).map(h => (
                    <span key={h} className="px-2 py-1 rounded-lg bg-[#6C63FF]/20 border border-[#6C63FF]/30 text-[#6C63FF] text-xs font-mono">
                      {h}
                    </span>
                  ))}
                  {preview.headers.length > 12 && (
                    <span className="px-2 py-1 rounded-lg bg-white/5 text-white/30 text-xs">
                      +{preview.headers.length - 12} more
                    </span>
                  )}
                </div>
              </div>

              <motion.button
                onClick={handleContinue}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-[#00E5FF] text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#6C63FF]/30 hover:shadow-[#6C63FF]/50 transition-shadow"
              >
                Launch Nexora AI
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Feature hints */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex flex-wrap justify-center gap-6 text-white/30 text-sm"
      >
        {[
          { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'AI Dashboard' },
          { icon: <Zap className="w-3.5 h-3.5" />, label: 'CEO Mode' },
          { icon: <Shield className="w-3.5 h-3.5" />, label: 'Health Score' },
          { icon: <FileSpreadsheet className="w-3.5 h-3.5" />, label: 'Export Center' },
        ].map(f => (
          <span key={f.label} className="flex items-center gap-1.5">
            {f.icon}
            {f.label}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
