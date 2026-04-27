export interface UserState {
    isLockedIn: boolean;
    currentGoal: string;
    blockedCount: number;
    lastRateLimitedDate?: string;  //question mark just means that its optional.
    sessionEndTime?: number | null;
    durationMinutes?: number;
    uid?: string;
}

export interface ScanResult {
    allowed: boolean;
    reason: string;
}

export interface Todo {
    id: number;
    title: string;
    duration: number;
    completed: boolean;
}