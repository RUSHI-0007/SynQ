"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { useTerminal } from './useTerminal';
import { RefreshCw, X, Minus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// Import xterm CSS — Next.js handles this through global CSS bundling
import 'xterm/css/xterm.css';

interface TerminalUIProps {
  projectId: string;
  onClose?: () => void;
}

export function TerminalUI({ projectId, onClose }: TerminalUIProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isInitialisedRef = useRef(false);

  const { status, sendData, sendResize, onData, reconnect } = useTerminal(projectId);

  // ── Initialise xterm.js once on mount ────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || isInitialisedRef.current) return;
    isInitialisedRef.current = true;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: '#09090b', // Zinc-950
        foreground: '#fafafa',
        cursor: '#60a5fa',
        cursorAccent: '#09090b',
        black: '#1e1e1e',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#22d3ee',
        white: '#e5e7eb',
        brightBlack: '#374151',
        brightRed: '#ef4444',
        brightGreen: '#22c55e',
        brightYellow: '#eab308',
        brightBlue: '#3b82f6',
        brightMagenta: '#a855f7',
        brightCyan: '#06b6d4',
        brightWhite: '#f9fafb',
      },
      allowTransparency: true,
      scrollback: 5000,
      rows: 20,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // THE FIX: Wait 50ms for the DOM to render before calculating dimensions
    setTimeout(() => {
      try {
        fitAddon.fit();
        sendResize(term.cols, term.rows);
      } catch (err) {
        console.warn("xterm fit delayed", err);
      }
    }, 50);

    // ── xterm → WebSocket: pipe keystrokes ────────────────────────────
    const onDataDisposable = term.onData((data) => {
      sendData(data);
    });

    // ── WebSocket → xterm: write received bytes ────────────────────────
    onData((text) => {
      term.write(text);
    });

    // ── Auto-resize xterm when the panel resizes ───────────────────────
    const ro = new ResizeObserver(() => {
      try {
        // Wrap in a tiny timeout to prevent ResizeObserver loop limit errors
        requestAnimationFrame(() => {
          if (isInitialisedRef.current && fitAddonRef.current && xtermRef.current) {
            fitAddonRef.current.fit();
            sendResize(xtermRef.current.cols, xtermRef.current.rows);
          }
        });
      } catch (e) {}
    });
    if (containerRef.current) ro.observe(containerRef.current);
    resizeObserverRef.current = ro;

    return () => {
      onDataDisposable.dispose();
      ro.disconnect();
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      isInitialisedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally mount-only — sendData/sendResize/onData are stable refs

  // ── When WS connects, send resize so Docker PTY matches xterm ─────────
  useEffect(() => {
    if (status === 'connected' && xtermRef.current && fitAddonRef.current) {
      try {
        fitAddonRef.current.fit();
        sendResize(xtermRef.current.cols, xtermRef.current.rows);
      } catch { /* ignore */ }
    }
  }, [status, sendResize]);

  // ── Status indicator ──────────────────────────────────────────────────
  const statusEl = () => {
    switch (status) {
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 text-green-400 text-xs font-mono">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </span>
        );
      case 'connecting':
        return (
          <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-mono">
            <Loader2 className="w-3 h-3 animate-spin" /> Connecting...
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-red-400 text-xs font-mono">
            <AlertCircle className="w-3 h-3" /> Error
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-gray-500 text-xs font-mono">
            <Minus className="w-3 h-3" /> Disconnected
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-black border-t border-[#333]">
      {/* ── Terminal Tab Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#333] bg-[#0A0A0A] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Terminal
          </span>
          <span className="text-gray-700">|</span>
          {statusEl()}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={reconnect}
            title="Reconnect"
            className="p-1 text-gray-600 hover:text-gray-300 transition-colors rounded"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close terminal"
              className="p-1 text-gray-600 hover:text-red-400 transition-colors rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── xterm.js Mount Target ────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden px-2 py-1"
        style={{ minHeight: 0 }}
        // Allow the terminal to capture keyboard events
        onClick={() => xtermRef.current?.focus()}
      />
    </div>
  );
}
