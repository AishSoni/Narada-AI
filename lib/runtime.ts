export type RuntimeProfile = 'local' | 'hosted';

export function getRuntimeProfile(): RuntimeProfile {
  return process.env.RUNTIME_PROFILE === 'hosted' ? 'hosted' : 'local';
}

export function isLocal(): boolean {
  return getRuntimeProfile() === 'local';
}

export function isHosted(): boolean {
  return getRuntimeProfile() === 'hosted';
}

export const UPLOAD_LIMITS = {
  local: {
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxFiles: 10,
  },
  hosted: {
    maxFileSizeBytes: 5 * 1024 * 1024,
    maxFiles: 3,
  },
} as const;

export function getUploadLimits() {
  return isHosted() ? UPLOAD_LIMITS.hosted : UPLOAD_LIMITS.local;
}
