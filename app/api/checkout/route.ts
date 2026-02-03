export const dynamic = "force-dynamic";

export async function POST() {
  return new Response("Stripe disabled", { status: 200 });
}
