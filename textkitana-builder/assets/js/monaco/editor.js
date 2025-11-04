(function () {
  function createEditor(element, options = {}) {
    const textarea = document.createElement('textarea');
    textarea.className = 'kb-monaco-faux';
    textarea.spellcheck = false;
    textarea.value = options.value || '';
    textarea.addEventListener('input', () => {
      if (typeof options.onDidChangeModelContent === 'function') {
        options.onDidChangeModelContent({ value: textarea.value });
      }
    });
    element.innerHTML = '';
    element.appendChild(textarea);
    return {
      getValue: () => textarea.value,
      setValue: (value) => {
        textarea.value = value;
      },
      focus: () => textarea.focus(),
      dispose: () => element.removeChild(textarea)
    };
  }

  window.KitanaEditor = {
    editors: new Map(),
    create(domNode, options) {
      const instance = createEditor(domNode, options);
      this.editors.set(domNode, instance);
      return instance;
    },
    attachStandalone(id) {
      const element = document.getElementById(id);
      if (!element) return null;
      return this.create(element, {});
    }
  };
})();
