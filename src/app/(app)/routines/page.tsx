import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: routines } = await supabase
    .from("routines")
    .select("id, name, description, is_preset, visibility, owner_id")
    .order("is_preset", { ascending: false })
    .order("name");

  const shared = (routines ?? []).filter((r) => r.visibility === "shared");
  const mine = (routines ?? []).filter(
    (r) => r.visibility === "private" && r.owner_id === user?.id
  );

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Routines</h1>
        <Link
          href="/routines/new"
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-sm font-bold uppercase tracking-wide text-accent-fg hover:brightness-110"
        >
          <Plus size={16} /> New
        </Link>
      </div>

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-widest text-fg-muted">
          Shared with the group
        </h2>
        <RoutineList routines={shared} emptyText="No shared routines yet." />
      </section>

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-widest text-fg-muted">
          My private routines
        </h2>
        <RoutineList
          routines={mine}
          emptyText="You haven't built a private routine yet."
        />
      </section>
    </main>
  );
}

function RoutineList({
  routines,
  emptyText,
}: {
  routines: {
    id: string;
    name: string;
    description: string | null;
    is_preset: boolean;
  }[];
  emptyText: string;
}) {
  if (routines.length === 0) {
    return <p className="text-sm text-fg-muted">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
      {routines.map((r) => (
        <li key={r.id}>
          <Link
            href={`/routines/${r.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-surface-2"
          >
            <div>
              <p>{r.name}</p>
              {r.description && (
                <p className="text-sm text-fg-muted">{r.description}</p>
              )}
            </div>
            {r.is_preset && (
              <span className="text-xs uppercase tracking-wide text-steel">
                Preset
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
