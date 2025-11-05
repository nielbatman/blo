import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const Settings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [importing, setImporting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Normalize column names (trim spaces, lowercase) and convert Excel dates
          const normalizedData = jsonData.map((row: any) => {
            const normalizedRow: any = {};
            Object.keys(row).forEach((key) => {
              const normalizedKey = key.trim().toLowerCase();
              let value = row[key];
              
              // Convert Excel serial date to proper date format
              if (normalizedKey === 'date' && typeof value === 'number') {
                // Excel stores dates as days since 1900-01-01
                const excelEpoch = new Date(1900, 0, 1);
                const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
                value = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
              }
              
              normalizedRow[normalizedKey] = value;
            });
            return normalizedRow;
          });

          // Validate headers
          const requiredColumns = ['blotter_entry', 'first_name', 'last_name', 'case_type', 'date'];
          const firstRow = normalizedData[0] as any;
          const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

          if (missingColumns.length > 0) {
            toast.error(`Missing columns: ${missingColumns.join(', ')}`);
            setImporting(false);
            return;
          }

          // Insert data
          const { error } = await supabase.from('blotter_entries').insert(normalizedData);

          if (error) throw error;

          toast.success(`Successfully imported ${normalizedData.length} entries`);
          navigate('/');
        } catch (error: any) {
          toast.error('Error processing file: ' + error.message);
        } finally {
          setImporting(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.error('Error reading file: ' + error.message);
      setImporting(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      const { error } = await supabase.from('blotter_entries').delete().neq('id', 0);

      if (error) throw error;

      toast.success('All entries deleted successfully');
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      navigate('/');
    } catch (error: any) {
      toast.error('Error deleting entries: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-primary px-4 py-4 text-primary-foreground shadow-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-primary-foreground hover:bg-primary/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Import Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Upload an Excel (.xlsx) or CSV file with blotter entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="w-full"
            >
              {importing ? 'Importing...' : 'Select File to Import'}
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              Required columns: blotter_entry, first_name, last_name, case_type, date
            </p>
          </CardContent>
        </Card>

        {/* Delete All */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete all entries from the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full"
            >
              Delete All Entries
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Entries</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This will permanently delete all blotter entries. This action cannot be undone.</p>
              <div className="space-y-2">
                <Label htmlFor="delete-confirmation">
                  Type <strong>DELETE</strong> to confirm
                </Label>
                <Input
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmation('');
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={deleteConfirmation !== 'DELETE'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
