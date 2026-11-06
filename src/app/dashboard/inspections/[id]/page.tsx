
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  MapPin,
  UserRound,
  Ruler,
  Image as ImageIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { getUserDatePreferences } from "@/lib/user-date-preferences";
import { formatAppDate } from "@/lib/date-format";
import DeleteInspectionButton from "@/components/dashboard/DeleteInspectionButton";

type InspectionPageProps = {
  params: Promise<{ id: string }>;
};

async function InspectionDetailsContent({
  params,
}: InspectionPageProps) {
  await connection();

  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const datePreferences = await getUserDatePreferences(supabase, user.id);
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Inspection deletion authorization lookup error:", profileError);
  }
  const isAdmin = currentProfile?.role === "admin";

  // Get inspection
  const { data: inspection, error: inspectionError } = await supabase
    .from("inspections")
    .select("*")
    .eq("id", id)
    .single();

  if (inspectionError || !inspection) {
    notFound();
  }

  // Get wall information
  const { data: wall } = await supabase
    .from("walls")
    .select("*")
    .eq("id", inspection.wall_id)
    .single();

  // Get inspector information
  let inspector = null;

  if (inspection.inspected_by) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", inspection.inspected_by)
      .maybeSingle();

    inspector = data;
  }

  // Find photos belonging to this inspection.
  // The storage path format is wall_id/inspection_id/filename.
  const { data: photoRecords, error: photosError } = await supabase
    .from("wall_photos")
    .select("id, image_path, caption, created_at")
    .eq("wall_id", inspection.wall_id)
    .eq("photo_type", "inspection")
    .like("image_path", `${inspection.wall_id}/${id}/%`)
    .order("created_at", { ascending: true });

  // Generate temporary viewing links for private storage images.
  const photos = await Promise.all(
    (photoRecords ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("wall-photos")
        .createSignedUrl(photo.image_path, 60 * 60);

      return {
        ...photo,
        signedUrl: data?.signedUrl ?? null,
      };
    })
  );

  const conditionStyles: Record<string, string> = {
    excellent: "bg-green-500/10 text-green-400 border-green-500/20",
    good: "bg-lime-500/10 text-lime-400 border-lime-500/20",
    fair: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    poor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    damaged: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const conditionStyle =
    conditionStyles[inspection.condition?.toLowerCase()] ??
    "bg-gray-500/10 text-gray-400 border-gray-500/20";

  const formattedDate = formatAppDate(
    inspection.inspection_date,
    datePreferences
  );

  const location = wall
    ? [wall.address, wall.suburb, wall.city, wall.province]
        .filter(Boolean)
        .join(", ")
    : "Wall information unavailable";

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? "Employee"} />
        <main className="p-6 lg:p-8">
          <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/inspections"
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#E7FF3C]"
        >
          <ArrowLeft size={16} />
          Back to inspections
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-[#E7FF3C]">
              <ClipboardCheck size={17} />
              Inspection record
            </div>

            <h1 className="text-2xl font-semibold text-white">
              Inspection Details
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              View the inspection information, wall details and uploaded photos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`w-fit rounded-full border px-4 py-2 text-sm font-medium capitalize ${conditionStyle}`}
            >
              {inspection.condition}
            </span>
            {isAdmin && <DeleteInspectionButton inspectionId={id} />}
          </div>
        </div>
      </div>

      {/* Inspection information */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">
            Inspection Information
          </h2>

          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-1 text-[#E7FF3C]" size={19} />
              <div>
                <p className="text-xs text-gray-500">Inspection date</p>
                <p className="mt-1 text-sm text-white">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserRound className="mt-1 text-[#E7FF3C]" size={19} />
              <div>
                <p className="text-xs text-gray-500">Inspected by</p>
                <p className="mt-1 text-sm text-white">
                  {inspector?.full_name || inspector?.email || "Unknown inspector"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500">Condition</p>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-sm capitalize ${conditionStyle}`}
              >
                {inspection.condition}
              </span>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500">Inspection notes</p>
              <div className="rounded-lg border border-white/10 bg-[#111111] p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
                  {inspection.notes || "No notes were added."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Wall information */}
        <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">
            Wall Information
          </h2>

          {wall ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-500">Wall code</p>
                <p className="mt-1 font-medium text-[#E7FF3C]">
                  {wall.wall_code}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Wall name</p>
                <p className="mt-1 text-sm text-white">{wall.name}</p>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-1 text-[#E7FF3C]" size={19} />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="mt-1 text-sm leading-6 text-white">
                    {location || "No address recorded"}
                  </p>
                </div>
              </div>

              {wall.wall_type && (
                <div>
                  <p className="text-xs text-gray-500">Wall type</p>
                  <p className="mt-1 text-sm capitalize text-white">
                    {wall.wall_type.replaceAll("_", " ")}
                  </p>
                </div>
              )}

              {(wall.width_m || wall.height_m) && (
                <div className="flex items-start gap-3">
                  <Ruler className="mt-1 text-[#E7FF3C]" size={19} />
                  <div>
                    <p className="text-xs text-gray-500">Dimensions</p>
                    <p className="mt-1 text-sm text-white">
                      {wall.width_m ?? "—"} m × {wall.height_m ?? "—"} m
                    </p>
                  </div>
                </div>
              )}

              <Link
                href={`/dashboard/walls/${wall.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#E7FF3C] transition hover:underline"
              >
                View wall details
                <ArrowLeft className="rotate-180" size={15} />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Wall information could not be found.
            </p>
          )}
        </section>
      </div>

      {/* Inspection photos */}
      <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Inspection Photos
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Photos uploaded during this inspection.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ImageIcon size={17} />
            {photos.length} {photos.length === 1 ? "photo" : "photos"}
          </div>
        </div>

        {photosError ? (
          <p className="text-sm text-red-400">
            Unable to retrieve inspection photos.
          </p>
        ) : photos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 py-12 text-center">
            <ImageIcon className="mx-auto mb-3 text-gray-600" size={32} />
            <p className="text-sm text-gray-400">
              No photos were uploaded for this inspection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-lg border border-white/10 bg-[#111111]"
              >
                {photo.signedUrl ? (
                  <a
                    href={photo.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <Image
                      src={photo.signedUrl}
                      alt={photo.caption || "Inspection photo"}
                      width={800}
                      height={600}
                      unoptimized
                      className="h-56 w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </a>
                ) : (
                  <div className="flex h-56 items-center justify-center text-sm text-gray-500">
                    Image unavailable
                  </div>
                )}

                {photo.caption && (
                  <p className="p-3 text-sm text-gray-400">
                    {photo.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function InspectionDetailsPage({
  params,
}: InspectionPageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-gray-400">
          Loading inspection details...
        </div>
      }
    >
      <InspectionDetailsContent params={params} />
    </Suspense>
  );
}
