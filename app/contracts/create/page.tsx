'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  User,
  Building,
  Calendar,
  DollarSign,
  FileSignature,
  Copy,
  Wand2
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/use-organization';
import {
  createContract,
  getContractTemplates,
  createContractFromTemplate
} from '@/lib/services/contract-service';
import {
  Contract,
  ContractTemplate,
  ContractParty,
  ContractSection,
  FinancialTerms,
  ContractTerms
} from '@/lib/types/contract';
import { Timestamp } from 'firebase/firestore';

export default function CreateContractPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Contract form state
  const [contractForm, setContractForm] = useState({
    title: '',
    description: '',
    type: 'custom' as Contract['type'],
    parties: [] as ContractParty[],
    sections: [] as ContractSection[],
    terms: {} as ContractTerms,
    financial: {
      currency: 'USD',
      subtotal: 0,
      total: 0,
      paymentSchedule: []
    } as FinancialTerms,
    signatureRequired: true,
    effectiveDate: '',
    expirationDate: ''
  });

  // New party form
  const [newParty, setNewParty] = useState<Partial<ContractParty>>({
    type: 'individual',
    role: 'client',
    mustSign: true
  });

  // New section form
  const [newSection, setNewSection] = useState({
    title: '',
    content: '',
    isRequired: true,
    isEditable: true
  });

  useEffect(() => {
    loadTemplates();
  }, [currentOrg]);

  const loadTemplates = async () => {
    try {
      const availableTemplates = await getContractTemplates(currentOrg?.id);
      setTemplates(availableTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSelectTemplate = async (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setContractForm({
      ...contractForm,
      title: template.name,
      description: template.description || '',
      type: template.type,
      sections: template.sections,
      terms: template.defaultTerms || {},
      financial: {
        ...contractForm.financial,
        ...(template.defaultFinancial || {})
      },
      signatureRequired: template.requiresSignature
    });
  };

  const handleAddParty = () => {
    if (!newParty.name || !newParty.email) {
      alert('Please provide party name and email');
      return;
    }

    const party: ContractParty = {
      id: Math.random().toString(36).substr(2, 9),
      type: newParty.type || 'individual',
      role: newParty.role || 'client',
      name: newParty.name,
      email: newParty.email,
      phone: newParty.phone,
      organizationName: newParty.organizationName,
      representativeName: newParty.representativeName,
      representativeTitle: newParty.representativeTitle,
      address: newParty.address,
      mustSign: newParty.mustSign || false,
      signatureOrder: contractForm.parties.length + 1
    };

    setContractForm({
      ...contractForm,
      parties: [...contractForm.parties, party]
    });

    // Reset form
    setNewParty({
      type: 'individual',
      role: 'client',
      mustSign: true
    });
  };

  const handleRemoveParty = (partyId: string) => {
    setContractForm({
      ...contractForm,
      parties: contractForm.parties.filter(p => p.id !== partyId)
    });
  };

  const handleAddSection = () => {
    if (!newSection.title || !newSection.content) {
      alert('Please provide section title and content');
      return;
    }

    const section: ContractSection = {
      id: Math.random().toString(36).substr(2, 9),
      title: newSection.title,
      content: newSection.content,
      order: contractForm.sections.length + 1,
      isRequired: newSection.isRequired,
      isEditable: newSection.isEditable
    };

    setContractForm({
      ...contractForm,
      sections: [...contractForm.sections, section]
    });

    // Reset form
    setNewSection({
      title: '',
      content: '',
      isRequired: true,
      isEditable: true
    });
  };

  const handleRemoveSection = (sectionId: string) => {
    setContractForm({
      ...contractForm,
      sections: contractForm.sections.filter(s => s.id !== sectionId)
    });
  };

  const handleSaveContract = async (sendNow: boolean = false) => {
    if (!currentOrg?.id || !user) return;

    if (!contractForm.title) {
      alert('Please provide a contract title');
      return;
    }

    if (contractForm.parties.length === 0) {
      alert('Please add at least one party to the contract');
      return;
    }

    if (contractForm.sections.length === 0) {
      alert('Please add at least one section to the contract');
      return;
    }

    try {
      setLoading(true);

      const contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
        orgId: currentOrg.id,
        type: contractForm.type,
        templateId: selectedTemplate?.id,
        title: contractForm.title,
        description: contractForm.description,
        status: sendNow ? 'sent' : 'draft',
        parties: contractForm.parties,
        sections: contractForm.sections,
        terms: contractForm.terms,
        financial: contractForm.financial.total > 0 ? contractForm.financial : undefined,
        signatures: [],
        signatureRequired: contractForm.signatureRequired,
        signatureDeadline: contractForm.signatureRequired && contractForm.effectiveDate
          ? Timestamp.fromDate(new Date(contractForm.effectiveDate))
          : undefined,
        effectiveDate: contractForm.effectiveDate
          ? Timestamp.fromDate(new Date(contractForm.effectiveDate))
          : undefined,
        expirationDate: contractForm.expirationDate
          ? Timestamp.fromDate(new Date(contractForm.expirationDate))
          : undefined,
        createdBy: user.uid
      };

      const contractId = await createContract(contractData);

      if (sendNow) {
        // TODO: Send notifications to parties
        alert('Contract created and sent successfully!');
      } else {
        alert('Contract saved as draft!');
      }

      router.push(`/contracts/${contractId}`);
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/contracts')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Create Contract</h1>
        <p className="text-gray-600">
          Create a new contract from scratch or use a template
        </p>
      </div>

      {/* Template Selection */}
      {templates.length > 0 && !selectedTemplate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Start with a Template</CardTitle>
            <CardDescription>
              Choose a template to get started quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{template.name}</h4>
                    {template.isSystem && (
                      <Badge variant="secondary">System</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{template.type}</Badge>
                    {template.requiresSignature && (
                      <Badge variant="outline">
                        <FileSignature className="h-3 w-3 mr-1" />
                        Signature Required
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTemplate && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm">
              Using template: <strong>{selectedTemplate.name}</strong>
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedTemplate(null);
              setContractForm({
                title: '',
                description: '',
                type: 'custom',
                parties: [],
                sections: [],
                terms: {},
                financial: {
                  currency: 'USD',
                  subtotal: 0,
                  total: 0,
                  paymentSchedule: []
                },
                signatureRequired: true,
                effectiveDate: '',
                expirationDate: ''
              });
            }}
          >
            Clear Template
          </Button>
        </div>
      )}

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={contractForm.title}
                  onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                  placeholder="e.g., DJ Performance Agreement"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={contractForm.description}
                  onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                  placeholder="Brief description of the contract..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="type">Contract Type</Label>
                <Select
                  value={contractForm.type}
                  onValueChange={(value) => setContractForm({ ...contractForm, type: value as Contract['type'] })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="effective-date">Effective Date</Label>
                  <Input
                    id="effective-date"
                    type="date"
                    value={contractForm.effectiveDate}
                    onChange={(e) => setContractForm({ ...contractForm, effectiveDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="expiration-date">Expiration Date</Label>
                  <Input
                    id="expiration-date"
                    type="date"
                    value={contractForm.expirationDate}
                    onChange={(e) => setContractForm({ ...contractForm, expirationDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="signature-required"
                  checked={contractForm.signatureRequired}
                  onChange={(e) => setContractForm({ ...contractForm, signatureRequired: e.target.checked })}
                />
                <Label htmlFor="signature-required" className="font-normal cursor-pointer">
                  Signature required for this contract
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parties">
          <Card>
            <CardHeader>
              <CardTitle>Contract Parties</CardTitle>
              <CardDescription>
                Add all parties involved in this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Existing Parties */}
              {contractForm.parties.length > 0 && (
                <div className="space-y-3 mb-6">
                  {contractForm.parties.map((party, index) => (
                    <div key={party.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {party.type === 'organization' ? (
                              <Building className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                            <span className="font-semibold">{party.name}</span>
                            <Badge variant="outline">{party.role}</Badge>
                            {party.mustSign && (
                              <Badge variant="default">
                                <FileSignature className="h-3 w-3 mr-1" />
                                Must Sign
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>{party.email}</p>
                            {party.phone && <p>{party.phone}</p>}
                            {party.organizationName && (
                              <p>Organization: {party.organizationName}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveParty(party.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Party Form */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Add New Party</h4>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Party Type</Label>
                      <Select
                        value={newParty.type}
                        onValueChange={(value) => setNewParty({ ...newParty, type: value as 'individual' | 'organization' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="organization">Organization</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Role</Label>
                      <Select
                        value={newParty.role}
                        onValueChange={(value) => setNewParty({ ...newParty, role: value as ContractParty['role'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="performer">Performer</SelectItem>
                          <SelectItem value="venue">Venue</SelectItem>
                          <SelectItem value="sponsor">Sponsor</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={newParty.name || ''}
                        onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newParty.email || ''}
                        onChange={(e) => setNewParty({ ...newParty, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={newParty.phone || ''}
                      onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {newParty.type === 'organization' && (
                    <>
                      <div>
                        <Label>Organization Name</Label>
                        <Input
                          value={newParty.organizationName || ''}
                          onChange={(e) => setNewParty({ ...newParty, organizationName: e.target.value })}
                          placeholder="Company Inc."
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Representative Name</Label>
                          <Input
                            value={newParty.representativeName || ''}
                            onChange={(e) => setNewParty({ ...newParty, representativeName: e.target.value })}
                            placeholder="Jane Smith"
                          />
                        </div>

                        <div>
                          <Label>Representative Title</Label>
                          <Input
                            value={newParty.representativeTitle || ''}
                            onChange={(e) => setNewParty({ ...newParty, representativeTitle: e.target.value })}
                            placeholder="CEO"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="must-sign"
                      checked={newParty.mustSign}
                      onChange={(e) => setNewParty({ ...newParty, mustSign: e.target.checked })}
                    />
                    <Label htmlFor="must-sign" className="font-normal cursor-pointer">
                      This party must sign the contract
                    </Label>
                  </div>

                  <Button onClick={handleAddParty}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Party
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Contract Content</CardTitle>
              <CardDescription>
                Add sections to your contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Existing Sections */}
              {contractForm.sections.length > 0 && (
                <div className="space-y-4 mb-6">
                  {contractForm.sections.map((section) => (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{section.title}</h4>
                          <div className="flex gap-2 mt-1 mb-2">
                            {section.isRequired && (
                              <Badge variant="outline">Required</Badge>
                            )}
                            {section.isEditable && (
                              <Badge variant="outline">Editable</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {section.content}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Section Form */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Add New Section</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Section Title *</Label>
                    <Input
                      value={newSection.title}
                      onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                      placeholder="e.g., Performance Details"
                    />
                  </div>

                  <div>
                    <Label>Content *</Label>
                    <Textarea
                      value={newSection.content}
                      onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                      placeholder="Enter the section content..."
                      rows={6}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-required"
                        checked={newSection.isRequired}
                        onChange={(e) => setNewSection({ ...newSection, isRequired: e.target.checked })}
                      />
                      <Label htmlFor="is-required" className="font-normal cursor-pointer">
                        Required section
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-editable"
                        checked={newSection.isEditable}
                        onChange={(e) => setNewSection({ ...newSection, isEditable: e.target.checked })}
                      />
                      <Label htmlFor="is-editable" className="font-normal cursor-pointer">
                        Editable by parties
                      </Label>
                    </div>
                  </div>

                  <Button onClick={handleAddSection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>Contract Terms</CardTitle>
              <CardDescription>
                Define specific terms and conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Performance Date</Label>
                  <Input
                    type="datetime-local"
                    value={contractForm.terms.performanceDate ? format(contractForm.terms.performanceDate.toDate(), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => setContractForm({
                      ...contractForm,
                      terms: {
                        ...contractForm.terms,
                        performanceDate: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined
                      }
                    })}
                  />
                </div>

                <div>
                  <Label>Performance Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={contractForm.terms.performanceDuration || ''}
                    onChange={(e) => setContractForm({
                      ...contractForm,
                      terms: {
                        ...contractForm.terms,
                        performanceDuration: parseInt(e.target.value) || undefined
                      }
                    })}
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <Label>Venue Name</Label>
                <Input
                  value={contractForm.terms.venueName || ''}
                  onChange={(e) => setContractForm({
                    ...contractForm,
                    terms: {
                      ...contractForm.terms,
                      venueName: e.target.value
                    }
                  })}
                  placeholder="The Music Hall"
                />
              </div>

              <div>
                <Label>Venue Address</Label>
                <Input
                  value={contractForm.terms.venueAddress || ''}
                  onChange={(e) => setContractForm({
                    ...contractForm,
                    terms: {
                      ...contractForm.terms,
                      venueAddress: e.target.value
                    }
                  })}
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div>
                <Label>Cancellation Notice (days)</Label>
                <Input
                  type="number"
                  value={contractForm.terms.cancellationPolicy?.notice || ''}
                  onChange={(e) => setContractForm({
                    ...contractForm,
                    terms: {
                      ...contractForm.terms,
                      cancellationPolicy: {
                        ...contractForm.terms.cancellationPolicy,
                        notice: parseInt(e.target.value) || undefined
                      }
                    }
                  })}
                  placeholder="30"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Terms</CardTitle>
              <CardDescription>
                Define payment terms and amounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={contractForm.financial.currency}
                    onValueChange={(value) => setContractForm({
                      ...contractForm,
                      financial: {
                        ...contractForm.financial,
                        currency: value
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Base Fee</Label>
                  <Input
                    type="number"
                    value={contractForm.financial.baseFee || ''}
                    onChange={(e) => {
                      const baseFee = parseFloat(e.target.value) || 0;
                      setContractForm({
                        ...contractForm,
                        financial: {
                          ...contractForm.financial,
                          baseFee,
                          subtotal: baseFee,
                          total: baseFee
                        }
                      });
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Deposit Required</Label>
                  <Select
                    value={contractForm.financial.depositRequired ? 'yes' : 'no'}
                    onValueChange={(value) => setContractForm({
                      ...contractForm,
                      financial: {
                        ...contractForm.financial,
                        depositRequired: value === 'yes'
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {contractForm.financial.depositRequired && (
                  <div>
                    <Label>Deposit Amount</Label>
                    <Input
                      type="number"
                      value={contractForm.financial.depositAmount || ''}
                      onChange={(e) => setContractForm({
                        ...contractForm,
                        financial: {
                          ...contractForm.financial,
                          depositAmount: parseFloat(e.target.value) || 0
                        }
                      })}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold">
                    {contractForm.financial.currency} {contractForm.financial.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-6">
        <Button
          variant="outline"
          onClick={() => router.push('/contracts')}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSaveContract(false)}
          disabled={loading}
        >
          <Save className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSaveContract(true)}
          disabled={loading}
        >
          <Send className="h-4 w-4 mr-2" />
          Create & Send
        </Button>
      </div>
    </div>
  );
}