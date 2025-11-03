const { streamCompletion } = require('./parallel_sessions');

async function explainCode({ code, audience = 'intermediate developer', model = 'llama3' }) {
  const chunks = [];
  await streamCompletion({
    model,
    prompt: `Explain the following code to an ${audience}. Structure the explanation with sections: Summary, KeyConcepts, StepByStep, BestPractices. Code:\n\n${code}`,
    onToken: chunk => chunks.push(chunk)
  });
  return chunks.join('');
}

module.exports = {
  explainCode
};
