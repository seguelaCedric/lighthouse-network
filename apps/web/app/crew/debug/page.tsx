import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DebugPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user record
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .maybeSingle(); // Use maybeSingle to avoid error if not found

  // Get candidate by user_id
  let candidate = null;
  let candidateLookupMethod = "none";

  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("*")
      .eq("user_id", userData.id)
      .maybeSingle(); // Use maybeSingle to avoid error if not found

    if (candidateByUserId) {
      candidate = candidateByUserId;
      candidateLookupMethod = "user_id";
    }
  }

  // Fallback: Get candidate by email
  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select("*")
      .eq("email", user.email)
      .maybeSingle(); // Use maybeSingle to avoid error if not found

    if (candidateByEmail) {
      candidate = candidateByEmail;
      candidateLookupMethod = "email";
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Debug Info</h1>

        {/* Auth User */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Auth User</h2>
          <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm">
            {JSON.stringify(
              {
                id: user.id,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                user_metadata: user.user_metadata,
              },
              null,
              2
            )}
          </pre>
        </div>

        {/* Users Record */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Users Record</h2>
          {userError ? (
            <div className="rounded bg-red-50 p-4 text-red-700">
              Error: {userError.message}
            </div>
          ) : userData ? (
            <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm">
              {JSON.stringify(userData, null, 2)}
            </pre>
          ) : (
            <div className="rounded bg-yellow-50 p-4 text-yellow-700">
              No users record found for auth_id: {user.id}
            </div>
          )}
        </div>

        {/* Candidate Record */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Candidate Record
            {candidateLookupMethod !== "none" && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (found via {candidateLookupMethod})
              </span>
            )}
          </h2>
          {candidate ? (
            <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm">
              {JSON.stringify(candidate, null, 2)}
            </pre>
          ) : (
            <div className="rounded bg-red-50 p-4 text-red-700">
              <p className="font-semibold">No candidate record found!</p>
              <p className="mt-2 text-sm">
                Searched by:
                <ul className="ml-4 mt-1 list-disc">
                  {userData && <li>user_id: {userData.id}</li>}
                  {user.email && <li>email: {user.email}</li>}
                </ul>
              </p>
            </div>
          )}
        </div>

        {/* Status Summary */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Status Summary</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`size-3 rounded-full ${
                  user ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span>Auth User: {user ? "✓ Found" : "✗ Not found"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`size-3 rounded-full ${
                  userData ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span>
                Users Record: {userData ? "✓ Found" : "✗ Not found"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`size-3 rounded-full ${
                  candidate ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span>
                Candidate Record: {candidate ? "✓ Found" : "✗ Not found"}
              </span>
            </div>
            {candidate && userData && (
              <div className="flex items-center gap-2">
                <div
                  className={`size-3 rounded-full ${
                    candidate.user_id === userData.id
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                />
                <span>
                  Link Status:{" "}
                  {candidate.user_id === userData.id
                    ? "✓ Properly linked"
                    : "⚠ Not linked (using email fallback)"}
                </span>
              </div>
            )}
          </div>

          {candidate && userData && candidate.user_id !== userData.id && (
            <div className="mt-4 rounded bg-yellow-50 p-4 text-sm text-yellow-800">
              <p className="font-semibold">⚠️ Warning: Candidate not properly linked</p>
              <p className="mt-1">
                The candidate record has user_id: {candidate.user_id || "null"}, but should
                be: {userData.id}
              </p>
              <p className="mt-2">
                Run this command to fix:
                <br />
                <code className="mt-1 block rounded bg-yellow-100 p-2 font-mono text-xs">
                  npx tsx apps/web/scripts/link-user-to-candidate.ts {user.email}
                </code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
