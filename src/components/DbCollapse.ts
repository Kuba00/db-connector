import { html, LitElement, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
// @ts-ignore: Allow SCSS import
import styles from '../styles/collapse.scss?inline';

/**
 * DbCollapse component - An accordion-style collapsible component
 * Follows the accordion pattern where only one item can be open at a time
 */
@customElement('db-collapse')
export class DbCollapse extends LitElement {
    static styles = css`${unsafeCSS(styles)}`;

    // Static registry to track open collapses by group
    private static openCollapsesByGroup: Record<string, DbCollapse | null> = {};

    @property({ type: String })
    id = '';

    @property({ type: String })
    title = '';

    @property({ type: Boolean, reflect: true })
    expanded = false;

    @property({ type: String })
    ariaLabel = '';

    /**
     * Group name to identify which collapses should work together as an accordion
     * Collapses with the same group name will close others when one is opened
     */
    @property({ type: String, reflect: true })
    group = 'default';

    @query('.content')
    private content!: HTMLElement;

    @query('.content-inner')
    private contentInner!: HTMLElement;

    connectedCallback() {
        super.connectedCallback();
        // Register this collapse with its group if it's expanded
        if (this.expanded) {
            this.registerAsOpenInGroup();
        }

        // Listen for collapse-toggle events from other collapses
        window.addEventListener('collapse-toggle', this.handleCollapseToggleEvent);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Remove from registry when disconnected
        if (DbCollapse.openCollapsesByGroup[this.group] === this) {
            DbCollapse.openCollapsesByGroup[this.group] = null;
        }
        // Remove event listener
        window.removeEventListener('collapse-toggle', this.handleCollapseToggleEvent);
    }

    /**
     * Handle toggle events from other collapses
     */
    private handleCollapseToggleEvent = (event: Event) => {
        const customEvent = event as CustomEvent;
        const detail = customEvent.detail;
        
        // Only process if it's from the same group but not from this instance
        if (detail && detail.group === this.group && detail.id !== this.id && detail.expanded) {
            // Another collapse in our group was opened, so close this one if it's open
            if (this.expanded) {
                this.expanded = false;
                this.updateContentHeight();
                this.requestUpdate();
            }
        }
    }

    /**
     * Register this collapse as the open one in its group
     */
    private registerAsOpenInGroup() {
        // If there's already an open collapse in this group, close it
        const currentOpen = DbCollapse.openCollapsesByGroup[this.group];
        if (currentOpen && currentOpen !== this && currentOpen.expanded) {
            currentOpen.expanded = false;
            currentOpen.updateContentHeight();
            currentOpen.requestUpdate();
        }
        
        // Register this collapse as the open one for this group
        DbCollapse.openCollapsesByGroup[this.group] = this;
    }

    private handleToggle() {
        const wasExpanded = this.expanded;
        this.expanded = !wasExpanded;
        
        // If we're expanding, register as the open collapse in this group
        if (this.expanded) {
            this.registerAsOpenInGroup();
        } else if (DbCollapse.openCollapsesByGroup[this.group] === this) {
            // If we're closing and we're the registered open collapse, clear the registry
            DbCollapse.openCollapsesByGroup[this.group] = null;
        }
        
        this.updateContentHeight();
        
        // Dispatch event to notify of the change
        this.dispatchEvent(new CustomEvent('collapse-toggle', {
            detail: { 
                id: this.id,
                expanded: this.expanded,
                group: this.group
            },
            bubbles: true,
            composed: true
        }));
    }

    private updateContentHeight() {
        if (!this.content || !this.contentInner) return;

        const height = this.contentInner.offsetHeight;
        
        if (this.expanded) {
            // Set max-height for transition
            this.content.style.maxHeight = `${height}px`;
            this.content.classList.add('expanded');
        } else {
            // Remove expanded class
            this.content.classList.remove('expanded');
            // Reset max-height to 0
            this.content.style.maxHeight = '0';
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
            <div class="collapse" role="region" aria-label="${this.ariaLabel || 'Collapsible section'}">
                <h2 class="handle" id="${this.id}-header">
                    <button 
                        @click="${this.handleToggle}"
                        aria-expanded="${this.expanded}"
                        aria-controls="${this.id}-content"
                        class="${this.expanded ? 'expanded' : ''}"
                    >
                        <span class="title-text">${this.title}</span>
                        <span class="icon" aria-hidden="true"></span>
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