import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  BookOpen, 
  FileText, 
  Settings, 
  Loader2,
  BadgeCheck,
  UserX,
  UserCheck,
  Trash2,
  Search,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

interface UserWithRole {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  email?: string;
  is_verified: boolean;
  privacy: string;
  created_at: string;
  role?: string;
}

interface BookData {
  id: string;
  title: string;
  status: string;
  created_at: string;
  author: {
    display_name: string;
    username: string;
  };
}

interface PostData {
  id: string;
  content: string;
  visibility: string;
  star_count: number;
  comment_count: number;
  created_at: string;
  user: {
    display_name: string;
    username: string;
  };
}

export default function Admin() {
  const { user, isAdmin, isModerator, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [books, setBooks] = useState<BookData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalBooks: 0,
    verifiedUsers: 0,
  });

  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && !isModerator))) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the admin panel.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, isAdmin, isModerator, authLoading, navigate]);

  useEffect(() => {
    if (user && (isAdmin || isModerator)) {
      fetchData();
    }
  }, [user, isAdmin, isModerator]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*');

      const usersWithRoles = (profilesData || []).map(profile => ({
        ...profile,
        role: rolesData?.find(r => r.user_id === profile.user_id)?.role || 'user',
      }));

      setUsers(usersWithRoles);

      // Fetch books
      const { data: booksData } = await supabase
        .from('books')
        .select(`
          id,
          title,
          status,
          created_at,
          author_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get author profiles for books
      if (booksData && booksData.length > 0) {
        const authorIds = [...new Set(booksData.map(b => b.author_id))];
        const { data: authorProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username')
          .in('user_id', authorIds);

        const booksWithAuthors = booksData.map(book => ({
          ...book,
          author: authorProfiles?.find(p => p.user_id === book.author_id) || { display_name: 'Unknown', username: 'unknown' },
        }));

        setBooks(booksWithAuthors);
      }

      // Fetch posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          visibility,
          star_count,
          comment_count,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get user profiles for posts
      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(p => p.user_id))];
        const { data: userProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username')
          .in('user_id', userIds);

        const postsWithUsers = postsData.map(post => ({
          ...post,
          user: userProfiles?.find(p => p.user_id === post.user_id) || { display_name: 'Unknown', username: 'unknown' },
        }));

        setPosts(postsWithUsers);
      }

      // Calculate stats
      setStats({
        totalUsers: profilesData?.length || 0,
        totalPosts: postsData?.length || 0,
        totalBooks: booksData?.length || 0,
        verifiedUsers: profilesData?.filter(p => p.is_verified).length || 0,
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, is_verified: !currentStatus } : u
      ));

      toast({
        title: 'Success',
        description: `User ${!currentStatus ? 'verified' : 'unverified'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));

      toast({
        title: 'Success',
        description: 'Post deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post.',
        variant: 'destructive',
      });
    }
  };

  const deleteBook = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      setBooks(prev => prev.filter(b => b.id !== bookId));

      toast({
        title: 'Success',
        description: 'Book deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete book.',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(u => 
    u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin && !isModerator) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Full administrative access' : 'Moderator access'}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-star/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-star" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalBooks}</p>
                  <p className="text-sm text-muted-foreground">Total Books</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-verified/10 flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5 text-verified" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.verifiedUsers}</p>
                  <p className="text-sm text-muted-foreground">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <FileText className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="books" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Books
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user accounts and verification status</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full sm:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(user.display_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium flex items-center gap-1">
                                  {user.display_name}
                                  {user.is_verified && (
                                    <BadgeCheck className="w-4 h-4 text-verified" />
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.privacy === 'public' ? 'outline' : 'secondary'}>
                              {user.privacy}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleVerification(user.user_id, user.is_verified)}
                            >
                              {user.is_verified ? (
                                <UserX className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-verified" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Post Management</CardTitle>
                <CardDescription>Review and moderate user posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Author</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{post.user.display_name}</p>
                              <p className="text-sm text-muted-foreground">@{post.user.username}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {post.content.substring(0, 100)}...
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{post.visibility}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              ⭐ {post.star_count} · 💬 {post.comment_count}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePost(post.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books">
            <Card>
              <CardHeader>
                <CardTitle>Book Management</CardTitle>
                <CardDescription>Review and manage published books</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {books.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell className="font-medium">{book.title}</TableCell>
                          <TableCell>
                            <div>
                              <p>{book.author.display_name}</p>
                              <p className="text-sm text-muted-foreground">@{book.author.username}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
                              {book.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(book.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBook(book.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
