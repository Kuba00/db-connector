import { html, LitElement, css, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
// @ts-ignore: Allow SCSS import
import styles from '../styles/db-connector.scss?inline';


@customElement('db-connector')
export class DbConnector extends LitElement {
    static styles = css`${unsafeCSS(styles)}`;


    render() {
        return html`
        <div class="db-connector">
            <form>
                <div class="form-group">
                    <div class="grid-container">
                        <div class="input-group">
                            <label for="username">Username</label>
                            <div class="input-wrapper username-input">
                                <input type="text" name="username" id="username" placeholder="janesmith">
                            </div>
                        </div>

                        <div class="input-group full-width">
                            <label for="about">About</label>
                            <div class="input-wrapper">
                                <textarea name="about" id="about" rows="3"></textarea>
                            </div>
                            <p class="help-text">Write a few sentences about yourself.</p>
                        </div>

                        <div class="input-group full-width">
                            <label for="file-upload">File Upload</label>
                            <div class="input-wrapper">
                                <slot></slot>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'db-connector': DbConnector;
    }
}