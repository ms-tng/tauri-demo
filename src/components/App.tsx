import { FC } from 'react';
import { useOnError } from '../hooks/use-on-error.ts';
import { PortListenersTable } from './PortListenersTable.tsx';
import { Toaster } from './ui/toaster.tsx';
import { useToast } from './ui/use-toast.ts';

export const App: FC = () => {
  const { toast } = useToast();

  useOnError((err) => {
    toast({
      title: 'Error',
      description: err.message,
      variant: 'destructive',
    });
  });

  return (
    <div className="p-4">
      <PortListenersTable />
      <Toaster />
    </div>
  );
};
