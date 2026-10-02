// Shared availability helper functions for seat occupancy and overlap logic.

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const normalizeRange = (s, e) => (e <= s ? [s, e + 24 * 60] : [s, e]);

const timesOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  const [ns1, ne1] = normalizeRange(s1, e1);
  const [ns2, ne2] = normalizeRange(s2, e2);

  const overlaps = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;

  return (
    overlaps(ns1, ne1, ns2, ne2) ||
    overlaps(ns1 - 24 * 60, ne1 - 24 * 60, ns2, ne2) ||
    overlaps(ns1, ne1, ns2 - 24 * 60, ne2 - 24 * 60)
  );
};

const isSeatAvailableForSlot = (slot, allocations) => {
  return allocations.every((alloc) => !timesOverlap(
    slot.startTime,
    slot.endTime,
    alloc.slot.startTime,
    alloc.slot.endTime,
  ));
};

const getSlotConflicts = (slot, allocations) => {
  return allocations
    .filter((alloc) => timesOverlap(
      slot.startTime,
      slot.endTime,
      alloc.slot.startTime,
      alloc.slot.endTime,
    ))
    .map((alloc) => alloc.slot.name);
};

const getSeatSortKey = (seatNumber) => {
  const value = `${seatNumber}`;
  const match = value.match(/(\d+)/);
  if (match) return Number(match[1]);
  return value.toLowerCase();
};

const sortSeats = (seats) => seats.sort((a, b) => {
  const aKey = getSeatSortKey(a.seatNumber);
  const bKey = getSeatSortKey(b.seatNumber);

  if (typeof aKey === 'number' && typeof bKey === 'number') {
    if (aKey !== bKey) return aKey - bKey;
    return a.seatNumber.localeCompare(b.seatNumber, undefined, { sensitivity: 'base' });
  }

  if (typeof aKey === 'number') return -1;
  if (typeof bKey === 'number') return 1;

  return a.seatNumber.localeCompare(b.seatNumber, undefined, { sensitivity: 'base', numeric: true });
});

module.exports = { timesOverlap, isSeatAvailableForSlot, getSlotConflicts, sortSeats };
