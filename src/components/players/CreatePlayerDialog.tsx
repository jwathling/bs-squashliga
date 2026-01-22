import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreatePlayer } from "@/hooks/usePlayers";
import { toast } from "sonner";

interface CreatePlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (playerId: string) => void;
}

export function CreatePlayerDialog({ open, onOpenChange, onCreated }: CreatePlayerDialogProps) {
  const [name, setName] = useState("");
  const createPlayer = useCreatePlayer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Bitte gib einen Namen ein");
      return;
    }

    try {
      const player = await createPlayer.mutateAsync(name.trim());
      toast.success(`Spieler "${player.name}" erstellt!`);
      setName("");
      onOpenChange(false);
      onCreated?.(player.id);
    } catch (error) {
      toast.error("Fehler beim Erstellen des Spielers");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuen Spieler erstellen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createPlayer.isPending}>
              {createPlayer.isPending ? "Erstelle..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
