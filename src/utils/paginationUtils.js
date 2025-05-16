/**
 * Pagination utilities for use in components that display lists
 */

/**
 * Get paginated items from an array
 * @param {Array} items - The full array of items
 * @param {number} currentPage - The current page number (1-based)
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Array} Paginated subset of items
 */
export const getPaginatedItems = (items, currentPage, itemsPerPage) => {
  if (!items || !Array.isArray(items)) return [];
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  return items.slice(indexOfFirstItem, indexOfLastItem);
};

/**
 * Calculate total number of pages
 * @param {Array} items - The full array of items
 * @param {number} itemsPerPage - Number of items per page
 * @returns {number} Total pages
 */
export const getTotalPages = (items, itemsPerPage) => {
  if (!items || !Array.isArray(items)) return 0;
  return Math.ceil(items.length / itemsPerPage);
};

/**
 * Generate page numbers array for pagination UI
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {number} maxPageButtons - Maximum number of page buttons to display
 * @returns {Array} Array of page numbers to display
 */
export const getPageNumbers = (currentPage, totalPages, maxPageButtons = 5) => {
  if (totalPages <= maxPageButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  // Always show first and last page
  const firstPage = 1;
  const lastPage = totalPages;
  
  // Calculate current group
  const halfButtons = Math.floor(maxPageButtons / 2);
  let startPage = Math.max(currentPage - halfButtons, firstPage);
  let endPage = Math.min(startPage + maxPageButtons - 1, lastPage);
  
  // Adjust if we're near the end
  if (endPage === lastPage) {
    startPage = Math.max(endPage - maxPageButtons + 1, firstPage);
  }
  
  // Generate array of page numbers
  const pages = [];
  
  // Add first page if not included
  if (startPage > firstPage) {
    pages.push(firstPage);
    if (startPage > firstPage + 1) {
      pages.push('...');
    }
  }
  
  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  // Add last page if not included
  if (endPage < lastPage) {
    if (endPage < lastPage - 1) {
      pages.push('...');
    }
    pages.push(lastPage);
  }
  
  return pages;
};
