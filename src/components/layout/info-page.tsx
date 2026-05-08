import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  sections: {
    title: string;
    body: string;
  }[];
  ctaLabel?: string;
  ctaHref?: string;
};

export function InfoPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  sections,
  ctaLabel = "Explore courses",
  ctaHref = "/courses",
}: InfoPageProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="mb-14">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <p className="mb-3 text-sm font-medium uppercase text-primary">
            {eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
          <div className="mt-8">
            <Link href={ctaHref}>
              <Button className="gap-2">
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-lg border border-border bg-card/50 p-6"
            >
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="leading-7 text-muted-foreground">
                {section.body}
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
