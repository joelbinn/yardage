import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { COURSE_MAP_FACTORY, GreenPointMarker, ICourseMap } from '../../application/ports';
import { GreenPoint } from '../../domain/course';
import { CourseDraft } from '../../domain/course-draft';

export interface MovedGreenPoint {
  readonly holeNumber: number;
  readonly green: GreenPoint;
}

const toMarkers = (course: CourseDraft, activeHoleNumber: number | null): GreenPointMarker[] =>
  course.holes.flatMap((hole) =>
    hole.green
      ? [{ holeNumber: hole.number, green: hole.green, active: hole.number === activeHoleNumber }]
      : [],
  );

const greenPoints = (course: CourseDraft): GreenPoint[] =>
  course.holes.flatMap((hole) => (hole.green ? [hole.green] : []));

/**
 * Satellitkartan i karteditorn. Kartbiblioteket nås endast via porten `COURSE_MAP_FACTORY`;
 * komponenten översätter vald Bana till markörer och kartans händelser till outputs.
 */
@Component({
  selector: 'app-course-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #host class="course-map" role="region" aria-label="Karta"></div>`,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .course-map {
      height: 100%;
      min-height: 20rem;
      cursor: crosshair;
    }
  `,
})
export class CourseMapComponent {
  readonly course = input.required<CourseDraft>();
  readonly activeHoleNumber = input<number | null>(null);
  readonly mapClicked = output<GreenPoint>();
  readonly greenPointMoved = output<MovedGreenPoint>();

  private readonly factory = inject(COURSE_MAP_FACTORY);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly map = signal<ICourseMap | null>(null);
  private readonly courseId = computed(() => this.course().id);
  private readonly markers = computed(() => toMarkers(this.course(), this.activeHoleNumber()));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      void this.factory
        .create(this.host().nativeElement, {
          mapClicked: (point) => this.mapClicked.emit(point),
          markerMoved: (holeNumber, green) => this.greenPointMoved.emit({ holeNumber, green }),
        })
        .then((map) => (destroyRef.destroyed ? map.destroy() : this.map.set(map)));
    });
    effect(() => this.map()?.showMarkers(this.markers()));
    // Zooma till banans greenpunkter när en annan Bana väljs — inte vid varje ändring.
    effect(() => {
      const map = this.map();
      this.courseId();
      untracked(() => map?.fitTo(greenPoints(this.course())));
    });
    // Kartan följer värdelementets storlek (fälld panel, ändrat fönster).
    effect((onCleanup) => {
      const map = this.map();
      if (!map || typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(() => map.resize());
      observer.observe(this.host().nativeElement);
      onCleanup(() => observer.disconnect());
    });
    destroyRef.onDestroy(() => this.map()?.destroy());
  }
}
