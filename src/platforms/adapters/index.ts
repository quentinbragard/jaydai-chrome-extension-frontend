// src/platforms/adapters/index.ts
import { PlatformAdapter } from './base.adapter';
import { chatGptAdapter } from './chatgpt.adapter';
import { claudeAdapter } from './claude.adapter';
import { mistralAdapter } from './mistral.adapter';

const adapters: PlatformAdapter[] = [
  chatGptAdapter,
  claudeAdapter,
  mistralAdapter,
];

export { chatGptAdapter, claudeAdapter, mistralAdapter };
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