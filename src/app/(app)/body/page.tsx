import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { kgToDisplay } from "@/lib/units";
import { BodyweightForm } from "@/components/body/bodyweight-form";
import { WeightChart } from "@/components/body/weight-chart";
import { MeasurementForm } from "@/components/body/measurement-form";
import { PhotoUploadForm } from "@/components/body/photo-upload-form";
import {
  deleteBodyweightAction,
  deleteMeasurementAction,
  deleteProgressPhotoAction,
} from "./actions";

const MEASUREMENT_LABELS: Record<string, string> = {
  waist: "Waist",
  chest: "Chest",
  hips: "Hips",
  arm_left: "Arm (L)",
  arm_right: "Arm (R)",
  thigh_left: "Thigh (L)",
  thigh_right: "Thigh (R)",
  shoulders: "Shoulders",
  neck: "Neck",
  calf_left: "Calf (L)",
  calf_right: "Calf (R)",
};

export default async function BodyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("unit_preference")
    .eq("id", user.id)
    .single();
  const unit = profile?.unit_preference ?? "kg";

  const { data: weights } = await supabase
    .from("body_metrics")
    .select("id, recorded_at, weight_kg")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false });

  const { data: measurements } = await supabase
    .from("body_measurements")
    .select("id, recorded_at, measurement_type, value_cm")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false });

  const { data: photos } = await supabase
    .from("progress_photos")
    .select("id, storage_path, taken_at, notes")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false });

  const photoPaths = (photos ?? []).map((p) => p.storage_path);
  const { data: signedUrls } =
    photoPaths.length > 0
      ? await supabase.storage
          .from("progress-photos")
          .createSignedUrls(photoPaths, 3600)
      : { data: [] };
  const urlByPath = new Map(
    (signedUrls ?? []).map((s) => [s.path, s.signedUrl])
  );

  const chartData = [...(weights ?? [])]
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
    .map((w) => ({
      date: w.recorded_at,
      weight: kgToDisplay(w.weight_kg, unit),
    }));

  return (
    <main className="flex flex-1 flex-col gap-8 px-4 py-6">
      <h1 className="font-display text-2xl">Body</h1>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-widest text-fg-muted">
          Bodyweight
        </h2>
        <div className="mb-3">
          <BodyweightForm unit={unit} />
        </div>
        {chartData.length > 0 && <WeightChart data={chartData} />}
        {weights && weights.length > 0 && (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
            {weights.map((w) => {
              const deleteAction = deleteBodyweightAction.bind(null, w.id);
              return (
                <li
                  key={w.id}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <span className="text-fg-muted">{w.recorded_at}</span>
                  <div className="flex items-center gap-3">
                    <span className="tabular">
                      {kgToDisplay(w.weight_kg, unit)} {unit}
                    </span>
                    <form action={deleteAction}>
                      <button
                        type="submit"
                        aria-label="Delete entry"
                        className="text-fg-muted hover:text-accent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-widest text-fg-muted">
          Measurements
        </h2>
        <div className="mb-3">
          <MeasurementForm />
        </div>
        {measurements && measurements.length > 0 && (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {measurements.map((m) => {
              const deleteAction = deleteMeasurementAction.bind(null, m.id);
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <span className="text-fg-muted">
                    {m.recorded_at} &middot;{" "}
                    {MEASUREMENT_LABELS[m.measurement_type]}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="tabular">{m.value_cm} cm</span>
                    <form action={deleteAction}>
                      <button
                        type="submit"
                        aria-label="Delete entry"
                        className="text-fg-muted hover:text-accent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-widest text-fg-muted">
          Progress Photos
        </h2>
        <div className="mb-3">
          <PhotoUploadForm />
        </div>
        {photos && photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => {
              const url = urlByPath.get(p.storage_path);
              const deleteAction = deleteProgressPhotoAction.bind(
                null,
                p.id,
                p.storage_path
              );
              return (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-border bg-surface"
                >
                  {url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={p.notes ?? p.taken_at}
                      className="aspect-square w-full object-cover"
                    />
                  )}
                  <div className="flex items-center justify-between px-2 py-1.5 text-xs">
                    <span className="text-fg-muted">{p.taken_at}</span>
                    <form action={deleteAction}>
                      <button
                        type="submit"
                        aria-label="Delete photo"
                        className="text-fg-muted hover:text-accent"
                      >
                        <Trash2 size={12} />
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
