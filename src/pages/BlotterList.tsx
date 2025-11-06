import { useState, useEffect } from 'react';
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
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LogOut, Plus, Search, Filter, Settings, ChevronsUpDown, Check, BookMarked, BookPlus } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BlotterList = () => {
  const [entries, setEntries] = useState<BlotterEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<BlotterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [caseTypeOpen, setCaseTypeOpen] = useState(false);
  const { signOut, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) return;
    fetchEntries();
  }, [session]);

  useEffect(() => {
    filterEntries();
  }, [entries, searchText, caseTypeFilter]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('blotter_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast.error('Error loading entries: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.first_name.toLowerCase().includes(search) ||
          entry.last_name.toLowerCase().includes(search) ||
          entry.case_type.toLowerCase().includes(search) ||
          entry.blotter_entry.toLowerCase().includes(search)
      );
    }

    if (caseTypeFilter !== 'all') {
      filtered = filtered.filter((entry) => entry.case_type === caseTypeFilter);
    }

    setFilteredEntries(filtered);
  };

  const getCaseTypes = () => {
    const types = new Set(entries.map((e) => e.case_type));
    return Array.from(types);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive tooltip="Blotter">
                  <Link to="/">
                    <BookMarked />
                    <span>Blotter</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link to="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
    <div className="flex min-h-screen flex-col bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-primary px-4 py-4 text-primary-foreground shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <SidebarTrigger className="text-primary-foreground" />
            <BookMarked className="h-5 w-5" />
            Blotter Entries
          </h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Search and Filter */}
      <div className="sticky top-[72px] z-10 space-y-3 bg-secondary px-4 py-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, case type, or entry..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          {showFilters && (
            <>
              <Popover open={caseTypeOpen} onOpenChange={setCaseTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={caseTypeOpen}
                    className="flex-1 justify-between"
                  >
                    {caseTypeFilter === 'all' ? 'All Cases' : caseTypeFilter}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search case type..." />
                    <CommandEmpty>No case type found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setCaseTypeFilter('all');
                            setCaseTypeOpen(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${caseTypeFilter === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                          All Cases
                        </CommandItem>
                        {getCaseTypes().map((type) => (
                          <CommandItem
                            key={type}
                            value={type}
                            onSelect={() => {
                              setCaseTypeFilter(type);
                              setCaseTypeOpen(false);
                            }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${caseTypeFilter === type ? 'opacity-100' : 'opacity-0'}`} />
                            {type}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchText('');
                  setCaseTypeFilter('all');
                }}
              >
                Reset filters
              </Button>
            </>
          )}
        </div>
        {(searchText || caseTypeFilter !== 'all') ? (
          <div className="text-xs text-muted-foreground">
            Showing {filteredEntries.length} of {entries.length} {entries.length === 1 ? 'result' : 'results'}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            {entries.length} total {entries.length === 1 ? 'entry' : 'entries'}
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="flex-1 space-y-3 p-4">
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No entries found
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate(`/entry/${entry.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {entry.first_name} {entry.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{entry.case_type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-foreground">{entry.blotter_entry}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <Button
        onClick={() => navigate('/add')}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
      >
        <BookPlus className="h-6 w-6" />
      </Button>
    </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default BlotterList;
