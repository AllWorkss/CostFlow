import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const versions = await prisma.projectVersion.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(versions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const project = await prisma.project.findUnique({
      where: { id: params.id }
    });
    
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await request.json();

    const version = await prisma.projectVersion.create({
      data: {
        name: body.name || `Snapshot ${new Date().toLocaleString()}`,
        data: project.data, // Save current state of project as a snapshot
        projectId: params.id,
      }
    });

    return NextResponse.json(version);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 });
  }
}
