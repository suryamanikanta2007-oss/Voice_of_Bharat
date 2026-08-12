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
      return NextResponse.json({ escalations: [] });
    }

    const command = `python -c "import sqlite3, json; conn=sqlite3.connect(r'${dbPath}'); c=conn.cursor(); c.execute('CREATE TABLE IF NOT EXISTS escalations (id TEXT PRIMARY KEY, user_id TEXT, caller_name TEXT NOT NULL, reason_category TEXT NOT NULL, issue_summary TEXT NOT NULL, agent_checks TEXT NOT NULL, urgency TEXT NOT NULL, caller_language TEXT NOT NULL, preferred_contact_method TEXT NOT NULL, status TEXT DEFAULT \\'OPEN\\', created_at TEXT NOT NULL)'); c.execute('SELECT id, user_id, caller_name, reason_category, issue_summary, agent_checks, urgency, caller_language, preferred_contact_method, status, created_at FROM escalations ORDER BY created_at DESC'); rows=c.fetchall(); print(json.dumps([{'id':r[0],'user_id':r[1],'caller_name':r[2],'reason_category':r[3],'issue_summary':r[4],'agent_checks':r[5],'urgency':r[6],'caller_language':r[7],'preferred_contact_method':r[8],'status':r[9],'created_at':r[10]} for r in rows]))"`;

    const { stdout } = await execAsync(command, {
      cwd: path.resolve(process.cwd(), '../backend'),
    });

    const escalations = JSON.parse(stdout.trim() || '[]');
    return NextResponse.json({ escalations });
  } catch (error) {
    console.error('Error fetching escalations:', error);
    return NextResponse.json({ escalations: [] });
  }
}
