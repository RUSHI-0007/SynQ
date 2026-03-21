"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, GitMerge, FileCode2, Info } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase.
// Assuming NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are in .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MergeRequest {
  id: string;
  project_id: string;
  author_id: string;
  commit_message: string;
  status: "pending" | "accepted" | "merged" | "rejected" | "failed";
  diff_payload: string;
}

interface MergeVote {
  request_id: string;
  user_id: string;
  decision: "approve" | "reject";
}

interface MergeModalProps {
  projectId: string;
  // Passing teammates so we can render avatars for everyone who needs to vote
  teammates: { id: string; name: string; avatarUrl: string }[];
  isOpen?: boolean;
  onClose?: () => void;
}

export const MergeModal: React.FC<MergeModalProps> = ({
  projectId,
  teammates,
}) => {
  const { user } = useUser();
  const [activeRequest, setActiveRequest] = useState<MergeRequest | null>(null);
  const [votes, setVotes] = useState<MergeVote[]>([]);
  const [isVoting, setIsVoting] = useState(false);

  // 1. Initial Fetch & Realtime Subscription
  useEffect(() => {
    if (!projectId) return;

    // Fetch the currently active pending request for this project
    const fetchActiveRequest = async () => {
      const { data, error } = await supabase
        .from("merge_requests")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setActiveRequest(data);
        fetchVotes(data.id);
      }
    };

    const fetchVotes = async (requestId: string) => {
      const { data } = await supabase
        .from("merge_votes")
        .select("*")
        .eq("request_id", requestId);
      if (data) setVotes(data);
    };

    fetchActiveRequest();

    // Subscribe to new merge requests for this project
    const requestSub = supabase
      .channel("public:merge_requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "merge_requests",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newReq = payload.new as MergeRequest;
          if (newReq.status === "pending") {
            setActiveRequest(newReq);
            fetchVotes(newReq.id);
          } else if (
            newReq.status === "merged" ||
            newReq.status === "failed" ||
            newReq.status === "rejected"
          ) {
            // Close the modal if the active request resolves
            if (activeRequest?.id === newReq.id) {
              // Add a slight delay before closing so users see the success state
              setTimeout(() => setActiveRequest(null), 2000);
            }
          }
        },
      )
      .subscribe();

    // Subscribe to votes for the active request
    const voteSub = supabase
      .channel("public:merge_votes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "merge_votes" },
        (payload) => {
          // If we have an active request, update the votes array
          setVotes((current) => {
            const newVote = payload.new as MergeVote;
            // Overwrite existing user vote or add new one
            const filtered = current.filter(
              (v) => v.user_id !== newVote.user_id,
            );
            return [...filtered, newVote];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestSub);
      supabase.removeChannel(voteSub);
    };
  }, [projectId, activeRequest?.id]);

  // Derived state
  const hasVoted = useMemo(() => {
    if (!user || !activeRequest) return false;
    return votes.some(
      (v) => v.user_id === user.id && v.request_id === activeRequest.id,
    );
  }, [votes, user, activeRequest]);

  const handleVote = async () => {
    if (!activeRequest || !user) return;
    setIsVoting(true);
    try {
      // Hit our backend engine
      await fetch("/api/merge/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: activeRequest.id,
          userId: user.id,
          decision: "approve",
        }),
      });
      // State updates via Supabase Realtime
    } catch (error) {
      console.error("Failed to cast vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  if (!activeRequest) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(99,102,241,0.15)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <GitMerge size={20} />
              </div>
              <div>
                <h2 className="text-white font-medium text-lg tracking-tight">
                  Consensus Merge Required
                </h2>
                <p className="text-zinc-400 text-sm">
                  Waiting for unanimous team approval to push to main
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-medium tracking-wide flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
              </span>
              PENDING
            </div>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-6">
            {/* Commit Message & Info */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <Info className="text-zinc-400 mt-0.5" size={18} />
              <div>
                <h3 className="text-zinc-200 font-medium mb-1">
                  Commit Message
                </h3>
                <p className="text-zinc-400 text-sm code font-mono">
                  {activeRequest.commit_message}
                </p>
              </div>
            </div>

            {/* Fake Git Diff Block */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <FileCode2 size={16} className="text-zinc-500" />
                <span className="text-sm text-zinc-400 font-medium">
                  Changes proposed
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#0d0d0d] font-mono text-[13px] leading-relaxed shadow-inner">
                <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
                  <span className="text-zinc-500 text-xs">
                    src/components/ui/Button.tsx
                  </span>
                </div>
                <div className="p-4 overflow-x-auto whitespace-pre">
                  <div className="text-zinc-500 line-through opacity-70">
                    <span className="text-red-400 select-none mr-4">-</span>
                    <span className="text-red-300">export const Button = () =&gt; {'{'}</span>
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-green-400 select-none mr-4">+</span>
                    <span className="text-green-300">export const Button = ({'{'} variant = &apos;primary&apos; {'}'}) =&gt; {'{'}</span>
                  </div>
                  <div className="text-zinc-500">
                    <span className="text-transparent select-none mr-4"> </span> return (
                  </div>
                  <div className="text-zinc-500 line-through opacity-70">
                    <span className="text-red-400 select-none mr-4">-</span>
                    <span className="text-red-300">    &lt;button className=&quot;bg-blue-500&quot;&gt;</span>
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-green-400 select-none mr-4">+</span>
                    <span className="text-green-300">    &lt;button className={`base-btn \${variant}`}&gt;</span>
                  </div>
                  <div className="text-zinc-500">
                    <span className="text-transparent select-none mr-4"> </span>      Click me
                  </div>
                  <div className="text-zinc-500">
                    <span className="text-transparent select-none mr-4"> </span>    &lt;/button&gt;
                  </div>
                </div>
              </div>
            </div>

            {/* Teammate Avatars & Status */}
            <div>
              <h3 className="text-sm text-zinc-400 mb-3 px-1 font-medium">
                Voter Status ({votes.length}/{teammates.length})
              </h3>
              <div className="flex items-center gap-3">
                {teammates.map((mate) => {
                  const mateVote = votes.find((v) => v.user_id === mate.id);
                  const isApproved = mateVote?.decision === "approve";

                  return (
                    <div key={mate.id} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mate.avatarUrl}
                        alt={mate.name}
                        className={`w-10 h-10 rounded-full border-2 transition-colors ${
                          isApproved
                            ? "border-green-500"
                            : "border-zinc-700 opacity-50 grayscale"
                        }`}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-[#0a0a0a] rounded-full p-0.5">
                        {isApproved ? (
                          <CheckCircle2
                            size={14}
                            className="text-green-500 fill-green-500/20"
                          />
                        ) : (
                          <Loader2
                            size={14}
                            className="text-zinc-500 animate-spin"
                          />
                        )}
                      </div>

                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                        {mate.name} {isApproved ? "approved" : "reviewing..."}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="p-6 pt-2">
            <button
              onClick={handleVote}
              disabled={hasVoted || isVoting}
              className={`w-full py-3.5 rounded-xl font-medium tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                hasVoted
                  ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-indigo-500/50"
              }`}
            >
              {hasVoted ? (
                <>
                  <Loader2 size={18} className="animate-spin text-zinc-500" />
                  Waiting for team...
                </>
              ) : isVoting ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                "Approve Merge"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
