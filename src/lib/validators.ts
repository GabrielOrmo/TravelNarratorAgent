
import { z } from "zod";

export const narratorFormSchema = z.object({
  imageDataUri: z.string().refine(
    (dataUri) => dataUri.startsWith('data:image/'),
    { message: "Please provide a valid image (upload or capture one)." }
  ).describe("The image data URI of the location."),
  informationStyle: z.enum(["Historical", "Curious", "Legends"], {
    required_error: "You need to select an information style.",
  }),
});

export type NarratorFormValues = z.infer<typeof narratorFormSchema>;
