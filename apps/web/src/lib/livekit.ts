export const getLiveKitConfig = () => {
  return {
    url: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://livekit.example.app',
  };
};
