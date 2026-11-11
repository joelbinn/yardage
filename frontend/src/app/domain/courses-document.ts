import {
  ALLOWED_HOLE_COUNTS,
  COURSES_DOCUMENT_VERSION,
  Course,
  GreenPoint,
  Hole,
} from './course';

/**
 * Tolkning och validering av data-repots `courses.json`.
 *
 * Data-repot saknar serverside-validering (ADR-0001), så appen måste själv avvisa
 * felformade dokument. Funktionen är ren: indata är okänd JSON, utdata är antingen
 * en fryst lista av banor eller ett felmeddelande med sökväg till första felet.
 */
export type CoursesParseResult =
  | { readonly ok: true; readonly courses: readonly Course[] }
  | { readonly ok: false; readonly error: string };

type JsonObject = Record<string, unknown>;

/** Internt fel som bär sökvägen till det felaktiga fältet. */
class InvalidField extends Error {
  constructor(path: string, problem: string) {
    super(`${path}: ${problem}`);
  }
}

export function parseCoursesDocument(input: unknown): CoursesParseResult {
  try {
    return { ok: true, courses: deepFreeze(readDocument(input)) };
  } catch (e) {
    if (e instanceof InvalidField) {
      return { ok: false, error: e.message };
    }
    throw e;
  }
}

/** Skriver ban-dokumentet som läsbar JSON (indrag 2, avslutande radbrytning) för data-repot. */
export function serializeCoursesDocument(courses: readonly Course[]): string {
  return `${JSON.stringify({ version: COURSES_DOCUMENT_VERSION, courses }, null, 2)}\n`;
}

function readDocument(input: unknown): Course[] {
  const doc = requireObject(input, 'dokument');
  if (doc['version'] !== COURSES_DOCUMENT_VERSION) {
    throw new InvalidField('version', `måste vara ${COURSES_DOCUMENT_VERSION}`);
  }
  const courses = requireArray(doc['courses'], 'courses').map((c, i) =>
    readCourse(c, `courses[${i}]`),
  );
  assertUniqueIds(courses);
  return courses;
}

function readCourse(input: unknown, path: string): Course {
  const obj = requireObject(input, path);
  return {
    id: requireText(obj['id'], `${path}.id`),
    name: requireText(obj['name'], `${path}.name`),
    holes: readHoles(obj['holes'], `${path}.holes`),
  };
}

function readHoles(input: unknown, path: string): Hole[] {
  const holes = requireArray(input, path);
  if (!ALLOWED_HOLE_COUNTS.includes(holes.length)) {
    throw new InvalidField(path, `måste innehålla ${ALLOWED_HOLE_COUNTS.join(' eller ')} hål`);
  }
  return holes.map((h, i) => readHole(h, i + 1, `${path}[${i}]`));
}

function readHole(input: unknown, expectedNumber: number, path: string): Hole {
  const obj = requireObject(input, path);
  if (obj['number'] !== expectedNumber) {
    throw new InvalidField(`${path}.number`, `måste vara ${expectedNumber}`);
  }
  const green = readOptionalGreenPoint(obj['green'], `${path}.green`);
  const par = readOptionalPar(obj['par'], `${path}.par`);
  return par === undefined ? { number: expectedNumber, green } : { number: expectedNumber, green, par };
}

/** Saknad eller `null` greenpunkt tolkas som "ej registrerad än". */
function readOptionalGreenPoint(input: unknown, path: string): GreenPoint | null {
  return input === undefined || input === null ? null : readGreenPoint(input, path);
}

function readGreenPoint(input: unknown, path: string): GreenPoint {
  const obj = requireObject(input, path);
  return {
    lat: requireCoordinate(obj['lat'], 90, `${path}.lat`),
    lng: requireCoordinate(obj['lng'], 180, `${path}.lng`),
  };
}

function readOptionalPar(input: unknown, path: string): number | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (!Number.isInteger(input) || (input as number) < 1) {
    throw new InvalidField(path, 'måste vara ett positivt heltal');
  }
  return input as number;
}

function assertUniqueIds(courses: readonly Course[]): void {
  const seen = new Set<string>();
  courses.forEach((course, i) => {
    if (seen.has(course.id)) {
      throw new InvalidField(`courses[${i}].id`, `"${course.id}" förekommer flera gånger`);
    }
    seen.add(course.id);
  });
}

function requireObject(input: unknown, path: string): JsonObject {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new InvalidField(path, 'måste vara ett objekt');
  }
  return input as JsonObject;
}

function requireArray(input: unknown, path: string): unknown[] {
  if (!Array.isArray(input)) {
    throw new InvalidField(path, 'måste vara en lista');
  }
  return input;
}

function requireText(input: unknown, path: string): string {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new InvalidField(path, 'måste vara en icke-tom text');
  }
  return input.trim();
}

function requireCoordinate(input: unknown, limit: number, path: string): number {
  const valid = typeof input === 'number' && Number.isFinite(input) && Math.abs(input) <= limit;
  if (!valid) {
    throw new InvalidField(path, `måste vara ett tal mellan -${limit} och ${limit}`);
  }
  return input;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
