(() => {
  const csrfToken = window.KITANA?.csrfToken ?? '';

  async function request(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
    const opts = {
      method,
      headers: {
        'X-CSRF-Token': csrfToken,
        ...headers
      },
      credentials: 'same-origin'
    };

    if (body !== undefined) {
      opts.body = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(path, opts);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || response.statusText);
    }
    return raw ? response : response.json();
  }

  const KitanaOllama = {
    chat(payload) {
      return request('api/chat.php', { method: 'POST', body: payload });
    },
    listChats() {
      return request('api/list-chats.php');
    },
    loadChat(id) {
      return request(`api/load-chat.php?id=${encodeURIComponent(id)}`);
    },
    createChat(body) {
      return request('api/create-chat.php', { method: 'POST', body });
    },
    deleteChat(body) {
      return request('api/delete-chat.php', { method: 'POST', body });
    },
    summarize(body) {
      return request('api/summary.php', { method: 'POST', body });
    },
    generateCode(body) {
      return request('api/generate-code.php', { method: 'POST', body });
    },
    autocomplete(body) {
      return request('api/autocomplete.php', { method: 'POST', body });
    },
    debug(body) {
      return request('api/debug.php', { method: 'POST', body });
    },
    runTests(body) {
      return request('api/test.php', { method: 'POST', body });
    },
    projects(method = 'GET', body) {
      if (method === 'GET') {
        return request('api/projects.php');
      }
      return request('api/projects.php', { method, body });
    },
    files(method = 'GET', params = {}) {
      if (method === 'GET') {
        const query = new URLSearchParams(params).toString();
        return request(`api/files.php?${query}`);
      }
      return request('api/files.php', { method, body: params });
    },
    tasks(method = 'GET', body) {
      if (method === 'GET') {
        const query = body ? `?${new URLSearchParams(body).toString()}` : '';
        return request(`api/tasks.php${query}`);
      }
      return request('api/tasks.php', { method, body });
    },
    prompts(method = 'GET', body) {
      if (method === 'GET') {
        return request('api/prompts.php');
      }
      return request('api/prompts.php', { method, body });
    },
    exportProject(body) {
      return request('api/export.php', { method: 'POST', body, raw: true });
    },
    backups(method = 'GET', body) {
      if (method === 'GET') {
        return request('api/backup.php');
      }
      return request('api/backup.php', { method, body });
    },
    models() {
      return request('api/models.php');
    },
    manageModels(body) {
      return request('api/manage-models.php', { method: 'POST', body });
    },
    status() {
      return request('api/status.php');
    },
    agentPlan(goal, autonomy = 0) {
      const mode = ['suggest', 'collaborate', 'execute'][Math.min(2, Math.max(0, Number(autonomy)))];
      const prompt = `Design an offline workflow for Kitana Builder. Autonomy mode: ${mode}. Goal: ${goal}`;
      return this.debug({ context: prompt, language: 'workflow' }).then(data => data.analysis);
    }
  };

  window.KitanaOllama = KitanaOllama;
})();
