import "server-only";

import { NextResponse } from "next/server";

import {
  getErrorStatus,
  getPublicErrorMessage
} from "@/lib/errors";

export function applyNoStoreHeaders<T extends Response>(response: T) {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export function noStoreJson(body: unknown, init?: ResponseInit) {
  return applyNoStoreHeaders(NextResponse.json(body, init));
}

export function publicErrorJson(
  error: unknown,
  fallbackMessage: string,
  init?: ResponseInit & { fallbackStatus?: number },
  additionalSafeMessages?: readonly string[]
) {
  const { fallbackStatus, ...responseInit } = init ?? {};
  const status = getErrorStatus(error, fallbackStatus ?? responseInit.status ?? 400);
  return noStoreJson(
    {
      error: getPublicErrorMessage(error, fallbackMessage, additionalSafeMessages)
    },
    {
      ...responseInit,
      status
    }
  );
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return (
    request.headers.get("cf-connecting-ip") ??
    forwardedFor?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local"
  );
}
