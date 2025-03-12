import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import './DbFileInput';
import './DbProgressBar';
import './DbMappingVisualizer';
import './DbButton';


/**
 * DbMappingUploader component
 * 
 * A component that combines file input functionality with mapping visualization
 * for database mapping files.
 */
@customElement('db-mapping-uploader')
export class DbMappingUploader extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: 'Hind', sans-serif;
    }
    
    .uploader-container {
      padding: 20px;
      background-color: #f9f9f9;
    }
    
    .uploader-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .controls {
      display: flex;
      gap: 10px;
    }
    
    .section {
      margin-top: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 15px;
      background-color: #fff;
    }
    
    .section h4 {
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 1.1rem;
      color: #333;
    }
    

    
    .event-log {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 10px;
      background-color: #f8f9fa;
      font-family: monospace;
      font-size: 0.85rem;
      margin-top: 10px;
    }
    
    .log-item {
      padding: 4px 0;
      border-bottom: 1px solid #eee;
    }
    
    .log-item:last-child {
      border-bottom: none;
    }
    
    .log-item .timestamp {
      color: #666;
      margin-right: 8px;
    }
    
    .log-item .event-type {
      font-weight: bold;
      color: #03b5d2;
    }
    
    .log-item.success .event-type {
      color: #28a745;
    }
    
    .log-item.error .event-type {
      color: #dc3545;
    }
    

    
    .visualizer-container {
      margin-top: 20px;
    }
    
    .mapping-output {
      margin-top: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f5f5f5;
    }
    
    .mapping-output h5 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 1rem;
      color: #333;
    }
    
    .mapping-json {
      overflow: auto;
      max-height: 300px;
      padding: 10px;
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
    }
  `;

  /**
   * The title of the uploader component
   */
  @property({ type: String })
  title = 'Database Mapping Uploader';

  /**
   * The label for the file input area
   */
  @property({ type: String })
  label = 'Drag & Drop your mapping file here';

  /**
   * The sublabel for the file input area
   */
  @property({ type: String })
  sublabel = 'or click to browse';

  /**
   * The accepted file types
   */
  @property({ type: String })
  accept = '.json,.csv,.xlsx';

  /**
   * Whether multiple files are allowed
   */
  @property({ type: Boolean })
  multiple = false;

  /**
   * The API URL to fetch mapping data
   */
  @property({ type: String })
  apiUrl = 'http://localhost:3100/api/mapping';

  /**
   * The schema data from the schema editor
   */
  @property({ type: Object })
  schemaData = null;

  /**
   * The mapping data to visualize
   */
  @property({ type: Object })
  mappingData = null;

  /**
   * Flag to track if the file has been successfully loaded
   */
  @state()
  private fileLoaded = false;

  /**
   * Flag to track if the mapping visualization should be shown
   */
  @state()
  private showMappingVisualization = false;

  /**
   * Validated mapping data for display
   */
  @state()
  private validatedMapping = null;

  /**
   * Flag to indicate if the mapping has been validated
   */
  @state()
  private isValidated = false;

  /**
   * Upload progress percentage
   */
  @state()
  private uploadProgress = 0;

  /**
   * Current file being processed
   */
  @state()
  private currentFile: File | null = null;



  /**
   * The event log entries
   */
  @state()
  private eventLog: Array<{ timestamp: string; type: string; message: string; eventClass: string }> = [];



  /**
   * Called after the component's first update
   */
  firstUpdated() {
    // Add event listeners for mapping events
    this.setupMappingEventListeners();
    
    // Add event listeners for file input events
    this.setupFileInputEventListeners();
  }

  /**
   * Setup event listeners for mapping visualization events
   */
  private setupMappingEventListeners() {
    // We need to add the event listeners after the component is rendered and updated
    this.addEventListener('mapping-loaded', () => {
      // Wait a bit to ensure the visualizer is in the DOM
      setTimeout(() => {
        const visualizer = this.shadowRoot?.querySelector('#mapping-visualizer');
        if (visualizer) {
          // Listen for real-time changes to the mapping
          visualizer.addEventListener('mapping-change', (event: any) => {
            this.handleMappingChange(event);
          });

          // Listen for validation events
          visualizer.addEventListener('validate-mapping', (event: any) => {
            this.handleValidateMapping(event);
          });
        }
      }, 1500);
    });
  }
  
  /**
   * Setup event listeners for file input events
   */
  private setupFileInputEventListeners() {
    // Get the file input component
    const fileInput = this.shadowRoot?.querySelector('db-file-input');
    if (fileInput) {
      // Listen for upload progress events
      fileInput.addEventListener('upload-progress', ((event: Event) => {
        const customEvent = event as CustomEvent;
        this.handleFileUploadProgress(customEvent);
      }) as EventListener);
      
      // Listen for upload complete events
      fileInput.addEventListener('upload-complete', ((event: Event) => {
        const customEvent = event as CustomEvent;
        this.handleFileUploadComplete(customEvent);
      }) as EventListener);
    }
  }

  /**
   * Handle mapping change events
   */
  private handleMappingChange(event: any) {
    const mapping = event.detail.mapping;
    this.logEvent('mapping-change', 'Mapping updated', 'success');
    console.log('Mapping changed:', mapping);
  }
  
  /**
   * Handle file upload progress events from the file input component
   * @param event The upload progress event
   */
  private handleFileUploadProgress(event: CustomEvent) {
    const { file, progress } = event.detail;
    
    // Update the progress state
    this.uploadProgress = progress;
    this.currentFile = file;
    
    // Update the progress bar if it exists
    if (this.progressBar) {
      this.progressBar.setProgress(progress);
    }
    
    // Log the progress event
    this.logEvent('upload-progress', `${file.name}: ${progress}%`);
  }
  
  /**
   * Handle file upload complete events from the file input component
   * @param event The upload complete event
   */
  private handleFileUploadComplete(event: CustomEvent) {
    const { file } = event.detail;
    
    this.logEvent('success', 'File uploaded successfully', 'success');
    this.logEvent('upload-complete', `${file.name} uploaded successfully`, 'success');
    
    // Set the fileLoaded flag to true when upload is complete
    this.fileLoaded = true;
    
    // Fetch mapping data from API after upload is complete
    this.fetchMappingFromApi();
    
    // Show mapping visualization after a delay to ensure everything is loaded
    setTimeout(() => {
      this.showMappingVisualization = true;
    }, 1000);
  }

  /**
   * Handle validate mapping events
   */
  private handleValidateMapping(event: any) {
    const mapping = event.detail.mapping;
    this.validatedMapping = mapping;
    this.isValidated = true;
    this.logEvent('validate-mapping', 'Mapping validated', 'success');
    console.log('Validated mapping:', mapping);

    // Force re-render to show the validated mapping
    this.requestUpdate();
  }

  /**
   * Handles the file selection event
   * @param e The custom event containing the selected files
   */
  private handleFilesSelected(e: CustomEvent) {
    const files = e.detail.files;
    this.logEvent('files-selected', `${files.length} file(s) selected`);

    // Process the first file if it exists
    if (files.length > 0) {
      const file = files[0];
      this.logEvent('processing', `Processing file: ${file.name}`);

      // Read the file based on its type
      if (file.name.endsWith('.json')) {
        this.readJsonFile(file);
      } else if (file.name.endsWith('.csv')) {
        this.logEvent('error', 'CSV parsing not implemented yet', 'error');
      } else if (file.name.endsWith('.xlsx')) {
        this.logEvent('error', 'XLSX parsing not implemented yet', 'error');
      } else {
        this.logEvent('error', 'Unsupported file format', 'error');
      }
    }
  }

  /**
   * Reads a JSON file and sets the mapping data
   * @param file The JSON file to read
   */
  private readJsonFile(file: File) {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result);
        this.mappingData = data;

        // Log the successful parsing of the file
        this.logEvent('success', 'JSON file parsed successfully', 'success');

        // Dispatch an event with the mapping data
        this.dispatchEvent(new CustomEvent('mapping-loaded', {
          detail: { data },
          bubbles: true,
          composed: true
        }));
      } catch (error) {
        this.logEvent('error', `Error parsing JSON: ${error}`, 'error');
      }
    };

    reader.onerror = () => {
      this.logEvent('error', 'Error reading file', 'error');
    };

    reader.readAsText(file);
  }



  /**
   * Loading state for the visualizer
   */
  @state()
  private isLoading = false;

  /**
   * Error message if API fetch fails
   */
  @state()
  private errorMessage = '';

  /**
   * Validates if all required data is available before making an API call
   * @returns An object with validation result and error message if any
   */
  private validateApiRequirements(): { isValid: boolean; errorMessage?: string } {
    // Check if schema data is available
    if (!this.schemaData) {
      return { 
        isValid: false, 
        errorMessage: 'Database schema is required. Please define a schema in the Database Schema Editor.' 
      };
    }

    // Check if file has been uploaded
    if (!this.currentFile || !this.fileLoaded) {
      return { 
        isValid: false, 
        errorMessage: 'A mapping file is required. Please upload a file first.' 
      };
    }

    return { isValid: true };
  }

  /**
   * Fetches mapping data from the API
   */
  private fetchMappingFromApi() {
    // Validate requirements before making API call
    const validation = this.validateApiRequirements();
    if (!validation.isValid) {
      this.errorMessage = validation.errorMessage || 'Missing required data for API call';
      this.logEvent('error', this.errorMessage, 'error');
      return;
    }

    this.logEvent('api-request', `Fetching mapping data from ${this.apiUrl}`);

    // Set loading state
    this.isLoading = true;
    this.errorMessage = '';

    // Prepare headers for JSON content
    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    // Prepare request body with both schema data and mapping file information
    const requestBody = {
      schemaData: this.schemaData,
      mappingFile: this.currentFile ? {
        name: this.currentFile.name,
        size: this.currentFile.size,
        type: this.currentFile.type
      } : null
    };

    fetch(this.apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        this.logEvent('api-success', 'Mapping data fetched successfully', 'success');

        // Reset loading and error states
        this.isLoading = false;
        this.errorMessage = '';

        // Update the mapping data property
        this.mappingData = data;

        // Make sure fileLoaded is true - the mapping visualization should be visible
        // This ensures the mapping visualization is shown after a successful API call
        if (!this.fileLoaded) {
          this.fileLoaded = true;

          // Show mapping visualization after a delay to ensure everything is loaded
          setTimeout(() => {
            this.showMappingVisualization = true;
          }, 1000);
        }

        // Wait for the next render cycle to update the visualizer
        setTimeout(() => {
          // Update the mapping visualizer with the new data
          const visualizer = this.shadowRoot?.querySelector('#mapping-visualizer');
          if (visualizer) {
            visualizer.setAttribute('mapping-data', JSON.stringify(data));
          }
        }, 0);

        // Dispatch an event with the mapping data
        this.dispatchEvent(new CustomEvent('mapping-loaded', {
          detail: { data },
          bubbles: true,
          composed: true
        }));

        // Force re-render to ensure the visualizer is updated
        this.requestUpdate();

        // Announce to screen readers that mapping data is loaded
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.style.position = 'absolute';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = 'Mapping data loaded successfully';

        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 3000);
      })
      .catch(error => {
        this.logEvent('api-error', `Error fetching mapping data: ${error}`, 'error');

        // Set error state
        this.isLoading = false;
        this.errorMessage = error.message;

        // Force re-render to show the error message
        this.requestUpdate();
      });
  }

  /**
   * Logs an event to the event log
   * @param type The type of event
   * @param message The event message
   * @param eventClass The CSS class for styling the event
   */
  private logEvent(type: string, message: string, eventClass: string = 'info') {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    this.eventLog = [
      { timestamp, type, message, eventClass },
      ...this.eventLog
    ].slice(0, 50); // Keep only the last 50 events

    // Dispatch an event for external listeners
    this.dispatchEvent(new CustomEvent('log-event', {
      detail: { timestamp, type, message, eventClass },
      bubbles: true,
      composed: true
    }));
  }



  /**
   * Reference to the file input element
   */
  @query('db-file-input')
  private fileInput!: HTMLElement;

  /**
   * Reference to the progress bar element
   */
  @query('db-progress-bar')
  private progressBar?: HTMLElement & { setProgress: (value: number) => void };

  /**
   * Clears the event log, mapping visualization, and resets the file input
   */
  private clearEventLog() {
    // Clear event log
    this.eventLog = [];

    // Reset mapping data and states
    this.mappingData = null;
    this.fileLoaded = false;
    this.showMappingVisualization = false;
    this.isLoading = false;
    this.errorMessage = '';
    this.uploadProgress = 0;
    this.currentFile = null;
    this.validatedMapping = null;
    this.isValidated = false;

    // Reset the file input by recreating it
    if (this.fileInput) {
      // Create a clone of the file input to reset it
      const parent = this.fileInput.parentNode;
      const clone = this.fileInput.cloneNode(true);
      if (parent) {
        parent.replaceChild(clone, this.fileInput);
        // Add event listener to the new file input
        clone.addEventListener('files-selected', (e: Event) => {
          // Cast the event to CustomEvent to access the detail property
          this.handleFilesSelected(e as CustomEvent<any>);
        });
      }
    }

    this.logEvent('info', 'Event log, mapping visualization, and file input cleared');

    // Request an update to refresh the UI
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="uploader-container" role="region" aria-label="Database mapping uploader" id="mapping-uploader">
        <div class="uploader-header">
          <h3 id="uploader-title">${this.title}</h3>
          <div class="controls" role="group" aria-labelledby="uploader-title">
            <db-button @click=${this.clearEventLog} aria-label="Clear log, mapping visualization, and file input">Clear All</db-button>
          </div>
        </div>
        
        <!-- File Input Component -->
        <db-file-input
          .accept=${this.accept}
          .multiple=${this.multiple}
          .label=${this.label}
          .sublabel=${this.sublabel}
          @files-selected=${this.handleFilesSelected}
          aria-labelledby="uploader-title"
        ></db-file-input>
        
        <!-- Event Log Section -->
        <div class="section">
          <h4 id="event-log-heading">Event Log</h4>
          <div class="event-log" tabindex="0" role="log" aria-label="Upload event log" aria-live="polite" aria-labelledby="event-log-heading">
            ${this.eventLog.length === 0
        ? html`<div class="log-item">No events yet</div>`
        : this.eventLog.map(event => html`
                <div class="log-item ${event.eventClass}">
                  <span class="timestamp">${event.timestamp}</span>
                  <span class="event-type">[${event.type}]</span>
                  <span class="message">${event.message}</span>
                </div>
              `)}
          </div>
        </div>
        
        <!-- Mapping Visualizer Section - Only shown when file is loaded successfully and visualization is ready -->
        ${this.fileLoaded && this.showMappingVisualization ? html`
          <div class="section visualizer-container">
            <h4 id="visualizer-heading">Mapping Visualization</h4>
            <div aria-labelledby="visualizer-heading">
              ${this.isLoading ?
          html`<div class="loading-state" role="status" aria-live="polite">
                  <p>Loading mapping data from API...</p>
                </div>` :
          this.errorMessage ?
            html`<div class="error-state" role="alert">
                    <p>Error loading mapping data: ${this.errorMessage}</p>
                    <db-button @click=${() => this.fetchMappingFromApi()}>Retry</db-button>
                  </div>` :
            this.mappingData ?
              html`<db-mapping-visualizer 
                      id="mapping-visualizer"
                      mapping-data=${JSON.stringify(this.mappingData)}
                      aria-label="Database mapping visualization"
                    ></db-mapping-visualizer>` :
              html`<div class="empty-state" role="status">
                      <p>No mapping data available. Upload a mapping file or wait for API response.</p>
                    </div>`
        }
              
              <!-- Display validated mapping data when available -->
              ${this.isValidated && this.validatedMapping ? html`
                <div class="mapping-output" role="region" aria-labelledby="validated-mapping-heading">
                  <h5 id="validated-mapping-heading">${this.isValidated ? 'Validated Mapping Output:' : 'Current Mapping:'}</h5>
                  <pre aria-live="polite" role="status" class="mapping-json">
                    ${JSON.stringify(this.validatedMapping, null, 2)}
                  </pre>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'db-mapping-uploader': DbMappingUploader;
  }
}
