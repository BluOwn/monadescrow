// src/types/web-vitals.d.ts
declare module 'web-vitals' {
  export type ReportHandler = (metric: {
    name: string;
    delta: number;
    id: string;
    value?: number;
  }) => void;

  export function getCLS(onReport: ReportHandler): void;
  export function getFID(onReport: ReportHandler): void;
  export function getFCP(onReport: ReportHandler): void;
  export function getLCP(onReport: ReportHandler): void;
  export function getTTFB(onReport: ReportHandler): void;
}