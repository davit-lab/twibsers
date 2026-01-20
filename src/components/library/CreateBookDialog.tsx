import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useBookActions } from '@/hooks/useBooks';
import { Plus } from 'lucide-react';

interface CreateBookDialogProps {
  onBookCreated?: () => void;
}

export default function CreateBookDialog({ onBookCreated }: CreateBookDialogProps) {
  const navigate = useNavigate();
  const { createBook } = useBookActions();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    const book = await createBook(title.trim(), description.trim() || undefined);
    setIsCreating(false);

    if (book) {
      setTitle('');
      setDescription('');
      setOpen(false);
      onBookCreated?.();
      navigate(`/library/book/${book.id}/edit`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Book
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Book</DialogTitle>
          <DialogDescription>
            Start writing your new book. You can add chapters and publish when ready.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your book about?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim() || isCreating}>
            {isCreating ? 'Creating...' : 'Create Book'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
