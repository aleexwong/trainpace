/**
 * Training Plan — macOS-Calendar-style schedule grid
 *
 * Renders the whole plan as one continuous calendar: a Mon–Sun weekday
 * header, then one 7-column row per training week with hairline gridlines,
 * date numbers (today gets the filled accent badge), and workouts as tinted
 * event chips. When an `editor` is provided, chips are draggable to other
 * days of the same week — drop on an empty day to move, on an occupied day
 * to swap. One DndContext per week row makes cross-week drags impossible by
 * construction (weekly volume/progression is a per-week invariant).
 *
 * Touch uses a long-press (200ms) activation so normal scrolling over the
 * grid keeps working; mouse uses a small distance threshold so plain clicks
 * (e.g. the completion toggle inside a chip) never start a drag.
 */

import { useMemo, useState, type ReactNode, type Ref } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { RunDay, TrainingDay, TrainingPlan, TrainingWeek, Workout } from "../types";
import { PHASE_META, WORKOUT_META } from "../utils/planDisplay";
import { todayNoon, workoutDate } from "../utils/planSchedule";
import type { PlanProgress } from "../hooks/usePlanProgress";
import type { PlanEditor } from "../hooks/usePlanEditor";
import { cn } from "@/lib/utils";

const ALL_DAYS: RunDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DRAG_ID_PREFIX = "drag-";

function dayFromDragId(id: string | number): RunDay {
  return String(id).replace(DRAG_ID_PREFIX, "") as RunDay;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Tinted macOS-event look: soft wash of the workout hue + saturated accent. */
function chipColors(workout: Workout): { bg: string; accent: string; text: string } {
  if (workout.type === "rest") {
    return { bg: "#f1f5f9", accent: "#cbd5e1", text: "#64748b" };
  }
  const meta = WORKOUT_META[workout.type];
  return { bg: `${meta.bg}1A`, accent: meta.bg, text: meta.bg };
}

interface ChipProps {
  workout: Workout;
  done?: boolean;
  pending?: boolean;
  /** Present only for trackable workouts with progress wired in. */
  onToggle?: () => void;
  /** Rendered inside DragOverlay — lifted styling. */
  overlay?: boolean;
  /** The source chip while its overlay clone is being dragged. */
  dragging?: boolean;
}

function WorkoutChip({ workout, done = false, pending = false, onToggle, overlay = false, dragging = false }: ChipProps) {
  const colors = chipColors(workout);
  // Terse per-type name ("Easy", "Tempo", "Long") — calendar chips are
  // narrow; the full label + description live in the tooltip.
  const displayName = WORKOUT_META[workout.type].name;
  return (
    <div
      title={workout.type === "rest" ? undefined : `${workout.label} — ${workout.description}`}
      className={cn(
        "rounded-md px-1.5 py-1 sm:px-2 sm:py-1.5 select-none",
        overlay && "shadow-xl ring-1 ring-black/10",
        dragging && "opacity-30",
        done && "opacity-60"
      )}
      style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.accent}` }}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "min-w-0 truncate text-[10px] sm:text-[11px] font-semibold leading-tight",
            done && "line-through"
          )}
          style={{ color: colors.text }}
        >
          {displayName}
        </span>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            disabled={pending}
            aria-pressed={done}
            aria-label={`Mark ${workout.label} as ${done ? "not done" : "done"}`}
            className={cn(
              "flex-shrink-0 h-3.5 w-3.5 p-0 rounded-full border flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500",
              done
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "bg-white/80 border-slate-300 text-transparent hover:border-emerald-400",
              pending && "opacity-50 cursor-wait"
            )}
          >
            <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
      </div>
      {workout.type !== "rest" && workout.distanceKm !== undefined && workout.distanceKm > 0 && (
        <div
          className="mt-0.5 text-[9px] sm:text-[10px] font-medium tabular-nums leading-tight opacity-75 truncate"
          style={{ color: colors.text }}
        >
          {workout.distanceKm} km
          {workout.paceZone && <span className="hidden sm:inline"> · {workout.paceZone}</span>}
        </div>
      )}
    </div>
  );
}

interface DraggableChipProps extends ChipProps {
  day: RunDay;
  disabled: boolean;
}

function DraggableChip({ day, disabled, ...chip }: DraggableChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${DRAG_ID_PREFIX}${day}`,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-chip
      aria-label={
        disabled
          ? undefined
          : `${chip.workout.label} on ${day}. Press space or enter to pick up, arrow keys to move, space or enter again to drop on another day.`
      }
      className={cn(
        "touch-manipulation rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500",
        !disabled && "cursor-grab active:cursor-grabbing"
      )}
    >
      <WorkoutChip {...chip} dragging={isDragging} />
    </div>
  );
}

interface DayCellShellProps {
  day: RunDay;
  date: Date;
  isToday: boolean;
  highlight?: boolean;
  children?: ReactNode;
  innerRef?: (node: HTMLElement | null) => void;
}

/** One calendar cell: date number top-right (macOS style), chip below. */
function DayCellShell({ day, date, isToday, highlight = false, children, innerRef }: DayCellShellProps) {
  const dayOfMonth = date.getDate();
  const label =
    dayOfMonth === 1
      ? `${date.toLocaleDateString(undefined, { month: "short" })} 1`
      : String(dayOfMonth);
  return (
    <div
      ref={innerRef}
      data-day={day}
      className={cn(
        "min-h-[64px] sm:min-h-[84px] p-1 sm:p-1.5 flex flex-col gap-1 transition-colors",
        highlight && "bg-emerald-50 ring-1 ring-inset ring-emerald-300"
      )}
    >
      <div className="flex justify-end">
        <span
          className={cn(
            "inline-flex items-center justify-center h-4 min-w-4 sm:h-5 sm:min-w-5 px-1 rounded-full text-[9px] sm:text-[10px] tabular-nums leading-none",
            isToday ? "bg-emerald-600 text-white font-bold" : "text-slate-400 font-medium"
          )}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

interface DroppableDayCellProps extends Omit<DayCellShellProps, "highlight" | "innerRef"> {
  /** Whether the in-flight drag may drop here (false also when no drag). */
  validTarget: boolean;
}

function DroppableDayCell({ day, validTarget, children, ...shell }: DroppableDayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: day, disabled: !validTarget });
  return (
    <DayCellShell {...shell} day={day} innerRef={setNodeRef} highlight={isOver && validTarget}>
      {children}
    </DayCellShell>
  );
}

