import { html, LitElement, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
// @ts-ignore: Allow SCSS import
import styles from '../styles/file-upload.scss?inline';
import './DbIcons';

@customElement('file-upload')
export class FileUpload extends LitElement {
  static styles = unsafeCSS(styles);

  render() {
    return html`
    <form class="form-container" enctype='multipart/form-data'>
	<div class="upload-files-container">
		<div class="drag-file-area">
			<svg viewBox="0 0 24 24" aria-hidden="true" width="24px" height="24px" fill="currentColor"><!--?lit$711627453$--></svg>
			<h3 class="dynamic-message"> Drag & drop any file here </h3>
			<label class="label"> or <span class="browse-files"> <input type="file" class="default-file-input"/> <span class="browse-files-text">browse file</span> <span>from device</span> </span> </label>
		</div>
		<span class="cannot-upload-message"> 
			<svg viewBox="0 0 24 24" aria-hidden="true" width="24px" height="24px" fill="currentColor"><!--?lit$711627453$--></svg>
			Please select a file first 
		</span>
		<div class="file-block">
			<div class="file-info"> 
				<svg viewBox="0 0 24 24" aria-hidden="true" width="24px" height="24px" fill="currentColor"><!--?lit$711627453$--></svg>
				<span class="file-name"> </span> | <span class="file-size">  </span> 
			</div>
			<div class="progress-bar"> </div>
		</div>
		<button type="button" class="upload-button"> Upload </button>
	</div>
</form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'file-upload': FileUpload;
  }
}