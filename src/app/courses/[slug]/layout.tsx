import { Metadata } from "next";
import dbConnect from "@/lib/db";
import { CourseModel } from "@/models";

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  
  try {
     await dbConnect();
     const course = await CourseModel.findOne({ slug }).lean();

     if (!course) {
       return { title: "Course Not Found | LJ CodeQuest" };
     }

     return {
       title: `${course.title} | LJ CodeQuest`,
       description: course.shortDescription,
       openGraph: {
         title: `${course.title} | LJ CodeQuest`,
         description: course.shortDescription,
         images: [course.thumbnail || "/logo.png"],
       },
       twitter: {
         card: "summary_large_image",
         title: course.title,
         description: course.shortDescription,
         images: [course.thumbnail || "/logo.png"],
       }
     };
  } catch (error) {
     return { title: "Course | LJ CodeQuest" };
  }
}

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
