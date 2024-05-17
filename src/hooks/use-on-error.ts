import { useEffect } from 'react';
import { ErrorEvent, subscribeToErrorEvent } from '../api/api';

export const useOnError = (handler: (event: ErrorEvent) => void) => {
  useEffect(() => {
    const unsubscribePromise = subscribeToErrorEvent(handler);

    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe());
    };
  });
};
