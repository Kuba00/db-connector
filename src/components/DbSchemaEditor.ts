import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './DbButton';

/**
 * DbSchemaEditor component
 * 
 * A component that allows users to input and edit database schema information
 * before mapping data.
 */
@customElement('db-schema-editor')
export class DbSchemaEditor extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: 'Hind', sans-serif;
    }
    
    .schema-editor-container {
      padding: 20px;
      background-color: #f9f9f9;
      margin-bottom: 20px;
    }
    
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .controls {
      display: flex;
      gap: 10px;
    }
    
    .schema-textarea {
      width: 100%;
      min-height: 200px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      resize: vertical;
      background-color: #fff;
    }
    
    .schema-textarea:focus {
      outline: none;
      border-color: #03b5d2;
      box-shadow: 0 0 0 2px rgba(3, 181, 210, 0.2);
    }
    
    .error-message {
      color: #dc3545;
      margin-top: 8px;
      font-size: 14px;
    }
    
    .schema-preview {
      margin-top: 15px;
      padding: 15px;
    }
    
    .schema-preview h4 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 1rem;
      color: #333;
    }
    
    .schema-json {
      overflow: auto;
      max-height: 200px;
      padding: 10px;
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
    }
    
    .template-selector {
      margin-bottom: 15px;
    }
    
    .template-selector select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      background-color: #fff;
    }
    
    .help-text {
      margin-top: 8px;
      font-size: 14px;
      color: #666;
    }
  `;

  /**
   * The title of the schema editor
   */
  @property({ type: String })
  title = 'Database Schema Editor';

  /**
   * The schema data
   */
  @property({ type: Object })
  schemaData = null;

  /**
   * The schema text value
   */
  @state()
  private schemaText = '';

  /**
   * Error message if schema parsing fails
   */
  @state()
  private errorMessage = '';

  /**
   * Flag to show schema preview
   */
  @state()
  private showPreview = false;

  /**
   * Available schema templates
   */
  private schemaTemplates = {
    empty: '',
    simple: `{
  "tables": [
    {
      "name": "users",
      "fields": [
        { "name": "id", "type": "integer", "primary": true },
        { "name": "username", "type": "string", "length": 50 },
        { "name": "email", "type": "string", "length": 100 },
        { "name": "created_at", "type": "datetime" }
      ]
    },
    {
      "name": "posts",
      "fields": [
        { "name": "id", "type": "integer", "primary": true },
        { "name": "user_id", "type": "integer", "foreign_key": "users.id" },
        { "name": "title", "type": "string", "length": 200 },
        { "name": "content", "type": "text" },
        { "name": "published", "type": "boolean", "default": false },
        { "name": "created_at", "type": "datetime" }
      ]
    }
  ]
}`,
    complex: `{
  "tables": [
    {
      "name": "customers",
      "fields": [
        { "name": "id", "type": "integer", "primary": true, "auto_increment": true },
        { "name": "first_name", "type": "string", "length": 50, "nullable": false },
        { "name": "last_name", "type": "string", "length": 50, "nullable": false },
        { "name": "email", "type": "string", "length": 100, "unique": true },
        { "name": "phone", "type": "string", "length": 20 },
        { "name": "address", "type": "string", "length": 255 },
        { "name": "created_at", "type": "datetime", "default": "CURRENT_TIMESTAMP" }
      ],
      "indexes": [
        { "name": "idx_customer_email", "fields": ["email"] },
        { "name": "idx_customer_name", "fields": ["last_name", "first_name"] }
      ]
    },
    {
      "name": "products",
      "fields": [
        { "name": "id", "type": "integer", "primary": true, "auto_increment": true },
        { "name": "name", "type": "string", "length": 100, "nullable": false },
        { "name": "description", "type": "text" },
        { "name": "price", "type": "decimal", "precision": 10, "scale": 2, "nullable": false },
        { "name": "stock", "type": "integer", "default": 0 },
        { "name": "category_id", "type": "integer", "foreign_key": "categories.id" }
      ]
    },
    {
      "name": "categories",
      "fields": [
        { "name": "id", "type": "integer", "primary": true, "auto_increment": true },
        { "name": "name", "type": "string", "length": 50, "nullable": false },
        { "name": "parent_id", "type": "integer", "foreign_key": "categories.id", "nullable": true }
      ]
    },
    {
      "name": "orders",
      "fields": [
        { "name": "id", "type": "integer", "primary": true, "auto_increment": true },
        { "name": "customer_id", "type": "integer", "foreign_key": "customers.id", "nullable": false },
        { "name": "order_date", "type": "datetime", "default": "CURRENT_TIMESTAMP" },
        { "name": "status", "type": "string", "length": 20, "default": "pending" },
        { "name": "total", "type": "decimal", "precision": 10, "scale": 2 }
      ]
    },
    {
      "name": "order_items",
      "fields": [
        { "name": "id", "type": "integer", "primary": true, "auto_increment": true },
        { "name": "order_id", "type": "integer", "foreign_key": "orders.id", "nullable": false },
        { "name": "product_id", "type": "integer", "foreign_key": "products.id", "nullable": false },
        { "name": "quantity", "type": "integer", "default": 1 },
        { "name": "price", "type": "decimal", "precision": 10, "scale": 2, "nullable": false }
      ],
      "indexes": [
        { "name": "idx_order_product", "fields": ["order_id", "product_id"], "unique": true }
      ]
    }
  ]
}`
  };

  constructor() {
    super();
    this.schemaText = this.schemaTemplates.simple;
  }

  /**
   * Handle schema text changes
   */
  private handleSchemaChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.schemaText = textarea.value;
    this.errorMessage = '';
  }

  /**
   * Parse and validate the schema
   */
  private parseSchema() {
    try {
      if (!this.schemaText.trim()) {
        this.errorMessage = 'Schema cannot be empty';
        return null;
      }

      const schema = JSON.parse(this.schemaText);
      this.schemaData = schema;
      this.showPreview = true;
      this.errorMessage = '';

      // Dispatch an event with the schema data
      this.dispatchEvent(new CustomEvent('schema-updated', {
        detail: { schema },
        bubbles: true,
        composed: true
      }));

      return schema;
    } catch (error: any) {
      this.errorMessage = `Error parsing schema: ${error.message}`;
      this.showPreview = false;
      return null;
    }
  }

  /**
   * Handle template selection
   */
  private handleTemplateChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const template = select.value;
    this.schemaText = this.schemaTemplates[template as keyof typeof this.schemaTemplates] || '';
    this.errorMessage = '';
  }

  /**
   * Clear the schema text
   */
  private clearSchema() {
    this.schemaText = '';
    this.errorMessage = '';
    this.showPreview = false;
  }

  render() {
    return html`
      <div class="schema-editor-container" role="region" aria-label="Database schema editor" id="schema-editor">
        <div class="editor-header">
          <h3 id="schema-editor-title">${this.title}</h3>
          <div class="controls" role="group" aria-labelledby="schema-editor-title">
            <db-button @click=${this.parseSchema}>Validate Schema</db-button>
            <db-button @click=${this.clearSchema}>Clear</db-button>
          </div>
        </div>
        
        <div class="template-selector">
          <label for="template-select">Choose a template: </label>
          <select id="template-select" @change=${this.handleTemplateChange}>
            <option value="empty">Empty</option>
            <option value="simple" selected>Simple (Users & Posts)</option>
            <option value="complex">Complex (E-commerce)</option>
          </select>
        </div>
        
        <div class="help-text">
          <p>Enter your database schema in JSON format. The schema should define tables, fields, and relationships.</p>
        </div>
        
        <textarea 
          class="schema-textarea" 
          .value=${this.schemaText}
          @input=${this.handleSchemaChange}
          placeholder="Enter your database schema in JSON format"
          aria-label="Database schema input area"
          spellcheck="false"
        ></textarea>
        
        ${this.errorMessage ? html`
          <div class="error-message" role="alert">
            ${this.errorMessage}
          </div>
        ` : ''}
        
        ${this.showPreview && this.schemaData ? html`
          <div class="schema-preview" role="region" aria-labelledby="schema-preview-heading">
            <h4 id="schema-preview-heading">Schema Preview:</h4>
            <pre class="schema-json">${JSON.stringify(this.schemaData, null, 2)}</pre>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'db-schema-editor': DbSchemaEditor;
  }
}
