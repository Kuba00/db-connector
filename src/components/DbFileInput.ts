import { html, LitElement, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
// @ts-ignore: Allow SCSS import
import styles from '../styles/file-input.scss?inline';

// Interface for file with upload progress
interface FileWithProgress extends File {
  progress?: number;
  uploaded?: boolean;
  error?: boolean;
  id: string;
}

/**
 * DbFileInput component - A drag and drop file input component
 * Allows users to drag and drop files or click to browse for files
 */
@customElement('db-file-input')
export class DbFileInput extends LitElement {
  static styles = css`${unsafeCSS(styles)}`;

  /**
   * The accepted file types (e.g., '.jpg,.png,.pdf')
   */
  @property({ type: String })
  accept = '';

  /**
   * Whether multiple files can be selected
   */
  @property({ type: Boolean })
  multiple = false;

  /**
   * Maximum file size in bytes (default: 5MB)
   */
  @property({ type: Number })
  maxSize = 5 * 1024 * 1024;

  /**
   * Label for the drop zone
   */
  @property({ type: String })
  label = 'Drag & Drop your files here';

  /**
   * Secondary label for the drop zone
   */
  @property({ type: String })
  sublabel = 'or browse';

  /**
   * Aria label for accessibility
   */
  @property({ type: String })
  ariaLabel = 'File upload area';

  /**
   * Whether the component is in the dragging state
   */
  @state()
  private isDragging = false;

  /**
   * The selected files with progress information
   */
  @state()
  private files: FileWithProgress[] = [];

  /**
   * Error message to display
   */
  @state()
  private errorMessage = '';

  /**
   * Reference to the hidden file input
   */
  @query('input[type="file"]')
  private fileInput!: HTMLInputElement;

  // No need for drop zone reference as we're handling events directly

  /**
   * Handle file selection from the file input
   */
  private handleFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
    }
  }

  /**
   * Trigger the file input click
   */
  private handleBrowseClick() {
    this.fileInput.click();
  }

  /**
   * Handle the dragover event
   */
  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Handle the dragleave event
   */
  private handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Handle the drop event
   */
  private handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;

    if (e.dataTransfer?.files) {
      this.processFiles(Array.from(e.dataTransfer.files));
    }
  }

  /**
   * Process the selected files
   */
  private processFiles(newFiles: File[]) {
    this.errorMessage = '';

    // Validate file types if accept is specified
    if (this.accept) {
      const acceptedTypes = this.accept.split(',').map(type => type.trim().toLowerCase());
      const invalidFiles = newFiles.filter(file => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const fileType = file.type.toLowerCase();
        return !acceptedTypes.some(type => {
          // Check if the type matches the file extension or MIME type
          return fileExtension === type.toLowerCase() || 
                 fileType === type.toLowerCase() ||
                 (type.startsWith('.') && fileExtension === type) ||
                 (type.includes('/') && fileType.startsWith(type.split('/')[0]));
        });
      });

      if (invalidFiles.length > 0) {
        this.errorMessage = `Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}`;
        return;
      }
    }

    // Validate file sizes
    const oversizedFiles = newFiles.filter(file => file.size > this.maxSize);
    if (oversizedFiles.length > 0) {
      this.errorMessage = `File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}`;
      return;
    }

    // Convert files to FileWithProgress
    const filesWithProgress = Array.from(newFiles).map(file => {
      const fileWithProgress = file as FileWithProgress;
      fileWithProgress.progress = 0;
      fileWithProgress.uploaded = false;
      fileWithProgress.error = false;
      fileWithProgress.id = this.generateUniqueId();
      return fileWithProgress;
    });

    // Update files
    if (this.multiple) {
      this.files = [...this.files, ...filesWithProgress];
    } else {
      this.files = filesWithProgress.slice(0, 1);
    }

    // Simulate upload progress for each file
    filesWithProgress.forEach(file => {
      this.simulateFileUpload(file);
    });

    // Dispatch event
    this.dispatchEvent(new CustomEvent('files-selected', {
      detail: {
        files: this.files
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Remove a file from the selection
   */
  private removeFile(fileId: string) {
    this.files = this.files.filter(file => (file as FileWithProgress).id !== fileId);
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('files-selected', {
      detail: {
        files: this.files
      },
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Generate a unique ID for a file
   */
  private generateUniqueId(): string {
    return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Simulate file upload progress
   */
  private simulateFileUpload(file: FileWithProgress) {
    let progress = 0;
    const interval = setInterval(() => {
      // Increment progress by a random amount between 5-15%
      progress += Math.floor(Math.random() * 10) + 5;
      
      if (progress >= 100) {
        progress = 100;
        file.uploaded = true;
        clearInterval(interval);
        
        // Dispatch upload-complete event
        this.dispatchEvent(new CustomEvent('upload-complete', {
          detail: { file },
          bubbles: true,
          composed: true
        }));
      }
      
      file.progress = progress;
      this.requestUpdate();
      
      // Dispatch progress event
      this.dispatchEvent(new CustomEvent('upload-progress', {
        detail: {
          file,
          progress
        },
        bubbles: true,
        composed: true
      }));
    }, 500);
  }

  /**
   * Clear all selected files
   */
  public clearFiles() {
    this.files = [];
    this.fileInput.value = '';
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('files-selected', {
      detail: {
        files: this.files
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Get the selected files
   */
  public getFiles(): File[] {
    return [...this.files];
  }

  render() {
    return html`
      <div class="file-input-container">
        <div
          class="drop-zone ${this.isDragging ? 'dragging' : ''}"
          @dragover="${this.handleDragOver}"
          @dragleave="${this.handleDragLeave}"
          @drop="${this.handleDrop}"
          @click="${this.handleBrowseClick}"
          role="button"
          tabindex="0"
          aria-label="${this.ariaLabel}"
          @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this.handleBrowseClick()}"
        >
          <div class="drop-zone-content">
            <div class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div class="text">
              <p class="primary">${this.label}</p>
              <p class="secondary">${this.sublabel}</p>
            </div>
          </div>
          <input
            type="file"
            @change="${this.handleFileInputChange}"
            accept="${this.accept}"
            ?multiple="${this.multiple}"
            tabindex="-1"
            aria-hidden="true"
          />
        </div>
        
        ${this.errorMessage ? html`
          <div class="error-message" role="alert">
            ${this.errorMessage}
          </div>
        ` : ''}
        
        ${this.files.length > 0 ? html`
          <div class="file-list" role="list" aria-label="Selected files">
            ${this.files.map((file) => html`
              <div class="file-item" role="listitem">
                <div class="file-info">
                  <span class="file-name">${file.name}</span>
                  <span class="file-size">${this.formatFileSize(file.size)}</span>
                </div>
                <div class="file-progress">
                  ${file.progress !== undefined ? html`
                    <db-progress-bar 
                      value="${file.progress}" 
                      color="${file.uploaded ? 'success' : file.error ? 'danger' : 'primary'}"
                      label="${file.uploaded ? 'Completed' : file.error ? 'Error' : `${file.progress}%`}"
                      striped
                      animated="${!file.uploaded && !file.error}"
                    ></db-progress-bar>
                  ` : ''}
                </div>
                <button 
                  class="remove-file" 
                  @click="${() => this.removeFile(file.id)}"
                  aria-label="Remove ${file.name}"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Format file size to human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'db-file-input': DbFileInput;
  }
}
