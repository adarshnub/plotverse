import { describe, expect, it } from "vitest";
import { transitionDraftStatus } from "@/lib/drafts";
import type { DraftMessage } from "@/lib/types";

describe("draft approval transitions", () => {
  it("moves pending drafts to approved without changing the body", () => {
    const draft: DraftMessage = {
      id: "draft_1",
      matchId: "match_1",
      channel: "whatsapp",
      tone: "warm",
      body: "Original",
      editedBody: "Edited",
      status: "pending",
      createdAt: "2026-05-06T00:00:00.000Z",
      updatedAt: "2026-05-06T00:00:00.000Z",
    };

    const next = transitionDraftStatus(draft, "approved", "2026-05-06T01:00:00.000Z");

    expect(next.status).toBe("approved");
    expect(next.editedBody).toBe("Edited");
    expect(next.updatedAt).toBe("2026-05-06T01:00:00.000Z");
  });
});
