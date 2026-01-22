import type { CastInterface } from '#app/Casts/CastInterface';

export class CastJson implements CastInterface {
  get(value: any) {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return {}; }
    }
    return value || {};
  }

  set(value: any) {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
}