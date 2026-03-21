'use client';

import React from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { useLiveKitToken } from '../../hooks/useLiveKit';
import { getLiveKitConfig } from '../../lib/livekit';

import '@livekit/components-styles';

export function VoiceChannel({ projectId }: { projectId: string }) {
  const { token } = useLiveKitToken(projectId);
  const config = getLiveKitConfig();

  if (!token) {
    return <div className="p-4 text-slate-400 bg-slate-800 rounded">Connecting to voice channel...</div>;
  }

  return (
    <div className="rounded overflow-hidden">
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={config.url}
        data-lk-theme="default"
        style={{ height: '300px' }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
