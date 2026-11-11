/**
 * Domäntyper för Bana, Hål och Greenpunkt (se GLOSSARY.md och specens datamodell).
 * Alla typer är Value Objects/immutabla — instanser skapas via parseCoursesDocument
 * och fryses rekursivt.
 */

/** Koordinaten som markerar mitten av green för ett hål. */
export interface GreenPoint {
  readonly lat: number;
  readonly lng: number;
}

/**
 * Ett av en banas hål, identifierat av hålnummer. Greenpunkten kan saknas (`null`)
 * för en bana som ännu inte är färdigregistrerad; Spelläget visar då "Greenpunkt saknas".
 */
export interface Hole {
  readonly number: number;
  readonly green: GreenPoint | null;
  readonly par?: number;
}

/** En registrerad bana med namn och 9 eller 18 hål i ordning. */
export interface Course {
  readonly id: string;
  readonly name: string;
  readonly holes: readonly Hole[];
}

/** Tillåtna hålantal för en bana. */
export const ALLOWED_HOLE_COUNTS: readonly number[] = [9, 18];

/** Versionen av `courses.json` som denna app förstår. */
export const COURSES_DOCUMENT_VERSION = 1;
