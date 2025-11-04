document.addEventListener('DOMContentLoaded', () => {
  const state = {
    activeTab: 'chat',
    activeChat: null,
    chats: [],
    messages: [],
    projects: [],
    openFiles: new Map(),
    activeFile: null,
    tasks: [],
    autonomy: 0
  };

  const elements = {
    tabs: document.querySelectorAll('.kb-header__nav button'),
    tabPanels: document.querySelectorAll('.kb-tab'),
    chatList: document.getElementById('chat-list'),
    chatMessages: document.getElementById('chat-messages'),
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    chatMic: document.getElementById('chat-mic'),
    newChat: document.getElementById('new-chat'),
    searchChats: document.getElementById('search-chats'),
    messageSearch: document.getElementById('message-search'),
    pinToggle: document.getElementById('pin-toggle'),
    exportThread: document.getElementById('export-thread'),
    summarizeProject: document.getElementById('summarize-project'),
    memorySummary: document.getElementById('memory-summary'),
    projectTree: document.getElementById('project-tree'),
    createProject: document.getElementById('create-project'),
    projectSummary: document.getElementById('project-summary'),
    projectCheckpoint: document.getElementById('project-checkpoint'),
    editorTabs: document.getElementById('editor-tabs'),
    editorContainer: document.getElementById('editor-container'),
    editorStatus: document.getElementById('editor-status'),
    autocomplete: document.getElementById('autocomplete'),
    explainCode: document.getElementById('explain-code'),
    refactorCode: document.getElementById('refactor-code'),
    previewTabs: document.querySelectorAll('.kb-preview__tabs button'),
    previewPanes: document.querySelectorAll('.kb-preview__pane'),
    previewFrame: document.getElementById('preview-frame'),
    phpOutput: document.getElementById('php-output'),
    builderLogs: document.getElementById('builder-logs'),
    runBackend: document.getElementById('run-backend'),
    schedulerCalendar: document.getElementById('scheduler-calendar'),
    taskList: document.getElementById('task-list'),
    newTask: document.getElementById('new-task'),
    ollamaStatus: document.getElementById('ollama-status'),
    refreshModels: document.getElementById('refresh-models'),
    pullModel: document.getElementById('pull-model'),
    deleteModel: document.getElementById('delete-model'),
    themeSelector: document.getElementById('theme-selector'),
    languageSelector: document.getElementById('language-selector'),
    customCss: document.getElementById('custom-css'),
    createBackup: document.getElementById('create-backup'),
    restoreBackup: document.getElementById('restore-backup'),
    statsPanel: document.getElementById('stats-panel'),
    runSecurityScan: document.getElementById('run-security-scan'),
    policyEnforce: document.getElementById('policy-enforce'),
    toggleVoice: document.getElementById('toggle-voice'),
    toggleSound: document.getElementById('toggle-sound'),
    autonomyLevel: document.getElementById('autonomy-level'),
    modeSelector: document.getElementById('mode-selector'),
    personalitySelector: document.getElementById('personality-selector')
  };

  const templates = {
    message: document.getElementById('message-template'),
    project: document.getElementById('project-node-template')
  };

  function switchTab(tab) {
    state.activeTab = tab;
    elements.tabs.forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    elements.tabPanels.forEach((panel) => {
      panel.classList.toggle('is-visible', panel.dataset.tab === tab);
    });
  }

  elements.tabs.forEach((button) => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });

  async function loadChats() {
    const { chats } = await KitanaOllama.listChats();
    state.chats = chats;
    renderChatList();
  }

  function renderChatList(filter = '') {
    elements.chatList.innerHTML = '';
    const query = filter.trim().toLowerCase();
    state.chats
      .filter((chat) => !query || chat.title.toLowerCase().includes(query))
      .forEach((chat) => {
        const li = document.createElement('li');
        li.dataset.id = chat.id;
        li.innerHTML = `<strong>${chat.title}</strong><span>${new Date(chat.updated_at).toLocaleString()}</span>`;
        if (state.activeChat === chat.id) {
          li.classList.add('is-active');
        }
        li.addEventListener('click', () => openChat(chat.id));
        elements.chatList.appendChild(li);
      });
  }

  async function openChat(id) {
    state.activeChat = id;
    const { chat, messages } = await KitanaOllama.loadChat(id);
    state.messages = messages;
    renderChatList(elements.searchChats.value);
    renderMessages();
    elements.memorySummary.textContent = chat.summary || '—';
  }

  function renderMessages(filter = '') {
    elements.chatMessages.innerHTML = '';
    const query = filter.trim().toLowerCase();
    state.messages
      .filter((message) => !query || message.content.toLowerCase().includes(query))
      .forEach((message) => {
        const node = templates.message.content.cloneNode(true);
        const article = node.querySelector('.kb-message');
        const role = node.querySelector('.kb-message__role');
        const time = node.querySelector('time');
        const content = node.querySelector('.kb-message__content');
        role.textContent = message.role === 'assistant' ? 'Kitana' : 'You';
        time.textContent = new Date(message.created_at * 1000).toLocaleString();
        content.innerHTML = KitanaUI.renderMarkdown(message.content);
        if (message.role === 'assistant') {
          article.classList.add('is-assistant');
        }
        const pin = node.querySelector('.pin');
        pin.addEventListener('click', () => togglePin(message));
        const edit = node.querySelector('.edit');
        edit.addEventListener('click', () => editMessage(message));
        elements.chatMessages.appendChild(node);
      });
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  async function togglePin(message) {
    message.is_pinned = message.is_pinned ? 0 : 1;
    KitanaUI.flashStatus(message.is_pinned ? 'Pinned message' : 'Unpinned message');
  }

  function editMessage(message) {
    const updated = prompt('Edit message', message.content);
    if (updated && updated !== message.content) {
      message.content = updated;
      KitanaUI.flashStatus('Message updated in memory.');
      renderMessages(elements.messageSearch.value);
    }
  }

  elements.chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.activeChat) {
      const { id } = await KitanaOllama.createChat({ title: elements.chatInput.value.slice(0, 50) || 'Untitled' });
      state.activeChat = id;
    }
    const payload = {
      chat_id: state.activeChat,
      message: elements.chatInput.value,
      mode: elements.modeSelector.value,
      personality: elements.personalitySelector.value,
      autonomy: state.autonomy
    };
    appendMessage({ role: 'user', content: payload.message, created_at: Date.now() / 1000 });
    elements.chatInput.value = '';
    KitanaUI.playTone(920, 0.08);
    const typing = createTypingIndicator();
    try {
      const response = await KitanaOllama.chat(payload);
      removeTypingIndicator(typing);
      appendMessage({ role: 'assistant', content: response.assistant_message, created_at: response.timestamp });
      KitanaUI.speak(response.assistant_message);
      KitanaUI.flashStatus('Response received');
      await loadChats();
    } catch (error) {
      removeTypingIndicator(typing);
      KitanaUI.flashStatus(error.message || 'Chat failed');
      appendMessage({ role: 'assistant', content: `⚠️ ${error.message}`, created_at: Date.now() / 1000 });
    }
  });

  function appendMessage(message) {
    state.messages.push(message);
    renderMessages(elements.messageSearch.value);
  }

  function createTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'kb-typing';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    elements.chatMessages.appendChild(indicator);
    indicator.scrollIntoView();
    return indicator;
  }

  function removeTypingIndicator(indicator) {
    if (indicator?.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  elements.chatMic.addEventListener('click', () => {
    KitanaUI.startDictation(elements.chatInput);
  });

  elements.newChat.addEventListener('click', async () => {
    const { id } = await KitanaOllama.createChat({ title: 'Untitled chat' });
    await loadChats();
    openChat(id);
  });

  elements.searchChats.addEventListener('input', (event) => {
    renderChatList(event.target.value);
  });

  elements.messageSearch.addEventListener('input', (event) => {
    renderMessages(event.target.value);
  });

  elements.exportThread.addEventListener('click', () => {
    const blob = new Blob(state.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n'), { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kitana-chat-${state.activeChat}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  });

  elements.summarizeProject.addEventListener('click', async () => {
    if (!state.activeChat) return;
    const { summary } = await KitanaOllama.summarize({ chat_id: state.activeChat });
    elements.memorySummary.textContent = summary;
    KitanaUI.flashStatus('Summary updated');
  });

  async function loadProjects() {
    const { projects } = await KitanaOllama.projects();
    state.projects = projects;
    renderProjects();
  }

  function renderProjects() {
    elements.projectTree.innerHTML = '';
    state.projects.forEach((project) => {
      const node = templates.project.content.cloneNode(true);
      const li = node.querySelector('li');
      li.dataset.id = project.id;
      li.querySelector('.label').textContent = project.name;
      li.querySelector('.icon').textContent = '📁';
      li.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        KitanaUI.bump(event.currentTarget);
        loadFiles(project);
      });
      const openBtn = li.querySelector('.open');
      openBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        loadFiles(project);
      });
      const deleteBtn = li.querySelector('.delete');
      deleteBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        if (!confirm(`Delete project ${project.name}?`)) return;
        await KitanaOllama.projects('DELETE', { id: project.id });
        KitanaUI.flashStatus('Project removed');
        loadProjects();
      });
      elements.projectTree.appendChild(node);
    });
  }

  elements.createProject.addEventListener('click', async () => {
    const name = prompt('Project name');
    if (!name) return;
    const stack = prompt('Stack (php/python/js/html)', 'php');
    await KitanaOllama.projects('POST', { name, stack: stack || 'php' });
    KitanaUI.flashStatus('Project created');
    loadProjects();
  });

  elements.projectSummary.addEventListener('click', async () => {
    if (!state.activeProject) {
      alert('Select a project to summarize.');
      return;
    }
    const { analysis } = await KitanaOllama.debug({
      context: `Summarize project ${state.activeProject.name} stack ${state.activeProject.stack}. List modules, dependencies, and TODOs.`,
      language: state.activeProject.stack
    });
    elements.builderLogs.textContent = analysis;
    KitanaUI.flashStatus('Project summary generated');
  });

  elements.projectCheckpoint.addEventListener('click', () => {
    if (!state.activeProject) {
      alert('Open a project file before creating a checkpoint.');
      return;
    }
    const snapshot = MinGit.snapshot(state.activeProject.id, {
      files: Array.from(state.openFiles.entries())
    });
    KitanaUI.flashStatus(`Checkpoint saved (${snapshot.id})`);
    elements.builderLogs.textContent = `Checkpoint ${snapshot.id}\n${snapshot.created_at}`;
  });

  async function loadFiles(project) {
    const { files } = await KitanaOllama.files('GET', { project_id: project.id });
    state.activeProject = project;
    renderFileTree(project, files);
  }

  function renderFileTree(project, files) {
    const container = elements.projectTree.querySelector(`li[data-id="${project.id}"] ul`);
    container.innerHTML = '';
    files.forEach((file) => {
      const child = templates.project.content.cloneNode(true);
      const li = child.querySelector('li');
      li.dataset.path = file.path;
      li.querySelector('.label').textContent = file.path;
      li.querySelector('.icon').textContent = file.type === 'file' ? '📄' : '📁';
      li.addEventListener('click', (event) => {
        if (file.type === 'file') {
          openFile(project, file.path);
        }
        event.stopPropagation();
      });
      li.querySelector('.open').remove();
      li.querySelector('.delete').remove();
      container.appendChild(child);
    });
  }

  async function openFile(project, path) {
    const { content } = await KitanaOllama.files('GET', { project_id: project.id, file: path });
    state.openFiles.set(path, { project, content });
    state.activeFile = path;
    renderEditorTabs();
    renderEditorContent(content);
    elements.editorStatus.textContent = `${path} • ${project.stack}`;
  }

  function renderEditorTabs() {
    elements.editorTabs.innerHTML = '';
    state.openFiles.forEach((file, path) => {
      const button = document.createElement('button');
      button.textContent = path;
      button.classList.toggle('is-active', path === state.activeFile);
      button.addEventListener('click', () => {
        state.activeFile = path;
        renderEditorTabs();
        renderEditorContent(file.content);
      });
      elements.editorTabs.appendChild(button);
    });
  }

  function renderEditorContent(content) {
    elements.editorContainer.innerHTML = '';
    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.addEventListener('input', () => {
      if (!state.activeFile) return;
      const file = state.openFiles.get(state.activeFile);
      if (file) {
        file.content = textarea.value;
      }
    });
    elements.editorContainer.appendChild(textarea);
    textarea.focus();
  }

  elements.autocomplete.addEventListener('click', async () => {
    if (!state.activeFile) return;
    const file = state.openFiles.get(state.activeFile);
    const textarea = elements.editorContainer.querySelector('textarea');
    const cursor = textarea.selectionStart;
    const { suggestion } = await KitanaOllama.autocomplete({
      content: textarea.value,
      cursor,
      language: detectLanguage(state.activeFile)
    });
    textarea.setRangeText(suggestion, cursor, cursor, 'end');
    textarea.dispatchEvent(new Event('input'));
    KitanaUI.flashStatus('Autocomplete applied');
  });

  elements.explainCode.addEventListener('click', async () => {
    if (!state.activeFile) return;
    const file = state.openFiles.get(state.activeFile);
    const { analysis } = await KitanaOllama.debug({
      context: file.content,
      language: detectLanguage(state.activeFile)
    });
    KitanaUI.flashStatus('Explanation ready');
    elements.builderLogs.textContent = analysis;
  });

  elements.refactorCode.addEventListener('click', async () => {
    if (!state.activeFile) return;
    const file = state.openFiles.get(state.activeFile);
    const instructions = prompt('Refactor goal', 'Optimize performance and readability');
    if (!instructions) return;
    const { summary } = await KitanaOllama.generateCode({
      project_id: file.project.id,
      instructions: `${instructions}. Modify file ${state.activeFile}. Current content: ${file.content}`,
      stack: file.project.stack
    });
    KitanaUI.flashStatus('Refactor request sent');
    await openFile(file.project, state.activeFile);
    elements.builderLogs.textContent = summary;
  });

  elements.previewTabs.forEach((button) => {
    button.addEventListener('click', () => {
      elements.previewTabs.forEach((btn) => btn.classList.toggle('is-active', btn === button));
      elements.previewPanes.forEach((pane) => pane.classList.toggle('is-visible', pane.dataset.pane === button.dataset.preview));
    });
  });

  elements.runBackend.addEventListener('click', async () => {
    if (!state.activeProject) return;
    const result = await KitanaOllama.runTests({ project_id: state.activeProject.id, runner: 'phpunit' }).catch((error) => ({ error: error.message }));
    elements.phpOutput.textContent = result.output || result.error || 'Executed';
  });

  async function loadTasks() {
    const { tasks } = await KitanaOllama.tasks('GET');
    state.tasks = tasks;
    renderTasks();
  }

  function renderTasks() {
    elements.taskList.innerHTML = '';
    state.tasks.forEach((task) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${task.description}</strong><span>${task.schedule}</span>`;
      const done = document.createElement('button');
      done.className = 'kb-button';
      done.textContent = 'Complete';
      done.addEventListener('click', async () => {
        await KitanaOllama.tasks('PATCH', { id: task.id, status: 'completed' });
        loadTasks();
      });
      li.appendChild(done);
      elements.taskList.appendChild(li);
    });
    renderCalendar();
  }

  function renderCalendar() {
    elements.schedulerCalendar.innerHTML = '';
    state.tasks.forEach((task) => {
      const card = document.createElement('div');
      card.className = 'kb-calendar__event';
      card.textContent = `${task.schedule}: ${task.description}`;
      elements.schedulerCalendar.appendChild(card);
    });
  }

  elements.newTask.addEventListener('click', async () => {
    if (!state.activeProject) {
      alert('Select a project first.');
      return;
    }
    const description = prompt('Task description');
    const schedule = prompt('Schedule (cron-like or ISO datetime)', new Date().toISOString());
    if (!description || !schedule) return;
    await KitanaOllama.tasks('POST', {
      project_id: state.activeProject.id,
      description,
      schedule,
      status: 'pending'
    });
    KitanaUI.flashStatus('Task scheduled');
    loadTasks();
  });

  async function refreshStatus() {
    const status = await KitanaOllama.status();
    elements.ollamaStatus.innerHTML = `
      <p>Reachable: <strong>${status.reachable ? 'Yes' : 'No'}</strong></p>
      <p>Models: ${status.models.map((m) => m.name).join(', ') || 'None'}</p>
      <p>Database: ${status.db_exists ? `${(status.db_size / 1024).toFixed(1)} KB` : 'Missing'}</p>
    `;
  }

  elements.refreshModels.addEventListener('click', refreshStatus);

  elements.pullModel.addEventListener('click', async () => {
    const model = prompt('Model to pull', 'codellama');
    if (!model) return;
    const result = await KitanaOllama.manageModels({ action: 'pull', model });
    elements.builderLogs.textContent = result.output || result.error || 'Pull triggered';
    refreshStatus();
  });

  elements.deleteModel.addEventListener('click', async () => {
    const model = prompt('Model to delete');
    if (!model) return;
    const result = await KitanaOllama.manageModels({ action: 'delete', model });
    elements.builderLogs.textContent = result.output || result.error || 'Delete triggered';
    refreshStatus();
  });

  elements.themeSelector.addEventListener('change', (event) => {
    KitanaUI.setTheme(event.target.value);
  });

  elements.languageSelector.addEventListener('change', (event) => {
    window.location.search = `?lang=${event.target.value}`;
  });

  elements.customCss.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const style = document.createElement('style');
      style.textContent = reader.result;
      document.head.appendChild(style);
      KitanaUI.flashStatus('Custom CSS applied');
    };
    reader.readAsText(file);
  });

  elements.createBackup.addEventListener('click', async () => {
    await KitanaOllama.backups('POST', { action: 'create' });
    KitanaUI.flashStatus('Backup created');
  });

  elements.restoreBackup.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    KitanaUI.flashStatus('Upload backup via filesystem before restore. Place file into backups/ then use Restore option.');
  });

  async function updateStats() {
    const stats = {
      chats: state.chats.length,
      messages: state.messages.length,
      projects: state.projects.length,
      tasks: state.tasks.length,
      autonomy: state.autonomy
    };
    elements.statsPanel.innerHTML = '';
    Object.entries(stats).forEach(([key, value]) => {
      const div = document.createElement('div');
      div.innerHTML = `<strong>${key.toUpperCase()}</strong><br>${value}`;
      elements.statsPanel.appendChild(div);
    });
  }

  elements.runSecurityScan.addEventListener('click', async () => {
    if (!state.activeProject) {
      alert('Select project first');
      return;
    }
    const { analysis } = await KitanaOllama.debug({
      context: `Perform OWASP-inspired security review for ${state.activeProject.name}.` ,
      language: state.activeProject.stack
    });
    elements.builderLogs.textContent = analysis;
  });

  elements.policyEnforce.addEventListener('click', async () => {
    if (!state.activeProject) return;
    const { analysis } = await KitanaOllama.debug({
      context: `Ensure project ${state.activeProject.name} enforces PHP 8.1 strict types and sanitization. Provide actionable checklist.` ,
      language: state.activeProject.stack
    });
    elements.builderLogs.textContent = analysis;
  });

  elements.toggleVoice.addEventListener('change', (event) => {
    KitanaUI.voiceEnabled = event.target.checked;
  });

  elements.toggleSound.addEventListener('change', (event) => {
    KitanaUI.soundEnabled = event.target.checked;
  });

  elements.autonomyLevel.addEventListener('input', (event) => {
    state.autonomy = Number(event.target.value);
    KitanaUI.flashStatus(`Autonomy level: ${state.autonomy}`);
  });

  function detectLanguage(path) {
    if (path.endsWith('.php')) return 'php';
    if (path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.py')) return 'python';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.css')) return 'css';
    return 'plain';
  }

  async function init() {
    await Promise.all([loadChats(), loadProjects(), loadTasks(), refreshStatus()]);
    updateStats();
  }

  init();
});
