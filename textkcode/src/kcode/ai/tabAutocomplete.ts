import type * as monaco from 'monaco-editor';
import { streamCompletion } from './parallel_sessions';

export function registerAiAutocomplete(editor: monaco.editor.IStandaloneCodeEditor) {
  let currentAbort = new AbortController();

  editor.addCommand(monaco.KeyCode.Tab, async () => {
    const model = editor.getModel();
    if (!model) return;

    const position = editor.getPosition();
    if (!position) return;

    const lineContent = model.getLineContent(position.lineNumber);
    const prefix = lineContent.slice(0, position.column - 1);

    currentAbort.abort();
    currentAbort = new AbortController();

    const buffer: string[] = [];
    await streamCompletion({
      model: 'codellama',
      prompt: `Complete the following code line based on context:
Context:
${model.getValue().slice(0, 4000)}

Line:
${prefix}`,
      onToken: token => buffer.push(token)
    });

    const suggestion = buffer.join('').trim();
    if (suggestion) {
      editor.executeEdits('kcode-ai', [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text: suggestion,
          forceMoveMarkers: true
        }
      ]);
    }
  });
}
