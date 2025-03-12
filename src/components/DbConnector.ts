import { html, LitElement, css, unsafeCSS } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
// @ts-ignore: Allow SCSS import
import styles from '../styles/db-connector.scss?inline';

// Import components
import './DbSchemaEditor';
import './DbMappingUploader';
import './DbButton';


@customElement('db-connector')
export class DbConnector extends LitElement {
    static styles = css`${unsafeCSS(styles)}
        :host {
            display: block;
            width: 100%;
            font-family: 'Hind', sans-serif;
        }
        
        .db-connector {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }
        
        .connector-header {
            margin-bottom: 20px;
        }
        
        .connector-header h2 {
            margin: 0;
            color: #333;
        }
        
        .connector-section {
            margin-bottom: 20px;
        }
    `;

    /**
     * API URL for mapping data
     */
    @property({ type: String })
    apiUrl = 'http://localhost:3100/api/mapping';
    
    /**
     * Current schema data
     */
    @state()
    private schemaData: any = null;

    /**
     * Handle schema updates from the schema editor
     */
    private handleSchemaUpdate(e: CustomEvent) {
        this.schemaData = e.detail.schema;
        console.log('Schema updated:', this.schemaData);
    }

    render() {
        return html`
        <div class="db-connector" role="main" id="contenu">
            <section class="connector-section">
                <db-schema-editor 
                    title="Database Schema Editor" 
                    @schema-updated=${this.handleSchemaUpdate}>
                </db-schema-editor>
            </section>
            
            <section class="connector-section">
                <db-mapping-uploader
                  .apiUrl=${this.apiUrl}
                ></db-mapping-uploader>
            </section>
        </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'db-connector': DbConnector;
    }
}