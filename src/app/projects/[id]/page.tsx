import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Play, Tag, Briefcase } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProjectGallery } from "@/components/ProjectGallery";
import { formatPrice } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

async function getProject(id: string) {
  return prisma.website.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      longDescription: true,
      thumbnail: true,
      galleryImages: true,
      liveUrl: true,
      demoUrl: true,
      isForSale: true,
      oldPrice: true,
      newPrice: true,
      tags: true,
      featured: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return { title: "Project not found | nexus265" };
  return {
    title: `${project.title} | nexus265`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: project.thumbnail ? [project.thumbnail] : [],
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const gallery = Array.from(new Set([project.thumbnail, ...(project.galleryImages || [])].filter(Boolean)));

  return (
    <main className="min-h-screen">
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0">
          <Image src={project.thumbnail} alt="" fill priority sizes="100vw" className="object-cover opacity-20 blur-2xl scale-110" />
          <div className="absolute inset-0 bg-background/80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to projects
          </Link>
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 items-center">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.featured && <span className="rounded-full bg-primary/20 text-indigo-300 px-3 py-1 text-xs font-semibold">Featured</span>}
                {project.isForSale && <span className="rounded-full bg-accent/20 text-cyan-300 px-3 py-1 text-xs font-semibold">For Sale</span>}
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold leading-tight">{project.title}</h1>
              <p className="mt-5 text-muted text-base md:text-lg leading-relaxed">{project.description}</p>
              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {project.tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-xs text-muted"><Tag className="w-3 h-3" />{tag}</span>)}
                </div>
              )}
              {project.isForSale && project.newPrice != null && (
                <div className="flex items-baseline gap-3 mt-6">
                  {project.oldPrice != null && <span className="line-through text-muted">{formatPrice(project.oldPrice)}</span>}
                  <span className="text-2xl font-bold text-accent">{formatPrice(project.newPrice)}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-3 mt-8">
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex"><ExternalLink className="w-4 h-4" /> Visit Project</a>
                {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn-outline inline-flex"><Play className="w-4 h-4" /> View Demo</a>}
                {project.isForSale && <Link href="/contact#hire" className="btn-accent inline-flex"><Briefcase className="w-4 h-4" /> Enquire about this project</Link>}
              </div>
            </div>
            <div className="relative aspect-[16/11] rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
              <Image src={project.thumbnail} alt={project.title} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-14">
        {project.longDescription && (
          <section className="max-w-4xl">
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold mb-4">About this project</h2>
            <div className="text-muted leading-8 whitespace-pre-line">{project.longDescription}</div>
          </section>
        )}
        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold">Project gallery</h2>
              <p className="text-sm text-muted mt-2">Explore screenshots and views from {project.title}.</p>
            </div>
            <span className="text-xs text-muted">{gallery.length} image{gallery.length === 1 ? "" : "s"}</span>
          </div>
          <ProjectGallery images={gallery} title={project.title} />
        </section>
      </div>
    </main>
  );
}
