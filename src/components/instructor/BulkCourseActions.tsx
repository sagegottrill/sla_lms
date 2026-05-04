import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff, Copy, Archive } from 'lucide-react';

interface BulkCourseActionsProps {
  selectedCourses: number[];
  onPublishToggle: (courseIds: number[]) => void;
  onDuplicate: (courseId: number, newTitle: string) => void;
  onArchive: (courseIds: number[], reason?: string) => void;
  onClearSelection: () => void;
}

export default function BulkCourseActions({
  selectedCourses,
  onPublishToggle,
  onDuplicate,
  onArchive,
  onClearSelection,
}: BulkCourseActionsProps) {
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [duplicateTitle, setDuplicateTitle] = useState('');
  const [archiveReason, setArchiveReason] = useState('');

  if (selectedCourses.length === 0) {
    return null;
  }

  const handleDuplicate = () => {
    if (selectedCourses.length === 1 && duplicateTitle.trim()) {
      onDuplicate(selectedCourses[0], duplicateTitle.trim());
      setDuplicateDialogOpen(false);
      setDuplicateTitle('');
      onClearSelection();
    }
  };

  const handleArchive = () => {
    onArchive(selectedCourses, archiveReason.trim() || undefined);
    setArchiveDialogOpen(false);
    setArchiveReason('');
    onClearSelection();
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">
            {selectedCourses.length} course{selectedCourses.length > 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPublishToggle(selectedCourses)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Toggle Publish
            </Button>

            {selectedCourses.length === 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDuplicateDialogOpen(true)}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setArchiveDialogOpen(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Archive className="w-4 h-4" />
              Archive
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Course</DialogTitle>
            <DialogDescription>
              Create a copy of this course with a new title. All lessons will be copied.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-title">New Course Title</Label>
              <Input
                id="duplicate-title"
                placeholder="Enter new course title"
                value={duplicateTitle}
                onChange={(e) => setDuplicateTitle(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDuplicateDialogOpen(false);
                setDuplicateTitle('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicate}
              disabled={!duplicateTitle.trim()}
            >
              Duplicate Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Course{selectedCourses.length > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              This will unpublish and archive {selectedCourses.length} course{selectedCourses.length > 1 ? 's' : ''}. 
              You can restore them later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="archive-reason">Reason (Optional)</Label>
              <Textarea
                id="archive-reason"
                placeholder="Why are you archiving this course?"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setArchiveDialogOpen(false);
                setArchiveReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchive}
            >
              Archive Course{selectedCourses.length > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
