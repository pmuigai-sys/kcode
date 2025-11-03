import * as vscode from 'vscode';
import * as path from 'path';
import { getNonce } from './utils/nonce';

type StreamCompletionArgs = {
  model: string;
  prompt: string;
  options?: Record<string, unknown>;
  onToken?: (chunk: unknown) => void;
};

type ParallelSessionsModule = {
  streamCompletion: (args: StreamCompletionArgs) => Promise<unknown>;
  runParallel: (
    tasks: Array<{ model: string; prompt: string; options?: Record<string, unknown> }>
  ) => Promise<Array<{ output: string }>>;
};

type GithubIntegrationModule = {
  generateCommitMessage(repoPath: string): Promise<string>;
  reviewDiff(repoPath: string): Promise<string>;
};

interface AgentPayload {
  agentId: string;
  prompt: string;
  context?: string;
  model?: string;
}

export function activate(context: vscode.ExtensionContext) {
  const runtimeRoot = path.join(vscode.env.appRoot, 'kcode');
  const parallelSessions = loadParallelSessions(runtimeRoot);
  const githubIntegration = loadGithubIntegration(runtimeRoot);
  const agentHandler = createAgentHandler(parallelSessions);

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
        const response = await agentHandler(payload);
        return { agentId: payload.agentId, text: response };
      } catch (error) {
        vscode.window.showErrorMessage(`Agent failed: ${String(error)}`);
        throw error;
      }
    })
  );

  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      new KCodeInlineCompletionProvider(parallelSessions)
    )
  );

  const reviewChannel = vscode.window.createOutputChannel('KCode Review');
  context.subscriptions.push(reviewChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode-ai.generateCommitMessage', async () => {
      const workspace = vscode.workspace.workspaceFolders?.[0];
      if (!workspace) {
        vscode.window.showWarningMessage('Open a workspace to generate a commit message.');
        return;
      }

      try {
        const message = await githubIntegration.generateCommitMessage(workspace.uri.fsPath);
        await vscode.env.clipboard.writeText(message);
        vscode.window.showInformationMessage('Generated commit message copied to clipboard.');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate commit message: ${String(error)}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kcode-ai.reviewDiff', async () => {
      const workspace = vscode.workspace.workspaceFolders?.[0];
      if (!workspace) {
        vscode.window.showWarningMessage('Open a workspace to review changes.');
        return;
      }

      reviewChannel.clear();
      reviewChannel.show(true);
      try {
        const review = await githubIntegration.reviewDiff(workspace.uri.fsPath);
        reviewChannel.appendLine(review);
      } catch (error) {
        const message = `Failed to review diff: ${String(error)}`;
        reviewChannel.appendLine(message);
        vscode.window.showErrorMessage(message);
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

class KCodeInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  constructor(private readonly parallelSessions: ParallelSessionsModule) {}

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList> {
    if (token.isCancellationRequested) {
      return { items: [] };
    }

    const startLine = Math.max(0, position.line - 30);
    const start = new vscode.Position(startLine, 0);
    const range = new vscode.Range(start, position);
    const contextText = document.getText(range);

    if (!contextText.trim()) {
      return { items: [] };
    }

    const prompt = `Language: ${document.languageId}\nContext:\n${contextText}\n\nCompletion:`;

    try {
      const suggestion = await collectModelOutput(this.parallelSessions, 'codellama', prompt);
      if (!suggestion) {
        return { items: [] };
      }

      const inlineItem = new vscode.InlineCompletionItem(
        suggestion.replace(/\r/g, ''),
        new vscode.Range(position, position)
      );
      return { items: [inlineItem] };
    } catch (error) {
      console.warn('[KCode] Inline completion failed', error);
      return { items: [] };
    }
  }
}

function createAgentHandler(parallelSessions: ParallelSessionsModule) {
  return async (payload: AgentPayload) => {
    const prompt = `${payload.context ?? ''}\n\n${payload.prompt}`;
    return collectModelOutput(parallelSessions, payload.model ?? 'codellama', prompt);
  };
}

async function collectModelOutput(
  parallelSessions: ParallelSessionsModule,
  model: string,
  prompt: string
): Promise<string> {
  const chunks: string[] = [];
  const result = await parallelSessions.streamCompletion({
    model,
    prompt,
    onToken: chunk => {
      if (!chunk) {
        return;
      }
      if (typeof chunk === 'string') {
        chunks.push(chunk);
      } else if (typeof (chunk as { response?: string }).response === 'string') {
        chunks.push((chunk as { response: string }).response);
      }
    }
  });

  if (result && typeof result === 'object' && (result as { response?: string }).response) {
    chunks.push((result as { response: string }).response);
  }

  return chunks.join('').trim();
}

function loadParallelSessions(runtimeRoot: string): ParallelSessionsModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path.join(runtimeRoot, 'ai', 'parallel_sessions.js')) as ParallelSessionsModule;
  } catch (error) {
    console.warn('[KCode] Failed to load parallel sessions module', error);
    return {
      async streamCompletion() {
        throw new Error('Ollama runtime unavailable');
      },
      async runParallel() {
        return [];
      }
    };
  }
}

function loadGithubIntegration(runtimeRoot: string): GithubIntegrationModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path.join(runtimeRoot, 'integrations', 'github.js')) as GithubIntegrationModule;
  } catch (error) {
    console.warn('[KCode] Failed to load GitHub integration', error);
    return {
      async generateCommitMessage() {
        throw new Error('Git integration unavailable');
      },
      async reviewDiff() {
        throw new Error('Git integration unavailable');
      }
    };
  }
}
