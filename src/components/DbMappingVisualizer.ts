import { html, LitElement, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
// @ts-ignore: Allow SCSS import
import styles from '../styles/mapping.scss?inline';

// Define interfaces for the mapping data structure
export interface MappingData {
  tables: TableMapping[];
}

export interface TableMapping {
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

export interface FieldMapping {
  source_field: string;
  target_field: string;
  confidence: number;
}

export interface UnmappedField {
  source_field: string;
  error_type: string;
  expected_format?: string;
  suggested_fix: string;
  manual_fix_required: boolean;
}

@customElement('db-mapping-visualizer')
export class DbMappingVisualizer extends LitElement {
  static styles = css`${unsafeCSS(styles)}`;

  @property({
    type: Object,
    attribute: 'mapping-data',
    converter: {
      fromAttribute: (value: string) => {
        try {
          return value ? JSON.parse(value) : { tables: [] };
        } catch (e) {
          console.error('Error parsing mapping data:', e);
          return { tables: [] };
        }
      },
      toAttribute: (value: MappingData) => JSON.stringify(value)
    }
  })
  mappingData: MappingData = { tables: [] };

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

  /**
   * Handle manual fix button click
   */
  private handleManualFix(sourceField: string) {
    console.log(`Manual fix requested for ${sourceField}`);
    this.dispatchEvent(new CustomEvent('manual-fix', {
      detail: { sourceField },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Get all unique target fields from the mapping data
   */
  private getAllTargetFields(): string[] {
    const targetFields = new Set<string>();
    
    // Extract all target fields from all tables
    this.mappingData.tables.forEach(table => {
      table.header_mapping.forEach(mapping => {
        if (mapping.target_field) {
          targetFields.add(mapping.target_field);
        }
      });
    });
    
    return Array.from(targetFields);
  }

  /**
   * Generate options for the target field select
   * Ensures no duplicate options are included and sorts them alphabetically
   */
  private generateTargetFieldOptions(currentValue: string): {value: string, label: string}[] {
    // Get all unique target fields
    const allTargetFields = this.getAllTargetFields();
    
    // Create options array with the current value first
    const options = [
      { value: currentValue, label: currentValue }
    ];
    
    // Get all other fields (excluding current value) and sort them alphabetically
    const otherFields = allTargetFields
      .filter(field => field !== currentValue)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    
    // Add the sorted fields to the options
    otherFields.forEach(field => {
      options.push({ value: field, label: field });
    });
    
    // Ensure no duplicates by using a Set and reconstructing the array
    const uniqueOptions = Array.from(
      new Map(options.map(item => [item.value, item])).values()
    );
    
    return uniqueOptions;
  }

  /**
   * Handle target field change
   */
  private handleTargetChange(event: Event, tableIndex: number, sourceField: string) {
    const select = event.target as HTMLElement;
    const value = (select as any).value;
    
    console.log(`Target field for ${sourceField} changed to ${value}`);
    this.dispatchEvent(new CustomEvent('target-change', {
      detail: { tableIndex, sourceField, targetField: value },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle apply fix button click
   */
  private handleApplyFix(sourceField: string) {
    console.log(`Apply fix requested for ${sourceField}`);
    this.dispatchEvent(new CustomEvent('apply-fix', {
      detail: { sourceField },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle skip button click
   */
  private handleSkip(sourceField: string) {
    console.log(`Skip requested for ${sourceField}`);
    this.dispatchEvent(new CustomEvent('skip-fix', {
      detail: { sourceField },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="mapping-visualizer">
        ${this.mappingData.tables.map((table, index) => html`
          <db-collapse 
            id="table-${index}"
            title="${table.table_name} (${this.getStatusBadge(table.mapping_status)})"
            aria-label="Table mapping for ${table.table_name}"
            ?expanded="${index === 0}"
          >
            <div class="mapping-table-content">
              <!-- Mapping Summary -->
              <div class="mapping-summary">
                <p>
                  <strong>Mapping Summary:</strong> 
                  ${table.mapping_summary.mapped_fields}/${table.mapping_summary.total_fields} fields mapped 
                  (${Math.round(table.mapping_summary.confidence_score * 100)}% confidence)
                </p>
                <p><strong>Status:</strong> ${table.validation_status}</p>
                <p><strong>Message:</strong> ${table.message}</p>
              </div>

              <!-- Header Mappings -->
              ${table.header_mapping && table.header_mapping.length > 0 ? html`
                <div class="header-mappings">
                  <h3>Field Mappings</h3>
                  <ul aria-label="List of mapped fields" class="mappings-list">
                    ${table.header_mapping.map(mapping => html`
                      <li class="mapping-item">
                        <div class="source-field">
                          <strong>Source:</strong> ${mapping.source_field}
                        </div>
                        <div class="target-field">
                          <strong>Target: </strong>
                          <db-select 
                            id="target-select-${index}-${mapping.source_field}"
                            .options=${this.generateTargetFieldOptions(mapping.target_field)}
                            value="${mapping.target_field}"
                            @change="${(e: Event) => this.handleTargetChange(e, index, mapping.source_field)}"
                          ></db-select>
                        </div>
                        <div class="confidence">
                          <strong>Confidence:</strong> ${Math.round(mapping.confidence * 100)}%
                        </div>
                      </li>
                    `)}
                  </ul>
                </div>
              ` : ''}

              <!-- Unmapped Fields -->
              ${table.unmapped_fields && table.unmapped_fields.length > 0 ? html`
                <div class="unmapped-fields">
                  <h3>Unmapped Fields</h3>
                  <ul aria-label="List of unmapped fields" class="unmapped-list">
                    ${table.unmapped_fields.map(unmapped => html`
                      <li class="unmapped-item">
                        <div class="source-field">
                          <strong>Source:</strong> ${unmapped.source_field}
                        </div>
                        <div class="error-type">
                          <strong>Error:</strong> ${unmapped.error_type}
                        </div>
                        ${unmapped.expected_format ? html`
                          <div class="expected-format">
                            <strong>Expected Format:</strong> ${unmapped.expected_format}
                          </div>
                        ` : ''}
                        <div class="suggested-fix">
                          <strong>Suggested Fix:</strong> ${unmapped.suggested_fix}
                        </div>
                        <div class="actions">
                          ${unmapped.manual_fix_required ? html`
                            <db-button 
                              variant="primary"
                              icon="bx bx-wrench"
                              @click="${() => this.handleManualFix(unmapped.source_field)}"
                            >
                              Manual Fix
                            </db-button>
                          ` : html`
                            <db-button 
                              variant="primary"
                              icon="bx bx-check"
                              @click="${() => this.handleApplyFix(unmapped.source_field)}"
                            >
                              Apply Fix
                            </db-button>
                          `}
                          <db-button 
                            variant="secondary"
                            icon="bx bx-skip-next"
                            @click="${() => this.handleSkip(unmapped.source_field)}"
                          >
                            Skip
                          </db-button>
                        </div>
                      </li>
                    `)}
                  </ul>
                </div>
              ` : ''}
            </div>
          </db-collapse>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'db-mapping-visualizer': DbMappingVisualizer;
  }
}
