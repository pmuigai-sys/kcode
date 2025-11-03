import * as vscode from 'vscode';
import { getNonce } from './utils/nonce';

export function activate(context: vscode.ExtensionContext) {
  const provider = new KCodePreviewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('kcodePreviewView', provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode-preview.open', () => provider.reveal())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode-preview.deploy', uri => provider.deploy(uri))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode.preview.start', async ({ framework }) => {
      provider.postMessage({ type: 'previewStatus', payload: { status: `Running (${framework})` } });
      return 'started';
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode.preview.stop', async () => {
      provider.postMessage({ type: 'previewStatus', payload: { status: 'Stopped' } });
      return 'stopped';
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode.netlify.deploy', async projectPath => {
      vscode.window.showInformationMessage(`Netlify deploy initiated for ${projectPath}`);
      provider.postMessage({
        type: 'previewStatus',
        payload: { status: 'Deployment triggered (mock)' }
      });
      return 'ok';
    })
  );
}

export function deactivate() {}

class KCodePreviewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
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
        case 'startPreview':
          await vscode.commands.executeCommand('kcode.preview.start', message.payload);
          break;
        case 'stopPreview':
          await vscode.commands.executeCommand('kcode.preview.stop');
          break;
        case 'deploy':
          await vscode.commands.executeCommand('kcode.netlify.deploy', message.payload);
          break;
        default:
          break;
      }
    });
  }

  reveal() {
    vscode.commands.executeCommand('workbench.view.extension.kcode-preview-container');
  }

  async deploy(uri?: vscode.Uri) {
    if (!uri) {
      const workspace = vscode.workspace.workspaceFolders?.[0];
      if (!workspace) {
        vscode.window.showWarningMessage('Open a workspace to deploy.');
        return;
      }
      uri = workspace.uri;
    }
    await vscode.commands.executeCommand('kcode.netlify.deploy', uri.fsPath);
  }

  postMessage(message: unknown) {
    this.view?.webview.postMessage(message);
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
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: vscode-resource: https:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href="${styleUri}" />
          <title>KCode Preview</title>
        </head>
        <body class="bg-slate-950 text-slate-100">
          <div id="root"></div>
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
  }
}
