/**
 * Suggest a bot reply from an option label (template-based, no AI cost).
 */
export function suggestResponseFromOption(optionLabel: string): string {
  const label = optionLabel.trim().replace(/\s+/g, " ");
  if (!label) {
    return "Thanks for your interest. How else can I help you?";
  }

  const lower = label.toLowerCase();

  if (
    lower.includes("human") ||
    lower.includes("agent") ||
    lower.includes("developer") ||
    lower.includes("talk to")
  ) {
    return "I'll connect you with the developer. Please share a short message about what you need.";
  }

  if (lower.includes("hire") || lower.includes("custom") || lower.includes("build")) {
    return `Great — you're interested in: "${label}". Tell me a bit about your project (goals, timeline, budget) and we can take the next step.`;
  }

  if (
    lower.includes("sale") ||
    lower.includes("buy") ||
    lower.includes("price") ||
    lower.includes("purchase")
  ) {
    return `You're looking at projects for sale. Browse the listings, open a demo if available, or ask to negotiate — I can guide you.`;
  }

  if (
    lower.includes("website") ||
    lower.includes("project") ||
    lower.includes("portfolio") ||
    lower.includes("browse")
  ) {
    return `You chose "${label}". You can explore live projects on the site, open a demo, or ask me anything about a specific one.`;
  }

  if (lower.includes("contact") || lower.includes("email") || lower.includes("whatsapp")) {
    return `You can reach out via the contact page, email, or WhatsApp. Prefer live chat? Choose "Talk to a human agent".`;
  }

  if (lower.includes("demo")) {
    return `Demos let you try how a project works. Open the demo from the project card, then come back here if you have questions.`;
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("discount")) {
    return `Pricing is shown on each for-sale project (old price crossed out when discounted). Want a custom quote? Talk to the developer.`;
  }

  // Generic, still grounded in the option text
  return `You selected "${label}". Here's what you should know next — or pick another option below, or ask me in your own words.`;
}

/** Short admin title suggestion from option label */
export function suggestTitleFromOption(optionLabel: string): string {
  const label = optionLabel.trim();
  if (!label) return "Follow-up";
  return label.length > 40 ? label.slice(0, 37) + "…" : label;
}
