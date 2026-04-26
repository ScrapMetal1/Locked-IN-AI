export interface UserState {
    isLockedIn: boolean;
    currentGoal: string;
    blockedCount: number;
    lastRateLimitedDate?: string;  //question mark just means that its optional.
    sessionEndTime?: number | null;
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