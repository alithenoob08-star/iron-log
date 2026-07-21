import type { MuscleGroup } from "@/lib/supabase/types";

export const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "legs", label: "Legs" },
  { value: "shoulders", label: "Shoulders" },
  { value: "arms", label: "Arms" },
  { value: "core", label: "Core" },
  { value: "full_body", label: "Full Body" },
  { value: "cardio", label: "Cardio" },
  { value: "other", label: "Other" },
];

export function muscleGroupLabel(value: MuscleGroup): string {
  return MUSCLE_GROUPS.find((m) => m.value === value)?.label ?? value;
}
