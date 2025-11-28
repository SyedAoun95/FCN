import React from 'react';

interface TableRow {
  id: number;
  header: string;
  sectionType: string;
  status: 'Done' | 'in Process' | 'Assign reviewer';
  target: number;
  limit: number;
  reviewer: string;
}

const DataTable: React.FC = () => {
  const tableData: TableRow[] = [
    {
      id: 1,
      header: 'Cover page',
      sectionType: 'Cover page',
      status: 'in Process',
      target: 18,
      limit: 5,
      reviewer: 'Eddie Lake'
    },
    {
      id: 2,
      header: 'Table of contents',
      sectionType: 'Table of contents',
      status: 'Done',
      target: 29,
      limit: 24,
      reviewer: 'Eddie Lake'
    },
    {
      id: 3,
      header: 'Executive summary',
      sectionType: 'Narrative',
      status: 'Done',
      target: 10,
      limit: 13,
      reviewer: 'Eddie Lake'
    },
    {
      id: 4,
      header: 'Technical approach',
      sectionType: 'Narrative',
      status: 'Done',
      target: 27,
      limit: 23,
      reviewer: 'Jamie Tashpulatov'
    },
    {
      id: 5,
      header: 'Design',
      sectionType: 'Narrative',
      status: 'in Process',
      target: 2,
      limit: 16,
      reviewer: 'Jamie Tashpulatov'
    },
    {
      id: 6,
      header: 'Capabilities',
      sectionType: 'Narrative',
      status: 'in Process',
      target: 20,
      limit: 8,
      reviewer: 'Jamie Tashpulatov'
    },
    {
      id: 7,
      header: 'Integration with existing systems',
      sectionType: 'Narrative',
      status: 'in Process',
      target: 19,
      limit: 21,
      reviewer: 'Jamie Tashpulatov'
    },
    {
      id: 8,
      header: 'Innovation and Advantages',
      sectionType: 'Narrative',
      status: 'Assign reviewer',
      target: 25,
      limit: 26,
      reviewer: 'Assign reviewer'
    },
    {
      id: 9,
      header: 'Overview of EMR\'s innovative Solutions',
      sectionType: 'Technical content',
      status: 'Done',
      target: 7,
      limit: 23,
      reviewer: 'Assign reviewer'
    }
  ];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800';
      case 'in Process':
        return 'bg-yellow-100 text-yellow-800';
      case 'Assign reviewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Records Management</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Header
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Section Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reviewer
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.header}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.sectionType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.target}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.limit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.reviewer}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;