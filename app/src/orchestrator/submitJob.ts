import { computeRequestHash, computeSchemaHash, type JobManifest, type JobTypeName } from "@koinara/shared";

export function recommendJobType(text: string): JobTypeName {
  const length = text.trim().length;
  if (length > 2500) {
    return "Collective";
  }
  if (length > 800) {
    return "General";
  }
  return "Simple";
}

export function defaultDeadlineForJobType(jobType: JobTypeName, now = Date.now()): number {
  const hour = 60 * 60 * 1000;
  switch (jobType) {
    case "Simple":
      return Math.floor((now + 6 * hour) / 1000);
    case "General":
      return Math.floor((now + 24 * hour) / 1000);
    case "Collective":
      return Math.floor((now + 48 * hour) / 1000);
  }
}

export function buildManifestFromPrompt(input: {
  prompt: string;
  contentType: string;
  metadata?: Record<string, unknown>;
}): JobManifest {
  const manifest: JobManifest = {
    version: "koinara-job-manifest-v1",
    requestHash: "0x",
    body: {
      prompt: input.prompt,
      contentType: input.contentType,
      schema: { type: "text" },
      metadata: {
        createdBy: "koinara-app",
        ...input.metadata
      }
    }
  };
  manifest.requestHash = computeRequestHash(manifest);
  return manifest;
}

export function buildSubmissionHashes(manifest: JobManifest): { requestHash: string; schemaHash: string } {
  return {
    requestHash: computeRequestHash(manifest),
    schemaHash: computeSchemaHash(manifest)
  };
}
