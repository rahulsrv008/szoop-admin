export interface DateRange {
  from?: string | null;
  to?: string | null;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

/** Turns a readonly const list of enum strings into dropdown options. */
export function toOptions(
  values: readonly string[],
  labels: Record<string, string> = {},
): SelectOption[] {
  return values.map((value) => ({
    value,
    label: labels[value] ?? humanize(value),
  }));
}

export function humanize(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
