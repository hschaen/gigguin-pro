'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileSignature,
  Calendar,
  DollarSign,
  Users,
  MoreVertical,
  Copy,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/use-organization';
import {
  searchContracts,
  getContractStats,
  sendContract,
  cancelContract,
  initializeSystemTemplates
} from '@/lib/services/contract-service';
import { Contract, ContractStats, ContractSearchFilters } from '@/lib/types/contract';

export default function ContractsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ContractSearchFilters>({
    status: [],
    type: []
  });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (currentOrg?.id) {
      loadContracts();
      loadStats();
      // Initialize system templates on first load
      initializeSystemTemplates();
    }
  }, [currentOrg, filters, activeTab]);

  const loadContracts = async () => {
    if (!currentOrg?.id) return;
    
    try {
      setLoading(true);
      
      let searchFilters: ContractSearchFilters = {
        ...filters,
        orgId: currentOrg.id
      };
      
      // Apply tab filters
      switch (activeTab) {
        case 'draft':
          searchFilters.status = ['draft'];
          break;
        case 'pending':
          searchFilters.status = ['sent', 'viewed', 'negotiating'];
          break;
        case 'signed':
          searchFilters.status = ['signed', 'active'];
          break;
        case 'expired':
          searchFilters.status = ['expired', 'cancelled'];
          break;
      }
      
      const results = await searchContracts(searchFilters);
      
      // Client-side search
      if (searchTerm) {
        const filtered = results.filter(contract =>
          contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.parties.some(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
        setContracts(filtered);
      } else {
        setContracts(results);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!currentOrg?.id) return;
    
    try {
      const contractStats = await getContractStats(currentOrg.id);
      setStats(contractStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSendContract = async (contractId: string) => {
    if (!user) return;
    
    try {
      await sendContract(contractId, user.uid);
      loadContracts();
      alert('Contract sent successfully!');
    } catch (error) {
      console.error('Error sending contract:', error);
      alert('Failed to send contract');
    }
  };

  const handleCancelContract = async (contractId: string) => {
    if (!user) return;
    
    if (confirm('Are you sure you want to cancel this contract?')) {
      try {
        await cancelContract(contractId, 'Cancelled by user', user.uid);
        loadContracts();
      } catch (error) {
        console.error('Error cancelling contract:', error);
        alert('Failed to cancel contract');
      }
    }
  };

  const getStatusIcon = (status: Contract['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'viewed':
        return <Eye className="h-4 w-4" />;
      case 'negotiating':
        return <Edit className="h-4 w-4" />;
      case 'signed':
        return <CheckCircle className="h-4 w-4" />;
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
      case 'viewed':
        return 'default';
      case 'negotiating':
        return 'warning';
      case 'signed':
      case 'active':
      case 'completed':
        return 'success';
      case 'cancelled':
      case 'expired':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Contracts</h1>
            <p className="text-gray-600">
              Manage your contracts, agreements, and legal documents
            </p>
          </div>
          <Button onClick={() => router.push('/contracts/create')}>
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Contracts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Awaiting Signature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.awaitingSignature}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.expiringThisMonth}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalValue?.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contracts, parties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select
          value={filters.type?.[0] || ''}
          onValueChange={(value) => setFilters({ ...filters, type: value ? [value as Contract['type']] : [] })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="dj_performance">DJ Performance</SelectItem>
            <SelectItem value="venue_rental">Venue Rental</SelectItem>
            <SelectItem value="sponsorship">Sponsorship</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="employment">Employment</SelectItem>
            <SelectItem value="nda">NDA</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contracts List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="signed">Signed</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading contracts...</p>
              </div>
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Contracts Found</h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'all' 
                    ? "You haven't created any contracts yet"
                    : `No ${activeTab} contracts found`}
                </p>
                {activeTab === 'all' && (
                  <Button onClick={() => router.push('/contracts/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Contract
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <Card key={contract.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <FileSignature className="h-6 w-6 text-gray-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{contract.title}</h3>
                              <Badge variant={getStatusColor(contract.status) as any}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(contract.status)}
                                  {contract.status}
                                </span>
                              </Badge>
                              {contract.signatureRequired && !contract.signatures?.length && (
                                <Badge variant="outline">
                                  <FileSignature className="h-3 w-3 mr-1" />
                                  Signature Required
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {contract.parties.map(p => p.name).join(', ')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Created {format(contract.createdAt.toDate(), 'MMM d, yyyy')}
                              </span>
                              {contract.financial?.total && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${contract.financial.total.toLocaleString()}
                                </span>
                              )}
                            </div>
                            
                            {contract.description && (
                              <p className="text-sm text-gray-600">{contract.description}</p>
                            )}
                            
                            {/* Signature Progress */}
                            {contract.signatureRequired && contract.parties.filter(p => p.mustSign).length > 0 && (
                              <div className="mt-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-600">Signatures:</span>
                                  <div className="flex items-center gap-1">
                                    {contract.parties.filter(p => p.mustSign).map((party) => (
                                      <Badge
                                        key={party.id}
                                        variant={party.hasSigned ? 'default' : 'outline'}
                                        className="text-xs"
                                      >
                                        {party.hasSigned ? (
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                        ) : (
                                          <Clock className="h-3 w-3 mr-1" />
                                        )}
                                        {party.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {contract.status === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/contracts/${contract.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSendContract(contract.id!)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          </>
                        )}
                        
                        {(contract.status === 'sent' || contract.status === 'viewed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/contracts/${contract.id}/sign`)}
                          >
                            <FileSignature className="h-4 w-4 mr-1" />
                            Sign
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/contracts/${contract.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {contract.status !== 'cancelled' && contract.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelContract(contract.id!)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}