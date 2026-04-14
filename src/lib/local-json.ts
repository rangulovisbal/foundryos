import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function getDataDir() {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return path.join("/tmp", "foundryos-preview-data");
  }

  return path.join(process.cwd(), "data");
}

export async function ensureDataDir() {
  await mkdir(getDataDir(), { recursive: true });
}

export function resolveDataFile(name: string) {
  return path.join(getDataDir(), name);
}

export async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const contents = await readFile(filePath, "utf8");
    const parsed = JSON.parse(contents) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeJsonArray<T>(filePath: string, payload: T[]) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}
