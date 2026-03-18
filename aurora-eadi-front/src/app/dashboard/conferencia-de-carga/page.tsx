"use client";

import { Header } from "@/components/layout/Header";
import { Layout } from "@/components/layout/Layout";
import { ConferenciaCargaKanban } from "@/components/pages/dashboard/conferencia-carga/ConferenciaCargaKanban";

export default function ConferenciaDeCargaPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header pageTitle="Conferencia de Carga" />
      <Layout maxWidth="full">
        <ConferenciaCargaKanban />
      </Layout>
    </div>
  );
}
