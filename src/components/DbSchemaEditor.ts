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
  




  constructor() {
    super();
    this.schemaText = '';
  }

  /**
   * Handle schema text changes
   */
  private handleSchemaChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.schemaText = textarea.value;
    this.errorMessage = '';
    
    // Automatically validate the schema when it changes
    try {
      if (this.schemaText.trim()) {
        const schema = JSON.parse(this.schemaText);
        this.schemaData = schema;
        this.showPreview = true;
        
        // Dispatch an event with the schema data
        this.dispatchEvent(new CustomEvent('schema-updated', {
          detail: { schema },
          bubbles: true,
          composed: true
        }));
      } else {
        this.showPreview = false;
      }
    } catch (error: any) {
      this.errorMessage = `Error parsing schema: ${error.message}`;
      this.showPreview = false;
    }
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
            <db-button @click=${this.clearSchema}>Clear</db-button>
          </div>
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
