import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // Data dianggap segar selama 30 detik
      refetchOnWindowFocus: true,
      retry: 1
    }
  }
});
