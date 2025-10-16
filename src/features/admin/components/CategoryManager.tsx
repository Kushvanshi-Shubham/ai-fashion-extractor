/**
 * 🎯 Category Manager Component
 * Browse and search categories with pagination
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories, type GetCategoriesParams } from '../../../services/adminApi';

export const CategoryManager = () => {
  const [params, setParams] = useState<GetCategoriesParams>({
    page: 1,
    limit: 20,
    search: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['categories', params],
    queryFn: () => getCategories(params),
  });

  const handleSearch = (search: string) => {
    setParams({ ...params, search, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setParams({ ...params, page });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Categories</h2>
        
        {/* Search */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search categories..."
            value={params.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {data?.data.map((category) => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{category.code}</p>
                  </div>
                  {!category.isActive && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                {category.subDepartment && (
                  <p className="text-sm text-gray-600">
                    {category.subDepartment.department?.name} → {category.subDepartment.name}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(data.pagination.page - 1) * data.pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                </span>{' '}
                of <span className="font-medium">{data.pagination.total}</span> results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(params.page! - 1)}
                  disabled={params.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(params.page! + 1)}
                  disabled={params.page === data.pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
