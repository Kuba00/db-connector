import { html, LitElement, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
// @ts-ignore: Allow SCSS import
import styles from '../styles/select.scss?inline';

interface Option {
    value: string;
    label: string;
    icon?: string;
}

@customElement('db-select')
export class DbSelect extends LitElement {
    static styles = css`${unsafeCSS(styles)}`;

    @property({
        converter: {
            fromAttribute: (value: string) => {
                try {
                    return value ? JSON.parse(value) : [];
                } catch {
                    return [];
                }
            },
            toAttribute: (value: Option[]) => JSON.stringify(value)
        }
    })
    options: Option[] = [];

    @property({ type: String })
    value: string = '';

    @property({ type: String })
    placeholder: string = 'Open this select menu';

    @state()
    private isOpen = false;

    @state()
    private focusedIndex = -1;

    @query('.select-button')
    private selectButton!: HTMLButtonElement;

    @query('.select-dropdown')
    private dropdown!: HTMLUListElement;

    private handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (!this.contains(target)) {
            this.closeDropdown();
        }
    };

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this.handleClickOutside);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this.handleClickOutside);
    }

    private toggleDropdown() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.focusedIndex = this.options.findIndex(opt => opt.value === this.value);
            this.focusedIndex = this.focusedIndex === -1 ? 0 : this.focusedIndex;
            requestAnimationFrame(() => this.updateFocus());
        } else {
            this.focusedIndex = -1;
            this.selectButton.focus();
        }
    }

    private closeDropdown() {
        if (this.isOpen) {
            this.isOpen = false;
            this.focusedIndex = -1;
            this.selectButton.focus();
        }
    }

    private updateFocus() {
        const options = this.shadowRoot?.querySelectorAll('li[role="option"]') || [];
        options.forEach((option, index) => {
            if (option instanceof HTMLElement) {
                option.tabIndex = index === this.focusedIndex ? 0 : -1;
                if (index === this.focusedIndex) option.focus();
            }
        });
    }

    private handleOptionSelect(option: Option) {
        if (option.value === 'clear') {
            this.value = '';
        } else {
            this.value = option.value;
        }
        this.closeDropdown();
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }

    private handleKeyDown(e: KeyboardEvent) {
        const isDropdownEvent = e.currentTarget === this.dropdown;
        const isButtonEvent = e.currentTarget === this.selectButton;

        if (isButtonEvent && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            if (!this.isOpen) this.toggleDropdown();
        }

        if (this.isOpen && isDropdownEvent) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.focusedIndex = (this.focusedIndex + 1) % this.options.length;
                    this.updateFocus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.focusedIndex = (this.focusedIndex - 1 + this.options.length) % this.options.length;
                    this.updateFocus();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (this.focusedIndex >= 0) {
                        this.handleOptionSelect(this.options[this.focusedIndex]);
                    }
                    break;
                case 'Escape':
                    this.closeDropdown();
                    break;
                case 'Tab':
                    this.closeDropdown();
                    break;
            }
        }
    }

    render() {
        const selectedOption = this.options.find(opt => opt.value === this.value);
        const displayText = selectedOption ? selectedOption.label : this.placeholder;

        return html`
            <div class="custom-select">
                <button
                    class="select-button"
                    role="combobox"
                    aria-label="Database type selection"
                    aria-haspopup="listbox"
                    aria-expanded="${this.isOpen}"
                    aria-controls="select-dropdown"
                    @click="${() => this.toggleDropdown()}"
                    @keydown="${this.handleKeyDown}"
                >
                    <span class="selected-value">${displayText}</span>
                    <span class="arrow"></span>
                </button>
                <ul
                    class="select-dropdown ${this.isOpen ? '' : 'hidden'}"
                    role="listbox"
                    id="select-dropdown"
                    aria-label="Available database types"
                    @keydown="${this.handleKeyDown}"
                >
                    ${this.options.map((option, index) => html`
                        <li 
                            role="option"
                            aria-selected="${this.value === option.value}"
                            class="${this.value === option.value ? 'selected' : ''}"
                            @click="${() => this.handleOptionSelect(option)}"
                            tabindex="${index === this.focusedIndex ? '0' : '-1'}"
                        >
                            ${option.icon ? html`<i class="${option.icon}"></i>` : ''}
                            ${option.label}
                        </li>
                    `)}
                </ul>
            </div>
            <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'db-select': DbSelect;
    }
}