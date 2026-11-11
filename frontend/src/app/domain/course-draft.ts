import { ALLOWED_HOLE_COUNTS, Course, GreenPoint } from './course';

/**
 * En Bana under redigering i Redigeringsläget. Skiljer sig från `Course` genom att
 * ett Hål ännu kan sakna greenpunkt (sätts i karteditorn, ticket 06).
 * Immutabel: alla ändringar ger en ny instans.
 */
export interface DraftHole {
  readonly number: number;
  readonly green: GreenPoint | null;
  readonly par?: number;
}

export interface CourseDraft {
  readonly id: string;
  readonly name: string;
  readonly holes: readonly DraftHole[];
}

export type CourseDraftResult =
  | { readonly ok: true; readonly value: CourseDraft }
  | { readonly ok: false; readonly error: string };

/** En inläst Bana som utgångspunkt för redigering (Course är redan fryst och kompatibel). */
export function draftFromCourse(course: Course): CourseDraft {
  return course;
}

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

export type CoursesFromDraftsResult =
  | { readonly ok: true; readonly value: readonly Course[] }
  | { readonly ok: false; readonly error: string };

/**
 * Gör om arbetskopian till färdiga Banor inför sparning. Ban-dokumentet kräver en
 * greenpunkt för varje Hål, så första Banan med saknade greenpunkter avvisar hela listan.
 */
export function coursesFromDrafts(drafts: readonly CourseDraft[]): CoursesFromDraftsResult {
  const incomplete = drafts.find((draft) => draft.holes.some((h) => h.green === null));
  if (incomplete) {
    const missing = incomplete.holes.filter((h) => h.green === null).map((h) => h.number);
    return { ok: false, error: `${incomplete.name} saknar greenpunkt för hål ${missing.join(', ')}.` };
  }
  return { ok: true, value: Object.freeze(drafts.map(toCourse)) };
}

function toCourse(draft: CourseDraft): Course {
  const holes = draft.holes.map((h) => Object.freeze({ ...h, green: h.green as GreenPoint }));
  return Object.freeze({ id: draft.id, name: draft.name, holes: Object.freeze(holes) });
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
