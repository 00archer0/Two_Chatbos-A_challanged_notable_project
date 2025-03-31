// import { filterData } from './filters_data.js';

// Module: User Filter Management
let currentUserFilters = null;

/**
 * @module UserFilterManagement
 * This module handles loading and storing user-specific filters.
 */

/**
 * Loads user-specific filters into the application.
 * @param {object} userFilters - An object containing the user's filter preferences.
 */
export function loadUserFilters(userFilters) {
    currentUserFilters = userFilters;
    saveFiltersToStorage();
    renderFilters();
    updateAppliedFilters();
}

// Add this at the top of the file
const STORAGE_KEY = 'currentFilters';

// Add this function to save filters
function saveFiltersToStorage() {
    if (currentUserFilters) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentUserFilters));
    }
}

// Add this function to load filters
export function loadFiltersFromStorage() {
    const storedFilters = sessionStorage.getItem(STORAGE_KEY);
    if (storedFilters) {
        currentUserFilters = JSON.parse(storedFilters);
        renderFilters();
        updateAppliedFilters();
    }
};

// Module: Applied Filters Display
/**
 * @module AppliedFiltersDisplay
 * This module manages the display of currently applied filters.
 */

/**
 * Updates the displayed applied filters based on the current user filters.
 * This function is exported to be called from other modules (e.g., script.js).
 */
export function updateAppliedFilters() {
    const appliedFiltersContainer = document.getElementById('appliedFilters');
    if (!appliedFiltersContainer || !currentUserFilters) return;

    appliedFiltersContainer.innerHTML = '';

    for (const [key, section] of Object.entries(currentUserFilters)) {
        if (section.type === 'chips' || section.type === 'checkbox') {
            section.options.forEach(opt => {
                if (opt.enabled) {
                    const chip = createAppliedFilterChip(opt.name, key);
                    appliedFiltersContainer.appendChild(chip);
                }
            });
        } else if (section.type === 'dualRange' || section.type === 'range') {
            // Create chip for BUDGET if values are different from default
            if (key === 'BUDGET' && (section.options.currentMin !== section.options.min || section.options.currentMax !== section.options.max)) {
                const label = `₹${section.options.currentMin.toLocaleString()} - ₹${section.options.currentMax.toLocaleString()}`;
                const chip = createAppliedFilterChip(label, key, true);
                appliedFiltersContainer.appendChild(chip);
            } 
            // Create chip for AREA_SQFT if values are different from default
            else if (key === 'AREA_SQFT' && (section.options.currentMin !== section.options.min || section.options.currentMax !== section.options.max)) {
                const label = `${section.options.currentMin.toLocaleString()} - ${section.options.currentMax.toLocaleString()} sq.ft.`;
                const chip = createAppliedFilterChip(label, key, true);
                appliedFiltersContainer.appendChild(chip);
            }
        }
    }
}

/**
 * Creates a DOM element representing an applied filter chip.
 * @param {string} label - The text label for the filter chip.
 * @param {string} sectionKey - The key of the filter section this chip belongs to.
 * @param {boolean} [isRange=false] - Indicates if the filter is a range filter.
 * @returns {HTMLDivElement} The created applied filter chip element.
 */
export function createAppliedFilterChip(label, sectionKey, isRange = false) {
    const chip = document.createElement('div');
    chip.className = 'applied-filter-chip';
    chip.innerHTML = `
        ${label}
        <i class="fas fa-times" data-section="${sectionKey}" data-range="${isRange}"></i>
    `;
    const removeIcon = chip.querySelector('i');
    if (removeIcon) {
        removeIcon.addEventListener('click', (e) => {
            removeAppliedFilter(sectionKey, label, isRange);
        });
    }
    return chip;
}

/**
 * Handles the removal of an applied filter.
 * @param {string} sectionKey - The key of the filter section.
 * @param {string} label - The label of the filter to remove.
 * @param {boolean} isRange - Indicates if the filter is a range filter.
 */
function removeAppliedFilter(sectionKey, label, isRange) {
    if (!currentUserFilters) return;
    const section = currentUserFilters[sectionKey];
    if (isRange) {
        section.options.currentMin = section.options.min;
        section.options.currentMax = section.options.max;
    } else {
        const option = section.options.find(opt => opt.name === label);
        if (option) option.enabled = false;
    }
    renderFilters();
    updateAppliedFilters();
}

// Module: Filter Reset Functionality
/**
 * @module FilterReset
 * This module provides functionality to reset all applied filters.
 */

/**
 * Resets all currently applied filters to their default state.
 * This function is exported to allow external access.
 */
