import { html, LitElement, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
// @ts-ignore: Allow SCSS import
import styles from '../styles/input.scss?inline';

@customElement('db-input')
export class DbInput extends LitElement {
    static styles = css`${unsafeCSS(styles)}`;

    @property({ type: String })
    value: string = '';

    @property({ type: String })
    placeholder: string = '';

    @property({ type: String })
    type: string = 'text';

    @property({ type: String })
    name: string = '';

    @property({ type: String })
    label: string = '';

    @property({ type: Boolean })
    required: boolean = false;

    @property({ type: String })
    pattern: string = '';

    @property({ type: String })
    error: string = '';

    @property({ type: String })
    icon: string = '';

    private handleInput(e: Event) {
        const input = e.target as HTMLInputElement;
        this.value = input.value;
        this.dispatchEvent(new CustomEvent('input', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));

        // Validate if pattern is provided
        if (this.pattern) {
            const regex = new RegExp(this.pattern);
            const isValid = regex.test(this.value);
            input.setAttribute('aria-invalid', (!isValid).toString());
        }
    }

    private handleChange(e: Event) {
        const input = e.target as HTMLInputElement;
        this.value = input.value;
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <div class="custom-input">
                ${this.label ? html`
                    <label for="input-${this.name}">${this.label}</label>
                ` : ''}
                <div class="input-wrapper">
                    <input
                        id="input-${this.name}"
                        type="${this.type}"
                        .value="${this.value}"
                        placeholder="${this.placeholder}"
                        ?required="${this.required}"
                        pattern="${this.pattern}"
                        role="textbox"
                        aria-label="${this.label || this.placeholder}"
                        aria-invalid="false"
                        aria-required="${this.required}"
                        aria-describedby="${this.error ? `error-${this.name}` : ''}"
                        @input="${this.handleInput}"
                        @change="${this.handleChange}"
                    />
                    ${this.icon ? html`
                        <span class="input-icon">
                            <i class="${this.icon}"></i>
                        </span>
                    ` : ''}
                </div>
                ${this.error ? html`
                    <div id="error-${this.name}" class="error-message visible" role="alert">
                        ${this.error}
                    </div>
                ` : ''}
            </div>
            <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'db-input': DbInput;
    }
}