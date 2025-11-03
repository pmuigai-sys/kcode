import * as vscode from 'vscode';
import * as path from 'path';
import { getNonce } from './utils/nonce';

type NetlifyModule = {
  saveNetlifyToken(token: string): Promise<void>;
  deployWithNetlify(options: { projectPath: string }): Promise<string>;
};

type VercelModule = {
  deployWithVercel(options: { projectPath: string }): Promise<string>;
};

type GithubPagesModule = {
  deployToGithubPages(options: { projectPath: string; branch?: string }): Promise<string>;
};

export function activate(context: vscode.ExtensionContext) {
  const runtimeRoot = path.join(vscode.env.appRoot, 'kcode');
  const netlify = loadNetlify(runtimeRoot);
  const vercel = loadVercel(runtimeRoot);
  const githubPages = loadGithubPages(runtimeRoot);

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
      provider.postStatus(`Running (${framework})`);
      return 'started';
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode.preview.stop', async () => {
      provider.postStatus('Stopped');
      return 'stopped';
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode.netlify.saveToken', async (token?: string) => {
      if (!token) {
        token = await vscode.window.showInputBox({
          prompt: 'Enter Netlify API token',
          ignoreFocusOut: true,
          password: true
        });
      }

      if (!token) {
        return;
      }

      try {
        await netlify.saveNetlifyToken(token.trim());
        provider.postStatus('Netlify token saved securely');
      } catch (error) {
        provider.postError(error);
        vscode.window.showErrorMessage(`Failed to store Netlify token: ${String(error)}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode.netlify.deploy', async (projectInput?: string) => {
      const projectPath = await resolveProjectPath(projectInput);
      if (!projectPath) {
        vscode.window.showWarningMessage('Open a workspace to deploy with Netlify.');
        return;
      }

      provider.postStatus('Deploying with Netlify...');
      try {
        const result = await netlify.deployWithNetlify({ projectPath });
        provider.postStatus('Netlify deployment complete');
        if (result) {
          provider.postStatus(result);
        }
      } catch (error) {
        provider.postError(error);
        vscode.window.showErrorMessage(`Netlify deployment failed: ${String(error)}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode.vercel.deploy', async (projectInput?: string) => {
      const projectPath = await resolveProjectPath(projectInput);
      if (!projectPath) {
        vscode.window.showWarningMessage('Open a workspace to deploy with Vercel.');
        return;
      }

      provider.postStatus('Deploying with Vercel...');
      try {
        const result = await vercel.deployWithVercel({ projectPath });
        provider.postStatus('Vercel deployment complete');
        if (result) {
          provider.postStatus(result);
        }
      } catch (error) {
        provider.postError(error);
        vscode.window.showErrorMessage(`Vercel deployment failed: ${String(error)}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode.githubPages.deploy', async (options?: { projectPath?: string; branch?: string } | string) => {
      let branch: string | undefined;
      let projectInput: string | undefined;

      if (typeof options === 'string') {
        branch = options;
      } else if (options) {
        branch = options.branch;
        projectInput = options.projectPath;
      }

      const projectPath = await resolveProjectPath(projectInput);
      if (!projectPath) {
        vscode.window.showWarningMessage('Open a workspace to deploy with GitHub Pages.');
        return;
      }

      if (!branch) {
        branch = await vscode.window.showInputBox({
          prompt: 'Enter GitHub Pages branch',
          value: 'gh-pages',
          ignoreFocusOut: true
        });
      }

      if (!branch) {
        return;
      }

      provider.postStatus(`Deploying to GitHub Pages (${branch})...`);
      try {
        const result = await githubPages.deployToGithubPages({ projectPath, branch });
        provider.postStatus('GitHub Pages deployment complete');
        if (result) {
          provider.postStatus(result);
        }
      } catch (error) {
        provider.postError(error);
        vscode.window.showErrorMessage(`GitHub Pages deployment failed: ${String(error)}`);
      }
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
        case 'deploy': {
          const providerId = message.payload?.provider ?? 'netlify';
          if (providerId === 'vercel') {
            await vscode.commands.executeCommand('kcode.vercel.deploy');
          } else if (providerId === 'github') {
            await vscode.commands.executeCommand('kcode.githubPages.deploy', {
              branch: message.payload?.branch
            });
          } else {
            await vscode.commands.executeCommand('kcode.netlify.deploy');
          }
          break;
        }
        case 'saveNetlifyToken':
          await vscode.commands.executeCommand('kcode.netlify.saveToken', message.payload?.token ?? message.payload);
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
    const projectPath = await resolveProjectPath(uri?.fsPath ?? undefined);
    if (!projectPath) {
      vscode.window.showWarningMessage('Open a workspace to deploy.');
      return;
    }
    await vscode.commands.executeCommand('kcode.netlify.deploy', projectPath);
  }

  postStatus(status: string) {
    this.postMessage({ type: 'previewStatus', payload: { status } });
  }

  postError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.postMessage({ type: 'previewError', payload: { message } });
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

function resolveProjectPath(projectInput?: string): string | undefined {
  if (projectInput && projectInput.trim()) {
    return projectInput.trim();
  }
  const workspace = vscode.workspace.workspaceFolders?.[0];
  return workspace?.uri.fsPath;
}

function loadNetlify(runtimeRoot: string): NetlifyModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path.join(runtimeRoot, 'integrations', 'netlify.js')) as NetlifyModule;
  } catch (error) {
    console.warn('[KCode] Failed to load Netlify integration', error);
    return {
      async saveNetlifyToken() {
        throw new Error('Netlify integration unavailable');
      },
      async deployWithNetlify() {
        throw new Error('Netlify integration unavailable');
      }
    };
  }
}

function loadVercel(runtimeRoot: string): VercelModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path.join(runtimeRoot, 'integrations', 'vercel.js')) as VercelModule;
  } catch (error) {
    console.warn('[KCode] Failed to load Vercel integration', error);
    return {
      async deployWithVercel() {
        throw new Error('Vercel integration unavailable');
      }
    };
  }
}

function loadGithubPages(runtimeRoot: string): GithubPagesModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path.join(runtimeRoot, 'integrations', 'githubPages.js')) as GithubPagesModule;
  } catch (error) {
    console.warn('[KCode] Failed to load GitHub Pages integration', error);
    return {
      async deployToGithubPages() {
        throw new Error('GitHub Pages integration unavailable');
      }
    };
  }
}
