import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that listens for force refresh signals via Supabase Realtime.
 * When a refresh signal is received, the page will reload.
 */
export const useForceRefresh = () => {
  useEffect(() => {
    const channel = supabase
      .channel('force-refresh')
      .on('broadcast', { event: 'refresh' }, () => {
        console.log('Force refresh signal received, reloading...');
        window.location.reload();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};

/**
 * Trigger a force refresh for all connected clients.
 * Call this function to broadcast a refresh signal.
 */
export const triggerForceRefresh = async () => {
  const channel = supabase.channel('force-refresh');
  await channel.subscribe();
  await channel.send({
    type: 'broadcast',
    event: 'refresh',
    payload: { timestamp: Date.now() }
  });
  await supabase.removeChannel(channel);
};