export function resetAllFilters() {
    if (!currentUserFilters) return;

    // Existing reset logic
    for (const [key, section] of Object.entries(currentUserFilters)) {
        if (section.type === 'chips' || section.type === 'checkbox') {
            // Reset all checkbox/chip options by setting enabled to false
            if (Array.isArray(section.options)) {
                section.options.forEach(option => option.enabled = false);
            }
        } else if (section.type === 'dualRange' || section.type === 'range') {
            // Reset range filters to their min/max defaults
            if (section.options && typeof section.options === 'object') {
                section.options.currentMin = section.options.min;
                section.options.currentMax = section.options.max;
            }
        }
    }

    saveFiltersToStorage();
    
    // Dispatch event with clear message
    window.dispatchEvent(new CustomEvent('filtersCleared', {
        detail: "clear all filters"
    }));

    // Existing UI updates
    renderFilters();
    updateAppliedFilters();
}

// Module: Applied Filters Retrieval
/**
 * @module AppliedFiltersRetrieval
 * This module provides functionality to get all currently applied filters.
 */

/**
 * Collects all currently applied filters and returns them as an array.
 * @returns {Array<object>} An array of objects, where each object describes an applied filter.
 */
export function getAppliedFilters() {
    if (!currentUserFilters) return [];

    const appliedFilters = [];

    for (const [key, section] of Object.entries(currentUserFilters)) {
        if (section.type === 'chips' || section.type === 'checkbox') {
            section.options.forEach(opt => {
                if (opt.enabled) {
                    appliedFilters.push({
                        section: section.title,
                        option: opt.name
                    });
                }
            });
        } else if ((section.type === 'dualRange' || section.type === 'range') &&
            (section.options.currentMin !== section.options.min ||
                section.options.currentMax !== section.options.max)) {
            const label = key === 'budget' ?
                `₹${section.options.currentMin.toLocaleString()} - ₹${section.options.currentMax.toLocaleString()}` :
                `${section.options.currentMin.toLocaleString()} - ${section.options.currentMax.toLocaleString()} sq.ft.`;
            appliedFilters.push({
                section: section.title,
                option: label
            });
        }
    }

    return appliedFilters;
}

// Module: DOM Initialization
/**
 * @module DOMInitialization
 * This module handles the initialization of various UI components after the DOM is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    renderFilters();
    initializeCollapsibleSections();
    initializeHideFiltersButton();
    initializeShowFiltersButton();
    initializeRangeSliders();
    initializeClearApplyButtons();
    updateAppliedFilters();
});

// Module: Filter Rendering
/**
 * @module FilterRendering
 * This module is responsible for rendering the filter UI based on the current filters data.
 */

/**
 * Renders the filter sections and their options in the designated container.
 */
export function renderFilters() {
    const container = document.getElementById('filterSections');
    if (!container || !currentUserFilters) return;

    container.innerHTML = '';

    for (const [key, section] of Object.entries(currentUserFilters)) {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'filter-section';

        const header = document.createElement('div');
        header.className = 'filter-section-header';
        header.innerHTML = `
            <h4>${section.title}</h4>
            <i class="fas fa-chevron-down filter-toggle"></i>
        `;

        const content = document.createElement('div');
        content.className = 'filter-section-content';

        switch (section.type) {
            case 'chips':
                content.appendChild(renderChipFilters(key, section.options));
                break;

            case 'checkbox':
                content.appendChild(renderCheckboxFilters(key, section.options));
                break;

            case 'dualRange':
            case 'range':
                content.innerHTML = createRangeSlider(section.options, key);
                break;
        }

        sectionEl.appendChild(header);
        sectionEl.appendChild(content);
        container.appendChild(sectionEl);
    }

    initializeCollapsibleSections();
    initializeRangeSliders();
}

/**
 * Renders chip-style filters for a given section.
 * @param {string} sectionKey - The key of the filter section.
 * @param {Array<object>} options - An array of filter options.
 * @returns {HTMLDivElement} The container element for the chip filters.
 */
function renderChipFilters(sectionKey, options) {
    const chipsContainer = document.createElement('div');
    options.forEach(option => {
        const chip = document.createElement('div');
        chip.className = `filter-chip ${option.enabled ? 'active' : ''}`;
        chip.innerHTML = option.name;
        chip.addEventListener('click', () => toggleFilter(sectionKey, option));
        chipsContainer.appendChild(chip);
    });
    return chipsContainer;
}

/**
 * Renders checkbox-style filters for a given section.
 * @param {string} sectionKey - The key of the filter section.
 * @param {Array<object>} options - An array of filter options.
 * @returns {HTMLDivElement} The container element for the checkbox filters.
 */
