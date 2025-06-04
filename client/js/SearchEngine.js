/**
 * Search Engine - Advanced Search Functionality
 * Handles full-text search, saved searches, and search history
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

if (typeof window !== 'undefined') {
  window.CasesDashSearchEngine = (function() {
    'use strict';

    // Search state
    let searchState = {
      initialized: false,
      currentQuery: null,
      currentResults: [],
      searchHistory: [],
      savedSearches: [],
      searchFilters: {
        dateRange: null,
        status: [],
        priority: [],
        assignee: [],
        tags: [],
        sheetTypes: []
      },
      searchSettings: {
        fuzzySearch: true,
        caseSensitive: false,
        wholeWords: false,
        includeArchived: false,
        maxResults: 100,
        searchFields: ['title', 'description', 'comments', 'tags']
      },
      searchIndex: null,
      lastIndexUpdate: null
    };

    // DOM elements cache
    let elements = {};

    /**
     * Initialize Search Engine
     */
    function initialize() {
      try {
        console.log('初期化中: 検索エンジン...');
        
        cacheElements();
        setupEventListeners();
        loadSearchConfiguration();
        buildSearchIndex();
        loadSearchHistory();
        loadSavedSearches();
        
        searchState.initialized = true;
        console.log('✅ 検索エンジンが正常に初期化されました');
        
      } catch (error) {
        console.error('❌ 検索エンジンの初期化に失敗:', error);
        throw error;
      }
    }

    /**
     * Cache DOM elements for search interface
     */
    function cacheElements() {
      elements = {
        // Main search elements
        searchInput: document.getElementById('search-input'),
        searchButton: document.getElementById('search-button'),
        searchResults: document.getElementById('search-results'),
        searchSuggestions: document.getElementById('search-suggestions'),
        
        // Advanced search
        advancedSearchPanel: document.getElementById('advanced-search-panel'),
        advancedSearchToggle: document.getElementById('advanced-search-toggle'),
        searchFiltersPanel: document.getElementById('search-filters-panel'),
        
        // Search history and saved searches
        searchHistoryPanel: document.getElementById('search-history-panel'),
        savedSearchesPanel: document.getElementById('saved-searches-panel'),
        saveSearchButton: document.getElementById('save-search-button'),
        clearHistoryButton: document.getElementById('clear-history-button'),
        
        // Search settings
        searchSettingsPanel: document.getElementById('search-settings-panel'),
        searchSettingsToggle: document.getElementById('search-settings-toggle'),
        
        // Filter controls
        dateRangeFilter: document.getElementById('date-range-filter'),
        statusFilter: document.getElementById('status-filter'),
        priorityFilter: document.getElementById('priority-filter'),
        assigneeFilter: document.getElementById('assignee-filter'),
        tagsFilter: document.getElementById('tags-filter'),
        sheetTypesFilter: document.getElementById('sheet-types-filter'),
        
        // Search result controls
        resultsCount: document.getElementById('results-count'),
        sortBySelect: document.getElementById('sort-by-select'),
        searchPagination: document.getElementById('search-pagination'),
        exportResultsButton: document.getElementById('export-results-button'),
        
        // Quick search buttons
        quickSearchButtons: document.querySelectorAll('.quick-search-btn')
      };
    }

    /**
     * Setup event listeners for search functionality
     */
    function setupEventListeners() {
      // Main search input
      if (elements.searchInput) {
        elements.searchInput.addEventListener('input', handleSearchInput);
        elements.searchInput.addEventListener('keydown', handleSearchKeydown);
        elements.searchInput.addEventListener('focus', showSearchSuggestions);
        elements.searchInput.addEventListener('blur', hideSearchSuggestions);
      }

      // Search button
      if (elements.searchButton) {
        elements.searchButton.addEventListener('click', performSearch);
      }

      // Advanced search toggle
      if (elements.advancedSearchToggle) {
        elements.advancedSearchToggle.addEventListener('click', toggleAdvancedSearch);
      }

      // Search settings toggle
      if (elements.searchSettingsToggle) {
        elements.searchSettingsToggle.addEventListener('click', toggleSearchSettings);
      }

      // Save search button
      if (elements.saveSearchButton) {
        elements.saveSearchButton.addEventListener('click', saveCurrentSearch);
      }

      // Clear history button
      if (elements.clearHistoryButton) {
        elements.clearHistoryButton.addEventListener('click', clearSearchHistory);
      }

      // Filter controls
      setupFilterEventListeners();

      // Sort and pagination controls
      if (elements.sortBySelect) {
        elements.sortBySelect.addEventListener('change', handleSortChange);
      }

      if (elements.exportResultsButton) {
        elements.exportResultsButton.addEventListener('click', exportSearchResults);
      }

      // Quick search buttons
      elements.quickSearchButtons.forEach(button => {
        button.addEventListener('click', handleQuickSearch);
      });

      // Global search shortcut (Ctrl+F or Cmd+F)
      document.addEventListener('keydown', handleGlobalSearchShortcut);
    }

    /**
     * Setup filter event listeners
     */
    function setupFilterEventListeners() {
      const filterElements = [
        'dateRangeFilter', 'statusFilter', 'priorityFilter',
        'assigneeFilter', 'tagsFilter', 'sheetTypesFilter'
      ];

      filterElements.forEach(elementName => {
        const element = elements[elementName];
        if (element) {
          element.addEventListener('change', handleFilterChange);
        }
      });
    }

    /**
     * Load search configuration and settings
     */
    async function loadSearchConfiguration() {
      try {
        showLoading(true);
        
        const response = await callServerFunction('getSearchConfiguration');
        if (response.success) {
          applySearchConfiguration(response.data);
        }
        
      } catch (error) {
        console.error('検索設定の読み込みに失敗:', error);
        showError('検索設定の読み込みに失敗しました。デフォルト設定を使用します。');
      } finally {
        showLoading(false);
      }
    }

    /**
     * Apply search configuration
     */
    function applySearchConfiguration(config) {
      if (!config) return;

      // Apply search settings
      if (config.searchSettings) {
        searchState.searchSettings = { ...searchState.searchSettings, ...config.searchSettings };
      }

      // Apply saved filters
      if (config.defaultFilters) {
        searchState.searchFilters = { ...searchState.searchFilters, ...config.defaultFilters };
        updateFilterUI();
      }

      // Apply UI preferences
      if (config.uiPreferences) {
        applyUIPreferences(config.uiPreferences);
      }
    }

    /**
     * Build search index for fast searching
     */
    async function buildSearchIndex() {
      try {
        console.log('検索インデックスを構築中...');
        
        const response = await callServerFunction('buildSearchIndex');
        if (response.success) {
          searchState.searchIndex = response.data;
          searchState.lastIndexUpdate = new Date();
          console.log(`✅ 検索インデックスが構築されました (${response.data.totalDocuments} documents)`);
        }
        
      } catch (error) {
        console.error('検索インデックスの構築に失敗:', error);
        searchState.searchIndex = null;
      }
    }

    /**
     * Load search history
     */
    async function loadSearchHistory() {
      try {
        const response = await callServerFunction('getSearchHistory');
        if (response.success) {
          searchState.searchHistory = response.data || [];
          updateSearchHistoryUI();
        }
        
      } catch (error) {
        console.error('検索履歴の読み込みに失敗:', error);
        searchState.searchHistory = [];
      }
    }

    /**
     * Load saved searches
     */
    async function loadSavedSearches() {
      try {
        const response = await callServerFunction('getSavedSearches');
        if (response.success) {
          searchState.savedSearches = response.data || [];
          updateSavedSearchesUI();
        }
        
      } catch (error) {
        console.error('保存済み検索の読み込みに失敗:', error);
        searchState.savedSearches = [];
      }
    }

    /**
     * Handle search input changes
     */
    function handleSearchInput(event) {
      const query = event.target.value.trim();
      
      if (query.length >= 2) {
        // Show suggestions after a short delay
        clearTimeout(searchState.suggestionTimeout);
        searchState.suggestionTimeout = setTimeout(() => {
          showSearchSuggestions(query);
        }, 300);
      } else {
        hideSearchSuggestions();
      }
    }

    /**
     * Handle search input keydown events
     */
    function handleSearchKeydown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        performSearch();
      } else if (event.key === 'Escape') {
        hideSearchSuggestions();
        elements.searchInput.blur();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        navigateSuggestions('down');
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        navigateSuggestions('up');
      }
    }

    /**
     * Perform search operation
     */
    async function performSearch(query = null, saveToHistory = true) {
      try {
        showLoading(true);
        
        const searchQuery = query || elements.searchInput.value.trim();
        if (!searchQuery) {
          showError('検索クエリを入力してください。');
          return;
        }

        searchState.currentQuery = searchQuery;

        // Build search parameters
        const searchParams = {
          query: searchQuery,
          filters: searchState.searchFilters,
          settings: searchState.searchSettings,
          sortBy: elements.sortBySelect ? elements.sortBySelect.value : 'relevance',
          page: 1,
          limit: searchState.searchSettings.maxResults
        };

        const response = await callServerFunction('performSearch', searchParams);
        
        if (response.success) {
          searchState.currentResults = response.data.results;
          updateSearchResults(response.data);
          
          // Add to search history
          if (saveToHistory) {
            addToSearchHistory(searchQuery, searchParams);
          }
          
          // Hide suggestions
          hideSearchSuggestions();
          
        } else {
          throw new Error(response.error || '検索に失敗しました');
        }
        
      } catch (error) {
        console.error('検索エラー:', error);
        showError('検索に失敗しました: ' + error.message);
      } finally {
        showLoading(false);
      }
    }

    /**
     * Show search suggestions
     */
    async function showSearchSuggestions(query = null) {
      try {
        const searchQuery = query || elements.searchInput.value.trim();
        if (!searchQuery || searchQuery.length < 2) {
          hideSearchSuggestions();
          return;
        }

        const response = await callServerFunction('getSearchSuggestions', {
          query: searchQuery,
          limit: 8
        });

        if (response.success && response.data.length > 0) {
          displaySearchSuggestions(response.data);
        } else {
          hideSearchSuggestions();
        }
        
      } catch (error) {
        console.error('検索候補の取得に失敗:', error);
        hideSearchSuggestions();
      }
    }

    /**
     * Display search suggestions
     */
    function displaySearchSuggestions(suggestions) {
      if (!elements.searchSuggestions) return;

      const suggestionsHTML = suggestions.map((suggestion, index) => `
        <div class="suggestion-item ${index === 0 ? 'selected' : ''}" data-suggestion="${suggestion.text}">
          <div class="suggestion-text">${highlightQuery(suggestion.text, elements.searchInput.value)}</div>
          <div class="suggestion-type">${suggestion.type}</div>
          ${suggestion.count ? `<div class="suggestion-count">${suggestion.count} 件</div>` : ''}
        </div>
      `).join('');

      elements.searchSuggestions.innerHTML = suggestionsHTML;
      elements.searchSuggestions.style.display = 'block';

      // Add click listeners to suggestions
      elements.searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('mousedown', (e) => {
          e.preventDefault(); // Prevent input blur
          const suggestionText = item.getAttribute('data-suggestion');
          elements.searchInput.value = suggestionText;
          performSearch(suggestionText);
        });
      });
    }

    /**
     * Hide search suggestions
     */
    function hideSearchSuggestions() {
      if (elements.searchSuggestions) {
        elements.searchSuggestions.style.display = 'none';
        elements.searchSuggestions.innerHTML = '';
      }
    }

    /**
     * Navigate through search suggestions with arrow keys
     */
    function navigateSuggestions(direction) {
      if (!elements.searchSuggestions || elements.searchSuggestions.style.display === 'none') {
        return;
      }

      const suggestions = elements.searchSuggestions.querySelectorAll('.suggestion-item');
      if (suggestions.length === 0) return;

      const currentSelected = elements.searchSuggestions.querySelector('.suggestion-item.selected');
      let newIndex = 0;

      if (currentSelected) {
        const currentIndex = Array.from(suggestions).indexOf(currentSelected);
        newIndex = direction === 'down' 
          ? Math.min(currentIndex + 1, suggestions.length - 1)
          : Math.max(currentIndex - 1, 0);
        
        currentSelected.classList.remove('selected');
      }

      suggestions[newIndex].classList.add('selected');
      
      // Update input value with selected suggestion
      const suggestionText = suggestions[newIndex].getAttribute('data-suggestion');
      elements.searchInput.value = suggestionText;
    }

    /**
     * Update search results display
     */
    function updateSearchResults(searchData) {
      if (!elements.searchResults) return;

      const { results, totalCount, executionTime, facets } = searchData;

      // Update results count
      if (elements.resultsCount) {
        elements.resultsCount.textContent = `${totalCount} 件の結果 (${executionTime}ms)`;
      }

      // Generate results HTML
      const resultsHTML = results.length > 0 ? results.map(result => `
        <div class="search-result-item mdl-card mdl-shadow--2dp" data-case-id="${result.id}">
          <div class="mdl-card__title">
            <h4 class="mdl-card__title-text">
              ${highlightQuery(result.title, searchState.currentQuery)}
            </h4>
            <div class="result-metadata">
              <span class="result-type">${result.type}</span>
              <span class="result-status status-${result.status.toLowerCase().replace(' ', '-')}">${result.status}</span>
              ${result.priority ? `<span class="result-priority priority-${result.priority.toLowerCase()}">${result.priority}</span>` : ''}
            </div>
          </div>
          <div class="mdl-card__supporting-text">
            <div class="result-description">
              ${highlightQuery(truncateText(result.description, 200), searchState.currentQuery)}
            </div>
            <div class="result-details">
              <span class="result-assignee">担当: ${result.assignee || '未割当'}</span>
              <span class="result-date">更新: ${formatDate(result.lastModified)}</span>
              <span class="result-score">関連度: ${Math.round(result.score * 100)}%</span>
            </div>
            ${result.matchedFields && result.matchedFields.length > 0 ? `
              <div class="result-matches">
                <strong>マッチしたフィールド:</strong> ${result.matchedFields.join(', ')}
              </div>
            ` : ''}
          </div>
          <div class="mdl-card__actions">
            <button class="mdl-button mdl-js-button mdl-button--colored view-result-btn" data-case-id="${result.id}">
              詳細を表示
            </button>
            <button class="mdl-button mdl-js-button edit-result-btn" data-case-id="${result.id}">
              編集
            </button>
          </div>
        </div>
      `).join('') : `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>検索結果が見つかりませんでした</h3>
          <p>検索条件を変更してお試しください。</p>
          <div class="search-suggestions-help">
            <h4>検索のヒント:</h4>
            <ul>
              <li>キーワードのスペルを確認してください</li>
              <li>より一般的な用語を使用してみてください</li>
              <li>検索フィルターを調整してください</li>
              <li>部分一致検索を試してください</li>
            </ul>
          </div>
        </div>
      `;

      elements.searchResults.innerHTML = resultsHTML;

      // Add event listeners to result actions
      elements.searchResults.querySelectorAll('.view-result-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const caseId = e.target.getAttribute('data-case-id');
          viewSearchResult(caseId);
        });
      });

      elements.searchResults.querySelectorAll('.edit-result-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const caseId = e.target.getAttribute('data-case-id');
          editSearchResult(caseId);
        });
      });

      // Update facets if available
      if (facets) {
        updateSearchFacets(facets);
      }

      // Update pagination if needed
      updateSearchPagination(searchData);
    }

    /**
     * Handle filter changes
     */
    function handleFilterChange(event) {
      const filterName = event.target.name || event.target.id.replace('Filter', '').replace('-filter', '');
      const filterValue = getFilterValue(event.target);
      
      // Update search filters
      if (Array.isArray(searchState.searchFilters[filterName])) {
        if (event.target.checked) {
          searchState.searchFilters[filterName].push(filterValue);
        } else {
          const index = searchState.searchFilters[filterName].indexOf(filterValue);
          if (index > -1) {
            searchState.searchFilters[filterName].splice(index, 1);
          }
        }
      } else {
        searchState.searchFilters[filterName] = filterValue;
      }
      
      // Re-run search if there's a current query
      if (searchState.currentQuery) {
        performSearch(searchState.currentQuery, false);
      }
    }

    /**
     * Handle sort changes
     */
    function handleSortChange(event) {
      if (searchState.currentQuery) {
        performSearch(searchState.currentQuery, false);
      }
    }

    /**
     * Handle quick search button clicks
     */
    function handleQuickSearch(event) {
      const searchType = event.target.getAttribute('data-search-type');
      const searchQuery = event.target.getAttribute('data-search-query');
      
      if (searchQuery) {
        elements.searchInput.value = searchQuery;
        performSearch(searchQuery);
      } else {
        // Handle predefined search types
        handlePredefinedSearch(searchType);
      }
    }

    /**
     * Handle predefined search types
     */
    function handlePredefinedSearch(searchType) {
      switch (searchType) {
        case 'my-cases':
          searchState.searchFilters.assignee = [getCurrentUser()];
          elements.searchInput.value = '*';
          performSearch('*');
          break;
        case 'urgent-cases':
          searchState.searchFilters.priority = ['High', 'Critical'];
          elements.searchInput.value = '*';
          performSearch('*');
          break;
        case 'unassigned-cases':
          searchState.searchFilters.assignee = ['unassigned'];
          elements.searchInput.value = '*';
          performSearch('*');
          break;
        case 'recent-activity':
          searchState.searchFilters.dateRange = 'last-7-days';
          elements.searchInput.value = '*';
          performSearch('*');
          break;
      }
    }

    /**
     * Toggle advanced search panel
     */
    function toggleAdvancedSearch() {
      if (elements.advancedSearchPanel) {
        const isVisible = elements.advancedSearchPanel.style.display !== 'none';
        elements.advancedSearchPanel.style.display = isVisible ? 'none' : 'block';
        
        if (elements.advancedSearchToggle) {
          elements.advancedSearchToggle.textContent = isVisible ? '詳細検索を表示' : '詳細検索を非表示';
        }
      }
    }

    /**
     * Toggle search settings panel
     */
    function toggleSearchSettings() {
      if (elements.searchSettingsPanel) {
        const isVisible = elements.searchSettingsPanel.style.display !== 'none';
        elements.searchSettingsPanel.style.display = isVisible ? 'none' : 'block';
      }
    }

    /**
     * Save current search
     */
    async function saveCurrentSearch() {
      try {
        if (!searchState.currentQuery) {
          showError('保存する検索がありません。');
          return;
        }

        const searchName = prompt('検索名を入力してください:', searchState.currentQuery);
        if (!searchName) return;

        const searchData = {
          name: searchName,
          query: searchState.currentQuery,
          filters: { ...searchState.searchFilters },
          settings: { ...searchState.searchSettings },
          createdAt: new Date()
        };

        const response = await callServerFunction('saveSearch', searchData);
        
        if (response.success) {
          searchState.savedSearches.push({ id: response.searchId, ...searchData });
          updateSavedSearchesUI();
          showToast('検索が保存されました', 'success');
        } else {
          throw new Error(response.error || '検索の保存に失敗しました');
        }
        
      } catch (error) {
        console.error('検索保存エラー:', error);
        showError('検索の保存に失敗しました: ' + error.message);
      }
    }

    /**
     * Clear search history
     */
    async function clearSearchHistory() {
      try {
        const confirmed = confirm('検索履歴をすべて削除しますか？');
        if (!confirmed) return;

        const response = await callServerFunction('clearSearchHistory');
        
        if (response.success) {
          searchState.searchHistory = [];
          updateSearchHistoryUI();
          showToast('検索履歴が削除されました', 'success');
        } else {
          throw new Error(response.error || '検索履歴の削除に失敗しました');
        }
        
      } catch (error) {
        console.error('検索履歴削除エラー:', error);
        showError('検索履歴の削除に失敗しました: ' + error.message);
      }
    }

    /**
     * Export search results
     */
    async function exportSearchResults() {
      try {
        if (!searchState.currentResults || searchState.currentResults.length === 0) {
          showError('エクスポートする検索結果がありません。');
          return;
        }

        showLoading(true);

        const exportData = {
          query: searchState.currentQuery,
          results: searchState.currentResults,
          filters: searchState.searchFilters,
          exportedAt: new Date()
        };

        const response = await callServerFunction('exportSearchResults', exportData);
        
        if (response.success) {
          // Download the exported file
          if (response.data.downloadUrl) {
            window.open(response.data.downloadUrl, '_blank');
          }
          showToast('検索結果がエクスポートされました', 'success');
        } else {
          throw new Error(response.error || 'エクスポートに失敗しました');
        }
        
      } catch (error) {
        console.error('エクスポートエラー:', error);
        showError('エクスポートに失敗しました: ' + error.message);
      } finally {
        showLoading(false);
      }
    }

    /**
     * Handle global search shortcut
     */
    function handleGlobalSearchShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        if (elements.searchInput) {
          elements.searchInput.focus();
          elements.searchInput.select();
        }
      }
    }

    /**
     * Add search to history
     */
    function addToSearchHistory(query, params) {
      const historyItem = {
        query: query,
        timestamp: new Date(),
        filters: { ...params.filters },
        resultsCount: searchState.currentResults.length
      };

      // Remove duplicate if exists
      searchState.searchHistory = searchState.searchHistory.filter(item => item.query !== query);
      
      // Add to beginning of history
      searchState.searchHistory.unshift(historyItem);
      
      // Limit history size
      if (searchState.searchHistory.length > 50) {
        searchState.searchHistory = searchState.searchHistory.slice(0, 50);
      }

      updateSearchHistoryUI();
      
      // Save to server
      callServerFunction('saveSearchHistory', searchState.searchHistory).catch(error => {
        console.error('検索履歴の保存に失敗:', error);
      });
    }

    /**
     * Update search history UI
     */
    function updateSearchHistoryUI() {
      if (!elements.searchHistoryPanel) return;

      if (searchState.searchHistory.length === 0) {
        elements.searchHistoryPanel.innerHTML = '<p>検索履歴がありません。</p>';
        return;
      }

      const historyHTML = searchState.searchHistory.slice(0, 10).map(item => `
        <div class="history-item" data-query="${item.query}">
          <div class="history-query">${item.query}</div>
          <div class="history-meta">
            <span class="history-date">${formatDate(item.timestamp)}</span>
            <span class="history-results">${item.resultsCount} 件</span>
          </div>
        </div>
      `).join('');

      elements.searchHistoryPanel.innerHTML = historyHTML;

      // Add click listeners
      elements.searchHistoryPanel.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          const query = item.getAttribute('data-query');
          elements.searchInput.value = query;
          performSearch(query);
        });
      });
    }

    /**
     * Update saved searches UI
     */
    function updateSavedSearchesUI() {
      if (!elements.savedSearchesPanel) return;

      if (searchState.savedSearches.length === 0) {
        elements.savedSearchesPanel.innerHTML = '<p>保存済み検索がありません。</p>';
        return;
      }

      const savedSearchesHTML = searchState.savedSearches.map(search => `
        <div class="saved-search-item" data-search-id="${search.id}">
          <div class="saved-search-name">${search.name}</div>
          <div class="saved-search-query">${search.query}</div>
          <div class="saved-search-actions">
            <button class="mdl-button mdl-js-button mdl-button--icon run-saved-search-btn" title="実行">
              <i class="material-icons">play_arrow</i>
            </button>
            <button class="mdl-button mdl-js-button mdl-button--icon delete-saved-search-btn" title="削除">
              <i class="material-icons">delete</i>
            </button>
          </div>
        </div>
      `).join('');

      elements.savedSearchesPanel.innerHTML = savedSearchesHTML;

      // Add event listeners
      elements.savedSearchesPanel.querySelectorAll('.run-saved-search-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const searchId = e.target.closest('.saved-search-item').getAttribute('data-search-id');
          runSavedSearch(searchId);
        });
      });

      elements.savedSearchesPanel.querySelectorAll('.delete-saved-search-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const searchId = e.target.closest('.saved-search-item').getAttribute('data-search-id');
          deleteSavedSearch(searchId);
        });
      });
    }

    /**
     * Run a saved search
     */
    function runSavedSearch(searchId) {
      const savedSearch = searchState.savedSearches.find(s => s.id === searchId);
      if (!savedSearch) return;

      // Apply saved search parameters
      elements.searchInput.value = savedSearch.query;
      searchState.searchFilters = { ...savedSearch.filters };
      searchState.searchSettings = { ...savedSearch.settings };
      
      updateFilterUI();
      performSearch(savedSearch.query);
    }

    /**
     * Delete a saved search
     */
    async function deleteSavedSearch(searchId) {
      try {
        const confirmed = confirm('この保存済み検索を削除しますか？');
        if (!confirmed) return;

        const response = await callServerFunction('deleteSavedSearch', searchId);
        
        if (response.success) {
          searchState.savedSearches = searchState.savedSearches.filter(s => s.id !== searchId);
          updateSavedSearchesUI();
          showToast('保存済み検索が削除されました', 'success');
        } else {
          throw new Error(response.error || '削除に失敗しました');
        }
        
      } catch (error) {
        console.error('保存済み検索削除エラー:', error);
        showError('保存済み検索の削除に失敗しました: ' + error.message);
      }
    }

    /**
     * Utility functions
     */

    function highlightQuery(text, query) {
      if (!query || !text) return text;
      
      const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }

    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function truncateText(text, maxLength) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    }

    function formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('ja-JP') + ' ' + d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    }

    function getFilterValue(element) {
      if (element.type === 'checkbox') {
        return element.value;
      } else if (element.type === 'select-multiple') {
        return Array.from(element.selectedOptions).map(option => option.value);
      } else {
        return element.value;
      }
    }

    function updateFilterUI() {
      // Update filter UI elements to reflect current filter state
      Object.keys(searchState.searchFilters).forEach(filterName => {
        const element = elements[filterName + 'Filter'];
        if (element) {
          const filterValue = searchState.searchFilters[filterName];
          if (Array.isArray(filterValue)) {
            // Handle multiple select or checkboxes
            if (element.type === 'select-multiple') {
              Array.from(element.options).forEach(option => {
                option.selected = filterValue.includes(option.value);
              });
            }
          } else {
            element.value = filterValue || '';
          }
        }
      });
    }

    function applyUIPreferences(preferences) {
      // Apply UI preferences like default view, result count, etc.
      if (preferences.maxResults && preferences.maxResults !== searchState.searchSettings.maxResults) {
        searchState.searchSettings.maxResults = preferences.maxResults;
      }
    }

    function updateSearchFacets(facets) {
      // Update search facets display
      // This would show filter counts and suggestions
      console.log('Updating search facets:', facets);
    }

    function updateSearchPagination(searchData) {
      // Update pagination controls
      if (elements.searchPagination && searchData.totalPages > 1) {
        elements.searchPagination.style.display = 'block';
        // Implementation for pagination controls
      } else if (elements.searchPagination) {
        elements.searchPagination.style.display = 'none';
      }
    }

    function viewSearchResult(caseId) {
      // Navigate to case detail view
      if (window.CasesDashApp && typeof window.CasesDashApp.showCaseDetail === 'function') {
        window.CasesDashApp.showCaseDetail(caseId);
      }
    }

    function editSearchResult(caseId) {
      // Navigate to case edit view
      if (window.CasesDashApp && typeof window.CasesDashApp.editCase === 'function') {
        window.CasesDashApp.editCase(caseId);
      }
    }

    function getCurrentUser() {
      // Get current user email or ID from client-side storage or app state
      if (window.CasesDashApp && typeof window.CasesDashApp.getCurrentUser === 'function') {
        return window.CasesDashApp.getCurrentUser();
      }
      
      // Fallback: try to get from properties or localStorage
      try {
        const userEmail = localStorage.getItem('casesdash_user_email');
        if (userEmail) return userEmail;
        
        // Another fallback: check if available in global state
        if (window.currentUserEmail) return window.currentUserEmail;
        
        // Default fallback
        console.warn('⚠️ User email not available in client context, using fallback');
        return 'unknown@example.com';
      } catch (error) {
        console.error('Failed to get current user:', error);
        return 'unknown@example.com';
      }
    }

    function showLoading(show) {
      if (window.CasesDashApp && typeof window.CasesDashApp.showLoading === 'function') {
        window.CasesDashApp.showLoading(show);
      }
    }

    function showError(message) {
      if (window.CasesDashApp && typeof window.CasesDashApp.showError === 'function') {
        window.CasesDashApp.showError(message);
      } else {
        console.error(message);
      }
    }

    function showToast(message, type = 'info') {
      if (window.CasesDashApp && typeof window.CasesDashApp.showToast === 'function') {
        window.CasesDashApp.showToast(message, type);
      } else {
        console.log(message);
      }
    }

    function callServerFunction(functionName, ...args) {
      // Try main app's server function caller first
      if (window.AppMain && typeof window.AppMain.callServerFunction === 'function') {
        return window.AppMain.callServerFunction(functionName, ...args);
      } else if (window.CasesDashApp && typeof window.CasesDashApp.callServerFunction === 'function') {
        return window.CasesDashApp.callServerFunction(functionName, ...args);
      } else {
        // Fallback to direct Google Apps Script call
        return new Promise((resolve, reject) => {
          try {
            google.script.run
              .withSuccessHandler(resolve)
              .withFailureHandler(reject)
              [functionName](...args);
          } catch (error) {
            reject(new Error('Google Apps Script interface not available'));
          }
        });
      }
    }

    // Public API
    return {
      initialize,
      performSearch,
      showSearchSuggestions,
      hideSearchSuggestions,
      saveCurrentSearch,
      clearSearchHistory,
      exportSearchResults,
      runSavedSearch,
      deleteSavedSearch,
      buildSearchIndex,
      getState: () => ({ ...searchState }),
      updateFilters: (filters) => {
        searchState.searchFilters = { ...searchState.searchFilters, ...filters };
        updateFilterUI();
      },
      updateSettings: (settings) => {
        searchState.searchSettings = { ...searchState.searchSettings, ...settings };
      }
    };

  })();
}