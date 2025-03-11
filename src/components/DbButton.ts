import { html, LitElement, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
// @ts-ignore: Allow SCSS import
import styles from '../styles/button.scss?inline';

@customElement('db-button')
export class DbButton extends LitElement {
    static styles = css`${unsafeCSS(styles)}`;

    @property({ type: String })
    icon = '';

    @property({ type: String })
    variant = '';

    @property({ type: String })
    type = 'button';

    @property({ type: Boolean })
    disabled = false;

    private handleClick(event: MouseEvent) {
        if (this.disabled) {
            event.preventDefault();
            return;
        }

        this.dispatchEvent(new CustomEvent('click', {
            bubbles: true,
            composed: true,
            detail: { event }
        }));
    }

    render() {
        return html`
            <button 
                class="custom-button ${this.variant}"
                type="${this.type}"
                ?disabled="${this.disabled}"
                role="button"
                aria-disabled="${this.disabled}"
                @click="${this.handleClick}"
            >
                ${this.icon ? html`<span class="button-icon ${this.icon}" aria-hidden="true"></span>` : ''}
                <span class="button-text">
                    <slot></slot>
                </span>
            </button>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'db-button': DbButton;
    }
}