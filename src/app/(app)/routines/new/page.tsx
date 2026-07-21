import { RoutineForm } from "@/components/routines/routine-form";
import { createRoutineAction } from "../actions";

export default function NewRoutinePage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="font-display text-2xl">New Routine</h1>
      <RoutineForm action={createRoutineAction} submitLabel="Create & Add Days" />
    </main>
  );
}
