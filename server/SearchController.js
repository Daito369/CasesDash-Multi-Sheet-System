/**
 * CasesDash - Search Controller
 * Handles advanced search functionality, search indexing, and search management
 *
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

class SearchController {
  constructor() {
    this.initialized = true;
  }

  /**
   * Build search index for fast searching
   * @returns {Object} Search index build result
   */
  buildSearchIndex() {
  try {
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    const searchIndex = {
      totalDocuments: 0,
      bySheetType: {},
      lastBuildTime: new Date().toISOString(),
      buildDuration: 0
    };

    const startTime = Date.now();

    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const allCases = caseModel.search({ limit: 5000 }); // Build index from existing cases
        
        if (allCases.success && allCases.data) {
          const documents = allCases.data.map(caseData => ({
            id: caseData.caseId,
            sheetType: sheetType,
            title: caseData.issueCategory || caseData.caseId || '',
            description: caseData.details || '',
            status: caseData.caseStatus || '',
            priority: caseData.priority || '',
            assignee: caseData.finalAssignee || caseData.firstAssignee || '',
            tags: caseData.tags || '',
            lastModified: caseData.lastModified || caseData.caseOpenDate,
            searchableText: [
              caseData.caseId,
              caseData.issueCategory,
              caseData.details,
              caseData.caseStatus,
              caseData.finalAssignee,
              caseData.firstAssignee,
              caseData.tags
            ].filter(Boolean).join(' ').toLowerCase()
          }));

          searchIndex.bySheetType[sheetType] = documents;
          searchIndex.totalDocuments += documents.length;
        } else {
          searchIndex.bySheetType[sheetType] = [];
        }

      } catch (error) {
        console.warn(`Failed to index ${sheetType}:`, error.message);
        searchIndex.bySheetType[sheetType] = [];
      }
    });

    searchIndex.buildDuration = Date.now() - startTime;

    // Cache the search index
    const configManager = new ConfigManager();
    configManager.set('search', 'lastIndexBuild', searchIndex.lastBuildTime);
    configManager.set('search', 'indexStats', {
      totalDocuments: searchIndex.totalDocuments,
      buildDuration: searchIndex.buildDuration
    });

    return {
      success: true,
      data: searchIndex
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to build search index.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Perform advanced search across all or specific sheet types
   * @param {Object} searchParams - Search parameters
   * @returns {Object} Search results
   */
  performSearch(searchParams) {
  try {
    const {
      query = '',
      sheetTypes = SheetMapper.getAvailableSheetTypes(),
      filters = {},
      sortBy = 'relevance',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = searchParams;

    if (!query && Object.keys(filters).length === 0) {
      return {
        success: false,
        error: 'Search query or filters are required'
      };
    }

    const searchResults = [];
    const privacyManager = new PrivacyManager();
    const currentUser = Session.getActiveUser().getEmail();
    const userRole = privacyManager.getUserRole(currentUser);

    // Search across specified sheet types
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        
        // Build search criteria
        const searchCriteria = {
          limit: limit * 2, // Get more results to filter and sort
          filters: filters
        };

        // Add text search if query provided
        if (query) {
          searchCriteria.textSearch = query;
        }

        const sheetResults = caseModel.advancedSearch(searchCriteria);
        
        if (sheetResults.success && sheetResults.data) {
          // Apply privacy filters
          const filteredResults = sheetResults.data
            .map(caseData => privacyManager.applySensitivityFilters(caseData, userRole))
            .filter(caseData => {
              // Additional filtering based on user permissions
              return privacyManager.canAccessCase(caseData, 'read').allowed;
            })
            .map(caseData => ({
              ...caseData,
              sheetType: sheetType,
              channel: SheetMapper.create(sheetType).getChannelValue(),
              relevanceScore: calculateRelevanceScore(caseData, query)
            }));

          searchResults.push(...filteredResults);
        }
      } catch (error) {
        console.warn(`Search failed for ${sheetType}:`, error.message);
      }
    });

    // Sort results
    if (sortBy === 'relevance') {
      searchResults.sort((a, b) => {
        const scoreA = a.relevanceScore || 0;
        const scoreB = b.relevanceScore || 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
    } else {
      searchResults.sort((a, b) => {
        const valueA = a[sortBy] || '';
        const valueB = b[sortBy] || '';
        
        if (sortBy.includes('Date') || sortBy.includes('Time')) {
          const dateA = new Date(valueA);
          const dateB = new Date(valueB);
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        }
        
        return sortOrder === 'desc' ? 
          valueB.toString().localeCompare(valueA.toString()) :
          valueA.toString().localeCompare(valueB.toString());
      });
    }

    // Apply pagination
    const paginatedResults = searchResults.slice(offset, offset + limit);

    // Log search activity
    privacyManager.logAccess('search', 'advanced_search', {
      query: query,
      sheetTypes: sheetTypes,
      totalResults: searchResults.length,
      returnedResults: paginatedResults.length
    });

    return {
      success: true,
      data: {
        results: paginatedResults,
        totalResults: searchResults.length,
        hasMore: offset + limit < searchResults.length,
        searchParams: searchParams,
        facets: generateSearchFacets(searchResults)
      }
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Search failed. Please try again.',
        context: { searchParams },
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Get search suggestions based on partial input
   * @param {Object} params - Search suggestion parameters
   * @returns {Object} Search suggestions
   */
  getSearchSuggestions(params) {
  try {
    const { 
      partialQuery = '', 
      suggestionType = 'all',
      limit = 10 
    } = params;

    if (!partialQuery || partialQuery.length < 2) {
      return {
        success: true,
        data: []
      };
    }

    const suggestions = new Set();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();

    // Get suggestions from different sources
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const recentCases = caseModel.search({ 
          limit: 100,
          sortBy: 'lastModified',
          sortOrder: 'desc'
        });

        if (recentCases.success && recentCases.data) {
          recentCases.data.forEach(caseData => {
            // Case ID suggestions
            if (caseData.caseId && caseData.caseId.toLowerCase().includes(partialQuery.toLowerCase())) {
              suggestions.add({
                type: 'caseId',
                value: caseData.caseId,
                label: `Case: ${caseData.caseId}`,
                sheetType: sheetType
              });
            }

            // Assignee suggestions
            const assignee = caseData.finalAssignee || caseData.firstAssignee;
            if (assignee && assignee.toLowerCase().includes(partialQuery.toLowerCase())) {
              suggestions.add({
                type: 'assignee',
                value: assignee,
                label: `Assignee: ${assignee}`,
                sheetType: sheetType
              });
            }

            // Status suggestions
            if (caseData.caseStatus && caseData.caseStatus.toLowerCase().includes(partialQuery.toLowerCase())) {
              suggestions.add({
                type: 'status',
                value: caseData.caseStatus,
                label: `Status: ${caseData.caseStatus}`,
                sheetType: sheetType
              });
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to get suggestions from ${sheetType}:`, error.message);
      }
    });

    // Convert Set to Array and limit results
    const suggestionArray = Array.from(suggestions).slice(0, limit);

    return {
      success: true,
      data: suggestionArray
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get search suggestions.',
        context: { params },
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Get search configuration and settings
   * @returns {Object} Search configuration
   */
  getSearchConfiguration() {
  try {
    const config = ConfigManager.get('search') || {};
    
    return {
      success: true,
      data: {
        searchSettings: {
          maxResults: config.maxResults || 100,
          enableAutoComplete: config.enableAutoComplete !== false,
          enableFacets: config.enableFacets !== false,
          indexRefreshInterval: config.indexRefreshInterval || 3600000 // 1 hour
        },
        defaultFilters: {
          sheetTypes: SheetMapper.getAvailableSheetTypes(),
          statuses: ['Open', 'In Progress', 'Pending', 'Closed', 'Escalated'],
          priorities: ['Low', 'Normal', 'High', 'Critical']
        },
        uiPreferences: {
          resultsPerPage: config.resultsPerPage || 25,
          showSnippets: config.showSnippets !== false,
          highlightMatches: config.highlightMatches !== false
        }
      }
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get search configuration.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Save a search query for later use
   * @param {Object} searchData - Search data to save
   * @returns {Object} Save result
   */
  saveSearch(searchData) {
  try {
    const currentUser = Session.getActiveUser().getEmail();
    const searchId = 'search_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const savedSearch = {
      id: searchId,
      name: searchData.name || 'Untitled Search',
      query: searchData.query,
      filters: searchData.filters,
      sheetTypes: searchData.sheetTypes,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 0
    };

    // Store the search (in a real implementation, this would use a persistent storage)
    const properties = PropertiesService.getUserProperties();
    const existingSaves = JSON.parse(properties.getProperty('savedSearches') || '[]');
    existingSaves.push(savedSearch);
    
    // Keep only last 50 searches per user
    if (existingSaves.length > 50) {
      existingSaves.splice(0, existingSaves.length - 50);
    }
    
    properties.setProperty('savedSearches', JSON.stringify(existingSaves));

    return {
      success: true,
      data: {
        searchId: searchId,
        name: savedSearch.name
      }
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to save search.',
        context: { searchData },
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Get saved searches for current user
   * @returns {Object} Saved searches
   */
  getSavedSearches() {
  try {
    const properties = PropertiesService.getUserProperties();
    const savedSearches = JSON.parse(properties.getProperty('savedSearches') || '[]');

    return {
      success: true,
      data: savedSearches.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get saved searches.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Delete a saved search
   * @param {string} searchId - ID of search to delete
   * @returns {Object} Deletion result
   */
  deleteSavedSearch(searchId) {
  try {
    const properties = PropertiesService.getUserProperties();
    const savedSearches = JSON.parse(properties.getProperty('savedSearches') || '[]');
    
    const filteredSearches = savedSearches.filter(search => search.id !== searchId);
    properties.setProperty('savedSearches', JSON.stringify(filteredSearches));

    return {
      success: true,
      message: 'Search deleted successfully'
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to delete saved search.',
        context: { searchId },
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Get search history for current user
   * @returns {Object} Search history
   */
  getSearchHistory() {
  try {
    const properties = PropertiesService.getUserProperties();
    const searchHistory = JSON.parse(properties.getProperty('searchHistory') || '[]');

    return {
      success: true,
      data: searchHistory.slice(-20) // Return last 20 searches
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get search history.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Save search to history
   * @param {Object} history - Search history entry
   * @returns {Object} Save result
   */
  saveSearchHistory(history) {
  try {
    const properties = PropertiesService.getUserProperties();
    const searchHistory = JSON.parse(properties.getProperty('searchHistory') || '[]');
    
    searchHistory.push({
      ...history,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 entries
    if (searchHistory.length > 50) {
      searchHistory.splice(0, searchHistory.length - 50);
    }
    
    properties.setProperty('searchHistory', JSON.stringify(searchHistory));

    return {
      success: true,
      message: 'Search history updated'
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to save search history.',
        context: { history },
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Clear search history for current user
   * @returns {Object} Clear result
   */
  clearSearchHistory() {
  try {
    const properties = PropertiesService.getUserProperties();
    properties.deleteProperty('searchHistory');

    return {
      success: true,
      message: 'Search history cleared'
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to clear search history.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Export search results to various formats
   * @param {Object} exportData - Export configuration
   * @returns {Object} Export result
   */
  exportSearchResults(exportData) {
  try {
    const {
      searchResults,
      format = 'csv',
      includeHeaders = true,
      selectedFields = []
    } = exportData;

    if (!searchResults || !Array.isArray(searchResults)) {
      throw new Error('Search results are required for export');
    }

    let exportContent = '';
    let filename = `search_results_${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      const fields = selectedFields.length > 0 ? selectedFields : 
        ['caseId', 'sheetType', 'caseStatus', 'finalAssignee', 'caseOpenDate'];
      
      if (includeHeaders) {
        exportContent += fields.join(',') + '\n';
      }

      searchResults.forEach(result => {
        const row = fields.map(field => {
          const value = result[field] || '';
          return `"${value.toString().replace(/"/g, '""')}"`;
        });
        exportContent += row.join(',') + '\n';
      });

      filename += '.csv';
    } else if (format === 'json') {
      exportContent = JSON.stringify(searchResults, null, 2);
      filename += '.json';
    }

    return {
      success: true,
      data: {
        content: exportContent,
        filename: filename,
        mimeType: format === 'csv' ? 'text/csv' : 'application/json'
      }
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to export search results.',
        context: { exportData },
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Calculate relevance score for search results
   * @param {Object} caseData - Case data
   * @param {string} query - Search query
   * @returns {number} Relevance score
   */
  calculateRelevanceScore(caseData, query) {
  if (!query) return 0;

  let score = 0;
  const queryLower = query.toLowerCase();
  const searchableFields = [
    caseData.caseId,
    caseData.issueCategory,
    caseData.details,
    caseData.finalAssignee,
    caseData.firstAssignee,
    caseData.tags
  ].filter(Boolean);

  searchableFields.forEach(field => {
    const fieldValue = field.toString().toLowerCase();
    
    // Exact match gets highest score
    if (fieldValue === queryLower) {
      score += 10;
    }
    // Starts with query gets high score
    else if (fieldValue.startsWith(queryLower)) {
      score += 5;
    }
    // Contains query gets medium score
    else if (fieldValue.includes(queryLower)) {
      score += 2;
    }
  });

  // Boost score for case ID matches
  if (caseData.caseId && caseData.caseId.toLowerCase().includes(queryLower)) {
    score += 5;
  }

  // Boost score for recent cases
  if (caseData.lastModified) {
    const daysSinceModified = (Date.now() - new Date(caseData.lastModified)) / (1000 * 60 * 60 * 24);
    if (daysSinceModified < 7) {
      score += 1;
    }
  }

  return score;
  }

  /**
   * Generate search facets for filtering
   * @param {Array} searchResults - Search results
   * @returns {Object} Search facets
   */
  generateSearchFacets(searchResults) {
  const facets = {
    sheetTypes: {},
    statuses: {},
    assignees: {},
    priorities: {}
  };

  searchResults.forEach(result => {
    // Sheet type facets
    if (result.sheetType) {
      facets.sheetTypes[result.sheetType] = (facets.sheetTypes[result.sheetType] || 0) + 1;
    }

    // Status facets
    if (result.caseStatus) {
      facets.statuses[result.caseStatus] = (facets.statuses[result.caseStatus] || 0) + 1;
    }

    // Assignee facets
    const assignee = result.finalAssignee || result.firstAssignee;
    if (assignee) {
      facets.assignees[assignee] = (facets.assignees[assignee] || 0) + 1;
    }

    // Priority facets
    if (result.priority) {
      facets.priorities[result.priority] = (facets.priorities[result.priority] || 0) + 1;
    }
  });

  return facets;
  }

  /**
   * Initialize advanced features including search
   * @returns {Object} Initialization result
   */
  initializeAdvancedFeatures() {
  try {
    const results = {
      workflowEngine: false,
      reportGenerator: false,
      searchEngine: false,
      statisticsManager: false,
      errors: []
    };

    // Initialize Workflow Engine
    try {
      if (typeof initializeWorkflowEngine === 'function') {
        const workflowResult = initializeWorkflowEngine();
        results.workflowEngine = workflowResult.success;
        if (!workflowResult.success) {
          results.errors.push(`Workflow Engine: ${workflowResult.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`Workflow Engine: ${error.message}`);
    }

    // Initialize Report Generator
    try {
      if (typeof initializeReportGenerator === 'function') {
        const reportResult = initializeReportGenerator();
        results.reportGenerator = reportResult.success;
        if (!reportResult.success) {
          results.errors.push(`Report Generator: ${reportResult.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`Report Generator: ${error.message}`);
    }

    // Initialize Statistics Manager (client-side, just check availability)
    results.statisticsManager = true; // Client-side component

    // Initialize Search Engine (server-side components)
    results.searchEngine = true; // Server-side components available

    const overallSuccess = results.workflowEngine && results.reportGenerator &&
                          results.statisticsManager && results.searchEngine;

    return {
      success: overallSuccess,
      data: results,
      message: overallSuccess ?
        'All advanced features initialized successfully' :
        'Some advanced features failed to initialize'
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to initialize advanced features.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }
}