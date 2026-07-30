import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import ShareViewClient from "./ShareViewClient";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const project = await prisma.project.findUnique({
    where: { id }
  });

  if (!project || !project.data) {
    notFound();
  }

  const projectData = JSON.parse(project.data);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black p-4 md:p-10 pt-20">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {project.name}
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Read Only</span>
          </h1>
          <p className="text-gray-500 mt-2">Shared CostFlow Project. Last updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
        </header>
        
        <ShareViewClient data={projectData} />
      </div>
    </div>
  );
}
