import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const dbPath = path.resolve(process.cwd(), '../backend/caller_data.db');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        recent_calls: [],
      });
    }

    const command = `python -c "import sys; sys.path.insert(0, r'src'); from db import get_call_stats, init_db; init_db(r'${dbPath}'); import json; print(json.dumps(get_call_stats(r'${dbPath}')))"`;

    const { stdout } = await execAsync(command, {
      cwd: path.resolve(process.cwd(), '../backend'),
    });

    const data = JSON.parse(stdout.trim() || '{}');
    return NextResponse.json({
      total_calls: data.total_calls || 0,
      successful_calls: data.successful_calls || 0,
      failed_calls: data.failed_calls || 0,
      recent_calls: data.recent_calls || [],
    });
  } catch (error) {
    console.error('Error fetching call stats:', error);
    return NextResponse.json({
      total_calls: 0,
      successful_calls: 0,
      failed_calls: 0,
      recent_calls: [],
    });
  }
}
