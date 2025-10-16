/**
 * 🎯 Hierarchy Tree Component
 * Displays the complete fashion hierarchy tree
 */

import { useState } from 'react';
import type { Department } from '../../../services/adminApi';

interface HierarchyTreeProps {
  hierarchy?: Department[];
  loading: boolean;
}

export const HierarchyTree = ({ hierarchy, loading }: HierarchyTreeProps) => {
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());
  const [expandedSubDepts, setExpandedSubDepts] = useState<Set<number>>(new Set());

  const toggleDepartment = (id: number) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDepts(newExpanded);
  };

  const toggleSubDepartment = (id: number) => {
    const newExpanded = new Set(expandedSubDepts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSubDepts(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!hierarchy || hierarchy.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No hierarchy data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      {hierarchy.map((dept) => (
        <div key={dept.id} className="border border-gray-200 rounded-lg">
          {/* Department */}
          <button
            onClick={() => toggleDepartment(dept.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {expandedDepts.has(dept.id) ? '📂' : '📁'}
              </span>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{dept.name}</p>
                <p className="text-sm text-gray-500">{dept.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {dept.subDepartments?.length || 0} sub-depts
              </span>
              <span className={`transform transition-transform ${expandedDepts.has(dept.id) ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </button>

          {/* Sub-Departments */}
          {expandedDepts.has(dept.id) && dept.subDepartments && (
            <div className="border-t border-gray-200 bg-gray-50 p-2">
              {dept.subDepartments.map((subDept) => (
                <div key={subDept.id} className="mb-2 bg-white rounded-lg border border-gray-200">
                  {/* Sub-Department */}
                  <button
                    onClick={() => toggleSubDepartment(subDept.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="ml-6">
                        {expandedSubDepts.has(subDept.id) ? '📂' : '📁'}
                      </span>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{subDept.name}</p>
                        <p className="text-xs text-gray-500">{subDept.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">
                        {subDept.categories?.length || 0} categories
                      </span>
                      <span className={`transform transition-transform text-sm ${expandedSubDepts.has(subDept.id) ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Categories */}
                  {expandedSubDepts.has(subDept.id) && subDept.categories && (
                    <div className="border-t border-gray-200 bg-gray-50 p-2 max-h-[300px] overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {subDept.categories.map((category) => (
                          <div
                            key={category.id}
                            className="bg-white p-3 rounded border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-sm">🏷️</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {category.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{category.code}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
