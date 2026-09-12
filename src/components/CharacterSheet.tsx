"use client";
import React from 'react';
import AttributeCard from './AttributeCard';
import { motion } from 'framer-motion';

export default function CharacterSheet({ attributes, onTaskComplete }: { attributes: any[], onTaskComplete?: (taskId: string) => void }) {
  if (!attributes || attributes.length === 0) {
    return <div className="text-slate-400 italic p-4 text-center border border-slate-800 rounded-xl">No attributes discovered yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4">
      {attributes.map((attr, index) => (
        <motion.div
          key={attr.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <AttributeCard attribute={attr} />
        </motion.div>
      ))}
    </div>
  );
}
