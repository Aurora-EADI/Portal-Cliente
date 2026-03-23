'use client'

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { ReceptionLandingPage } from '@/components/pages/reception/ReceptionLandingPage';

export default function ReceptionMainPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />
            <Layout>
                <div className="p-8">
                    <ReceptionLandingPage />
                </div>
            </Layout>
        </div>
    );
}
