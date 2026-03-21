import React, { useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useConnectionState
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useVoice } from './useVoice';
import { Phone, PhoneOff, Mic, MicOff, Loader2, Volume2 } from 'lucide-react';

interface VoiceRoomProps {
  projectId: string;
  userName: string;
  livekitUrl: string; // usually process.env.NEXT_PUBLIC_LIVEKIT_URL
}

export function VoiceRoom({ projectId, userName, livekitUrl }: VoiceRoomProps) {
  const { token, loading, error, connect, disconnect } = useVoice(projectId, userName);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-gray-800 bg-[#0A0A0A] rounded-sm">
        <div className="flex w-12 h-12 rounded bg-blue-500/10 text-blue-400 items-center justify-center mb-4">
          <Phone className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-200 tracking-wide uppercase">Team Audio</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4 text-center max-w-[200px]">
          Join the low-latency WebRTC audio channel to sync with your team.
        </p>
        
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        
        <button
          onClick={connect}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] rounded-md active:scale-95"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
          {loading ? 'Connecting...' : 'Join Audio'}
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={disconnect}
      className="border border-gray-800 bg-[#0A0A0A] rounded-sm overflow-hidden"
    >
      <RoomAudioRenderer />
      {/* We are completely replacing the default UI with a Brutalist custom design mapping directly to hooks */}
      <CustomVoiceControls onLeave={disconnect} />
    </LiveKitRoom>
  );
}

// Subcomponent that must live INSIDE <LiveKitRoom> to access hooks
function CustomVoiceControls({ onLeave }: { onLeave: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants(); // all users in room
  const connectionState = useConnectionState();

  const isMuted = !localParticipant?.isMicrophoneEnabled;

  const toggleMic = async () => {
    if (!localParticipant) return;
    if (isMuted) {
      await localParticipant.setMicrophoneEnabled(true);
    } else {
      await localParticipant.setMicrophoneEnabled(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Active Users Feed */}
      <div className="flex flex-col p-4 border-b border-gray-800 bg-[#121212] min-h-[120px] max-h-[200px] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Active Call</span>
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {participants.length} Participant{participants.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex flex-col gap-2">
          {participants.map((p) => {
            const isSpeaking = p.isSpeaking;
            return (
              <div key={p.identity} className="flex items-center justify-between px-3 py-2 bg-black border border-gray-800">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`} />
                  <span className={`text-sm tracking-tight ${p.isLocal ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}>
                    {p.name || p.identity} {p.isLocal && '(You)'}
                  </span>
                </div>
                {!p.isMicrophoneEnabled ? (
                  <MicOff className="w-3.5 h-3.5 text-red-500/70" />
                ) : (
                  <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-green-400' : 'text-gray-500'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between p-3 bg-[#0A0A0A]">
        
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          {connectionState === ConnectionState.Connecting && (
            <span className="flex items-center gap-2 text-yellow-500"><Loader2 className="w-3 h-3 animate-spin"/> Connecting...</span>
          )}
          {connectionState === ConnectionState.Connected && (
            <span className="text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">WebRTC Locked</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
              isMuted 
                ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20' 
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onLeave}
            className="flex items-center justify-center w-10 h-10 bg-red-600 hover:bg-red-500 text-white rounded-sm transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
