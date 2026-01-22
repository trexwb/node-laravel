export interface CastInterface {
  get(value: any): any;
  set(value: any): any;
}

export interface CacheDriver {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>; // ttl 单位：秒
  forget(key: string): Promise<void>;
  flush(): Promise<void>;
}