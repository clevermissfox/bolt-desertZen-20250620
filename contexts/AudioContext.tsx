import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import type { Meditation } from '@/lib/supabase';

interface AudioContextType {
  currentMeditation: Meditation | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  playMeditation: (meditation: Meditation) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentMeditation, setCurrentMeditation] = useState<Meditation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mounted, setMounted] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Mark component as mounted
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      // Cleanup audio when unmounting
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);

  const safeSetState = useCallback((setter: () => void) => {
    if (mounted) {
      setter();
    }
  }, [mounted]);

  const playMeditation = async (meditation: Meditation) => {
    if (!mounted) return;
    
    try {
      // If same meditation is already loaded, just play it
      if (currentMeditation?.id === meditation.id && soundRef.current) {
        await soundRef.current.playAsync();
        safeSetState(() => setIsPlaying(true));
        return;
      }

      // Stop any currently playing audio
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Configure audio mode for playback
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }

      // Create new sound instance with the actual audio URL
      const { sound } = await Audio.Sound.createAsync(
        { uri: meditation.audioUrl },
        { shouldPlay: true, isLooping: false }
      );

      if (!mounted) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      safeSetState(() => {
        setCurrentMeditation(meditation);
        setIsPlaying(true);
      });

      // Set up status updates
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!mounted) return;
        
        if (status.isLoaded) {
          safeSetState(() => {
            setPosition(status.positionMillis || 0);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);
          });
        }
      });

    } catch (error) {
      console.error('Error playing meditation:', error);
    }
  };

  const pauseAudio = async () => {
    if (!mounted || !soundRef.current) return;
    
    try {
      await soundRef.current.pauseAsync();
      safeSetState(() => setIsPlaying(false));
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const resumeAudio = async () => {
    if (!mounted || !soundRef.current) return;
    
    try {
      await soundRef.current.playAsync();
      safeSetState(() => setIsPlaying(true));
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  };

  const stopAudio = async () => {
    if (!mounted) return;
    
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      safeSetState(() => {
        setCurrentMeditation(null);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
      });
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const seekTo = async (newPosition: number) => {
    if (!mounted || !soundRef.current) return;
    
    try {
      await soundRef.current.setPositionAsync(newPosition);
      safeSetState(() => setPosition(newPosition));
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentMeditation,
        isPlaying,
        position,
        duration,
        playMeditation,
        pauseAudio,
        resumeAudio,
        stopAudio,
        seekTo,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}