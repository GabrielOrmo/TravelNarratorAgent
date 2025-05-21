
import { z } from "zod";

export const narratorFormSchema = z.object({
  imageDataUri: z.string().refine(
    (dataUri) => dataUri.startsWith('data:image/'),
    { message: "Please provide a valid image (upload or capture one)." }
  ).optional(),
  locationQuery: z.string().min(1, "Search term must not be empty if used.").optional(),
  informationStyle: z.enum(["Historical", "Curious", "Legends"], {
    required_error: "You need to select an information style.",
  }),
  outputLanguage: z.string().min(2, "Please select an output language.").default("en"),
}).refine(data => {
  return !!data.imageDataUri || !!data.locationQuery;
}, {
  message: "Please provide either a location search term or an image.",
  path: ["locationQuery"], // Show error near the locationQuery field if both are empty
});

export type NarratorFormValues = z.infer<typeof narratorFormSchema>;

