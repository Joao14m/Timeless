export interface BlockedSite {
  id: string;
  hostname: string;
  startTime: string; // "HH:MM" 24-hour
  endTime: string;   // "HH:MM" 24-hour
  enabled: boolean;
}
