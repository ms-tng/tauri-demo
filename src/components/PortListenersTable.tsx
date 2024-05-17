import { cn } from '../lib/utils';
import { Loader, X } from 'lucide-react';
import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PortListener, killProcess } from '../api/api';
import { usePortListeners } from '../hooks/use-port-listeners';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { useToast } from './ui/use-toast';

export const PortListenersTable: FC = () => {
  const portListeners = usePortListeners();
  const [isFlashing, setIsFlashing] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (portListeners.length > 0) {
      setIsFlashing((f) => f !== undefined);
    }
  }, [portListeners]);

  return portListeners.length === 0 ? (
    <Loader className="animate-spin" />
  ) : (
    <>
      {createPortal(
        <div
          className={cn(
            'fixed left-0 top-0 w-screen h-screen -z-50 transition-[background-color] duration-200',
            {
              'bg-blue-50': isFlashing,
              'bg-transparent': !isFlashing,
            },
          )}
          onTransitionEnd={() => {
            setIsFlashing(false);
          }}
        />,
        document.body,
      )}

      <table className="text-left">
        <thead>
          <tr>
            <th className="min-w-24 pr-8">Port</th>
            <th className="min-w-56 pr-8">Process name</th>
            <th className="min-w-24 pr-8">Process ID</th>
            <th className="min-w-24 pr-8">Kill</th>
          </tr>
        </thead>

        <tbody className="font-mono">
          {portListeners.map((portListener) => (
            <PortListenerRow key={portListener.port} {...portListener} />
          ))}
        </tbody>
      </table>
    </>
  );
};

const PortListenerRow: FC<PortListener> = ({
  port,
  processId,
  processName,
}) => {
  const { toast } = useToast();

  return (
    <tr>
      <td className="pr-8">
        <Badge>{port}</Badge>
      </td>

      <td className="pr-8">{processName}</td>

      <td className="pr-8">{processId}</td>

      <td className="pr-8">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-6 w-6 p-0" variant="destructive">
              <X className="h-4 w-4" />
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogTitle>Kill process</DialogTitle>

            <div>
              Do you really want to kill process #{processId}: {processName}?
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  className="min-w-28"
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await killProcess({ processId });

                      toast({
                        title: 'Success',
                        description: `Killed process #${processId}: ${processName}`,
                        variant: 'success',
                      });
                    } catch (err) {
                      toast({
                        title: 'Error',
                        description: `Failed to kill process #${processId}: ${processName}`,
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Kill
                </Button>
              </DialogClose>

              <DialogClose asChild>
                <Button className="min-w-28" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  );
};
