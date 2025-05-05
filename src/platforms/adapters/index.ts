// src/platforms/adapters/index.ts
import { PlatformAdapter } from './base.adapter';
import { chatGptAdapter } from './chatgpt.adapter';
import { claudeAdapter } from './claude.adapter';

const adapters: PlatformAdapter[] = [
  chatGptAdapter,
  claudeAdapter
];

export { chatGptAdapter, claudeAdapter };
export * from './base.adapter';

export function getAdapterByName(name: string): PlatformAdapter | null {
  return adapters.find(adapter => adapter.name === name) || null;
}

export function getAdapterByHostname(hostname: string): PlatformAdapter | null {
  return adapters.find(adapter => 
    adapter.config.hostnames.some(h => hostname.includes(h))
  ) || null;
}

export { adapters };