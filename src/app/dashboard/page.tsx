
"use client";
import React from 'react';
import Layout from '../components/Layout';
import MetricsCards from '../components/MetricsCards';
import SearchSection from '../components/SearchSection';
import DataTable from '../components/DataTable';

const DashboardPage: React.FC = () => {
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  return (
    <Layout>
      <MetricsCards />
      <SearchSection onSearch={handleSearch} />
      <DataTable />
    </Layout>
  );
};

export default DashboardPage;