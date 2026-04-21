import { NextResponse } from 'next/server';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd());
const SCHEMAS_DIR = join(PROJECT_ROOT, 'schemas');

export async function GET() {
  if (!existsSync(SCHEMAS_DIR)) {
    return NextResponse.json({ schemas: [], error: 'Schemas directory not found' });
  }

  const files = readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.json'));

  const schemas = files.map(filename => {
    const fullPath = join(SCHEMAS_DIR, filename);
    try {
      const content = JSON.parse(readFileSync(fullPath, 'utf-8'));
      return {
        filename,
        title: content.title || filename.replace('.json', ''),
        description: content.description || null,
        schemaVersion: content.$schema || null,
      };
    } catch {
      return { filename, error: 'Failed to parse' };
    }
  });

  return NextResponse.json({ schemas });
}
