import { z } from "zod";
import rawExperiences from "@/content/experiences.json";

export const ExperienceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["game", "visualization", "simulation", "calculator"]),
  icon: z.string().startsWith("/"),
  thumbnail: z.string().startsWith("/"),
  featured: z.boolean(),
  status: z.enum(["live", "beta", "coming-soon"]),
  tags: z.array(z.string()).min(1),
});

export const ExperiencesSchema = z.array(ExperienceSchema);

export type Experience = z.infer<typeof ExperienceSchema>;

let validated: Experience[] | null = null;

export function getExperiences(): Experience[] {
  if (validated) return validated;
  const result = ExperiencesSchema.safeParse(rawExperiences);
  if (!result.success) {
    console.error("Invalid experiences.json:", result.error.format());
    // Fallback to raw with cast to avoid breaking build
    return rawExperiences as Experience[];
  }
  validated = result.data;
  return validated;
}

export function getLiveExperiences(): Experience[] {
  return getExperiences().filter((e) => e.status === "live");
}

export function getExperienceById(id: string): Experience | undefined {
  return getExperiences().find((e) => e.id === id);
}
