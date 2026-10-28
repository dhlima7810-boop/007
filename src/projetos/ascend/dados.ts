// Dados de exemplo para prévia e para as composições do Remotion.
// Tudo que as telas mostram entra por props: troque aqui ou passe por
// `inputProps`.
import type { SetLogProps } from './SetLogScreen';
import type { ProgressProps } from './ProgressScreen';
import type { WeekHistoryProps } from './WeekHistoryScreen';
import type { MilestoneProps } from './MilestoneScreen';

export const setLogExemplo: SetLogProps = {
  exercise: 'Barbell Bench Press',
  setNumber: 3,
  totalSets: 4,
  weight: 47.5,
  unit: 'kg',
  reps: 8,
  lastWeek: { weight: 45, reps: 8 },
  logged: [
    { weight: 45, reps: 8 },
    { weight: 47.5, reps: 8 },
  ],
  context: 'Push day',
};

export const progressoExemplo: ProgressProps = {
  week: 9,
  streak: {
    days: 23,
    last14: [true, true, false, true, true, true, false, true, true, true, true, false, true, true],
  },
  strength: {
    exercise: 'Bench press · est. 1RM',
    unit: 'kg',
    points: [32.5, 34, 36, 37, 39.5, 41, 44, 46, 49, 52.5],
    xLabels: [
      { index: 0, text: 'Week 1' },
      { index: 9, text: 'Week 10' },
    ],
  },
  volume: { value: 14280, unit: 'kg', deltaPct: 12 },
};

export const semanaExemplo: WeekHistoryProps = {
  week: 9,
  unit: 'kg',
  planned: 4,
  days: [
    { day: 'Mon', date: 13, status: 'done', title: 'Push', minutes: 52, volume: 4820 },
    { day: 'Tue', date: 14, status: 'rest' },
    { day: 'Wed', date: 15, status: 'done', title: 'Legs', minutes: 61, volume: 6940 },
    { day: 'Thu', date: 16, status: 'done', title: 'Pull', minutes: 48, volume: 3980 },
    { day: 'Fri', date: 17, status: 'rest' },
    { day: 'Sat', date: 18, status: 'done', title: 'Full body', minutes: 57, volume: 5410 },
    { day: 'Sun', date: 19, status: 'rest' },
  ],
};

export const marcoExemplo: MilestoneProps = {
  week: 12,
  line: 'The mirror hasn’t caught up yet. Your numbers have.',
  curve: [32.5, 34, 36, 37, 39.5, 41, 44, 46, 49, 52.5, 55, 57.5],
  rows: [
    { label: 'Strength', from: 32.5, to: 57.5, unit: 'kg', decimals: 1 },
    { label: 'Volume', from: 6200, to: 14800, unit: 'kg / wk' },
    { label: 'Streak', from: 3, to: 38, unit: 'days', delta: 'abs' },
  ],
};
