"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Terminal, Maximize2, Minimize2, X, Loader2 } from 'lucide-react';
import { useTerminal } from '@/features/ide/useTerminal';
import 'xterm/css/xterm.css';

interface FloatingTerminalProps {
  projectId: string;
}

export const FloatingTerminal: React.FC<FloatingTerminalProps> = ({ projectId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const isInitialisedRef = useRef(false);
  
  const [isMaximized, setIsMaximized] = useState(false);

  // Use our real, existing Docker container websocket hook
  const { status, sendData, sendResize, onData } = useTerminal(projectId);

  useEffect(() => {
    if (!containerRef.current || isInitialisedRef.current) return;
    isInitialisedRef.current = true;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: 'transparent',
        foreground: '#4ade80',
        cursor: '#6366f1',
      },
      allowTransparency: true,
      scrollback: 10000,
      convertEol: true, // Prevent raw \r\n from causing double newlines
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Defer open() until the DOM has painted the container to get real pixel dimensions
    const mountTimeout = setTimeout(() => {
      if (!containerRef.current) return;

      term.open(containerRef.current);
      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // Use ResizeObserver to detect the container's REAL width after layout,
      // then fit. This is the definitive fix for the "backspace jumps line" bug
      // which is caused by xterm computing columns against a 0px-wide container.
      const ro = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          try {
            fitAddon.fit();
            sendResize(term.cols, term.rows);
          } catch (e) { /* safe */ }
        });
      });
      ro.observe(containerRef.current);

      // Trigger one fit immediately too in case ResizeObserver fires late
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
          sendResize(term.cols, term.rows);
        } catch (e) { /* safe */ }
      });

      return () => ro.disconnect();
    }, 150);

    const onDataDisposable = term.onData((data) => {
      sendData(data);
    });

    onData((text) => {
      term.write(text);
    });

    return () => {
      clearTimeout(mountTimeout);
      onDataDisposable.dispose();
      term.dispose();
      isInitialisedRef.current = false;
    };
  }, [sendData, sendResize, onData]);

  // Handle resizing dynamically when the window OR the maximized state changes
  useEffect(() => {
    let rafId: number;
    
    const handleResize = () => {
      try {
        if (fitAddonRef.current && xtermRef.current) {
          fitAddonRef.current.fit();
          sendResize(xtermRef.current.cols, xtermRef.current.rows);
          // Auto-scroll to bottom helps prevent clipping visually
          xtermRef.current.scrollToBottom();
        }
      } catch (e) {
        // Safe catch
      }
    };
    
    // We wait 350ms to let the flex-box / width transition finish animating
    // Before computing the new grid columns for xterm.js
    const timer = setTimeout(() => {
      rafId = requestAnimationFrame(handleResize);
    }, 350); 
    
    const debouncedResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleResize);
    };

    window.addEventListener('resize', debouncedResize);
    
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, [sendResize, isMaximized]);

  // ── "Magic Bridge" for Smart Run button ────────────────────────
  useEffect(() => {
    const handleInjection = (e: Event) => {
      const customEvent = e as CustomEvent;
      const command = customEvent.detail;
      
      // Inject the command directly into the active WebSocket connection!
      sendData(command);
      
      // Auto-maximize the terminal if it's not already, so they can see the output
      setIsMaximized(true);
    };

    window.addEventListener('inject-terminal-command', handleInjection);
    return () => window.removeEventListener('inject-terminal-command', handleInjection);
  }, [sendData]);

  return (
    <>
      {/* Custom CSS to elegantly style the underlying xterm.js scrollbar instead of native white blocks */}
      <style dangerouslySetInnerHTML={{__html: `
        .xterm .xterm-viewport::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .xterm .xterm-viewport::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .xterm .xterm-viewport::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }
        .xterm .xterm-viewport::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}} />
      
      <div 
        className={`absolute z-30 bg-[#0a0a0c]/80 backdrop-blur-3xl border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMaximized 
            ? 'inset-2 md:inset-4 md:left-[304px] lg:inset-6 lg:left-[344px] w-auto h-auto' // Responsive maximized bounds
            : 'bottom-2 right-2 md:bottom-6 md:right-6 w-[calc(100vw-1rem)] md:w-[550px] h-[300px] md:h-[360px] max-w-full'
        }`}
      >
        {/* Terminal Header */}
        <div className="h-10 flex items-center justify-between px-4 border-b border-white/10 bg-white/[0.04] shrink-0">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300 uppercase tracking-widest leading-none">Container Shell</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border border-white/5 text-[10px] font-mono leading-none">
               {status === 'connected' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-emerald-500/80 uppercase tracking-widest mt-0.5">ACTIVE</span>
                  </>
               ) : status === 'connecting' ? (
                  <>
                    <Loader2 size={10} className="text-yellow-500 animate-spin" />
                    <span className="text-yellow-500/80 uppercase tracking-widest mt-0.5">CONNECTING</span>
                  </>
               ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span className="text-red-500/80 uppercase tracking-widest mt-0.5">DISCONNECTED</span>
                  </>
               )}
            </div>
            
            <button 
              onClick={() => setIsMaximized(!isMaximized)} 
              className="text-zinc-500 hover:text-white transition-colors"
              title={isMaximized ? "Restore Size" : "Maximize Terminal"}
            >
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button className="text-zinc-500 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>
        
        {/* Terminal Content Box */}
        {/* We fix the clipping by adding overflow-hidden on the parent and letting xterm.js manage viewport scrolling securely */}
        <div className="flex-1 p-2 pl-3 bg-[#050505]/40 relative overflow-hidden">
           <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>
    </>
  );
};
