import toast from 'react-hot-toast';

// Simple dedupe map: key -> timeout id
const recent = new Map();
const DEDUPE_WINDOW_MS = 1500;

function makeKey(type, message) {
  return `${type}::${message}`;
}

export default {
  success: (message, opts) => {
    const key = makeKey('success', message);
    if (recent.has(key)) return;
    recent.set(
      key,
      setTimeout(() => recent.delete(key), DEDUPE_WINDOW_MS)
    );
    return toast.success(message, opts);
  },
  error: (message, opts) => {
    const key = makeKey('error', message);
    if (recent.has(key)) return;
    recent.set(
      key,
      setTimeout(() => recent.delete(key), DEDUPE_WINDOW_MS)
    );
    return toast.error(message, opts);
  },
  info: (message, opts) => {
    const key = makeKey('info', message);
    if (recent.has(key)) return;
    recent.set(
      key,
      setTimeout(() => recent.delete(key), DEDUPE_WINDOW_MS)
    );
    return toast(message, { ...opts });
  },
  // Expose raw toast for cases where caller needs id or further control
  raw: toast,
};
