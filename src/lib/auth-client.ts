import type { User } from "firebase/auth";

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return body?.error || fallback;
  } catch {
    return fallback;
  }
}

export async function establishSession(
  user: User,
  options: { forceRefresh?: boolean } = {}
) {
  const token = await user.getIdToken(options.forceRefresh);

  const sessionResponse = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!sessionResponse.ok) {
    throw new Error(
      await readError(sessionResponse, "Failed to create your session.")
    );
  }

  const syncResponse = await fetch("/api/auth/sync", {
    method: "POST",
  });

  if (!syncResponse.ok) {
    throw new Error(
      await readError(syncResponse, "Failed to sync your account.")
    );
  }
}

export async function clearSession() {
  await fetch("/api/auth/session", { method: "DELETE" });
}