function renderCheckboxFilters(sectionKey, options) {
    const checkboxesContainer = document.createElement('div');
    options.forEach(option => {
        const container = document.createElement('div');
        container.className = 'verified-properties';
        container.innerHTML = `
            <label>
                <input type="checkbox" ${option.enabled ? 'checked' : ''}>
                ${option.name}
            </label>
        `;
        const checkbox = container.querySelector('input');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                option.enabled = checkbox.checked;
                // notifyFilterChange(currentUserFilters[sectionKey].title, option.name, option.enabled);
                updateAppliedFilters();
            });
        }
        checkboxesContainer.appendChild(container);
    });
    return checkboxesContainer;
}

/**
 * Creates the HTML structure for a range slider.
 * @param {object} options - The options for the range slider (min, max, currentMin, currentMax, step).
 * @param {string} key - The key of the filter section.
 * @returns {string} The HTML string for the range slider.
 */
function createRangeSlider(options, key) {
    // Make sure we're using strict equality comparison
    const isBudget = key === 'BUDGET';
    
    // Debug check - you can remove this later
    console.log('Creating slider for key:', key, 'isBudget:', isBudget);
    
    const formatValue = val => {
        if (isBudget) {
            return `₹${val.toLocaleString()}`;
        } else {
            return `${val.toLocaleString()} sq.ft.`;
        }
    };

    return `
        <div class="range-slider" data-key="${key}">
            <div class="range-slider-container">
                <div class="range-selected"></div>
                <div class="range-handle min-handle"></div>
                <div class="range-handle max-handle"></div>
            </div>
            <div class="range-values">
                <span>${formatValue(options.currentMin)}</span>
                <span>${formatValue(options.currentMax)}</span>
            </div>
        </div>
    `;
}

// Module: Range Slider Initialization and Handling
/**
 * @module RangeSlider
 * This module initializes and handles the functionality of range sliders.
 */

/**
 * Initializes the range slider components and sets up event listeners.
 */
function initializeRangeSliders() {
    document.querySelectorAll('.range-slider').forEach(slider => {
        const key = slider.dataset.key;
        const options = currentUserFilters[key].options;
        const container = slider.querySelector('.range-slider-container');
        const minHandle = slider.querySelector('.min-handle');
        const maxHandle = slider.querySelector('.max-handle');
        const selectedRange = slider.querySelector('.range-selected');
        const [minDisplay, maxDisplay] = slider.querySelectorAll('.range-values span');

        let isDragging = false;
        let currentHandle = null;
        const minVal = options.min;
        const maxVal = options.max;
        const step = options.step || 1;

        /**
         * Updates the visual state of the range slider based on the current values.
         */
        const updateSlider = () => {
            const containerWidth = container.offsetWidth;
            const minPercent = ((options.currentMin - minVal) / (maxVal - minVal)) * 100;
            const maxPercent = ((options.currentMax - minVal) / (maxVal - minVal)) * 100;

            minHandle.style.left = `${minPercent}%`;
            maxHandle.style.left = `${maxPercent}%`;
            selectedRange.style.left = `${minPercent}%`;
            selectedRange.style.right = `${100 - maxPercent}%`;

            minDisplay.textContent = key === 'BUDGET' ?
                `₹${options.currentMin.toLocaleString()}` :
                `${options.currentMin.toLocaleString()} sq.ft.`;

            maxDisplay.textContent = key === 'BUDGET' ?
                `₹${options.currentMax.toLocaleString()}` :
                `${options.currentMax.toLocaleString()} sq.ft.`;
        };

        /**
         * Calculates the value corresponding to a given position on the slider.
         * @param {number} x - The x-coordinate of the mouse event.
         * @returns {number} The calculated value.
         */
        const getValueFromPosition = (x) => {
            const rect = container.getBoundingClientRect();
            const position = (x - rect.left) / rect.width;
            return Math.round((minVal + position * (maxVal - minVal)) / step) * step;
        };

        /**
         * Handles the mousedown event on a slider handle.
         * @param {HTMLElement} handle - The handle element (min or max).
         * @returns {function} The event listener function.
         */
        const handleMouseDown = (handle) => (e) => {
            e.preventDefault();
            currentHandle = handle;
            isDragging = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        /**
         * Handles the mousemove event while dragging a slider handle.
         * @param {MouseEvent} e - The mouse event object.
         */
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const newVal = getValueFromPosition(e.clientX);

            if (currentHandle === minHandle) {
                options.currentMin = Math.min(newVal, options.currentMax);
            } else {
                options.currentMax = Math.max(newVal, options.currentMin);
            }

            updateSlider();
            // notifyFilterChange(currentUserFilters[key].title,
            //     `${options.currentMin}-${options.currentMax}`, true);
            updateAppliedFilters();
        };

        /**
         * Handles the mouseup event when releasing a slider handle.
         */
        const handleMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        if (minHandle && maxHandle) {
            minHandle.addEventListener('mousedown', handleMouseDown(minHandle));
            maxHandle.addEventListener('mousedown', handleMouseDown(maxHandle));
            updateSlider();
        }
    });
}

