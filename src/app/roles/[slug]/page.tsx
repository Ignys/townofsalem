import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getRoleById, ROLE_DEFINITIONS } from "@/data/roles";
import { RoleDetails } from "@/features/roles/role-details";

export function generateStaticParams() {
  return ROLE_DEFINITIONS.map((role) => ({ slug: role.id }));
}

export async function generateMetadata(
  props: PageProps<"/roles/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const role = getRoleById(slug);

  return role
    ? {
        title: `${role.name} | Enciclopédia de roles`,
        description: role.description,
      }
    : { title: "Role não encontrada" };
}

export default async function RolePage(props: PageProps<"/roles/[slug]">) {
  const { slug } = await props.params;
  const role = getRoleById(slug);

  if (!role) {
    notFound();
  }

  return (
    <main className="min-h-svh bg-[#111315] px-5 py-8 text-[#f8f1e5] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/roles"
          className="mb-7 inline-block text-sm font-semibold text-[#d3b88c] hover:text-[#e6cfa9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d3b88c]"
        >
          ← Todas as roles
        </Link>
        <RoleDetails role={role} />
      </div>
    </main>
  );
}
