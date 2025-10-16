/**
 * 🎯 Hierarchy Stats Component
 * Displays dashboard statistics
 */

import type { DashboardStats } from '../../../services/adminApi';

interface HierarchyStatsProps {
  stats?: DashboardStats;
  loading: boolean;
}

export const HierarchyStats = ({ stats, loading }: HierarchyStatsProps) => {
  const statCards = [
    {
      label: 'Departments',
      value: stats?.departments || 0,
      icon: '🏢',
      color: 'blue',
    },
    {
      label: 'Sub-Departments',
      value: stats?.subDepartments || 0,
      icon: '📁',
      color: 'purple',
    },
    {
      label: 'Categories',
      value: stats?.categories || 0,
      icon: '🏷️',
      color: 'green',
    },
    {
      label: 'Master Attributes',
      value: stats?.masterAttributes || 0,
      icon: '🎨',
      color: 'orange',
    },
    {
      label: 'Allowed Values',
      value: stats?.allowedValues || 0,
      icon: '✨',
      color: 'pink',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    pink: 'bg-pink-50 text-pink-600',
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{stat.label}</span>
            <span className={`text-2xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
              {stat.icon}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};
