#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const requiredFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/new/page.tsx',
  'app/trip/[id]/page.tsx',
  'app/trip/[id]/share/page.tsx',
  'app/trip/page.tsx',
  'components/site-header.tsx',
  'lib/supabase/client.ts',
  'types/supabase.ts',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'tsconfig.json',
  '.env.example',
  'app/actions/trip-actions.ts',
  'app/actions/ai-actions.ts',
  'lib/domain/trip.ts',
  'lib/dify/schema.ts',
  'components/trip/timeline-card.tsx',
  'components/trip/next-action-card.tsx',
  'db/schema.sql',
  'app/api/ai/generate/route.ts',
  'components/new-trip/generate-form.tsx',
  'lib/ai/openai-itinerary.ts',
  'lib/mock/shanxi-loop.ts',
  'lib/domain/trip-schedule.ts',
  'components/trip/trip-workspace.tsx',
  'components/trip/trip-library.tsx',
  'document/迭代升级日志.md',
  'document/Supabase同步设计文档.md',
];

const requiredSnippets = [
  {
    file: 'package.json',
    snippet: '"next":',
    message: 'Next.js dependency is missing',
  },
  {
    file: 'package.json',
    snippet: '"tailwindcss":',
    message: 'Tailwind dependency is missing',
  },
  {
    file: 'package.json',
    snippet: '"@supabase/supabase-js":',
    message: 'Supabase dependency is missing',
  },
  {
    file: 'package.json',
    snippet: '"lucide-react":',
    message: 'Lucide dependency is missing',
  },
  {
    file: 'types/supabase.ts',
    snippet: 'export interface Database',
    message: 'Supabase Database type is missing',
  },
  {
    file: 'types/supabase.ts',
    snippet: 'profiles:',
    message: 'profiles table type is missing',
  },
  {
    file: 'types/supabase.ts',
    snippet: 'trips:',
    message: 'trips table type is missing',
  },
  {
    file: 'types/supabase.ts',
    snippet: 'days:',
    message: 'days table type is missing',
  },
  {
    file: 'types/supabase.ts',
    snippet: 'events:',
    message: 'events table type is missing',
  },
  {
    file: 'types/supabase.ts',
    snippet: 'memories:',
    message: 'memories table type is missing',
  },
  {
    file: 'lib/supabase/client.ts',
    snippet: 'createSupabaseBrowserClient',
    message: 'Supabase client factory is missing',
  },
  {
    file: 'app/actions/trip-actions.ts',
    snippet: 'export async function getTripDetails',
    message: 'Trip server actions are missing',
  },
  {
    file: 'app/actions/ai-actions.ts',
    snippet: 'export async function generateItineraryAction',
    message: 'AI server action is missing',
  },
  {
    file: 'db/schema.sql',
    snippet: 'create table if not exists public.trips',
    message: 'Database schema file is missing trip table',
  },
  {
    file: '.env.example',
    snippet: 'OPENAI_BASE_URL',
    message: 'OpenAI-compatible API base URL env is missing',
  },
  {
    file: 'lib/ai/openai-itinerary.ts',
    snippet: '固定输出 JSON Schema',
    message: 'AI prompt is missing fixed output schema requirement',
  },
  {
    file: 'components/new-trip/generate-form.tsx',
    snippet: '按当前结果继续优化',
    message: 'Refinement UI is missing',
  },
  {
    file: 'components/new-trip/generate-form.tsx',
    snippet: 'localStorage.setItem',
    message: 'Local save capability is missing',
  },
  {
    file: 'components/new-trip/generate-form.tsx',
    snippet: '生成过程',
    message: 'Streaming UI is missing',
  },
  {
    file: 'components/new-trip/generate-form.tsx',
    snippet: '本地行程管理',
    message: 'Itinerary management UI is missing',
  },
  {
    file: 'app/page.tsx',
    snippet: '管理员 carl-xu',
    message: 'User support footer is missing',
  },
  {
    file: 'app/page.tsx',
    snippet: '版本号 1.0.0',
    message: 'Version footer is missing',
  },
  {
    file: 'app/trip/page.tsx',
    snippet: 'TripLibrary',
    message: 'Trip management page is missing',
  },
  {
    file: 'components/trip/trip-library.tsx',
    snippet: '历史行程',
    message: 'Trip library history UI is missing',
  },
  {
    file: 'components/new-trip/generate-form.tsx',
    snippet: '热门 2 日游灵感',
    message: 'Location-inspired prompt guidance is missing',
  },
  {
    file: 'components/new-trip/generate-form.tsx',
    snippet: 'showCode',
    message: 'Generated itinerary code toggle is missing',
  },
  {
    file: 'components/new-trip/generate-form.tsx',
    snippet: 'disabled={loading || !itinerary}',
    message: 'Regenerate button should be disabled before first itinerary',
  },
  {
    file: 'components/new-trip/generate-form.tsx',
    snippet: 'toast',
    message: 'Temporary action feedback is missing',
  },
  {
    file: 'components/new-trip/generate-form.tsx',
    snippet: '生成进度',
    message: 'Long-running generation progress UI is missing',
  },
  {
    file: 'lib/mock/shanxi-loop.ts',
    snippet: 'shanxiLoopTrip',
    message: 'Shanxi loop seed trip is missing',
  },
  {
    file: 'lib/mock/shanxi-loop.ts',
    snippet: '长沙 → 长治 → 晋东南到晋南自驾环线',
    message: 'Real Shanxi loop itinerary title is missing',
  },
  {
    file: 'lib/domain/trip.ts',
    snippet: 'export interface TripTodo',
    message: 'Trip todo domain model is missing',
  },
  {
    file: 'lib/domain/trip.ts',
    snippet: 'navigationUrl?: string',
    message: 'Navigation URL support is missing',
  },
  {
    file: 'lib/domain/trip-schedule.ts',
    snippet: 'export function getTripScheduleContext',
    message: 'Trip schedule context selector is missing',
  },
  {
    file: 'components/trip/trip-workspace.tsx',
    snippet: '明日预告',
    message: 'Tomorrow preview UI is missing',
  },
  {
    file: 'components/trip/trip-workspace.tsx',
    snippet: '今日待办',
    message: 'Today todos UI is missing',
  },
  {
    file: 'app/trip/[id]/share/page.tsx',
    snippet: 'readOnly',
    message: 'Share page does not reuse read-only trip workspace',
  },
  {
    file: 'document/迭代升级日志.md',
    snippet: 'v1.0.0',
    message: 'Iteration upgrade log is missing v1.0.0',
  },
  {
    file: 'document/Supabase同步设计文档.md',
    snippet: 'Row Level Security',
    message: 'Supabase sync design must cover RLS',
  },
  {
    file: 'document/Supabase同步设计文档.md',
    snippet: 'share_tokens',
    message: 'Supabase sync design must cover share tokens',
  },
];

const failures = [];

for (const file of requiredFiles) {
  const absPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absPath)) {
    failures.push(`Missing required file: ${file}`);
  }
}

for (const { file, snippet, message } of requiredSnippets) {
  const absPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absPath)) {
    failures.push(`${message} (${file} not found)`);
    continue;
  }

  const content = fs.readFileSync(absPath, 'utf8');
  if (!content.includes(snippet)) {
    failures.push(`${message} (${file})`);
  }
}

if (failures.length > 0) {
  console.error('❌ Scaffold validation failed:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log('✅ Scaffold validation passed.');
