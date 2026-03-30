interface Window {
  umami?: {
    track: (event: string, data?: Record<string, string>) => void;
  };
}

interface Document {
  startViewTransition?: (callback: () => void) => void;
}
