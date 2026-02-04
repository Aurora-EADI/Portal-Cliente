"use client";

import { Layout } from "@/components/layout/Layout";
import { Header } from "@/components/layout/Header";
import { ContainerKanban } from "@/components/pages/armazem/kanban/ContainerKanban";

export default function KanbanPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header pageTitle="Kanban de Containers" />
      <Layout maxWidth="full">
        <ContainerKanban />
      </Layout>
    </div>
  );
}
