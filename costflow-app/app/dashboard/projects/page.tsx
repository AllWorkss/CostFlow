"use client";

import { useEffect, useState } from "react";
import { Plus, Folder, FileText, Copy, Trash2, Clock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Project = {
  id: string;
  name: string;
  description: string | null;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ProjectsDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Cost Sheet", description: "" }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard?projectId=${data.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      fetchProjects();
    } catch (e) {
      console.error(e);
    }
  };

  const duplicateProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // First fetch the full project to get the data
      const fullRes = await fetch(`/api/projects/${project.id}`);
      const fullProject = await fullRes.json();

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${project.name} (Copy)`,
          description: project.description,
          data: fullProject.data,
        }),
      });
      if (res.ok) fetchProjects();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black p-6 md:p-10 pt-24">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Workspace</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your cost sheets, templates, and versions.</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard/compare")}
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 font-medium"
            >
              <Copy className="w-4 h-4" /> Compare
            </button>
            <button
              onClick={createProject}
              className="px-4 py-2 bg-[var(--cf-blue)] text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => router.push(`/dashboard?projectId=${project.id}`)}
                className="group relative bg-white dark:bg-zinc-900/50 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-[var(--cf-blue)] dark:hover:border-[var(--cf-blue)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-40"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2 text-gray-900 dark:text-white font-medium">
                    {project.isTemplate ? <Folder className="w-4 h-4 text-orange-500" /> : <FileText className="w-4 h-4 text-[var(--cf-blue)]" />}
                    <h3 className="truncate">{project.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {project.description || "No description"}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button onClick={(e) => duplicateProject(project, e)} className="p-1.5 text-gray-400 hover:text-[var(--cf-blue)] bg-gray-50 dark:bg-zinc-800 rounded-md">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => deleteProject(project.id, e)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-zinc-800 rounded-md">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first cost sheet to get started.</p>
                <button onClick={createProject} className="px-6 py-2 bg-[var(--cf-blue)] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Create Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
