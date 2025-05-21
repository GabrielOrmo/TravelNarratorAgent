
import { z } from "zod";

export const narratorFormSchema = z.object({
  locationDescription: z.string().min(10, {
    message: "Location description must be at least 10 characters.",
  }).max(500, {
    message: "Location description must be at most 500 characters.",
  }),
  informationStyle: z.enum(["Historical", "Curious", "Legends"], {
    required_error: "You need to select an information style.",
  }),
});

export type NarratorFormValues = z.infer<typeof narratorFormSchema>;
