import { html, LitElement, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
// @ts-ignore: Allow SCSS import
import styles from '../styles/collapse.scss?inline';

@customElement('db-collapse')
export class DbCollapse extends LitElement {
    static styles = css`${unsafeCSS(styles)}`;

    @property({ type: String })
    id = '';

    @property({ type: String })
    title = '';

    @property({ type: Boolean })
    expanded = false;

    @property({ type: String })
    ariaLabel = '';

    @query('.content')
    private content!: HTMLElement;

    @query('.content-inner')
    private contentInner!: HTMLElement;

    private handleToggle() {
        this.expanded = !this.expanded;
        this.updateContentHeight();
        this.dispatchEvent(new CustomEvent('collapse-toggle', {
            detail: { expanded: this.expanded },
            bubbles: true,
            composed: true
        }));
    }

    private updateContentHeight() {
        if (!this.content || !this.contentInner) return;

        const height = this.contentInner.offsetHeight;
        
        if (this.expanded) {
            // Set actual height for transition
            this.content.style.height = `${height}px`;
            this.content.classList.add('expanded');
        } else {
            // Set current height first
            this.content.style.height = `${height}px`;
            // Force a reflow
            this.content.offsetHeight;
            // Then animate to 0
            this.content.style.height = '0';
            this.content.classList.remove('expanded');
        }
    }

    protected firstUpdated() {
        // Initialize height
        this.updateContentHeight();
    }

    protected updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('expanded')) {
            this.updateContentHeight();
        }
    }

    render() {
        return html`
            <div class="collapse" role="region" aria-label="${this.ariaLabel}">
                <h2 class="handle" id="${this.id}-header">
                    <button 
                        @click="${this.handleToggle}"
                        aria-expanded="${this.expanded}"
                        aria-controls="${this.id}-content"
                        class="${this.expanded ? 'expanded' : ''}"
                    >
                        ${this.title}
                    </button>
                </h2>
                <div 
                    id="${this.id}-content"
                    class="content ${this.expanded ? 'expanded' : ''}"
                    role="region" 
                    aria-labelledby="${this.id}-header"
                >
                    <div class="content-inner">
                        <slot></slot>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'db-collapse': DbCollapse;
    }
}