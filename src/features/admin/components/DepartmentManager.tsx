/**
 * 🎯 Department Manager Component
 * CRUD operations for departments
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type Department,
} from '../../../services/adminApi';

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

export const DepartmentManager = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({});

  // Fetch departments
  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', true],
    queryFn: () => getDepartments(true),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-stats'] });
      setIsCreating(false);
      setFormData({});
      alert('✅ Department created successfully!');
    },
    onError: (error: ApiErrorResponse) => {
      alert(`❌ Failed to create: ${error.response?.data?.error || error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Department> }) =>
      updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setEditingId(null);
      setFormData({});
      alert('✅ Department updated successfully!');
    },
    onError: (error: ApiErrorResponse) => {
      alert(`❌ Failed to update: ${error.response?.data?.error || error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-stats'] });
      alert('✅ Department deleted successfully!');
    },
    onError: (error: ApiErrorResponse) => {
      alert(`❌ Failed to delete: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will also delete all sub-departments and categories under it.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🏢 Departments</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Department
          </button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-gray-900 mb-4">Create New Department</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Code (e.g., MENS)"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                placeholder="Name (e.g., Men's Fashion)"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Display Order"
                value={formData.displayOrder || 0}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setIsCreating(false); setFormData({}); }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {/* Departments List */}
        <div className="space-y-3">
          {departments?.map((dept) => (
            <div key={dept.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {editingId === dept.id ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label htmlFor={`code-${dept.id}`} className="sr-only">Department code</label>
                    <input
                      id={`code-${dept.id}`}
                      type="text"
                      placeholder="Code (e.g., MENS)"
                      title="Department code"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                    <label htmlFor={`name-${dept.id}`} className="sr-only">Department name</label>
                    <input
                      id={`name-${dept.id}`}
                      type="text"
                      placeholder="Name (e.g., Men's Fashion)"
                      title="Department name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                    <label htmlFor={`desc-${dept.id}`} className="sr-only">Description</label>
                    <input
                      id={`desc-${dept.id}`}
                      type="text"
                      placeholder="Description (optional)"
                      title="Department description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <label htmlFor={`order-${dept.id}`} className="sr-only">Display order</label>
                    <input
                      id={`order-${dept.id}`}
                      type="number"
                      placeholder="Display Order"
                      title="Display order"
                      value={formData.displayOrder || 0}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setFormData({}); }}
                      className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{dept.name}</h3>
                      <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                        {dept.code}
                      </span>
                      {!dept.isActive && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Inactive</span>
                      )}
                    </div>
                    {dept.description && (
                      <p className="text-sm text-gray-600 mb-2">{dept.description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {dept.subDepartments?.length || 0} sub-departments
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(dept.id);
                        setFormData(dept);
                      }}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
