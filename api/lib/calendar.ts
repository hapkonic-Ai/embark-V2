import {
  eachDayOfInterval,
  addMinutes,
  isBefore,
  isAfter,
  parseISO,
  isValid,
} from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { and, eq, gte, lt, ne } from "drizzle-orm";
import {
  expertAvailabilityExceptions,
  expertAvailabilityRules,
  expertBookings,
  mentorProfiles,
} from "@db/schema";
import { getDb } from "../queries/connection";

export type TimeStr = `${number}${number}:${number}${number}`;

export type Slot = {
  startAt: Date;
  endAt: Date;
};

export type AvailabilityInterval = {
  start: Date;
  end: Date;
};

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const MIN_NOTICE_MINUTES = 15;

export function isValidTimezone(tz: string | null | undefined): boolean {
  if (!tz) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function getExpertTimezone(userId: number): Promise<string> {
  const db = getDb();
  const row = await db
    .select({ timezone: mentorProfiles.timezone })
    .from(mentorProfiles)
    .where(eq(mentorProfiles.userId, userId))
    .limit(1)
    .then((r) => r[0]);
  return isValidTimezone(row?.timezone) ? row.timezone! : DEFAULT_TIMEZONE;
}

export async function getActiveRules(userId: number) {
  const db = getDb();
  return db
    .select()
    .from(expertAvailabilityRules)
    .where(
      and(
        eq(expertAvailabilityRules.userId, userId),
        eq(expertAvailabilityRules.isActive, true),
      ),
    )
    .orderBy(expertAvailabilityRules.startTime);
}

export async function getExceptionsForRange(
  userId: number,
  from: Date,
  to: Date,
) {
  const db = getDb();
  const rows = await db
    .select()
    .from(expertAvailabilityExceptions)
    .where(
      and(
        eq(expertAvailabilityExceptions.userId, userId),
        gte(expertAvailabilityExceptions.exceptionDate, localDateString(from)),
        lt(expertAvailabilityExceptions.exceptionDate, localDateString(to)),
      ),
    );
  return rows;
}

export async function getBookingsForRange(
  userId: number,
  from: Date,
  to: Date,
) {
  const db = getDb();
  return db
    .select({ startAt: expertBookings.startAt, endAt: expertBookings.endAt })
    .from(expertBookings)
    .where(
      and(
        eq(expertBookings.userId, userId),
        ne(expertBookings.status, "cancelled"),
        ne(expertBookings.status, "no_show"),
        lt(expertBookings.startAt, to),
        gte(expertBookings.endAt, from),
      ),
    );
}

export function localDateString(date: Date, timezone?: string): string {
  return formatInTimeZone(date, timezone || "UTC", "yyyy-MM-dd");
}

export function dayOfWeekFromDate(
  date: Date,
  timezone: string,
): "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" {
  const idx = Number(formatInTimeZone(date, timezone, "i")) - 1;
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;
  return days[idx] ?? "monday";
}

function zonedDate(localDate: string, localTime: string, timezone: string): Date {
  return toDate(`${localDate} ${localTime}`, { timeZone: timezone });
}

function intervalsOverlap(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
): boolean {
  return isBefore(a.start, b.end) && isAfter(a.end, b.start);
}

function subtractInterval(
  intervals: AvailabilityInterval[],
  block: AvailabilityInterval,
): AvailabilityInterval[] {
  const result: AvailabilityInterval[] = [];
  for (const interval of intervals) {
    if (!intervalsOverlap(interval, block)) {
      result.push(interval);
      continue;
    }
    if (isBefore(interval.start, block.start)) {
      result.push({ start: interval.start, end: block.start });
    }
    if (isAfter(interval.end, block.end)) {
      result.push({ start: block.end, end: interval.end });
    }
  }
  return result;
}

function mergeIntervals(intervals: AvailabilityInterval[]) {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: AvailabilityInterval[] = [sorted[0]!];
  for (const current of sorted.slice(1)) {
    const last = merged[merged.length - 1]!;
    if (isBefore(current.start, last.end) || current.start.getTime() === last.end.getTime()) {
      if (isAfter(current.end, last.end)) last.end = current.end;
    } else {
      merged.push(current);
    }
  }
  return merged;
}

export type ComputeSlotsOptions = {
  userId: number;
  timezone: string;
  durationMinutes: number;
  from: Date;
  to: Date;
  minNoticeMinutes?: number;
  excludeBookingId?: number;
};

export async function computeAvailableSlots(
  opts: ComputeSlotsOptions,
): Promise<Slot[]> {
  const {
    userId,
    timezone,
    durationMinutes,
    from,
    to,
    minNoticeMinutes = MIN_NOTICE_MINUTES,
    excludeBookingId,
  } = opts;

  if (durationMinutes <= 0) return [];
  if (isBefore(to, from)) return [];

  const rules = await getActiveRules(userId);
  const rulesByDay = new Map<string, typeof rules>();
  for (const rule of rules) {
    const list = rulesByDay.get(rule.dayOfWeek) ?? [];
    list.push(rule);
    rulesByDay.set(rule.dayOfWeek, list);
  }

  const exceptions = await getExceptionsForRange(userId, from, to);
  const exceptionsByDate = new Map<string, typeof exceptions>();
  for (const ex of exceptions) {
    const list = exceptionsByDate.get(ex.exceptionDate) ?? [];
    list.push(ex);
    exceptionsByDate.set(ex.exceptionDate, list);
  }

  const bookings = await getBookingsForRange(userId, from, to);
  const effectiveBookings = excludeBookingId
    ? bookings.filter((b) => (b as { id?: number }).id !== excludeBookingId)
    : bookings;

  const days = eachDayOfInterval({ start: from, end: to });
  const slots: Slot[] = [];
  const now = new Date();
  const minStart = addMinutes(now, minNoticeMinutes);

  for (const utcDay of days) {
    const localDate = localDateString(utcDay, timezone);
    const dow = dayOfWeekFromDate(utcDay, timezone);

    let intervals: AvailabilityInterval[] = [];
    const dayRules = rulesByDay.get(dow) ?? [];
    for (const rule of dayRules) {
      intervals.push({
        start: zonedDate(localDate, rule.startTime, timezone),
        end: zonedDate(localDate, rule.endTime, timezone),
      });
    }

    const dayExceptions = exceptionsByDate.get(localDate) ?? [];
    for (const ex of dayExceptions) {
      if (ex.type === "block") {
        if (ex.startTime && ex.endTime) {
          intervals = subtractInterval(intervals, {
            start: zonedDate(localDate, ex.startTime, timezone),
            end: zonedDate(localDate, ex.endTime, timezone),
          });
        } else {
          intervals = [];
        }
      } else if (ex.type === "override" && ex.startTime && ex.endTime) {
        intervals.push({
          start: zonedDate(localDate, ex.startTime, timezone),
          end: zonedDate(localDate, ex.endTime, timezone),
        });
      }
    }

    intervals = mergeIntervals(intervals);

    for (const interval of intervals) {
      let cursor = interval.start;
      while (
        isBefore(cursor, interval.end) ||
        cursor.getTime() === interval.end.getTime()
      ) {
        const slotEnd = addMinutes(cursor, durationMinutes);
        if (isAfter(slotEnd, interval.end)) break;
        if (!isBefore(cursor, minStart)) {
          const slot = { startAt: cursor, endAt: slotEnd };
          const blocked = effectiveBookings.some((b) =>
            intervalsOverlap(
              { start: slot.startAt, end: slot.endAt },
              { start: b.startAt, end: b.endAt },
            ),
          );
          if (!blocked) {
            slots.push(slot);
          }
        }
        cursor = slotEnd;
      }
    }
  }

  return slots;
}

export async function isSlotAvailable(
  userId: number,
  timezone: string,
  startAt: Date,
  endAt: Date,
  excludeBookingId?: number,
): Promise<boolean> {
  const duration = (endAt.getTime() - startAt.getTime()) / 60_000;
  const slots = await computeAvailableSlots({
    userId,
    timezone,
    durationMinutes: duration,
    from: startAt,
    to: endAt,
    excludeBookingId,
  });
  return slots.some(
    (s) =>
      s.startAt.getTime() === startAt.getTime() &&
      s.endAt.getTime() === endAt.getTime(),
  );
}

export function parseIsoDateTime(value: string): Date | null {
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

export function timeStr(value: string): TimeStr | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(":") as [string, string];
  if (Number(h) > 23 || Number(m) > 59) return null;
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}` as TimeStr;
}

export function minutesToHhmm(minutes: number): TimeStr {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` as TimeStr;
}
