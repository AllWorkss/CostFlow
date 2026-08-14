import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Helper to get mock user workspace (since we skipped Phase 3 Auth)
async function getDefaultWorkspaceId() {
  const user = await prisma.user.findUnique({ where: { email: 'mock@example.com' } });
  if (!user) throw new Error("Mock user not found");
  const member = await prisma.teamMember.findFirst({ where: { userId: user.id } });
  if (!member) throw new Error("Mock workspace not found");
  return member.workspaceId;
}

export async function GET() {
  try {
    const workspaceId = await getDefaultWorkspaceId();
    const projects = await prisma.project.findMany({
      where: { workspaceId, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        isTemplate: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getDefaultWorkspaceId();
    const body = await request.json();
    
    // Default empty costflow state
    const defaultData = JSON.stringify({
      domain: 'MANUFACTURING',
      blocks: [
        { id: '1', type: 'INPUT', name: 'Raw Material', value: 0, formula: '', order: 0 },
        { id: '2', type: 'CALC', name: 'Total Cost', value: 0, formula: 'B1', order: 1 }
      ]
    });

    const project = await prisma.project.create({
      data: {
        name: body.name || 'New Project',
        description: body.description || '',
        data: body.data || defaultData,
        workspaceId,
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
