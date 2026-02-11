import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "elite-care-funerals" },
    update: {},
    create: {
      name: "Elite Care Funerals",
      slug: "elite-care-funerals",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "director@elitecare.com.au" },
    update: {},
    create: {
      email: "director@elitecare.com.au",
      name: "Director Smith",
      role: "director",
      organizationId: org.id,
    },
  });

  const case1 = await prisma.case.upsert({
    where: { caseNumber: "FF-2024-00892" },
    update: {},
    create: {
      caseNumber: "FF-2024-00892",
      status: "Draft",
      deceasedFullName: "Johnathan Doe",
      deceasedDod: new Date("2024-01-15"),
      deceasedGender: "Male",
      nextOfKinName: "Jane Doe",
      nextOfKinRelationship: "Spouse",
      nextOfKinPhone: "+61 400 111 222",
      nextOfKinEmail: "jane.doe@email.com",
      serviceType: "burial",
      serviceStyle: "religious",
      venuePreference: "chapel",
      expectedAttendeesMin: 50,
      expectedAttendeesMax: 100,
      budgetMin: 450000,
      budgetMax: 700000,
      budgetPreference: "balanced",
      suburb: "Sydney",
      state: "NSW",
      preferredServiceDate: new Date("2024-02-20"),
      dateFlexibility: "+/-2 days",
      culturalFaithRequirements: "Christian Tradition",
      notes: "Family prefers traditional values and floral tributes.",
      addOns: JSON.stringify({ invitations: true, flowers: true }),
      organizationId: org.id,
      createdById: user.id,
    },
  });

  const case2 = await prisma.case.upsert({
    where: { caseNumber: "FF-9201-A" },
    update: {},
    create: {
      caseNumber: "FF-9201-A",
      status: "Quoted",
      deceasedFullName: "Arthur J. Henderson",
      deceasedDob: new Date("1945-12-05"),
      deceasedDod: new Date("2024-02-01"),
      deceasedGender: "Male",
      nextOfKinName: "Sarah Henderson",
      nextOfKinRelationship: "Daughter",
      nextOfKinPhone: "+61 555 012 345",
      nextOfKinEmail: "sarah.henderson@email.com",
      serviceType: "burial",
      serviceStyle: "religious",
      venuePreference: "chapel",
      expectedAttendeesMin: 30,
      expectedAttendeesMax: 80,
      budgetMin: 500000,
      budgetMax: 800000,
      budgetPreference: "balanced",
      suburb: "Melbourne",
      state: "VIC",
      preferredServiceDate: new Date("2024-02-28"),
      dateFlexibility: "fixed",
      notes: "Traditional with visitation, premium floral tribute requested.",
      organizationId: org.id,
      createdById: user.id,
    },
  });

  for (const c of [case1, case2]) {
    const packages = await prisma.package.findMany({ where: { caseId: c.id } });
    if (packages.length === 0) {
      const p1 = await prisma.package.create({
        data: {
          caseId: c.id,
          tier: "Essential",
          name: "Essential Tier",
          description: "Essential professional services",
          totalCents: 425000,
          inclusions: JSON.stringify([
            "Professional services of staff",
            "Transfer of remains (25mi)",
          ]),
          assumptions: JSON.stringify({ attendeeCount: 50, venueTier: "standard" }),
          isRecommended: false,
          sortOrder: 0,
        },
      });
      await prisma.quoteLineItem.createMany({
        data: [
          { packageId: p1.id, description: "Professional services", amountCents: 240000, category: "service" },
          { packageId: p1.id, description: "Transfer", amountCents: 185000, category: "service" },
        ],
      });
      const p2 = await prisma.package.create({
        data: {
          caseId: c.id,
          tier: "Standard",
          name: "Standard Tier",
          description: "Traditional with visitation",
          totalCents: 680000,
          inclusions: JSON.stringify([
            "Includes all Essential services",
            "Full public visitation (1 day)",
            "20-gauge steel casket included",
            "AI Suggested Floral Tribute",
          ]),
          assumptions: JSON.stringify({ attendeeCount: 60, venueTier: "standard", flowers: true }),
          isRecommended: true,
          sortOrder: 1,
        },
      });
      await prisma.quoteLineItem.createMany({
        data: [
          { packageId: p2.id, description: "Service Fee", amountCents: 240000, category: "service" },
          { packageId: p2.id, description: "Embalming & Prep", amountCents: 110000, category: "service" },
          { packageId: p2.id, description: "Casket", amountCents: 230000, category: "merchandise" },
          { packageId: p2.id, description: "Floral tribute", amountCents: 100000, category: "merchandise" },
        ],
      });
      const p3 = await prisma.package.create({
        data: {
          caseId: c.id,
          tier: "Premium",
          name: "Premium Tier",
          description: "Full commemorative suite",
          totalCents: 940000,
          inclusions: JSON.stringify([
            "Includes all Standard services",
            "Limousine & lead car escort",
            "Solid hardwood casket choice",
            "Premium memorial stationery",
          ]),
          assumptions: JSON.stringify({ attendeeCount: 80, venueTier: "premium" }),
          isRecommended: false,
          sortOrder: 2,
        },
      });
      await prisma.quoteLineItem.createMany({
        data: [
          { packageId: p3.id, description: "Professional services", amountCents: 350000, category: "service" },
          { packageId: p3.id, description: "Premium casket", amountCents: 450000, category: "merchandise" },
          { packageId: p3.id, description: "Transport & escort", amountCents: 140000, category: "service" },
        ],
      });
    }
  }

  const templates = [
    { name: "Modern Slate", slug: "modern-slate", thumbnailUrl: "", designConfig: "{}" },
    { name: "Heritage Gold", slug: "heritage-gold", thumbnailUrl: "", designConfig: "{}" },
    { name: "Serene White", slug: "serene-white", thumbnailUrl: "", designConfig: "{}" },
  ];
  for (const t of templates) {
    await prisma.invitationTemplate.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }

  console.log("Seed complete: org", org.slug, "user", user.email, "cases", case1.caseNumber, case2.caseNumber);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
