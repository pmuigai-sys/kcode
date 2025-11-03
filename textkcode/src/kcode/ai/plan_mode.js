const { streamCompletion } = require('./parallel_sessions');

async function generatePlan({ prompt, model = 'llama3' }) {
  const steps = [];
  await streamCompletion({
    model,
    prompt: `You are a senior engineer. Break the following request into step-by-step actions with rationale. Respond in JSON array format with {"title","description"} objects only. Request: ${prompt}`,
    onToken: chunk => steps.push(chunk)
  });

  try {
    return JSON.parse(steps.join(''));
  } catch (error) {
    return [
      {
        title: 'Review request',
        description: prompt
      }
    ];
  }
}

module.exports = {
  generatePlan
};
