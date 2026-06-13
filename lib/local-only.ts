import { NextResponse } from 'next/server';
import { isLocal } from './runtime';

export function localOnlyResponse(): NextResponse {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

/** Returns a 404 response when not in local profile, otherwise null. */
export function requireLocal(): NextResponse | null {
  if (!isLocal()) return localOnlyResponse();
  return null;
}
