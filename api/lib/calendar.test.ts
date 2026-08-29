import { describe, expect, test } from "vitest";
import { parseISO } from "date-fns";
import {
  dayOfWeekFromDate,
  localDateString,
  minutesToHhmm,
  parseIsoDateTime,
  timeStr,
} from "./calendar";

describe("calendar helpers", () => {
  test("localDateString formats UTC date in target timezone", () => {
    const d = parseISO("2026-09-01T00:30:00.000Z");
    expect(localDateString(d, "Asia/Kolkata")).toBe("2026-09-01");
    expect(localDateString(d, "America/New_York")).toBe("2026-08-31");
  });

  test("dayOfWeekFromDate respects timezone", () => {
    const mondayIndia = parseISO("2026-09-07T10:00:00.000Z");
    expect(dayOfWeekFromDate(mondayIndia, "Asia/Kolkata")).toBe("monday");

    const sundayUTC = parseISO("2026-09-06T23:00:00.000Z");
    expect(dayOfWeekFromDate(sundayUTC, "America/New_York")).toBe("sunday");
  });

  test("timeStr validates HH:MM", () => {
    expect(timeStr("09:00")).toBe("09:00");
    expect(timeStr("23:59")).toBe("23:59");
    expect(timeStr("24:00")).toBeNull();
    expect(timeStr("9:00")).toBeNull();
  });

  test("minutesToHhmm pads hours and minutes", () => {
    expect(minutesToHhmm(0)).toBe("00:00");
    expect(minutesToHhmm(90)).toBe("01:30");
    expect(minutesToHhmm(1439)).toBe("23:59");
  });

  test("parseIsoDateTime rejects invalid strings", () => {
    expect(parseIsoDateTime("2026-09-01T10:00:00.000Z")).toBeInstanceOf(Date);
    expect(parseIsoDateTime("not a date")).toBeNull();
  });
});
