import { DbCollapse } from './components/DbCollapse';
import { DbSelect } from './components/DbSelect';
// @ts-ignore: Allow SCSS import
import './styles/mapping.scss';

// Import the mapping data with type assertion
// @ts-ignore: Allow JSON import
import * as mappingDataModule from './data/mapping.json';
const mappingData = mappingDataModule as unknown as MappingData;

// Define interfaces for the mapping data structure
interface MappingData {
  tables: TableMapping[];
}

interface TableMapping {
  table_name: string;
  mapping_status: string;
  mapping_summary: {
    total_fields: number;
    mapped_fields: number;
    unmapped_fields: number;
    confidence_score: number;
  };
  header_mapping: FieldMapping[];
  unmapped_fields: UnmappedField[];
  validation_status: string;
  message: string;
}

interface FieldMapping {
  source_field: string;
  target_field: string;
  confidence: number;
}

interface UnmappedField {
  source_field: string;
  error_type: string;
  expected_format?: string;
  suggested_fix: string;
  manual_fix_required: boolean;
}

export class MappingVisualizer {
  private container: HTMLElement | null;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with ID "${containerId}" not found.`);
    }
  }

  /**
   * Initialize the mapping visualization
   */
  public initialize(): void {
    if (!this.container) return;
    
    // Clear any existing content
    this.container.innerHTML = '';
    
    // Create a collapsible component for each table
    mappingData.tables.forEach((table, index) => {
      this.createTableCollapse(table, index);
    });
  }

  /**
   * Create a collapsible component for a table
   */
  private createTableCollapse(table: TableMapping, index: number): void {
    if (!this.container) return;

    // Create the collapse element
    const collapseId = `table-${index}`;
    const collapse = document.createElement('db-collapse') as DbCollapse;
    collapse.id = collapseId;
    collapse.title = `${table.table_name} (${this.getStatusBadge(table.mapping_status)})`;
    collapse.ariaLabel = `Table mapping for ${table.table_name}`;
    collapse.expanded = index === 0; // Expand the first table by default

    // Create the content for the collapse
    const content = document.createElement('div');
    content.className = 'mapping-table-content';

    // Add mapping summary
    const summary = document.createElement('div');
    summary.className = 'mapping-summary';
    summary.innerHTML = `
      <p><strong>Mapping Summary:</strong> ${table.mapping_summary.mapped_fields}/${table.mapping_summary.total_fields} fields mapped 
      (${Math.round(table.mapping_summary.confidence_score * 100)}% confidence)</p>
      <p><strong>Status:</strong> ${table.validation_status}</p>
      <p><strong>Message:</strong> ${table.message}</p>
    `;
    content.appendChild(summary);

    // Add header mappings
    if (table.header_mapping && table.header_mapping.length > 0) {
      const mappingsContainer = document.createElement('div');
      mappingsContainer.className = 'header-mappings';
      mappingsContainer.innerHTML = '<h3>Field Mappings</h3>';

      const mappingsList = document.createElement('ul');
      mappingsList.setAttribute('aria-label', 'List of mapped fields');
      mappingsList.className = 'mappings-list';

      table.header_mapping.forEach((mapping: FieldMapping) => {
        const mappingItem = document.createElement('li');
        mappingItem.className = 'mapping-item';
        
        // Source field
        const sourceField = document.createElement('div');
        sourceField.className = 'source-field';
        sourceField.innerHTML = `<strong>Source:</strong> ${mapping.source_field}`;
        
        // Target field (as select)
        const targetContainer = document.createElement('div');
        targetContainer.className = 'target-field';
        
        const targetLabel = document.createElement('strong');
        targetLabel.textContent = 'Target: ';
        targetContainer.appendChild(targetLabel);
        
        // Create target field select
        const targetSelect = document.createElement('db-select') as DbSelect;
        targetSelect.id = `target-select-${index}-${mapping.source_field}`;
        
        // Generate options for the select
        // This would normally come from your available target fields
        const targetOptions = [
          { value: mapping.target_field, label: mapping.target_field },
          { value: 'customer_id', label: 'customer_id' },
          { value: 'transaction_id', label: 'transaction_id' },
          { value: 'purchase_date', label: 'purchase_date' },
          { value: 'contact_number', label: 'contact_number' },
          { value: 'customer_name', label: 'customer_name' }
        ];
        
        // Remove duplicates
        const uniqueOptions = targetOptions.filter((option, index, self) => 
          index === self.findIndex((t) => t.value === option.value)
        );
        
        targetSelect.setAttribute('options', JSON.stringify(uniqueOptions));
        targetSelect.value = mapping.target_field;
        
        targetContainer.appendChild(targetSelect);
        
        // Confidence indicator
        const confidence = document.createElement('div');
        confidence.className = 'confidence';
        confidence.innerHTML = `<strong>Confidence:</strong> ${Math.round(mapping.confidence * 100)}%`;
        
        // Add all elements to the mapping item
        mappingItem.appendChild(sourceField);
        mappingItem.appendChild(targetContainer);
        mappingItem.appendChild(confidence);
        
        mappingsList.appendChild(mappingItem);
      });

      mappingsContainer.appendChild(mappingsList);
      content.appendChild(mappingsContainer);
    }

    // Add unmapped fields
    if (table.unmapped_fields && table.unmapped_fields.length > 0) {
      const unmappedContainer = document.createElement('div');
      unmappedContainer.className = 'unmapped-fields';
      unmappedContainer.innerHTML = '<h3>Unmapped Fields</h3>';

      const unmappedList = document.createElement('ul');
      unmappedList.setAttribute('aria-label', 'List of unmapped fields');
      unmappedList.className = 'unmapped-list';

      table.unmapped_fields.forEach((unmapped: UnmappedField) => {
        const unmappedItem = document.createElement('li');
        unmappedItem.className = 'unmapped-item';
        
        // Source field
        const sourceField = document.createElement('div');
        sourceField.className = 'source-field';
        sourceField.innerHTML = `<strong>Source:</strong> ${unmapped.source_field}`;
        
        // Error type
        const errorType = document.createElement('div');
        errorType.className = 'error-type';
        errorType.innerHTML = `<strong>Error:</strong> ${unmapped.error_type}`;
        
        // Suggested fix
        const suggestedFix = document.createElement('div');
        suggestedFix.className = 'suggested-fix';
        suggestedFix.innerHTML = `<strong>Suggested Fix:</strong> ${unmapped.suggested_fix}`;
        
        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'actions';
        
        if (unmapped.manual_fix_required) {
          // For manual fixes
          const fixButton = document.createElement('db-button');
          fixButton.setAttribute('variant', 'primary');
          fixButton.setAttribute('icon', 'bx bx-wrench');
          fixButton.textContent = 'Manual Fix';
          actions.appendChild(fixButton);
        } else {
          // For automated fixes
          const applyButton = document.createElement('db-button');
          applyButton.setAttribute('variant', 'primary');
          applyButton.setAttribute('icon', 'bx bx-check');
          applyButton.textContent = 'Apply Fix';
          actions.appendChild(applyButton);
        }
        
        // Skip button
        const skipButton = document.createElement('db-button');
        skipButton.setAttribute('variant', 'secondary');
        skipButton.setAttribute('icon', 'bx bx-skip-next');
        skipButton.textContent = 'Skip';
        actions.appendChild(skipButton);
        
        // Add all elements to the unmapped item
        unmappedItem.appendChild(sourceField);
        unmappedItem.appendChild(errorType);
        unmappedItem.appendChild(suggestedFix);
        unmappedItem.appendChild(actions);
        
        unmappedList.appendChild(unmappedItem);
      });

      unmappedContainer.appendChild(unmappedList);
      content.appendChild(unmappedContainer);
    }

    // Add the content to the collapse
    collapse.appendChild(content);
    
    // Add the collapse to the container
    this.container.appendChild(collapse);
  }

  /**
   * Get a status badge based on mapping status
   */
  private getStatusBadge(status: string): string {
    switch (status) {
      case 'success':
        return '✅ Success';
      case 'partial_success':
        return '⚠️ Partial';
      case 'failed':
        return '❌ Failed';
      default:
        return status;
    }
  }
}

// Initialize the mapping visualizer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const visualizer = new MappingVisualizer('mapping-tables-container');
  visualizer.initialize();
});
