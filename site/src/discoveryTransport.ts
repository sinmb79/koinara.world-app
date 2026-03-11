import type { ChainConfig, JobManifest, RunSnapshot, SubmissionReceipt } from "@koinara/shared";

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function getWriteBaseUrl(): string {
  return import.meta.env.VITE_DISCOVERY_WRITE_URL ?? "";
}

export function isDiscoveryWriteConfigured(): boolean {
  return Boolean(getWriteBaseUrl());
}

export async function publishJobManifest(config: ChainConfig, manifest: JobManifest): Promise<string> {
  const writeBaseUrl = getWriteBaseUrl();
  if (!writeBaseUrl) {
    throw new Error("Public discovery writer is not configured.");
  }

  const path = `jobs/${manifest.requestHash}.json`;
  const url = joinUrl(writeBaseUrl, path);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(manifest, null, 2)
  });

  if (!response.ok) {
    throw new Error(`Failed to publish manifest to ${url}`);
  }

  return joinUrl(config.artifactTransport.publicBaseUrl, path);
}

export async function resolveRunSnapshotArtifact(config: ChainConfig, jobId: number): Promise<RunSnapshot | null> {
  return resolvePublicJson<RunSnapshot>(config, [`runs/${jobId}.json`]);
}

export async function resolveReceiptArtifact(
  config: ChainConfig,
  jobId: number,
  responseHash: string
): Promise<SubmissionReceipt | null> {
  return resolvePublicJson<SubmissionReceipt>(config, [
    `receipts/${config.id}/${jobId}-${responseHash}.json`,
    `receipts/${jobId}-${responseHash}.json`
  ]);
}

export async function resolveResultArtifact(
  config: ChainConfig,
  jobId: number,
  responseHash: string
): Promise<unknown | null> {
  return resolvePublicJson<unknown>(config, [
    `results/${config.id}/${jobId}-${responseHash}.json`
  ]);
}

async function resolvePublicJson<T>(config: ChainConfig, paths: string[]): Promise<T | null> {
  const candidates = buildCandidateUrls(config, paths);
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);
      if (!response.ok) {
        continue;
      }
      return (await response.json()) as T;
    } catch {
      continue;
    }
  }

  return null;
}

function buildCandidateUrls(config: ChainConfig, paths: string[]): string[] {
  const urls: string[] = [];
  if (config.artifactTransport.publicBaseUrl) {
    const base = config.artifactTransport.publicBaseUrl;
    if (base.startsWith("ipfs://")) {
      const cidPath = base.replace(/^ipfs:\/\//, "").replace(/^\/+/, "");
      for (const gateway of config.artifactTransport.gatewayUrls) {
        urls.push(...paths.map((path) => joinUrl(joinUrl(gateway, cidPath), path)));
      }
    } else {
      urls.push(...paths.map((path) => joinUrl(base, path)));
    }
  }
  return urls;
}
