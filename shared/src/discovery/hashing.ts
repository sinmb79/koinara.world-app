import { keccak256, toUtf8Bytes } from "ethers";
import type { JobManifest, SubmissionReceipt } from "../types.js";

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right)
    );
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalJson(entryValue)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function computeRequestHash(manifest: Pick<JobManifest, "body">): string {
  return keccak256(toUtf8Bytes(canonicalJson(manifest.body)));
}

export function computeSchemaHash(manifest: Pick<JobManifest, "body">): string {
  return keccak256(toUtf8Bytes(canonicalJson(manifest.body.schema)));
}

export function computeResponseHash(receipt: Pick<SubmissionReceipt, "body">): string {
  return keccak256(toUtf8Bytes(canonicalJson(receipt.body)));
}
