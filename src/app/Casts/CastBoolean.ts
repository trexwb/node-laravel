import type { CastInterface } from '#app/Casts/CastInterface';
export class CastBoolean implements CastInterface {
  get(value: any) { return Boolean(value); }
  set(value: any) { return value ? 1 : 0; }
}