import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/mongodb-client';

/** Which optional features this deployment has configured, so the UI can hide the rest. */
export async function GET() {
  return NextResponse.json({
    database: isDatabaseConfigured,
    oauth: {
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      github: Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
    },
  });
}

export const dynamic = 'force-dynamic';
