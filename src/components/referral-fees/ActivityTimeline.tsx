import React from "react";
import type { ActivityEvent } from "./types";

// ── Helpers ─────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return (
      "Today at " +
      date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type EventType = ActivityEvent["type"];

const EVENT_COLORS: Record<EventType, string> = {
  created: "#6b7280",
  payment_recorded: "#10b981",
  reminder_sent: "#3b82f6",
  edited: "#8b5cf6",
  disputed: "#ef4444",
  resolved: "#059669",
  note: "#6b7280",
  status_change: "#f59e0b",
};

const EVENT_LABELS: Record<EventType, string> = {
  created: "Created",
  payment_recorded: "Payment",
  reminder_sent: "Reminder",
  edited: "Edited",
  disputed: "Disputed",
  resolved: "Resolved",
  note: "Note",
  status_change: "Status",
};

// ── Component ───────────────────────────────────────────────────────

interface ActivityTimelineProps {
  activities: ActivityEvent[];
}

/**
 * Vertical timeline UI showing the activity history of a referral fee.
 * Events are displayed chronologically (newest first) with a vertical
 * connecting line and color-coded dot for each event type.
 */
export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
}) => {
  // Sort newest first
  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div style={emptyStyle}>
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Activity</h3>
      <div style={timelineContainerStyle}>
        {sorted.map((event, index) => {
          const isLast = index === sorted.length - 1;
          const color = EVENT_COLORS[event.type];
          const label = EVENT_LABELS[event.type];

          return (
            <div key={event.id} style={eventRowStyle}>
              {/* ── Timeline track (dot + line) ────────────── */}
              <div style={trackStyle}>
                <div
                  style={{
                    ...dotStyle,
                    backgroundColor: color,
                    boxShadow: `0 0 0 3px ${color}22`,
                  }}
                />
                {!isLast && <div style={lineStyle} />}
              </div>

              {/* ── Event content ─────────────────────────── */}
              <div style={contentStyle}>
                <div style={eventHeaderStyle}>
                  <span
                    style={{
                      ...typeBadgeStyle,
                      backgroundColor: `${color}15`,
                      color,
                    }}
                  >
                    {label}
                  </span>
                  <span style={timestampStyle}>
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <p style={descriptionStyle}>{event.description}</p>
                {event.actor && (
                  <span style={actorStyle}>by {event.actor}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Inline Styles ───────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  marginTop: "4px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 16px 0",
};

const timelineContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const eventRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "16px",
};

const trackStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "20px",
  flexShrink: 0,
};

const dotStyle: React.CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  flexShrink: 0,
  marginTop: "5px",
};

const lineStyle: React.CSSProperties = {
  width: "2px",
  flex: 1,
  backgroundColor: "#e5e7eb",
  minHeight: "24px",
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  paddingBottom: "20px",
};

const eventHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "4px",
};

const typeBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const timestampStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
};

const descriptionStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  margin: "4px 0 0 0",
  lineHeight: 1.5,
};

const actorStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  fontStyle: "italic",
};

const emptyStyle: React.CSSProperties = {
  padding: "24px",
  textAlign: "center",
  color: "#9ca3af",
  fontSize: "14px",
};
