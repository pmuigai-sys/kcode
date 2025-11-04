<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Kitana Agent Console</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="kb-embed">
    <section class="kb-agent">
        <header>
            <h1>Autonomous Agents</h1>
            <p>Chain tasks, execute scripts, and monitor outcomes in offline mode.</p>
        </header>
        <form id="agent-form" class="kb-form">
            <label>Goal
                <textarea name="goal" rows="3" required placeholder="Generate tests, run linting, compile preview..."></textarea>
            </label>
            <label>Autonomy level
                <input type="range" name="autonomy" min="0" max="2" value="0">
            </label>
            <button type="submit" class="kb-button primary">Execute Plan</button>
        </form>
        <article id="agent-output" class="kb-console" aria-live="polite"></article>
    </section>
    <script src="../assets/js/ollama.js"></script>
    <script src="../assets/js/ui.js"></script>
    <script>
        document.getElementById('agent-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const output = document.getElementById('agent-output');
            output.textContent = 'Planning autonomous workflow...';
            const form = new FormData(event.currentTarget);
            const goal = form.get('goal');
            const autonomy = form.get('autonomy');
            try {
                const analysis = await window.KitanaOllama.agentPlan(goal, autonomy);
                output.textContent = analysis;
            } catch (error) {
                output.textContent = 'Agent failed: ' + error.message;
            }
        });
    </script>
</body>
</html>
