import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function userName(data: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
}) {
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  return fullName || data.username || "Clerk user";
}

function primaryEmail(data: {
  email_addresses?: Array<{ id?: string | null; email_address?: string | null }>;
  primary_email_address_id?: string | null;
}) {
  const primary = data.email_addresses?.find(
    (email) => email.id === data.primary_email_address_id
  );
  return primary?.email_address || data.email_addresses?.[0]?.email_address;
}

export async function POST(request: NextRequest) {
  const evt = await verifyWebhook(request);

  if (evt.type === "user.created") {
    const email = primaryEmail(evt.data);

    if (!email) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { clerkId: evt.data.id },
      update: {
        email: email.toLowerCase(),
        name: userName(evt.data),
      },
      create: {
        clerkId: evt.data.id,
        email: email.toLowerCase(),
        name: userName(evt.data),
      },
    });
  }

  if (evt.type === "organization.created") {
    const ownerClerkId = evt.data.created_by;

    if (!ownerClerkId) {
      return NextResponse.json({ error: "Organization creator is required" }, { status: 400 });
    }

    const owner = await prisma.user.findUnique({
      where: { clerkId: ownerClerkId },
    });

    if (!owner) {
      return NextResponse.json({ error: "Organization owner not synced" }, { status: 409 });
    }

    await prisma.team.upsert({
      where: { clerkId: evt.data.id },
      update: {
        name: evt.data.name,
        ownerId: owner.id,
      },
      create: {
        clerkId: evt.data.id,
        name: evt.data.name,
        ownerId: owner.id,
      },
    });
  }

  return NextResponse.json({ received: true });
}
