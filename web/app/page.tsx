'use client';

import { useState, useCallback } from 'react';

interface Finding {
  id: string;
  severity: string;
  label: string;
  title: string;
  where: string;
  fact: string;
  fix: string;
  impact?: string;
}

interface Report {
  verdict: string;
  counts: Record<string, number>;
  findings: Finding[];
  components: Record<string, string>;
  gates: Record<string, string>;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [stdout, setStdout] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [useModel, setUseModel] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.zip')) {
      setFile(f);
      setReport(null);
      setError('');
    }
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setReport(null);
      setError('');
    }
  };

  const judge = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setReport(null);
    setStdout('');

    const formData = new FormData();
    formData.append('zip', file);
    formData.append('model', String(useModel));

    try {
      const res = await fetch('/api/judge', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setStdout(data.stdout || '');
        if (data.report) {
          setReport(data.report);
        } else {
          parseStdout(data.stdout || '');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseStdout = (text: string) => {
    const verdictMatch = text.match(/VERDICT:\s*(\w+)/);
    const p0Match = text.match(/P0:\s*(\d+)/);
    const p1Match = text.match(/P1:\s*(\d+)/);
    const p2Match = text.match(/P2:\s*(\d+)/);
    const infoMatch = text.match(/INFO:\s*(\d+)/);

    const findings: Finding[] = [];
    const findingRegex = /\[(P0|P1|P2|INFO)\]\s*\[([^\]]+)\]\s*\(([^)]+)\)\s*(.+)/g;
    let m;
    while ((m = findingRegex.exec(text)) !== null) {
      findings.push({
        id: m[2],
        severity: m[1],
        label: m[3],
        title: m[4].trim(),
        where: '',
        fact: '',
        fix: '',
      });
    }

    setReport({
      verdict: verdictMatch ? verdictMatch[1] : 'UNKNOWN',
      counts: {
        P0: p0Match ? parseInt(p0Match[1]) : 0,
        P1: p1Match ? parseInt(p1Match[1]) : 0,
        P2: p2Match ? parseInt(p2Match[1]) : 0,
        INFO: infoMatch ? parseInt(infoMatch[1]) : 0,
      },
      findings,
      components: {},
      gates: {},
    });
  };

  const verdictColor = (v: string) => {
    if (v === 'PASS') return 'bg-green-600';
    if (v === 'NEEDS_REVIEW') return 'bg-yellow-600';
    if (v === 'FAIL') return 'bg-red-600';
    return 'bg-gray-600';
  };

  const sevColor = (s: string) => {
    if (s === 'P0') return 'border-red-500 bg-red-50';
    if (s === 'P1') return 'border-orange-500 bg-orange-50';
    if (s === 'P2') return 'border-yellow-500 bg-yellow-50';
    return 'border-gray-300 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">
          ⚖️ Local QC Judge
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload a Harbor task zip — get a 331-check verdict in seconds
        </p>
      </div>

      {/* Upload area */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-950' : 'border-gray-700 bg-gray-900'
          }`}
        >
          <input
            type="file"
            accept=".zip"
            onChange={handleFile}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-lg font-medium text-gray-300">
              {file ? file.name : 'Drop zip here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {file ? `${(file.size / 1024).toFixed(0)} KB` : '.zip files only'}
            </p>
          </label>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between mt-6">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={useModel}
              onChange={(e) => setUseModel(e.target.checked)}
              className="rounded"
            />
            Run with model stage (~3 min, needs WANDB_GLM_API_KEY)
          </label>
          <button
            onClick={judge}
            disabled={!file || loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors"
          >
            {loading ? '⏳ Judging...' : '⚡ Judge Zip'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-950 border border-red-700 rounded-lg text-red-300">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin text-4xl">⚖️</div>
            <p className="text-gray-400 mt-2">Running 331 checks...</p>
          </div>
        )}

        {/* Results */}
        {report && (
          <div className="mt-8 space-y-6">
            {/* Verdict banner */}
            <div className={`${verdictColor(report.verdict)} rounded-xl p-6 text-center`}>
              <h2 className="text-3xl font-bold text-white">
                {report.verdict}
              </h2>
              <div className="flex justify-center gap-6 mt-4 text-white">
                <div>
                  <div className="text-2xl font-bold">{report.counts.P0 || 0}</div>
                  <div className="text-xs opacity-80">P0</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{report.counts.P1 || 0}</div>
                  <div className="text-xs opacity-80">P1</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{report.counts.P2 || 0}</div>
                  <div className="text-xs opacity-80">P2</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{report.counts.INFO || 0}</div>
                  <div className="text-xs opacity-80">INFO</div>
                </div>
              </div>
            </div>

            {/* Gates */}
            {Object.keys(report.gates).length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Gates</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(report.gates).map(([gate, status]) => (
                    <div key={gate} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${status === 'pass' ? 'bg-green-500' : status === 'fail' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <span className="text-sm text-gray-300">{gate}</span>
                      <span className="text-xs text-gray-500 ml-auto">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Findings */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400">
                Findings ({report.findings.length})
              </h3>
              {report.findings
                .sort((a, b) => {
                  const order: Record<string, number> = { P0: 0, P1: 1, P2: 2, INFO: 3 };
                  return (order[a.severity] || 9) - (order[b.severity] || 9);
                })
                .map((f, i) => (
                  <div
                    key={i}
                    className={`border-l-4 ${sevColor(f.severity)} rounded-r-lg p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        f.severity === 'P0' ? 'bg-red-600 text-white' :
                        f.severity === 'P1' ? 'bg-orange-600 text-white' :
                        f.severity === 'P2' ? 'bg-yellow-600 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {f.severity}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-100">{f.title}</p>
                        {f.where && (
                          <p className="text-xs text-gray-500 mt-1">📍 {f.where}</p>
                        )}
                        {f.fact && (
                          <p className="text-sm text-gray-400 mt-1">{f.fact}</p>
                        )}
                        {f.impact && (
                          <p className="text-xs text-gray-500 mt-1">⚠️ {f.impact}</p>
                        )}
                        {f.fix && (
                          <p className="text-xs text-green-400 mt-1">✅ Fix: {f.fix}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Raw stdout */}
            {stdout && (
              <details className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <summary className="text-sm text-gray-400 cursor-pointer">
                  Raw output (click to expand)
                </summary>
                <pre className="mt-3 text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap max-h-96">
                  {stdout}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 bg-gray-900 px-6 py-4 text-center text-xs text-gray-500">
        Local QC Judge v1.0 · 331 checks · github.com/haseeb371/local-qc
      </div>
    </div>
  );
}
