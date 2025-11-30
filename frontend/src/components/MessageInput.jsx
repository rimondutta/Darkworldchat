// import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import { useRef, useState, useEffect } from 'react';

import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { Image, Send, X, Mic, Smile } from 'lucide-react';
import toast from '../lib/toast';
import { VoiceRecorder } from './VoiceMessage';

const MessageInput = ({ isGroup = false }) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage, sendGroupMessage, selectedGroup, selectedUser } = useChatStore();
  const { socket } = useAuthStore();
  const typingTimeoutRef = useRef(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifOffset, setGifOffset] = useState(0);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const [selectedGifUrl, setSelectedGifUrl] = useState(null);
  const gifContainerRef = useRef(null);
  const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API;
  const GIF_LIMIT = 6;

  const fetchGifs = async (offset = 0, isNewSearch = false) => {
    if (isLoadingGifs) return;

    setIsLoadingGifs(true);
    try {
      const endpoint = gifSearchQuery.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${gifSearchQuery}&limit=${GIF_LIMIT}&offset=${offset}`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${GIF_LIMIT}&offset=${offset}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.data) {
        if (isNewSearch) {
          setGifs(data.data);
        } else {
          setGifs((prev) => [...prev, ...data.data]);
        }
        setGifOffset(offset);
      }
    } catch (error) {
      console.error('Failed to fetch GIFs:', error);
      toast.error('Failed to load GIFs');
    } finally {
      setIsLoadingGifs(false);
    }
  };

  useEffect(() => {
    if (showGifPicker && gifs.length === 0) {
      fetchGifs(0, true);
    }
  }, [showGifPicker]);

  useEffect(() => {
    if (showGifPicker) {
      const timer = setTimeout(() => {
        fetchGifs(0, true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gifSearchQuery]);

  const handleGifScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoadingGifs && gifOffset < 94) {
      fetchGifs(gifOffset + GIF_LIMIT, false);
    }
  };

  const handleSelectGif = (gif) => {
    const gifUrl = gif.images.original.url;
    setSelectedGifUrl(gifUrl);
    setImagePreview(gifUrl);
    setShowGifPicker(false);
    setGifs([]);
    setGifSearchQuery('');
    setGifOffset(0);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setSelectedGifUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setSelectedGifUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEmojiClick = (emojiObject) => {
    setText((prevText) => prevText + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      const messageData = {
        text: text.trim(),
        image: imagePreview,
      };

      if (isGroup) {
        if (!selectedGroup?._id) {
          toast.error('No group selected!');
          return;
        }
        await sendGroupMessage(selectedGroup._id, messageData);
      } else {
        if (!selectedUser?._id) {
          toast.error('No user selected!');
          return;
        }
        await sendMessage(messageData);
      }

      setText('');
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  useEffect(() => {
    if (!selectedUser || !socket) return;

    const handleTyping = () => {
      if (text.trim()) {
        socket.emit('startTyping', { receiverId: selectedUser._id });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('stopTyping', { receiverId: selectedUser._id });
        }, 1000);
      } else {
        socket.emit('stopTyping', { receiverId: selectedUser._id });
      }
    };

    handleTyping();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [text, selectedUser, socket]);

  return (
    <div className="p-4 w-full relative">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {showVoiceRecorder && (
        <div className="mb-3 border border-zinc-700 rounded-lg bg-base-200 p-3">
          <VoiceRecorder onClose={() => setShowVoiceRecorder(false)} />
        </div>
      )}

      {showGifPicker && (
        <div className="mb-3 border border-zinc-700 rounded-lg bg-base-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Select a GIF</h3>
            <button
              onClick={() => {
                setShowGifPicker(false);
                setGifs([]);
                setGifSearchQuery('');
                setGifOffset(0);
              }}
              className="btn btn-ghost btn-xs"
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <input
            type="text"
            className="w-full input input-bordered input-sm mb-3"
            placeholder="Search GIFs..."
            value={gifSearchQuery}
            onChange={(e) => setGifSearchQuery(e.target.value)}
          />

          <div
            ref={gifContainerRef}
            onScroll={handleGifScroll}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 sm:max-h-80 overflow-y-auto"
          >
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => handleSelectGif(gif)}
                className="relative aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {isLoadingGifs && (
            <div className="text-center py-2">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          )}

          {gifOffset >= 94 && (
            <div className="text-center py-2 text-xs text-zinc-500">Maximum GIFs loaded (100)</div>
          )}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          {/* Voice recording button */}
          <button
            type="button"
            className={`flex btn btn-circle btn-sm sm:btn-md
                     ${showVoiceRecorder ? 'text-emerald-500' : 'text-zinc-400'}`}
            onClick={() => {
              setShowVoiceRecorder(!showVoiceRecorder);
              if (showGifPicker) setShowGifPicker(false);
            }}
          >
            <Mic size={20} />
          </button>

          {/* Image upload button */}
          <button
            type="button"
            className="btn btn-circle btn-sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={20} />
          </button>

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>

          {/* GIF button */}
          <button
            type="button"
            className={`flex btn btn-circle btn-sm sm:btn-md
                     ${showGifPicker ? 'text-emerald-500' : 'text-zinc-400'}`}
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              if (showVoiceRecorder) setShowVoiceRecorder(false);
            }}
          >
            <span className="font-bold text-xs sm:text-sm">GIF</span>
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>

      {showEmojiPicker && (
        <div className="absolute bottom-16 right-4 z-10">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default MessageInput;
