import { useState, useCallback, useEffect } from 'react';
import type { CategoryConfig } from '../../types/category/CategoryTypes';
import { CategoryHelper } from '../../utils/category/categoryHelpers';
import { logger } from '../../utils/common/logger';

// Hook state interface
interface CategorySelectorState {
  selectedCategory: CategoryConfig | null;
  selectedDepartment: string | null;
  selectedSubDepartment: string | null;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  selectionHistory: CategoryConfig[];
}

// Hook return interface
interface UseCategorySelectorReturn {
  // State
  selectedCategory: CategoryConfig | null;
  selectedDepartment: string | null;
  selectedSubDepartment: string | null;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  selectionHistory: CategoryConfig[];
  
  // Derived data
  departments: string[];
  subDepartments: string[];
  availableCategories: CategoryConfig[];
  
  // Actions
  handleCategorySelect: (category: CategoryConfig | null) => void;
  handleDepartmentChange: (department: string) => void;
  handleSubDepartmentChange: (subDept: string) => void;
  resetSelection: () => void;
  goToPreviousCategory: () => void;
  validateCategory: (categoryCode: string) => boolean;
  
  // Utilities
  getCategoryPath: () => string[];
  isValidSelection: () => boolean;
}

export const useCategorySelector = (): UseCategorySelectorReturn => {
  // Initialize state
  const [state, setState] = useState<CategorySelectorState>({
    selectedCategory: null,
    selectedDepartment: null,
    selectedSubDepartment: null,
    isComplete: false,
    isLoading: false,
    error: null,
    selectionHistory: []
  });

  // ✅ Use your existing CategoryHelper methods
  const departments = CategoryHelper.getDepartments();

  const subDepartments = state.selectedDepartment 
    ? CategoryHelper.getSubDepartments(state.selectedDepartment)
    : [];

  // ✅ FIX: Use your existing getCategories method
  const availableCategories = (state.selectedDepartment && state.selectedSubDepartment)
    ? CategoryHelper.getCategories(state.selectedDepartment, state.selectedSubDepartment)
    : [];

  // ✅ Handle department change
  const handleDepartmentChange = useCallback((department: string): void => {
    logger.debug('Department changed', { department });
    
    setState(prevState => ({
      ...prevState,
      selectedDepartment: department,
      selectedSubDepartment: null,
      selectedCategory: null,
      isComplete: false,
      error: null
    }));
  }, []);

  // ✅ Handle sub-department change
  const handleSubDepartmentChange = useCallback((subDept: string): void => {
    logger.debug('Sub-department changed', { subDept });
    
    setState(prevState => ({
      ...prevState,
      selectedSubDepartment: subDept,
      selectedCategory: null,
      isComplete: false,
      error: null
    }));
  }, []);

  // ✅ Handle category selection
  const handleCategorySelect = useCallback((category: CategoryConfig | null): void => {
    logger.debug('Category selection requested', { 
      categoryCode: category?.category,
      displayName: category?.displayName 
    });

    setState(prevState => {
      if (category === null) {
        logger.info('Category selection reset');
        return {
          selectedCategory: null,
          selectedDepartment: null,
          selectedSubDepartment: null,
          isComplete: false,
          isLoading: false,
          error: null,
          selectionHistory: []
        };
      }

      // Validate category
      const isValid = CategoryHelper.getCategoryConfig(category.category);
      if (!isValid) {
        logger.error('Invalid category selected', { category: category.category });
        return {
          ...prevState,
          error: `Invalid category: ${category.category}`,
          isLoading: false
        };
      }

      // Update history (keep last 5 selections)
      const newHistory = [
        category,
        ...prevState.selectionHistory.filter(c => c.category !== category.category)
      ].slice(0, 5);

      logger.info('Category selected successfully', {
        category: category.category,
        displayName: category.displayName,
        department: category.department
      });

      return {
        ...prevState,
        selectedCategory: category,
        selectedDepartment: category.department,
        selectedSubDepartment: category.subDepartment,
        isComplete: true,
        isLoading: false,
        error: null,
        selectionHistory: newHistory
      };
    });
  }, []);

  // ✅ Reset selection completely
  const resetSelection = useCallback((): void => {
    logger.info('Resetting category selection');
    setState({
      selectedCategory: null,
      selectedDepartment: null,
      selectedSubDepartment: null,
      isComplete: false,
      isLoading: false,
      error: null,
      selectionHistory: []
    });
  }, []);

  // ✅ Go back to previous category
  const goToPreviousCategory = useCallback((): void => {
    setState(prevState => {
      if (prevState.selectionHistory.length === 0) {
        logger.warn('No previous category to go back to');
        return prevState;
      }

      const [, ...remainingHistory] = prevState.selectionHistory;
      const previousCategory = remainingHistory[0] || null;

      logger.info('Going back to previous category', {
        previousCategory: previousCategory?.category
      });

      return {
        ...prevState,
        selectedCategory: previousCategory,
        selectedDepartment: previousCategory?.department || null,
        selectedSubDepartment: previousCategory?.subDepartment || null,
        isComplete: !!previousCategory,
        selectionHistory: remainingHistory,
        error: null
      };
    });
  }, []);

  // ✅ Validate category code
  const validateCategory = useCallback((categoryCode: string): boolean => {
    try {
      const category = CategoryHelper.getCategoryConfig(categoryCode);
      return !!category;
    } catch (error) {
      logger.error('Category validation failed', { categoryCode, error });
      return false;
    }
  }, []);

  // ✅ Get category breadcrumb path
  const getCategoryPath = useCallback((): string[] => {
    if (!state.selectedCategory) return [];

    const category = state.selectedCategory;
    const path: string[] = [];

    if (category.department) {
      path.push(category.department);
    }

    if (category.subDepartment) {
      path.push(category.subDepartment);
    }

    path.push(category.displayName);

    return path;
  }, [state.selectedCategory]);

  // ✅ Check if current selection is valid
  const isValidSelection = useCallback((): boolean => {
    return !!(state.selectedCategory && state.isComplete && !state.error);
  }, [state.selectedCategory, state.isComplete, state.error]);

  // ✅ Handle errors and cleanup
  useEffect(() => {
    if (state.error) {
      logger.error('Category selector error', { error: state.error });
      
      const timer = setTimeout(() => {
        setState(prevState => ({
          ...prevState,
          error: null
        }));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.error]);

  return {
    // State
    selectedCategory: state.selectedCategory,
    selectedDepartment: state.selectedDepartment,
    selectedSubDepartment: state.selectedSubDepartment,
    isComplete: state.isComplete,
    isLoading: state.isLoading,
    error: state.error,
    selectionHistory: state.selectionHistory,
    
    // Derived data
    departments,
    subDepartments,
    availableCategories,
    
    // Actions
    handleCategorySelect,
    handleDepartmentChange,
    handleSubDepartmentChange,
    resetSelection,
    goToPreviousCategory,
    validateCategory,
    
    // Utilities
    getCategoryPath,
    isValidSelection
  };
};
