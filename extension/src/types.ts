export interface UserState {
    isLockedIn: boolean;
    currentGoal: string;
    blockedCount: number;
    lastRateLimitedDate?: string;
}

export interface ScanResult {
    allowed: boolean;
    reason: string;
}