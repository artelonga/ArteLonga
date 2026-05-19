export const STORAGE_KEYS = {
  VID: "al_vid",
  SID: "al_sid",
  OPT_OUT: "al_optout",
  EVENT_QUEUE: "al_evq_v1",
  UTM: "al_utm",
} as const;

export type StorageKeyValue = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
