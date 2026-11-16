import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-quotamob-hook-secret",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expected = Deno.env.get("QUOTAMOB_PUSH_WEBHOOK_SECRET");
  const received = req.headers.get("x-quotamob-hook-secret");
  if (!expected || !received || received !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized webhook" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const publicKey = Deno.env.get("QUOTAMOB_VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("QUOTAMOB_VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("QUOTAMOB_VAPID_SUBJECT") || "https://quotamobv1.vercel.app";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!publicKey || !privateKey || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Push server configuration is incomplete" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const event = body.record || body;
    if (!event.payment_id) throw new Error("Missing payment_id");

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: admins, error: adminError } = await supabase
      .from("motoristas").select("id").eq("role", "admin").eq("ativo", true);
    if (adminError) throw adminError;
    const adminIds = (admins || []).map((item: { id: string }) => item.id);
    if (adminIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "No active administrators" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", adminIds);
    if (subscriptionError) throw subscriptionError;

    webpush.setVapidDetails(subject, publicKey, privateKey);
    const payload = JSON.stringify({
      title: "Novo pagamento recebido",
      body: "Um motorista enviou um comprovativo. Abre o QuotaMob para analisar.",
      url: "/admin/aprovacoes",
      tag: `quotamob-payment-${event.payment_id}`,
    });

    let sent = 0;
    const expired: string[] = [];
    await Promise.all((subscriptions || []).map(async (item: any) => {
      try {
        await webpush.sendNotification({
          endpoint: item.endpoint,
          keys: { p256dh: item.p256dh, auth: item.auth },
        }, payload, { TTL: 60 * 60 });
        sent += 1;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) expired.push(item.id);
        else console.error("Push delivery failed", error?.statusCode || error?.message);
      }
    }));

    if (expired.length) {
      await supabase.from("push_subscriptions").delete().in("id", expired);
    }

    return new Response(JSON.stringify({ sent, expired: expired.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("QuotaMob push webhook error", error);
    return new Response(JSON.stringify({ error: "Push event could not be processed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
