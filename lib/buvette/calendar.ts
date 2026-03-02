export function firstDayOfMonth(month: string): Date {
  return new Date(`${month}-01T00:00:00`);
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getMonthBounds(month: string) {
  const first = firstDayOfMonth(month);
  const start = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return { start: toDateKey(start), end: toDateKey(end) };
}

export function buildMonthGrid(month: string): string[][] {
  const first = firstDayOfMonth(month);
  const year = first.getFullYear();
  const monthIndex = first.getMonth();

  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // lundi=0
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: string[] = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push("");
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    cells.push(toDateKey(date));
  }

  while (cells.length % 7 !== 0) {
    cells.push("");
  }

  const weeks: string[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
