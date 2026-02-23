'use client';

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Trash2, ChevronDown, Info, AlertTriangle, XCircle, ChevronRight } from "lucide-react";

type LogLevel = "log" | "info" | "warn" | "error";

interface ConsoleLog {
  id: string;
  type: LogLevel;
  message: string;
  timestamp: number;
  count: number;
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function ConsolePanel() {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Listen for console messages from preview iframe
      if (e.data?.source === "rork-preview-console") {
        const { type, message } = e.data;

        setLogs((prev) => {
          // Check if this message already exists (for grouping)
          const existing = prev.find((log) => log.message === message && log.type === type);

          if (existing) {
            // Increment count for repeated messages
            return prev.map((log) =>
              log.id === existing.id ? { ...log, count: log.count + 1 } : log
            );
          }

          // Add new log
          const newLog: ConsoleLog = {
            id: `${Date.now()}-${Math.random()}`,
            type,
            message,
            timestamp: Date.now(),
            count: 1,
          };

          return [...prev, newLog];
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isCollapsed]);

  const clearLogs = () => setLogs([]);

  const filteredLogs = filter === "all" ? logs : logs.filter((log) => log.type === filter);

  const getLogIcon = (type: LogLevel) => {
    switch (type) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-400" />;
      default:
        return <ChevronRight className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getLogColor = (type: LogLevel) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "warn":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
      default:
        return "text-zinc-300";
    }
  };

  const logCounts = {
    all: logs.length,
    log: logs.filter((l) => l.type === "log").length,
    info: logs.filter((l) => l.type === "info").length,
    warn: logs.filter((l) => l.type === "warn").length,
    error: logs.filter((l) => l.type === "error").length,
  };

  return (
    <div className="flex flex-col border-t border-[#27272a] bg-[#0f0f11] flex-shrink-0 z-50 absolute bottom-0 left-0 right-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#27272a] bg-[#1a1a1d]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          aria-label={isCollapsed ? "Expand console" : "Collapse console"}
        >
          <Terminal className="h-4 w-4" />
          <span>Console</span>
          {logs.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-[#27272a] rounded-md text-white">
              {logs.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              !isCollapsed && "rotate-180"
            )}
          />
        </button>

        {!isCollapsed && (
          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center gap-1">
              {(["all", "log", "info", "warn", "error"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors font-medium",
                    filter === level
                      ? "bg-[#27272a] text-white"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                  aria-label={`Filter ${level} logs`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  {logCounts[level] > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">
                      ({logCounts[level]})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={clearLogs}
              className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-md hover:bg-white/5"
              aria-label="Clear console"
              title="Clear console"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Console Content */}
      {!isCollapsed && (
        <div
          ref={scrollRef}
          className="max-h-64 h-48 overflow-y-auto font-mono text-xs bg-[#0f0f11]"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600">
              <div className="text-center">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No console output</p>
              </div>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 px-3 py-2 hover:bg-[#27272a]/40 border-b border-[#27272a]/50"
              >
                {getLogIcon(log.type)}
                <span className={cn("flex-1 whitespace-pre-wrap break-words", getLogColor(log.type))}>
                  {log.message}
                </span>
                {log.count > 1 && (
                  <span className="px-1.5 py-0.5 bg-[#27272a] text-gray-300 rounded-md text-[10px] ml-2 shrink-0">
                    {log.count}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
