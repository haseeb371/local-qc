import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import os from 'os';

const execAsync = promisify(exec);
const ENGINE = 'C:\\Users\\Haseeb Mirza\\Downloads\\Harbor-Shannon-QC\\harbor_shannon_qc.py';
const JUDGE = 'C:\\Users\\Haseeb Mirza\\Documents\\local-qc\\scripts\\judge.py';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('zip') as File;
    const useModel = formData.get('model') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No zip file uploaded' }, { status: 400 });
    }

    const tmpDir = join(os.tmpdir(), `qc-upload-${randomUUID()}`);
    await mkdir(tmpDir, { recursive: true });
    const zipPath = join(tmpDir, file.name);
    const bytes = await file.arrayBuffer();
    await writeFile(zipPath, Buffer.from(bytes));

    const args = ['python', JUDGE, zipPath, '--no-model'];
    if (useModel) {
      args.pop();
    }
    const cmd = args.join(' ');
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 120000,
      env: { ...process.env, PYTHONUTF8: '1', NO_COLOR: '1' },
      maxBuffer: 10 * 1024 * 1024,
    });

    const reportMatch = stdout.match(/judge-report\.json/);
    let reportJson = null;
    const reportPath = join(tmpDir, 'judge-report.json');
    const altReportDir = (stdout.match(/C:\\[^\s]+judge-report\.json/) || [])[0];

    if (altReportDir && existsSync(altReportDir)) {
      reportJson = JSON.parse(await readFile(altReportDir, 'utf-8'));
    }

    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    return NextResponse.json({
      stdout: stdout.slice(-8000),
      report: reportJson,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
