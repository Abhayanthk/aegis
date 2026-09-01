"use client";

import { ProjectCard, type Project } from "./project-card";
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <motion.div layout className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {projects.length === 0 ? (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            key="empty-state"
            className="col-span-full pt-10"
          >
            <Empty>
              <EmptyMedia variant="icon">
                <FolderOpen className="text-[var(--ds-ink-tertiary)]" />
              </EmptyMedia>
              <EmptyTitle>No projects available</EmptyTitle>
              <EmptyDescription className="mt-1 mb-5">
                We couldn't find any projects matching your criteria.
              </EmptyDescription>
              <Link href="/projects/new">
                <Button size="sm" className="h-8 px-4 text-[12px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0">
                  Create a new project
                </Button>
              </Link>
            </Empty>
          </motion.div>
        ) : (
          projects.map((project) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={project.id}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </motion.div>
  );
}
