import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';

const agentPrompts = {
  coding: 'You are a coding assistant. Generate code changes with rationale.',
  explain: 'You explain code in approachable language with best practices.',
  debug: 'You debug issues, identify root causes, and propose fixes.'
};

export function Composer({ activeAgent, onSubmit, stream }) {
  return (
    <div className="flex w-2/3 flex-col border-r border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div>
          <h2 className="text-lg font-semibold capitalize">{activeAgent} assistant</h2>
          <p className="text-xs text-slate-400">{agentPrompts[activeAgent]}</p>
        </div>
      </div>
      <MessageList stream={stream} />
      <div className="border-t border-slate-800 p-4">
        <ChatInput
          placeholder={`Ask the ${activeAgent} agent...`}
          onSubmit={value =>
            onSubmit({
              agentId: activeAgent,
              prompt: value,
              context: agentPrompts[activeAgent]
            })
          }
        />
      </div>
    </div>
  );
}
