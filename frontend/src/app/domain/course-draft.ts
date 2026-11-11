import { ALLOWED_HOLE_COUNTS, Course, GreenPoint, Hole } from './course';

/**
 * En Bana under redigering i Redigeringsläget. Samma form som `Course`: ett Hål kan
 * sakna greenpunkt både under redigering och i det sparade ban-dokumentet.
 * Immutabel: alla ändringar ger en ny instans.
 */
export type CourseDraft = Course;
export type DraftHole = Hole;

export type CourseDraftResult =
  | { readonly ok: true; readonly value: CourseDraft }
  | { readonly ok: false; readonly error: string };

/** Skapar en ny Bana med namngivna hål 1..N utan greenpunkter. */
export function createCourseDraft(
  name: string,
  holeCount: number,
  existingIds: readonly string[],
): CourseDraftResult {
  const trimmed = name.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Ange ett namn på banan.' };
  }
  if (!ALLOWED_HOLE_COUNTS.includes(holeCount)) {
    return { ok: false, error: 'Hålantalet måste vara 9 eller 18.' };
  }
  const holes = Array.from({ length: holeCount }, (_, i) =>
    Object.freeze({ number: i + 1, green: null }),
  );
  const draft = {
    id: uniqueId(slugify(trimmed), existingIds),
    name: trimmed,
    holes: Object.freeze(holes),
  };
  return { ok: true, value: Object.freeze(draft) };
}

/** Sätter (eller flyttar) greenpunkten för ett Hål. Okänt hålnummer lämnar banan orörd. */
export function placeGreenPoint(
  draft: CourseDraft,
  holeNumber: number,
  green: GreenPoint,
): CourseDraft {
  return updateHole(draft, holeNumber, (hole) => ({
    ...hole,
    green: Object.freeze({ lat: green.lat, lng: green.lng }),
  }));
}

/** Sätter par för ett Hål; `null` tar bort par (fältet är valfritt). */
export function setHolePar(
  draft: CourseDraft,
  holeNumber: number,
  par: number | null,
): CourseDraftResult {
  if (par === null) {
    return { ok: true, value: updateHole(draft, holeNumber, withoutPar) };
  }
  if (!Number.isInteger(par) || par < 1) {
    return { ok: false, error: 'Par måste vara ett positivt heltal.' };
  }
  return { ok: true, value: updateHole(draft, holeNumber, (hole) => ({ ...hole, par })) };
}

/** Hålet efter `holeNumber` i spelordning; sista hålet förblir sist. */
export function nextHoleNumber(draft: CourseDraft, holeNumber: number): number {
  return draft.holes.some((h) => h.number === holeNumber + 1) ? holeNumber + 1 : holeNumber;
}

function withoutPar(hole: DraftHole): DraftHole {
  return { number: hole.number, green: hole.green };
}

/** Ersätter ett hål med en ny, fryst instans; övriga hål delas oförändrade. */
function updateHole(
  draft: CourseDraft,
  holeNumber: number,
  change: (hole: DraftHole) => DraftHole,
): CourseDraft {
  if (!draft.holes.some((h) => h.number === holeNumber)) {
    return draft;
  }
  const holes = draft.holes.map((h) => (h.number === holeNumber ? Object.freeze(change(h)) : h));
  return Object.freeze({ ...draft, holes: Object.freeze(holes) });
}

const FALLBACK_ID = 'bana';

/** Gör om ett namn till ett URL-säkert id: gemener, a–z/0–9, bindestreck mellan ord. */
function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug === '' ? FALLBACK_ID : slug;
}

/** Lägger till löpnummer (-2, -3, …) tills id:t inte krockar med en befintlig bana. */
function uniqueId(base: string, existingIds: readonly string[]): string {
  const taken = new Set(existingIds);
  const candidate = (n: number): string => (n === 1 ? base : `${base}-${n}`);
  let n = 1;
  while (taken.has(candidate(n))) {
    n += 1;
  }
  return candidate(n);
}
