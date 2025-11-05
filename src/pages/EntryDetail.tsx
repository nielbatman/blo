import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, BlotterEntry } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Trash2, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const EntryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<BlotterEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<BlotterEntry>({
    first_name: '',
    last_name: '',
    case_type: '',
    date: '',
    blotter_entry: '',
  });

  useEffect(() => {
    fetchEntry();
  }, [id]);

  const fetchEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('blotter_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEntry(data);
      setFormData(data);
    } catch (error: any) {
      toast.error('Error loading entry: ' + error.message);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      // Exclude id and created_at from update
      const { id: _, created_at: __, ...updateData } = formData;
      
      const { error } = await supabase
        .from('blotter_entries')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setEntry(formData);
      setIsEditing(false);
      toast.success('Entry updated successfully');
    } catch (error: any) {
      toast.error('Error updating entry: ' + error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('blotter_entries').delete().eq('id', id);

      if (error) throw error;

      toast.success('Entry deleted successfully');
      navigate('/');
    } catch (error: any) {
      toast.error('Error deleting entry: ' + error.message);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!entry) return null;

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-primary px-4 py-4 text-primary-foreground shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Entry Details</h1>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(entry);
                  }}
                  className="text-primary-foreground hover:bg-primary/80"
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdate}
                  className="text-primary-foreground hover:bg-primary/80"
                >
                  <Save className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="text-primary-foreground hover:bg-primary/80"
                >
                  <Edit2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-primary-foreground hover:bg-primary/80"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Edit Entry' : 'View Entry'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case_type">Case Type</Label>
                  <Input
                    id="case_type"
                    name="case_type"
                    value={formData.case_type}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blotter_entry">Blotter Entry</Label>
                  <Textarea
                    id="blotter_entry"
                    name="blotter_entry"
                    value={formData.blotter_entry}
                    onChange={handleChange}
                    rows={6}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{entry.first_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{entry.last_name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Case Type</p>
                  <p className="font-medium">{entry.case_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(entry.date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blotter Entry</p>
                  <p className="mt-2 whitespace-pre-wrap">{entry.blotter_entry}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EntryDetail;
