export const dynamic = "force-dynamic";

export async function POST() {
  return new Response("Stripe webhook disabled", { status: 200 });
}
