/**
 * 🎯 Attribute Manager Component
 * Browse master attributes and their allowed values
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMasterAttributes } from '../../../services/adminApi';

export const AttributeManager = () => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: attributes, isLoading } = useQuery({
    queryKey: ['master-attributes', true],
    queryFn: () => getMasterAttributes(true),
  });

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      TEXT: 'bg-blue-100 text-blue-700',
      SELECT: 'bg-green-100 text-green-700',
      NUMBER: 'bg-purple-100 text-purple-700',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">🎨 Master Attributes</h2>
        <p className="text-sm text-gray-500">
          {attributes?.length || 0} attributes with {attributes?.reduce((sum, attr) => sum + (attr.allowedValues?.length || 0), 0)} allowed values
        </p>
      </div>

      <div className="space-y-3">
        {attributes?.map((attr) => (
          <div key={attr.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(attr.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(attr.type)}`}>
                  {attr.type}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{attr.label}</p>
                  <p className="text-sm text-gray-500 font-mono">{attr.key}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {attr.allowedValues?.length || 0} values
                </span>
                <span className={`transform transition-transform ${expandedIds.has(attr.id) ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </button>

            {expandedIds.has(attr.id) && attr.allowedValues && attr.allowedValues.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Allowed Values:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                  {attr.allowedValues.map((value) => (
                    <div
                      key={value.id}
                      className="bg-white p-2 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{value.fullForm}</p>
                      <p className="text-xs text-gray-500 font-mono">{value.shortForm}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
