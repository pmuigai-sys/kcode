const { streamCompletion } = require('./parallel_sessions');

async function analyzeBug({ code, errorMessage, model = 'codellama' }) {
  const chunks = [];
  await streamCompletion({
    model,
    prompt: `You are debugging the following code snippet. Identify bugs and propose fixes. Respond with markdown containing sections: Overview, RootCause, FixSuggestion, Patch. Code:\n\n${code}\n\nError:\n${errorMessage}`,
    onToken: chunk => chunks.push(chunk)
  });
  return chunks.join('');
}

module.exports = {
  analyzeBug
};
