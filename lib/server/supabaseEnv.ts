function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => Boolean(value?.trim()));
}

export function supabaseUrl(): string | undefined {
  return firstDefined(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabasePublishableKey(): string | undefined {
  return firstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
  );
}

export function supabaseSecretKey(): string | undefined {
  return firstDefined(process.env.SUPABASE_SECRET_KEY);
}
