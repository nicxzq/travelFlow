import type { TripDay, TripTodo, TripWithDaysAndEvents } from '@/lib/domain/trip';

export type TripSchedulePhase = 'pretrip' | 'intrip' | 'posttrip';

export interface TripScheduleContext {
  phase: TripSchedulePhase;
  today: TripDay;
  tomorrow?: TripDay;
  todayTodos: TripTodo[];
  upcomingTodos: TripTodo[];
}

function dateOnly(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function compareDate(a?: string, b?: string) {
  if (!a || !b) return 0;
  return a.localeCompare(b);
}

function getTodosForDay(todos: TripTodo[] | undefined, day?: TripDay) {
  if (!day) return [];
  return (todos ?? [])
    .filter((todo) => todo.status !== 'done' && (todo.dayId === day.id || todo.dueDate === day.date))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getTripScheduleContext(
  trip: TripWithDaysAndEvents,
  currentDate = new Date(),
): TripScheduleContext {
  const days = [...trip.days].sort((a, b) => a.dayIndex - b.dayIndex);
  const current = dateOnly(currentDate);
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  if (!firstDay || !lastDay) {
    throw new Error('Trip must contain at least one day.');
  }

  if (compareDate(current, firstDay.date) < 0) {
    return {
      phase: 'pretrip',
      today: firstDay,
      tomorrow: days[1],
      todayTodos: getTodosForDay(trip.todos, firstDay),
      upcomingTodos: (trip.todos ?? []).filter((todo) => todo.status !== 'done').slice(0, 5),
    };
  }

  if (compareDate(current, lastDay.date) > 0) {
    return {
      phase: 'posttrip',
      today: lastDay,
      todayTodos: getTodosForDay(trip.todos, lastDay),
      upcomingTodos: [],
    };
  }

  const today = days.find((day) => day.date === current) ?? days.find((day) => compareDate(day.date, current) >= 0) ?? lastDay;
  const tomorrow = days.find((day) => day.dayIndex === today.dayIndex + 1);

  return {
    phase: 'intrip',
    today,
    tomorrow,
    todayTodos: getTodosForDay(trip.todos, today),
    upcomingTodos: getTodosForDay(trip.todos, tomorrow),
  };
}

export function getNextEvent(day: TripDay, now = new Date()) {
  const current = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  return day.events.find((event) => !event.endTime || event.endTime >= current) ?? day.events[day.events.length - 1];
}
