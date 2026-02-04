/**
 * Get initials from a name string.
 * - Single word: first 2 letters
 * - Multiple words: first letter of first 2 words
 * - Empty/null: returns "?"
 */
export const getInitials = (name?: string | null): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};
