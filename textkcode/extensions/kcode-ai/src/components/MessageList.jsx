import { motion, AnimatePresence } from 'framer-motion';

export function MessageList({ stream }) {
  const messages = stream ? stream.split('\n\n') : [];

  return (
    <div className="flex-1 overflow-auto p-4">
      <AnimatePresence>
        {messages.map((block, index) => (
          <motion.div
            key={`${block}-${index}`}
            initial={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-3 rounded-md border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200"
          >
            {block}
          </motion.div>
        ))}
      </AnimatePresence>
      {!messages.length && (
        <p className="text-center text-xs text-slate-600">
          Ask an agent for help to begin. You can provide code selections or describe a task.
        </p>
      )}
    </div>
  );
}
