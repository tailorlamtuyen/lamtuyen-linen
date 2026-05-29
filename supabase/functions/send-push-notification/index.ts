import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUB = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRI = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const SURL = Deno.env.get("SUPABASE_URL") ?? "";
const SROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SHOP_EMAIL = "tailorlamtuyen@gmail.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json();
    const order = body.record || body;
    if (!VAPID_PUB || !VAPID_PRI) {
      return new Response(JSON.stringify({ sent: 0, reason: "no-vapid" }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }
    webpush.setVapidDetails("mailto:" + SHOP_EMAIL, VAPID_PUB, VAPID_PRI);
    const sb = createClient(SURL, SROLE);
    const [{ data: subs }, { count: newCount }] = await Promise.all([
      sb.from("push_subscriptions").select("subscription").eq("email", SHOP_EMAIL),
      sb.from("orders").select("*", { count: "exact", head: true }).eq("status", "new"),
    ]);
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no-subs" }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }
    const payload = JSON.stringify({
      title: "New Order — Lam Tuyen 🧵",
      body: String(order.name || "A customer") + " ordered " + String(order.garment || "a garment"),
      count: newCount ?? 1,
    });
    let sent = 0;
    for (const row of subs) {
      try {
        const sub = typeof row.subscription === "string"
          ? JSON.parse(row.subscription) : row.subscription;
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err: any) {
        console.warn("Push failed:", err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await sb.from("push_subscriptions").delete().eq("email", SHOP_EMAIL);
        }
      }
    }
    return new Response(JSON.stringify({ sent }), {
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
});
