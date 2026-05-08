import ChallengeEditor from "@/components/admin/challenge-form";

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChallengeEditor challengeId={id} />;
}
