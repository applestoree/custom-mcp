export interface BuildFinalPromptInput {
  products: string;
  headline: string;
  subheadline: string;
  features: string;
  composition: string;
  layout: string;
  background: string;
  quality: string;
}

export function buildFinalPrompt(input: BuildFinalPromptInput): string {
  return [
    "Create a professional commercial advertising poster featuring:",
    "",
    "**PRODUCT:** " + input.products,
    "",
    "**HEADLINE:** " + input.headline,
    "",
    "**SUBHEADLINE:** " + input.subheadline,
    "",
    "**PRODUCT FEATURES:**",
    input.features,
    "",
    "**COMPOSITION:**",
    input.composition,
    "",
    "**LAYOUT:**",
    input.layout,
    "",
    "**BACKGROUND:**",
    input.background,
    "",
    "**VISUAL QUALITY:**",
    input.quality,
    "",
    "## Design Requirements",
    "",
    "- Create a premium, professional advertising design.",
    "- Make the selected product the primary visual focus.",
    "- Maintain realistic product proportions and details.",
    "- Use professional commercial photography aesthetics.",
    "- Ensure clear visual hierarchy.",
    "- Make headline and subheadline visually readable.",
    "- Arrange all elements harmoniously.",
    "- Avoid unnecessary decorative elements.",
    "- Do not create, redraw, or generate any logo.",
    "- Leave the top-left area suitable for a small logo overlay.",
    "",
    "## Output Requirements",
    "",
    "- Image dimensions: 1080 × 1350 pixels.",
    "- Aspect ratio: 4:5.",
    "- High-resolution commercial advertising quality.",
    "- Ready for social media publication."
  ].join("\n");
}
