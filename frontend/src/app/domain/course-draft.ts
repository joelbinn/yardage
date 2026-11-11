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
