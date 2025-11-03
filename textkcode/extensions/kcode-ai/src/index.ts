import * as vscode from 'vscode';
import { getNonce } from './utils/nonce';

export function activate(context: vscode.ExtensionContext) {
  const provider = new KCodeAiViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('kcodeAiView', provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode-ai.open', () => {
      provider.reveal();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode.callAgent', async (payload: AgentPayload) => {
      try {
        const response = await handleAgent(payload);
        return { agentId: payload.agentId, text: response };
      } catch (error) {
        vscode.window.showErrorMessage(`Agent failed: ${String(error)}`);
        throw error;
      }
    })
  );
}

export function deactivate() {}

class KCodeAiViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
        vscode.Uri.joinPath(this.context.extensionUri, 'dist')
      ]
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'ollamaRequest': {
          const response = await vscode.commands.executeCommand('kcode.callAgent', message.payload);
          webviewView.webview.postMessage({ type: 'ollamaResponse', payload: response });
          break;
        }
        case 'savePlan': {
          await this.savePlan(message.payload);
          break;
        }
        default:
          break;
      }
    });
  }

  reveal() {
    vscode.commands.executeCommand('workbench.view.extension.kcode-ai');
  }

  private getHtml(webview: vscode.Webview) {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'tailwind.css')
    );

    return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: vscode-resource: https:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href="${styleUri}" />
          <title>KCode AI</title>
        </head>
        <body class="bg-slate-950 text-slate-100">
          <div id="root"></div>
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
  }

  private async savePlan(plan: unknown) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders?.length) {
      return;
    }

    const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, '.kcode', 'plans.json');
    const document = await vscode.workspace.openTextDocument(uri).catch(() => null);
    let plans = [];
    if (document) {
      plans = JSON.parse(document.getText() || '[]');
    }
    plans.push(plan);
    const buffer = Buffer.from(JSON.stringify(plans, null, 2));
    await vscode.workspace.fs.writeFile(uri, buffer);
  }
}

interface AgentPayload {
  agentId: string;
  prompt: string;
  context?: string;
  model?: string;
}

async function handleAgent(payload: AgentPayload) {
  const body = {
    model: payload.model ?? 'codellama',
    prompt: `${payload.context ?? ''}

${payload.prompt}`,
    stream: false
  };

  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`);
  }

  const data = await response.json();
  return data.response ?? '';
}
