import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, BlotterEntry } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Menu, X, LogOut, Plus, Search, ChevronsUpDown, Check, BookMarked, Settings } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

const BlotterList = () => {
  const [entries, setEntries] = useState<BlotterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstNameSearch, setFirstNameSearch] = useState('');
  const [lastNameSearch, setLastNameSearch] = useState('');
  const debouncedFirstName = useDebounce(firstNameSearch, 500);
  const debouncedLastName = useDebounce(lastNameSearch, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const ROWS_PER_PAGE = 20;
  
  const { signOut, session } = useAuth();
  const navigate = useNavigate();

  // Handle sidebar toggle and outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar-container');
      const target = e.target as HTMLElement;
      
      if (isSidebarOpen && 
          sidebar && 
          !sidebar.contains(target) &&
          !target.closest('.sidebar-toggle')) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSidebarOpen]);
  
  // Close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    if (!session) return;
    
    const fetchInitialEntries = async () => {
      try {
        setLoading(true);
        
        const { count, data, error } = await supabase
          .from('blotter_entries')
          .select('*', { count: 'exact' })
          .order('date', { ascending: false })
          .range((currentPage - 1) * ROWS_PER_PAGE, (currentPage * ROWS_PER_PAGE) - 1);
        
        if (error) throw error;
        
        setTotalCount(count || 0);
        const totalPages = Math.ceil((count || 0) / ROWS_PER_PAGE);
        setTotalPages(totalPages);
        setEntries(data || []);
      } catch (error: any) {
        toast.error('Error loading entries: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialEntries();
  }, [session]);

  // Update search and reset page when debounced values change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedFirstName, debouncedLastName]);

  // Fetch entries when search terms or page changes
  useEffect(() => {
    if (!session) return;
    
    const fetchEntries = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('blotter_entries')
          .select('*', { count: 'exact' })
          .order('date', { ascending: false });
        
        if (debouncedFirstName) {
          query = query.ilike('first_name', `%${debouncedFirstName.toLowerCase()}%`);
        }
        if (debouncedLastName) {
          query = query.ilike('last_name', `%${debouncedLastName.toLowerCase()}%`);
        }
        
        const { count, data, error } = await query
          .range((currentPage - 1) * ROWS_PER_PAGE, (currentPage * ROWS_PER_PAGE) - 1);
        
        if (error) throw error;
        
        setTotalCount(count || 0);
        const totalPages = Math.ceil((count || 0) / ROWS_PER_PAGE);
        setTotalPages(totalPages);
        setEntries(data || []);
      } catch (error: any) {
        toast.error('Error loading entries: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEntries();
  }, [debouncedFirstName, debouncedLastName, currentPage, session]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        {/* Mobile sidebar toggle button */}
        <button
          className="sidebar-toggle md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsSidebarOpen(!isSidebarOpen);
          }}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Sidebar */}
        <div 
          className={`sidebar-container fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-200 ease-in-out`}
          style={{
            height: '100vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <SidebarContent className="pt-4 md:pt-0">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive 
                    tooltip="Blotter"
                    className="md:justify-start"
                  >
                    <Link 
                      to="/" 
                      className="flex items-center space-x-2 w-full h-full px-4 py-2"
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }}
                    >
                      <BookMarked className="h-5 w-5" />
                      <span>Blotter</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="Settings"
                    className="md:justify-start"
                  >
                    <Link 
                      to="/settings" 
                      className="flex items-center space-x-2 w-full h-full px-4 py-2"
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }}
                    >
                      <Settings className="h-5 w-5" />
                      <span className="md:hidden">Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-64">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">
            <div className="flex h-16 items-center px-4">
              <div className="md:ml-0 ml-12 flex items-center space-x-3">
                <img 
                  src="/suspect.png" 
                  alt="Suspect Profile Logo" 
                  className="h-10 w-10 object-contain"
                />
                <h1 className="text-xl font-semibold hidden sm:block">Suspect Profile</h1>
              </div>
              <div className="ml-auto flex items-center space-x-2 absolute right-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30"
                >
                  <span className="sr-only md:not-sr-only">Sign Out</span>
                  <LogOut className="md:ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="border-b p-4 space-y-4 bg-background">
              <div className="w-full max-w-2xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by first name..."
                      className="pl-10 w-full text-foreground bg-background"
                      value={firstNameSearch}
                      onChange={(e) => setFirstNameSearch(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by last name..."
                      className="pl-10 w-full text-foreground bg-background"
                      value={lastNameSearch}
                      onChange={(e) => setLastNameSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {totalCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  Found {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
                  {(firstNameSearch || lastNameSearch) && ` matching ${firstNameSearch ? `first name: "${firstNameSearch}"` : ''}${firstNameSearch && lastNameSearch ? ' and ' : ''}${lastNameSearch ? `last name: "${lastNameSearch}"` : ''}`}
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="p-4">
            <div className="grid gap-4">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookMarked className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No entries found</h3>
                  <p className="text-sm text-muted-foreground">
                    {(firstNameSearch || lastNameSearch)
                      ? 'Try adjusting your search terms'
                      : 'Create a new entry to get started'}
                  </p>
                </div>
              ) : (
                entries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <h3 className="font-semibold">
                            {entry.first_name} {entry.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(entry.date), 'MMMM d, yyyy')}
                          </p>
                        </div>
                        <span className="inline-flex items-center self-start sm:self-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {entry.case_type}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.blotter_entry}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigate(`/entry/${entry.id}`);
                            setIsSidebarOpen(false);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    handlePageChange(currentPage - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground text-center">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    handlePageChange(currentPage + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage >= totalPages}
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </SidebarProvider>

      {/* Floating Action Button */}
      <Button
        onClick={() => {
          navigate('/add');
          setIsSidebarOpen(false);
        }}
        size="lg"
        className="fixed right-4 bottom-4 md:right-6 md:bottom-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default BlotterList;