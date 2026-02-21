import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

// GET /api/sectors/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const sector = await prisma.sector.findUnique({
    where: { id: params.id },
    include: {
      sources: true,
      briefings: { orderBy: { generatedAt: "desc" }, take: 5 },
      _count: { select: { articles: true } },
    },
  });

  if (!sector) {
    return NextResponse.json({ error: "Sector not found" }, { status: 404 });
  }

  return NextResponse.json(sector);
}

// PUT /api/sectors/:id
export async function PUT(req: NextRequest, { params }: Params) {
  const body = await req.json();

  const sector = await prisma.sector.update({
    where: { id: params.id },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.summary !== undefined && { summary: body.summary }),
      ...(body.since !== undefined && { since: new Date(body.since) }),
      ...(body.deptTags !== undefined && { deptTags: body.deptTags }),
      ...(body.searchQueriesKR !== undefined && {
        searchQueriesKR: body.searchQueriesKR,
      }),
      ...(body.searchQueriesUS !== undefined && {
        searchQueriesUS: body.searchQueriesUS,
      }),
      ...(body.classifyKeywords !== undefined && {
        classifyKeywords: body.classifyKeywords,
      }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });

  return NextResponse.json(sector);
}

// DELETE /api/sectors/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  await prisma.sector.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
