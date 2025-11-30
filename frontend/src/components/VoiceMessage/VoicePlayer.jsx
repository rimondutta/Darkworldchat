import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download } from 'lucide-react';
import './VoiceMessage.css';

const VoicePlayer = ({ url, duration = 0, waveform = [] }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Generate waveform data if not provided
  const waveformData =
    waveform.length > 0
      ? waveform
      : Array(30)
          .fill(0)
          .map(() => Math.random() * 0.8 + 0.2);

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error);
      });
    }
  };

  // Handle seeking on progress bar click
  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;

    const seekTime = clickPosition * audioRef.current.duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    setProgress(clickPosition * 100);
  };

  // Download voice message
  const handleDownload = (e) => {
    e.stopPropagation();

    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = `voice_message_${new Date().getTime()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Set up audio events
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handlePlay = () => {
      setIsPlaying(true);

      // Update progress regularly during playback
      progressIntervalRef.current = setInterval(() => {
        if (audio.duration) {
          setCurrentTime(audio.currentTime);
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      }, 50);
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration) {
        setCurrentTime(0);
        setProgress(0);
      }
    };

    // Add event listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Clean up
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="voice-player">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="voice-player-controls">
        <button
          onClick={togglePlay}
          className="btn btn-circle btn-sm"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <div className="voice-player-progress" onClick={handleSeek}>
          <div className="voice-player-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <button
          onClick={handleDownload}
          className="btn btn-ghost btn-xs btn-circle"
          aria-label="Download"
        >
          <Download size={14} />
        </button>
      </div>

      <div className="voice-player-waveform">
        {waveformData.map((value, index) => (
          <div
            key={index}
            className={`waveform-bar ${(index / waveformData.length) * 100 <= progress ? 'active' : ''}`}
            style={{ height: `${value * 100}%` }}
          />
        ))}
      </div>

      <div className="voice-player-time">
        {formatTime(currentTime)} / {formatTime(duration || audioRef.current?.duration || 0)}
      </div>
    </div>
  );
};

export default VoicePlayer;
