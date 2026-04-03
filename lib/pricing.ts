/** Parse `YYYY-MM-DD` as a local calendar date (avoids UTC offset bugs from `new Date(iso)`). */
export function parseLocalYmd(ymd: string): Date | null {
  const s = ymd.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

/** Number of nights between two local calendar dates (check-out day is exclusive). */
export function countStayNightsLocal(checkIn: Date, checkOut: Date): number {
  const t0 = Date.UTC(
    checkIn.getFullYear(),
    checkIn.getMonth(),
    checkIn.getDate(),
  );
  const t1 = Date.UTC(
    checkOut.getFullYear(),
    checkOut.getMonth(),
    checkOut.getDate(),
  );
  return Math.max(0, Math.round((t1 - t0) / (1000 * 60 * 60 * 24)));
}

export function calculateStayTotalPrice(
  checkIn: Date,
  checkOut: Date,
  weekdayPrice: number,
  weekendPrice: number,
) {
  const cursor = new Date(checkIn);
  let total = 0;

  while (cursor < checkOut) {
    const day = cursor.getDay();
    const isWeekend = day === 0 || day === 6;
    total += isWeekend ? weekendPrice : weekdayPrice;
    cursor.setDate(cursor.getDate() + 1);
  }

  return total;
}
