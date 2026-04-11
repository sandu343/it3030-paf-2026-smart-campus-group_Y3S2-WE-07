package com.smartcampus.backend.model;

/**
 * EscalationLevel enum for ticket SLA tracking.
 * 
 * Levels:
 * - NORMAL: Plenty of time remaining (>50% of SLA deadline)
 * - WARNING: Less than 50% of SLA deadline remaining
 * - CRITICAL: Less than 25% of SLA deadline remaining
 * - OVERDUE: SLA deadline has passed
 */
public enum EscalationLevel {
    NORMAL,
    WARNING,
    CRITICAL,
    OVERDUE
}
