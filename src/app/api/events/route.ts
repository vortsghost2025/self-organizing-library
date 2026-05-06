import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'Governance' | 'Graph' | 'Contradiction' | 'Deployment' | 'Verification' | 'Other';
  title: string;
  description: string;
  evidencePath: string;
  accessibility: 'Public' | 'Repo' | 'Local' | 'Metadata';
}

export async function GET() {
  try {
    const sourceDirs = [
      { path: 'lanes/broadcast', type: 'Governance' },
      { path: 'evidence/graph-snapshots', type: 'Graph' },
      { path: 'evidence/verification', type: 'Verification' },
      { path: 'lanes/library/state', type: 'Other' },
    ];

    const events: SystemEvent[] = [];
    const root = process.cwd();

    for (const dir of sourceDirs) {
      const fullPath = path.join(root, dir.path);
      if (!fs.existsSync(fullPath)) continue;

      const files = fs.readdirSync(fullPath);
      
      for (const file of files) {
        if (file === 'README.md' || file.startsWith('.')) continue;

        const filePath = path.join(fullPath, file);
        const stats = fs.statSync(filePath);
        
        // Try to extract timestamp from filename or use mtime
        let timestamp = stats.mtime.toISOString();
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z?)/);
        if (dateMatch) timestamp = dateMatch[1];

        // Simple classification based on filename/path
        let type = dir.type;
        if (file.includes('contradiction')) type = 'Contradiction';
        if (file.includes('deployment') || file.includes('release')) type = 'Deployment';
        if (file.includes('verification') || file.includes('test')) type = 'Verification';

        // Attempt to read a title/description from JSON
        let title = file;
        let description = 'System event artifact';
        
        if (file.endsWith('.json')) {
          try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            title = content.subject || content.title || file;
            description = content.body || content.description || 'Detailed event record';
          } catch (e) {
            // Fallback to filename
          }
        }

        events.push({
          id: file,
          timestamp,
          type: type as any,
          title,
          description,
          evidencePath: path.relative(root, filePath),
          accessibility: filePath.includes('lanes/broadcast') ? 'Repo' : 'Local',
        });
      }
    }

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Events API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