interface WeekRowProps {
  plan: TrainingPlan;
  week: TrainingWeek;
  isCurrent: boolean;
  isFirst: boolean;
  progress?: PlanProgress;
  editor?: PlanEditor;
  innerRef?: Ref<HTMLDivElement>;
}

function WeekRow({ plan, week, isCurrent, isFirst, progress, editor, innerRef }: WeekRowProps) {
  const [activeDay, setActiveDay] = useState<RunDay | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const byDay = useMemo(() => {
    const map = new Map<RunDay, TrainingDay>();
    for (const d of week.days) map.set(d.day, d);
    return map;
  }, [week.days]);

  const today = todayNoon();
  const phaseMeta = PHASE_META[week.phase];
  const summary = progress?.weekProgress(week);

  function handleDragStart(event: DragStartEvent) {
    setActiveDay(dayFromDragId(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const fromDay = dayFromDragId(event.active.id);
    setActiveDay(null);
    if (!editor || !event.over) return;
    editor.moveWorkout({ weekNumber: week.weekNumber, fromDay, toDay: event.over.id as RunDay });
  }

  const cells = ALL_DAYS.map((day) => {
    const trainingDay = byDay.get(day);
    const date = workoutDate(plan, week.weekNumber, day);
    const isToday = sameDay(date, today);

    const chipInteractions = trainingDay &&
      trainingDay.workout.type !== "rest" &&
      progress
        ? {
            done: progress.isComplete(week.weekNumber, day),
            pending: progress.isPending(week.weekNumber, day),
            onToggle: () => progress.toggle(week.weekNumber, day),
          }
        : {};

    if (!editor) {
      return (
        <DayCellShell key={day} day={day} date={date} isToday={isToday}>
          {trainingDay && <WorkoutChip workout={trainingDay.workout} {...chipInteractions} />}
        </DayCellShell>
      );
    }

    const validTarget =
      activeDay !== null &&
      editor.canMove({ weekNumber: week.weekNumber, fromDay: activeDay, toDay: day });

    return (
      <DroppableDayCell key={day} day={day} date={date} isToday={isToday} validTarget={validTarget}>
        {trainingDay && (
          <DraggableChip
            day={day}
            disabled={trainingDay.workout.type === "race"}
            workout={trainingDay.workout}
            {...chipInteractions}
          />
        )}
      </DroppableDayCell>
    );
  });

  const row = <div className="grid grid-cols-7 divide-x divide-slate-100">{cells}</div>;
  const activeWorkout = activeDay ? byDay.get(activeDay)?.workout : undefined;

  return (
    <div ref={innerRef} data-week={week.weekNumber}>
      {/* Slim week bar — the calendar's stand-in for macOS's month label:
          phase dot, week number, volume, and completion at a glance. */}
      <div
        className={cn(
          "flex items-center gap-2 px-2 sm:px-3 py-1.5 border-slate-200 text-[11px] sm:text-xs",
          !isFirst && "border-t",
          isCurrent ? "bg-emerald-50" : "bg-slate-50/60"
        )}
      >
        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: phaseMeta.bg }} />
        <span className="font-bold text-slate-700 whitespace-nowrap">Week {week.weekNumber}</span>
        <span className="text-slate-400 truncate">{phaseMeta.short}</span>
        {isCurrent && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white whitespace-nowrap">
            NOW
          </span>
        )}
        <span className="ml-auto font-semibold text-emerald-600 tabular-nums whitespace-nowrap">
          {week.totalKm} km
        </span>
        {summary && summary.totalCount > 0 && (
          <span className="text-slate-400 tabular-nums whitespace-nowrap">
            {summary.completedCount}/{summary.totalCount}
          </span>
        )}
      </div>

      {!editor ? (
        <div className="border-t border-slate-100">{row}</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDay(null)}
        >
          <div className="border-t border-slate-100">{row}</div>
          <DragOverlay dropAnimation={null}>
            {activeWorkout ? <WorkoutChip workout={activeWorkout} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

interface Props {
  plan: TrainingPlan;
  currentWeekNum: number | null;
  progress?: PlanProgress;
  editor?: PlanEditor;
  /** Attached to the current week's row so the calendar can scroll to it. */
  currentWeekRef?: Ref<HTMLDivElement>;
}

export function PlanCalendarGrid({ plan, currentWeekNum, progress, editor, currentWeekRef }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Weekday header — small, uppercase, right-aligned, macOS-style */}
      <div className="grid grid-cols-7 divide-x divide-slate-100 border-b border-slate-200 bg-white">
        {ALL_DAYS.map((day) => (
          <div
            key={day}
            className="px-1.5 sm:px-2 py-1.5 text-right text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      {plan.weeks.map((week, i) => (
        <WeekRow
          key={week.weekNumber}
          plan={plan}
          week={week}
          isCurrent={week.weekNumber === currentWeekNum}
          isFirst={i === 0}
          progress={progress}
          editor={editor}
          innerRef={week.weekNumber === currentWeekNum ? currentWeekRef : undefined}
        />
      ))}
    </div>
  );
}
