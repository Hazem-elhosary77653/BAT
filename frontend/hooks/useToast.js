'use client';

import { useState } from 'react';

export default function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info', duration = 4000) => {
    setToast({ message, type, duration });
  };

  const success = (message, duration = 4000) => {
    showToast(message, 'success', duration);
  };

  const error = (message, duration = 4000) => {
    showToast(message, 'error', duration);
  };

  const warning = (message, duration = 4000) => {
    showToast(message, 'warning', duration);
  };

  const info = (message, duration = 4000) => {
    showToast(message, 'info', duration);
  };

  const close = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    success,
    error,
    warning,
    info,
    close
  };
}
