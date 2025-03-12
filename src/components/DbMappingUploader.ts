import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
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
      border: 1px solid #e0e0e0;
      border-radius: 8px;
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
   * The mapping data to visualize
   */
  @property({ type: Object })
  mappingData = null;
  


  /**
   * The event log entries
   */
  @state()
  private eventLog: Array<{ timestamp: string; type: string; message: string; eventClass: string }> = [];



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
        this.logEvent('success', 'JSON file loaded successfully', 'success');
        
        // Simulate file upload completion
        this.simulateFileUpload(file);
        
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
   * Simulates a file upload and then fetches mapping data from the API
   * @param file The file being uploaded
   */
  private simulateFileUpload(file: File) {
    this.logEvent('upload-start', `Starting upload of ${file.name}`);  
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      
      if (progress <= 100) {
        this.logEvent('upload-progress', `${file.name}: ${progress}%`);
        
        // Dispatch progress event
        this.dispatchEvent(new CustomEvent('upload-progress', {
          detail: { file, progress },
          bubbles: true,
          composed: true
        }));
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        this.logEvent('upload-complete', `${file.name} uploaded successfully`, 'success');
        
        // Dispatch complete event
        this.dispatchEvent(new CustomEvent('upload-complete', {
          detail: { file },
          bubbles: true,
          composed: true
        }));
        
        // Fetch mapping data from API after upload is complete
        this.fetchMappingFromApi();
      }
    }, 300);
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
   * Fetches mapping data from the API
   */
  private fetchMappingFromApi() {
    this.logEvent('api-request', `Fetching mapping data from ${this.apiUrl}`);
    
    // Set loading state
    this.isLoading = true;
    this.errorMessage = '';
    
    fetch(this.apiUrl)
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
        
        // No need to expand the visualizer section since we removed the collapse
        
        // Update the mapping data property
        this.mappingData = data;
        
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
   * Clears the event log
   */
  private clearEventLog() {
    this.eventLog = [];
    this.logEvent('info', 'Event log cleared');
  }

  render() {
    return html`
      <div class="uploader-container" role="region" aria-label="Database mapping uploader" id="mapping-uploader">
        <!-- Quick access links for accessibility -->
        <ul class="lar" aria-label="Liens d'accès rapide">
          <li><a href="#uploader-title">Titre de l'uploader</a></li>
          <li><a href="#event-log-heading">Journal des événements</a></li>
          <li><a href="#visualizer-heading">Visualisation du mapping</a></li>
        </ul>
        
        <div class="uploader-header">
          <h3 id="uploader-title">${this.title}</h3>
          <div class="controls" role="group" aria-labelledby="uploader-title">
            <db-button @click=${this.clearEventLog}>Clear Log</db-button>
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
        
        <!-- Mapping Visualizer Section -->
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
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'db-mapping-uploader': DbMappingUploader;
  }
}
