"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface MockupProps {
  type: string;
  color: string;
}

const TableMockup = ({ color }: { color: string }) => (
  <div className="w-full space-y-3">
    <div className="flex border-b pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
      <div className="w-1/2">Entity</div>
      <div className="w-1/4">Status</div>
      <div className="w-1/4 text-right">Metric</div>
    </div>
    {[1, 2, 3].map((i) => (
      <motion.div 
        key={i}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
        className="flex items-center text-xs"
      >
        <div className="w-1/2 flex items-center gap-2">
          <div className={cn("h-6 w-6 rounded-full", color.replace('bg-', 'bg-opacity-20 bg-'))} />
          <div className="h-2 w-20 rounded bg-muted" />
        </div>
        <div className="w-1/4">
          <div className={cn("h-4 w-12 rounded-full", color)} />
        </div>
        <div className="w-1/4 text-right flex justify-end">
          <div className="h-2 w-8 rounded bg-muted" />
        </div>
      </motion.div>
    ))}
  </div>
);

const ChartMockup = ({ color }: { color: string }) => (
  <div className="w-full h-32 flex items-end gap-2 px-4">
    {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((val, i) => (
      <motion.div
        key={i}
        initial={{ height: 0 }}
        animate={{ height: `${val * 100}%` }}
        transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
        className={cn("flex-1 rounded-t-lg", color)}
      />
    ))}
  </div>
);

const NodesMockup = ({ color }: { color: string }) => (
  <div className="relative w-full h-40 flex items-center justify-center">
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn("z-20 h-12 w-12 rounded-xl border-4 border-background flex items-center justify-center", color)}
    />
    {[0, 90, 180, 270].map((angle, i) => (
      <React.Fragment key={i}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute h-px w-12 bg-muted-foreground/20"
          style={{ transform: `rotate(${angle}deg) translateX(30px)` }}
        />
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 + i * 0.1 }}
          className="absolute h-6 w-6 rounded-lg bg-muted border"
          style={{ 
            transform: `rotate(${angle}deg) translateX(55px) rotate(-${angle}deg)` 
          }}
        />
      </React.Fragment>
    ))}
  </div>
);

const MapMockup = ({ color }: { color: string }) => (
  <div className="relative w-full h-40 bg-muted/20 rounded-xl overflow-hidden">
    <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-10">
      {[...Array(24)].map((_, i) => (
        <div key={i} className="border border-foreground" />
      ))}
    </div>
    <motion.div
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      className="absolute inset-0 flex items-center justify-center p-8"
    >
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 60">
        <motion.path
          d="M 10 30 Q 30 10 50 30 T 90 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="text-muted-foreground/30"
        />
        <motion.circle
          cx="10" cy="30" r="3"
          className={cn(color.replace('bg-', 'fill-'))}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.path
          d="M 10 30 Q 30 10 50 30 T 90 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={color.replace('bg-', 'text-')}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </svg>
    </motion.div>
  </div>
);

const SelectionMockup = ({ color }: { color: string }) => (
  <div className="w-full grid grid-cols-2 gap-3">
    {[1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        whileHover={{ scale: 1.05 }}
        className={cn(
          "h-12 rounded-xl border bg-background p-2 flex items-center gap-2",
          i === 2 && cn("border-2", color.replace('bg-', 'border-'))
        )}
      >
        <div className={cn("h-4 w-4 rounded-full", i === 2 ? color : "bg-muted")} />
        <div className="h-2 w-12 rounded bg-muted" />
      </motion.div>
    ))}
  </div>
);

export const FeatureMockup = ({ type, color }: MockupProps) => {
  const getMockup = () => {
    switch (type) {
      case 'table': return <TableMockup color={color} />;
      case 'chart': return <ChartMockup color={color} />;
      case 'nodes': return <NodesMockup color={color} />;
      case 'map': return <MapMockup color={color} />;
      case 'selection':
      case 'list': return <SelectionMockup color={color} />;
      default: return null;
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-4">
      {getMockup()}
    </div>
  );
};
