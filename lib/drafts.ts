import type { DraftMessage, DraftStatus } from "@/lib/types";

export function transitionDraftStatus(draft: DraftMessage, status: Exclude<DraftStatus, "pending">, updatedAt: string) {
  return {
    ...draft,
    status,
    updatedAt,
  };
}
