import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Dynamically import SVGs from @material-design-icons/svg
async function loadIcon(iconName: string, variant: string) {
  try {
    const iconModule = await import(
      `@material-design-icons/svg/${variant}/${iconName}.svg`
    );
    return iconModule.default;
  } catch (error) {
    console.error(`Icon "${iconName}" not found!`, error);
    return '';
  }
}

@customElement('db-icon')
export class DbIcon extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
    }
  `;

  @property({ type: String }) name = 'face'; // Default icon
  @property({ type: String }) variant = 'filled'; // outlined, round, sharp, two-tone

  private iconSvg: string | null = null;

  async connectedCallback() {
    super.connectedCallback();
    this.iconSvg = await loadIcon(this.name, this.variant);
    this.requestUpdate();
  }

  async updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('name') || changedProperties.has('variant')) {
      this.iconSvg = await loadIcon(this.name, this.variant);
      this.requestUpdate();
    }
  }

  render() {
    if (!this.iconSvg) {
      return html``;
    }
    return html`<svg viewBox="0 0 24 24" aria-hidden="true" width="24px" height="24px" fill="currentColor"><!--?lit$711627453$--></svg>`;
  }
}