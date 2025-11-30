import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X } from 'lucide-react';
import './VoiceMessage.css';
import { useChatStore } from '../../store/useChatStore';
import toast from '../../lib/toast';

const VoiceRecorder = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [waveformData, setWaveformData] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);

  const { selectedUser, selectedGroup, sendVoiceMessage } = useChatStore();

  // Start recording
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create analyzer for waveform
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current.fftSize = 128;
      source.connect(analyserRef.current);

      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Handle data available event
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);

        // Clean up audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };

      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          // Auto-stop after 2 minutes (120 seconds)
          if (prevTime >= 120) {
            stopRecording();
            return prevTime;
          }
          return prevTime + 1;
        });
      }, 1000);

      // Start waveform analyzer
      updateWaveform();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone');
    }
  };

  // Update waveform visualization
  const updateWaveform = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!analyserRef.current || !isRecording) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Process data to get 10 bars for visualization
      const bars = 20;
      const normalizedData = [];

      // Skip first few bins (very low frequencies)
      const startBin = 2;

      for (let i = 0; i < bars; i++) {
        let sum = 0;
        const binPerBar = Math.floor((bufferLength - startBin) / bars);
        const startIndex = startBin + i * binPerBar;

        for (let j = 0; j < binPerBar; j++) {
          sum += dataArray[startIndex + j];
        }

        // Normalize between 0.1 and 1
        const normalized = Math.max(0.1, sum / (binPerBar * 255));
        normalizedData.push(normalized);
      }

      setWaveformData(normalizedData);

      if (isRecording) {
        requestAnimationFrame(update);
      }
    };

    update();
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setIsRecording(false);
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    onClose();
  };

  // Send the voice message
  const handleSend = async () => {
    if (!audioBlob) return;

    try {
      const recipientId = selectedUser?._id;
      const groupId = selectedGroup?._id;

      // Call the store function to send voice message
      await sendVoiceMessage({
        audioBlob,
        duration: recordingTime,
        recipientId,
        groupId,
      });

      // Reset state
      setAudioBlob(null);
      setRecordingTime(0);
      onClose();

      toast.success('Voice message sent');
    } catch (error) {
      console.error('Error sending voice message:', error);

      // Check if this is a Cloudinary configuration error
      if (error.message && error.message.includes('Cloudinary configuration')) {
        toast.error('Voice messages are currently unavailable. Please contact an administrator.');
      } else {
        toast.error('Failed to send voice message');
      }
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className={`voice-recorder ${isRecording ? 'recording' : ''}`}>
      {!isRecording && !audioBlob && (
        <>
          <div
            onClick={startRecording}
            className="flex items-center flex-1 cursor-pointer"
            aria-label="Start recording"
          >
            <button className="btn btn-circle btn-sm" aria-label="Start recording icon">
              <Mic size={18} />
            </button>
            <div className="ml-2">Tap anywhere to record voice message</div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle ml-auto"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </>
      )}

      {isRecording && (
        <>
          <div className="timer">{formatTime(recordingTime)}</div>

          <div className="wave-container">
            <div className="wave">
              {waveformData.map((height, index) => (
                <div key={index} className="wave-bar" style={{ height: `${height * 100}%` }} />
              ))}
            </div>
          </div>

          <button
            onClick={stopRecording}
            className="btn btn-error btn-sm btn-circle"
            aria-label="Stop recording"
          >
            <Square size={18} />
          </button>
        </>
      )}

      {!isRecording && audioBlob && (
        <>
          <div className="timer">{formatTime(recordingTime)}</div>

          <div className="wave-container">
            <div className="wave">
              {/* Show static waveform for recorded audio */}
              {waveformData.map((height, index) => (
                <div key={index} className="wave-bar" style={{ height: `${height * 100}%` }} />
              ))}
            </div>
          </div>

          <button
            onClick={handleSend}
            className="btn btn-primary btn-sm btn-circle"
            aria-label="Send voice message"
          >
            <Send size={18} />
          </button>

          <button
            onClick={cancelRecording}
            className="btn btn-ghost btn-sm btn-circle ml-2"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </>
      )}
    </div>
  );
};

export default VoiceRecorder;
