import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/documents/upload/route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/vincere/sync-service", () => ({
  syncDocumentUpload: vi.fn(),
}));

vi.mock("@/lib/verification", () => ({
  logVerificationEvent: vi.fn(),
  calculateVerificationTier: vi.fn(),
}));

vi.mock("@/lib/services/text-extraction", () => ({
  extractText: vi.fn(),
  isExtractable: vi.fn().mockReturnValue(false),
}));

const { createClient } = await import("@/lib/supabase/server");
const { createClient: createServiceClient } = await import("@supabase/supabase-js");

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

describe("documents upload", () => {
  it("uploads without organization_id and inserts document row", async () => {
    let insertedPayload: Record<string, unknown> | null = null;

    const userData = {
      id: "user-1",
      organization_id: null,
      user_type: "candidate",
    };

    const candidateData = { id: "candidate-1" };

    const createQuery = (table: string) => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        insert: vi.fn((payload: Record<string, unknown>) => {
          if (table === "documents") {
            insertedPayload = payload;
          }
          return query;
        }),
        update: vi.fn(() => query),
        single: vi.fn(async () => {
          if (table === "users") {
            return { data: userData, error: null };
          }
          if (table === "candidates") {
            return { data: candidateData, error: null };
          }
          if (table === "documents") {
            return { data: { id: "doc-1" }, error: null };
          }
          return { data: null, error: null };
        }),
      };
      return query;
    };

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "auth-1" } } })),
      },
      from: vi.fn((table: string) => createQuery(table)),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(async () => ({ error: null })),
          remove: vi.fn(async () => ({ error: null })),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/file.pdf" } })),
        })),
      },
    };

    (createClient as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      supabaseMock
    );
    (createServiceClient as unknown as { mockReturnValue: (value: unknown) => void }).mockReturnValue(
      supabaseMock
    );

    const formData = new FormData();
    formData.set("file", new File(["pdf"], "resume.pdf", { type: "application/pdf" }));
    formData.set("entityType", "candidate");
    formData.set("entityId", candidateData.id);
    formData.set("documentType", "certification");

    const request = new Request("http://localhost/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request as unknown as Request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(insertedPayload?.organization_id).toBeUndefined();
  });
});
