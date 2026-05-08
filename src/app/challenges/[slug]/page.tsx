import ChallengeWorkspace from "@/components/challenges/challenge-workspace";

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ChallengeWorkspace slug={slug} />;
}

