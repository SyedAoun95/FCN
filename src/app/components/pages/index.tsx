import React from 'react';
// import Layout from '../components/Layout';
import Layout from "../Layout";
import MetricsCards from '../MetricsCards';
import SearchSection from "../SearchSection";
import DataTable from "../DataTable";

const Dashboard: React.FC = () => {
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Implement your search logic here
  };

  return (
    <Layout>
      <MetricsCards />
      <SearchSection onSearch={handleSearch} />
      <DataTable />
    </Layout>
  );
};

export default Dashboard;