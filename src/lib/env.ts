export function getFirebaseProjectId(): string | null {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    null
  );
}
