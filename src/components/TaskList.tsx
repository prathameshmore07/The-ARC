'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskListProps {
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    attributeId: string;
    attribute: { id: string; name: string };
  }>;
  attributes: Array<{
    id: string;
    name: string;
  }>;
  onRefresh: () => void;
  onStartFocus: (task: { id: string; title: string }) => void;
  onComplete: (taskId: string, focusSessionId?: string) => void;
}

export default function TaskList({
  tasks,
  attributes,
  onRefresh,
  onStartFocus,
  onComplete,
}: TaskListProps) {
  const [title, setTitle] = useState('');
  const [attributeId, setAttributeId] = useState(attributes[0]?.id || '');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !attributeId) return;

    setCreating(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), attributeId }),
      });
      setTitle('');
      onRefresh();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    onRefresh();
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
      <h2 className="text-2xl font-bold text-white mb-6">⚔️ Quests</h2>

      {/* Create Task Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New quest..."
          aria-label="Quest title"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
        />
        <select
          value={attributeId}
          onChange={(e) => setAttributeId(e.target.value)}
          aria-label="Attribute"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
        >
          {attributes.map((attr) => (
            <option key={attr.id} value={attr.id}>
              {attr.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!title.trim() || creating}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {creating ? 'Adding...' : 'Add Quest'}
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {pendingTasks.length === 0 && doneTasks.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-500 text-center py-8 italic"
            >
              No quests yet. Create one to begin your grind.
            </motion.p>
          )}

          {pendingTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border bg-slate-800/80 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                <div className="p-1.5 rounded-md bg-slate-700 text-slate-400">
                  <div className="w-5 h-5 border-2 border-current rounded-full" />
                </div>
                <div>
                  <h4 className="font-medium text-white">{task.title}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-cyan-400 border border-slate-700">
                    {task.attribute?.name || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => onComplete(task.id)}
                  className="px-3 py-1.5 text-sm bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-md transition-colors"
                  aria-label={`Complete ${task.title}`}
                >
                  ✓ Complete
                </button>
                <button
                  onClick={() =>
                    onStartFocus({ id: task.id, title: task.title })
                  }
                  className="px-3 py-1.5 text-sm bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 rounded-md transition-colors"
                  aria-label={`Start focus session for ${task.title}`}
                >
                  🔥 Focus
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  aria-label={`Delete ${task.title}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}

          {doneTasks.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                Completed ({doneTasks.length})
              </p>
              {doneTasks.slice(0, 5).map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800 opacity-60 mb-2"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-slate-400 line-through text-sm">
                      {task.title}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    {task.attribute?.name}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
