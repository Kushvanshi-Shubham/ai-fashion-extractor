/**
 * 🔒 How to Use Sanitization in Your Components
 * 
 * This file shows examples of how to apply input sanitization
 * across different scenarios in the application.
 */

import { sanitizeText, sanitizeCode, sanitizeObject, validateFormData } from '../utils/security/sanitizer';
import { categorySchema, masterAttributeSchema } from '../utils/security/validation';

// ═══════════════════════════════════════════════════════
// EXAMPLE 1: Sanitize Form Input Before Submission
// ═══════════════════════════════════════════════════════

/**
 * In CategoryManager.tsx, DepartmentManager.tsx, etc.
 * Add this to handleModalOk():
 */
const handleModalOkExample = async () => {
  try {
    const values = await form.validateFields();
    
    // ✅ SANITIZE BEFORE SENDING TO API
    const sanitized = {
      ...values,
      code: sanitizeCode(values.code), // Remove special characters
      name: sanitizeText(values.name), // Remove HTML/XSS
      description: values.description ? sanitizeText(values.description) : undefined,
    };
    
    // ✅ VALIDATE WITH ZOD (optional extra layer)
    const validation = validateFormData(categorySchema, sanitized);
    if (!validation.valid) {
      message.error(validation.error);
      return;
    }
    
    // Now send sanitized data to API
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized);
    }
  } catch (error) {
    console.error('Validation failed:', error);
  }
};

// ═══════════════════════════════════════════════════════
// EXAMPLE 2: Sanitize Search Input
// ═══════════════════════════════════════════════════════

/**
 * In any component with search functionality
 */
const handleSearchExample = (value: string) => {
  // ✅ SANITIZE SEARCH QUERY
  const sanitized = sanitizeText(value);
  setParams({ ...params, search: sanitized, page: 1 });
};

// ═══════════════════════════════════════════════════════
// EXAMPLE 3: Sanitize API Response (if untrusted source)
// ═══════════════════════════════════════════════════════

/**
 * If receiving data from external/untrusted APIs
 */
const fetchExternalData = async () => {
  const response = await fetch('https://external-api.com/data');
  const data = await response.json();
  
  // ✅ SANITIZE EXTERNAL DATA
  const sanitized = sanitizeObject(data);
  
  return sanitized;
};

// ═══════════════════════════════════════════════════════
// EXAMPLE 4: Sanitize User-Generated Content Display
// ═══════════════════════════════════════════════════════

/**
 * When displaying user input in UI
 */
import { sanitizeHtml } from '../utils/security/sanitizer';

const UserCommentDisplay = ({ comment }: { comment: string }) => {
  // ✅ SANITIZE HTML BEFORE RENDERING
  const safeHtml = sanitizeHtml(comment);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
  );
};

// ═══════════════════════════════════════════════════════
// EXAMPLE 5: File Upload Sanitization
// ═══════════════════════════════════════════════════════

import { sanitizeFileName, imageFileSchema } from '../utils/security/sanitizer';

const handleFileUploadExample = (file: File) => {
  // ✅ SANITIZE FILENAME
  const safeName = sanitizeFileName(file.name);
  
  // ✅ VALIDATE FILE
  const validation = validateFormData(imageFileSchema, {
    name: safeName,
    size: file.size,
    type: file.type,
  });
  
  if (!validation.valid) {
    message.error(validation.error);
    return;
  }
  
  // Proceed with upload...
};

// ═══════════════════════════════════════════════════════
// EXAMPLE 6: Rate Limiting API Calls
// ═══════════════════════════════════════════════════════

import { RateLimiter } from '../utils/security/sanitizer';

// Create rate limiter: max 10 requests per 60 seconds
const extractionRateLimiter = new RateLimiter(10, 60000);

const handleExtractionExample = async () => {
  // ✅ CHECK RATE LIMIT
  if (!extractionRateLimiter.canMakeRequest()) {
    const remaining = extractionRateLimiter.getRemainingRequests();
    const resetTime = new Date(extractionRateLimiter.getResetTime());
    message.warning(`Rate limit exceeded. ${remaining} requests remaining. Resets at ${resetTime.toLocaleTimeString()}`);
    return;
  }
  
  // Proceed with extraction...
};

// ═══════════════════════════════════════════════════════
// IMPLEMENTATION CHECKLIST
// ═══════════════════════════════════════════════════════

/**
 * ✅ TODO: Apply sanitization to these components:
 * 
 * ADMIN PANEL (High Priority - User Input):
 * - [ ] DepartmentManager.tsx - handleModalOk()
 * - [ ] SubDepartmentManager.tsx - handleModalOk()
 * - [ ] CategoryManager.tsx - handleModalOk()
 * - [ ] AttributeManager.tsx - handleModalOk()
 * - [ ] CategoryAttributeMatrix.tsx - handleToggle()
 * 
 * EXTRACTION PAGE (High Priority - User Input):
 * - [ ] ExtractionPage.tsx - handleFileUpload(), handleCategorySelect()
 * - [ ] CategorySelector.tsx - handleSearch() if any
 * 
 * SEARCH/FILTER (Medium Priority):
 * - [ ] All components with search/filter functionality
 * 
 * API CALLS (Low Priority - Backend already validates):
 * - Backend Zod schemas already handle this
 * - Frontend sanitization is extra security layer
 */

// ═══════════════════════════════════════════════════════
// TESTING SANITIZATION
// ═══════════════════════════════════════════════════════

/**
 * Test with these malicious inputs:
 * 
 * XSS Attempts:
 * - <script>alert('xss')</script>
 * - <img src=x onerror="alert('xss')">
 * - javascript:alert('xss')
 * 
 * SQL Injection Attempts:
 * - '; DROP TABLE users; --
 * - 1' OR '1'='1
 * 
 * Path Traversal:
 * - ../../etc/passwd
 * - ..\..\windows\system32
 * 
 * Expected Result: All should be sanitized/rejected
 */

export {
  handleModalOkExample,
  handleSearchExample,
  fetchExternalData,
  UserCommentDisplay,
  handleFileUploadExample,
  handleExtractionExample,
};
