import { startOfWeek, addDays, addWeeks, format, parseISO } from "date-fns";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];
export const WEEK_DAYS: readonly Day[] = DAYS;

export function mondayOf(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function weekIdFor(date: Date = new Date()): string {
  return format(mondayOf(date), "yyyy-MM-dd");
}

export function nextWeekId(weekId: string): string {
  return format(addWeeks(parseISO(weekId), 1), "yyyy-MM-dd");
}

export function prevWeekId(weekId: string): string {
  return format(addWeeks(parseISO(weekId), -1), "yyyy-MM-dd");
}

export function formatWeekRange(weekId: string): string {
  const start = parseISO(weekId);
  const end = addDays(start, 6);
  return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
}

export function isoDateForDay(weekId: string, day: Day): string {
  const idx = DAYS.indexOf(day);
  return format(addDays(parseISO(weekId), idx), "yyyy-MM-dd");
}
