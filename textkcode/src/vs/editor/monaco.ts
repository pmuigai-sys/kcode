import * as monaco from 'monaco-editor';
import { registerAiAutocomplete } from '../../kcode/ai/tabAutocomplete';

export function bootEditor(container: HTMLElement, value = '', language = 'typescript') {
  const editor = monaco.editor.create(container, {
    value,
    language,
    theme: 'vs-dark',
    automaticLayout: true
  });

  registerAiAutocomplete(editor);
  return editor;
}
