import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * DbProgressBar component
 * 
 * @element db-progress-bar
 * @attr {number} value - Current progress value (0-100)
 * @attr {number} max - Maximum value (default: 100)
 * @attr {string} label - Accessible label for the progress bar
 * @attr {boolean} striped - Whether to show striped effect
 * @attr {boolean} animated - Whether to animate the stripes
 * @attr {string} color - Color of the progress bar (primary, success, warning, danger)
 */
@customElement('db-progress-bar')
export class DbProgressBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      margin: 1rem 0;
    }
    
    .progress-container {
      width: 100%;
      height: 1.5rem;
      background-color: #e9ecef;
      border-radius: 0.25rem;
      overflow: hidden;
      position: relative;
    }
    
    .progress-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .progress-bar {
      height: 100%;
      background-color: var(--progress-color, #0d6efd);
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.875rem;
    }
    
    .progress-bar.striped {
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      );
      background-size: 1rem 1rem;
    }
    
    .progress-bar.animated {
      animation: progress-bar-stripes 1s linear infinite;
    }
    
    @keyframes progress-bar-stripes {
      from {
        background-position: 1rem 0;
      }
      to {
        background-position: 0 0;
      }
    }
    
    /* Color variants */
    .progress-bar.primary {
      --progress-color: #0d6efd;
    }
    
    .progress-bar.success {
      --progress-color: #198754;
    }
    
    .progress-bar.warning {
      --progress-color: #ffc107;
    }
    
    .progress-bar.danger {
      --progress-color: #dc3545;
    }
  `;

  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: String })
  label = 'Progress';

  @property({ type: Boolean })
  striped = false;

  @property({ type: Boolean })
  animated = false;

  @property({ type: String })
  color = 'primary';

  @property({ type: Boolean })
  showPercentage = true;

  /**
   * Calculate the percentage value
   */
  private get percentage(): number {
    return Math.min(100, Math.max(0, (this.value / this.max) * 100));
  }

  /**
   * Generate the CSS classes for the progress bar
   */
  private get progressBarClasses(): string {
    const classes = ['progress-bar', this.color];
    
    if (this.striped) {
      classes.push('striped');
    }
    
    if (this.animated && this.striped) {
      classes.push('animated');
    }
    
    return classes.join(' ');
  }

  render() {
    return html`
      ${this.label ? html`<span class="progress-label" id="progress-label">${this.label}</span>` : ''}
      <div 
        class="progress-container" 
        role="progressbar" 
        aria-valuenow="${this.percentage}" 
        aria-valuemin="0" 
        aria-valuemax="100"
        aria-labelledby="${this.label ? 'progress-label' : null}"
      >
        <div 
          class="${this.progressBarClasses}" 
          style="width: ${this.percentage}%"
        >
          ${this.showPercentage ? `${Math.round(this.percentage)}%` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Set progress value programmatically
   * @param value - New progress value
   */
  setProgress(value: number): void {
    this.value = Math.min(this.max, Math.max(0, value));
    this.dispatchEvent(new CustomEvent('progress-change', {
      detail: { value: this.value, percentage: this.percentage },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Increment progress value by a specified amount
   * @param amount - Amount to increment (default: 1)
   */
  increment(amount = 1): void {
    this.setProgress(this.value + amount);
  }

  /**
   * Decrement progress value by a specified amount
   * @param amount - Amount to decrement (default: 1)
   */
  decrement(amount = 1): void {
    this.setProgress(this.value - amount);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'db-progress-bar': DbProgressBar;
  }
}
