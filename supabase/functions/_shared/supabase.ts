import { createClient } from "npm:@supabase/supabase-js@2";

export function adminClient() {
    return createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false } },
    );
}

export type Subscription = {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent: string | null;
    disabled_at: string | null;
};
