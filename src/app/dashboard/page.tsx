"use client";

import React from "react";
import MetricsCards from "../components/MetricsCards";
import SearchSection from "../components/SearchSection";
import DataTable from "../components/DataTable";

const DashboardPage: React.FC = () => {
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  return (
    <>
      <MetricsCards />
      <SearchSection onSearch={handleSearch} />
      <DataTable />
    </>
  );
};

export default DashboardPage;