// Module: Filter Toggling
/**
 * @module FilterToggling
 * This module handles the toggling of chip-based filters.
 */

/**
 * Toggles the enabled state of a chip filter.
 * @param {string} sectionKey - The key of the filter section.
 * @param {object} option - The filter option object to toggle.
 */
function toggleFilter(sectionKey, option) {
    if (!currentUserFilters) return;
    const section = currentUserFilters[sectionKey];
    const filterOption = section.options.find(opt => opt.name === option.name);
    if (filterOption) {
        filterOption.enabled = !filterOption.enabled;
        // Remove this line to stop immediate notifications
        // notifyFilterChange(section.title, option.name, filterOption.enabled);
        renderFilters();
        updateAppliedFilters();
    }
}



/**
 * Initializes the collapsible behavior for filter sections.
 */
function initializeCollapsibleSections() {
    document.querySelectorAll('.filter-section-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const toggleIcon = header.querySelector('.filter-toggle');
            if (content && toggleIcon) {
                content.classList.toggle('collapsed');
                toggleIcon.classList.toggle('collapsed');
            }
        });
    });
}

// Module: Hide Filters Button
/**
 * @module HideFiltersButton
 * This module handles the functionality of the "Hide Filters" button.
 */

/**
 * Initializes the "Hide Filters" button to toggle the visibility of the filters container.
 */
function initializeHideFiltersButton() {
    const hideButton = document.getElementById('hideFiltersBtn');
    const filtersContainer = document.getElementById('filtersContainer');
    const showButton = document.getElementById('showFiltersBtn');

    if (hideButton && filtersContainer && showButton) {
        hideButton.addEventListener('click', () => {
            filtersContainer.classList.add('hide');
            filtersContainer.classList.remove('show');
            showButton.style.display = 'block';
        });
    }
}

// Module: Show Filters Button
/**
 * @module ShowFiltersButton
 * This module handles the functionality of the "Show Filters" button.
 */

/**
 * Initializes the "Show Filters" button to toggle the visibility of the filters container.
 */
function initializeShowFiltersButton() {
    const showButton = document.getElementById('showFiltersBtn');
    const filtersContainer = document.getElementById('filtersContainer');

    if (showButton && filtersContainer) {
        showButton.addEventListener('click', () => {
            filtersContainer.classList.add('show');
            filtersContainer.classList.remove('hide');
            showButton.style.display = 'none';
        });
    }
}

// Module: Clear and Apply Buttons
/**
 * @module ClearApplyButtons
 * This module handles the functionality of the "Clear Filters" and "Apply Filters" buttons.
 */

/**
 * Initializes the event listeners for the "Clear Filters" and "Apply Filters" buttons.
 */
function initializeClearApplyButtons() {
    const clearBtn = document.getElementById('clearFiltersBtn');
    const applyBtn = document.getElementById('applyFiltersBtn');

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            resetAllFilters();
        });
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            handleApplyFilters();
        });
    }
}


/**
 * Handles the action when the "Apply Filters" button is clicked.
 * It collects the applied filters and dispatches a custom event.
 */
function handleApplyFilters() {
    const appliedFilters = getAppliedFilters();

    if (appliedFilters.length > 0) {
        let filterMessage = "I want to search property with filters: ";

        appliedFilters.forEach((filter, index) => {
            if (index > 0) {
                filterMessage += index === appliedFilters.length - 1 ? " and " : ", ";
            }
            filterMessage += `${filter.option}`;
        });

        // Dispatch the custom event with the filter message
        window.dispatchEvent(new CustomEvent('manualFilterApplied', {
            detail: filterMessage
        }));


    } else {
        window.dispatchEvent(new CustomEvent('manualFilterApplied', {
            detail: "Please select filters."
        }));
    }
}



// In filter_script.js
/**
 * Applies filters received from the bot to the current user filters.
 * @param {Array<object>} customFilters - Array of filter objects from the bot.
 */
export function applyBotFilters(customFilters) {
    if (!currentUserFilters || !customFilters) return;

    customFilters.forEach(filter => {
        const filterType = filter.type;
        const section = currentUserFilters[filterType];
        if (!section || !filter.value) return;

        // Convert value to an array if it's not already
        const enabledOptions = Array.isArray(filter.value) ? filter.value : [filter.value];
        
        // Update each option in the section based on the value array
        section.options.forEach(option => {
            option.enabled = enabledOptions.includes(option.name);
        });
    });

    saveFiltersToStorage();
    renderFilters();
    updateAppliedFilters();
}