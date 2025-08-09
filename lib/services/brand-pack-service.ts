import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { 
  BrandPack, 
  AssetTemplate, 
  CopyGenerationRequest, 
  GeneratedCopy,
  AssetGenerationConfig,
  BRAND_PACK_PRESETS 
} from '@/lib/types/brand-pack';

const BRAND_PACKS_COLLECTION = 'brand-packs';
const TEMPLATES_COLLECTION = 'asset-templates';
const GENERATED_COPY_COLLECTION = 'generated-copy';

// Create a new brand pack
export async function createBrandPack(
  brandData: Omit<BrandPack, 'id' | 'createdAt' | 'updatedAt'>,
  logoFile?: File
): Promise<string> {
  try {
    let logoUrl = '';
    
    // Upload logo if provided
    if (logoFile) {
      const logoRef = ref(storage, `brand-logos/${brandData.orgId}/${Date.now()}-${logoFile.name}`);
      const snapshot = await uploadBytes(logoRef, logoFile);
      logoUrl = await getDownloadURL(snapshot.ref);
    }
    
    const brandPack: Omit<BrandPack, 'id'> = {
      ...brandData,
      logo: logoUrl ? {
        url: logoUrl,
        publicUrl: logoUrl
      } : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, BRAND_PACKS_COLLECTION), brandPack);
    
    // If this is set as default, update other brand packs
    if (brandData.isDefault) {
      await setDefaultBrandPack(brandData.orgId, docRef.id);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating brand pack:', error);
    throw error;
  }
}

// Get brand pack by ID
export async function getBrandPackById(brandPackId: string): Promise<BrandPack | null> {
  try {
    const docRef = doc(db, BRAND_PACKS_COLLECTION, brandPackId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as BrandPack;
    }
    return null;
  } catch (error) {
    console.error('Error getting brand pack:', error);
    throw error;
  }
}

// Get brand packs for organization
export async function getOrgBrandPacks(orgId: string): Promise<BrandPack[]> {
  try {
    const q = query(
      collection(db, BRAND_PACKS_COLLECTION),
      where('orgId', '==', orgId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const brandPacks: BrandPack[] = [];
    
    querySnapshot.forEach((doc) => {
      brandPacks.push({
        id: doc.id,
        ...doc.data()
      } as BrandPack);
    });
    
    return brandPacks;
  } catch (error) {
    console.error('Error getting org brand packs:', error);
    throw error;
  }
}

// Get default brand pack for organization
export async function getDefaultBrandPack(orgId: string): Promise<BrandPack | null> {
  try {
    const q = query(
      collection(db, BRAND_PACKS_COLLECTION),
      where('orgId', '==', orgId),
      where('isDefault', '==', true),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as BrandPack;
    }
    
    // If no default, return the first active brand pack
    const brandPacks = await getOrgBrandPacks(orgId);
    return brandPacks.length > 0 ? brandPacks[0] : null;
  } catch (error) {
    console.error('Error getting default brand pack:', error);
    throw error;
  }
}

// Set default brand pack
export async function setDefaultBrandPack(orgId: string, brandPackId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Remove default from all other brand packs
    const q = query(
      collection(db, BRAND_PACKS_COLLECTION),
      where('orgId', '==', orgId),
      where('isDefault', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      if (doc.id !== brandPackId) {
        batch.update(doc.ref, { isDefault: false });
      }
    });
    
    // Set the new default
    const brandPackRef = doc(db, BRAND_PACKS_COLLECTION, brandPackId);
    batch.update(brandPackRef, { 
      isDefault: true,
      updatedAt: Timestamp.now()
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error setting default brand pack:', error);
    throw error;
  }
}

// Update brand pack
export async function updateBrandPack(
  brandPackId: string,
  updates: Partial<BrandPack>,
  newLogoFile?: File
): Promise<void> {
  try {
    let logoUrl = updates.logo?.url;
    
    // Upload new logo if provided
    if (newLogoFile) {
      const brandPack = await getBrandPackById(brandPackId);
      
      // Delete old logo if exists
      if (brandPack?.logo?.url) {
        try {
          const oldLogoRef = ref(storage, brandPack.logo.url);
          await deleteObject(oldLogoRef);
        } catch (err) {
          console.warn('Could not delete old logo:', err);
        }
      }
      
      // Upload new logo
      const logoRef = ref(storage, `brand-logos/${brandPack?.orgId}/${Date.now()}-${newLogoFile.name}`);
      const snapshot = await uploadBytes(logoRef, newLogoFile);
      logoUrl = await getDownloadURL(snapshot.ref);
      
      updates.logo = {
        url: logoUrl,
        publicUrl: logoUrl
      };
    }
    
    const docRef = doc(db, BRAND_PACKS_COLLECTION, brandPackId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    
    // Handle default brand pack update
    if (updates.isDefault) {
      const brandPack = await getBrandPackById(brandPackId);
      if (brandPack) {
        await setDefaultBrandPack(brandPack.orgId, brandPackId);
      }
    }
  } catch (error) {
    console.error('Error updating brand pack:', error);
    throw error;
  }
}

// Delete brand pack (soft delete)
export async function deleteBrandPack(brandPackId: string): Promise<void> {
  try {
    const docRef = doc(db, BRAND_PACKS_COLLECTION, brandPackId);
    await updateDoc(docRef, {
      isActive: false,
      isDefault: false,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting brand pack:', error);
    throw error;
  }
}

// Create brand pack from preset
export async function createBrandPackFromPreset(
  orgId: string,
  presetKey: keyof typeof BRAND_PACK_PRESETS,
  createdBy: string,
  customizations?: Partial<BrandPack>
): Promise<string> {
  try {
    const preset = BRAND_PACK_PRESETS[presetKey];
    
    const brandPack: Omit<BrandPack, 'id' | 'createdAt' | 'updatedAt'> = {
      orgId,
      name: customizations?.name || `${preset.name} Brand Pack`,
      description: customizations?.description || `Based on ${preset.name} preset`,
      isActive: true,
      isDefault: false,
      colors: {
        ...preset.colors,
        ...customizations?.colors
      },
      typography: {
        ...preset.typography,
        ...customizations?.typography
      },
      copyTemplates: customizations?.copyTemplates,
      socialTemplates: customizations?.socialTemplates,
      createdBy
    };
    
    return await createBrandPack(brandPack);
  } catch (error) {
    console.error('Error creating brand pack from preset:', error);
    throw error;
  }
}

// Asset Template Management

// Create asset template
export async function createAssetTemplate(
  template: Omit<AssetTemplate, 'id'>,
  brandPackId: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...template,
      brandPackId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating asset template:', error);
    throw error;
  }
}

// Get templates for brand pack
export async function getBrandPackTemplates(brandPackId: string): Promise<AssetTemplate[]> {
  try {
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      where('brandPackId', '==', brandPackId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const templates: AssetTemplate[] = [];
    
    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data()
      } as AssetTemplate);
    });
    
    return templates;
  } catch (error) {
    console.error('Error getting brand pack templates:', error);
    throw error;
  }
}

// AI Copy Generation

// Generate marketing copy using AI
export async function generateMarketingCopy(
  request: CopyGenerationRequest,
  userId: string
): Promise<GeneratedCopy> {
  try {
    // Get brand pack if specified
    let brandContext = '';
    if (request.brandPackId) {
      const brandPack = await getBrandPackById(request.brandPackId);
      if (brandPack?.copyTemplates) {
        brandContext = `Brand voice examples: ${JSON.stringify(brandPack.copyTemplates)}`;
      }
    }
    
    // Build the prompt
    const prompt = buildCopyPrompt(request, brandContext);
    
    // Call AI service (this would integrate with OpenAI, Anthropic, etc.)
    const generatedContent = await callAIService(prompt);
    
    // Process and format the response
    const processedCopy = processCopyResponse(generatedContent, request);
    
    // Save to database
    const copyDoc: Omit<GeneratedCopy, 'id'> = {
      content: processedCopy.content,
      platform: request.platform,
      copyType: request.copyType,
      metadata: processedCopy.metadata,
      variations: processedCopy.variations,
      createdAt: Timestamp.now(),
      createdBy: userId,
      brandPackId: request.brandPackId
    };
    
    const docRef = await addDoc(collection(db, GENERATED_COPY_COLLECTION), copyDoc);
    
    return {
      id: docRef.id,
      ...copyDoc
    };
  } catch (error) {
    console.error('Error generating marketing copy:', error);
    throw error;
  }
}

// Build copy generation prompt
function buildCopyPrompt(request: CopyGenerationRequest, brandContext: string): string {
  const { eventDetails, copyType, platform, tone, includeEmojis, includeHashtags, maxLength } = request;
  
  let prompt = `Generate ${copyType} marketing copy for ${platform}.\n\n`;
  prompt += `Event Details:\n`;
  prompt += `- Name: ${eventDetails.name}\n`;
  prompt += `- Date: ${eventDetails.date}\n`;
  prompt += `- Venue: ${eventDetails.venue}\n`;
  
  if (eventDetails.description) {
    prompt += `- Description: ${eventDetails.description}\n`;
  }
  
  if (eventDetails.lineup?.length) {
    prompt += `- Lineup: ${eventDetails.lineup.join(', ')}\n`;
  }
  
  if (eventDetails.ticketPrice) {
    prompt += `- Ticket Price: $${eventDetails.ticketPrice}\n`;
  }
  
  prompt += `\nRequirements:\n`;
  prompt += `- Platform: ${platform}\n`;
  prompt += `- Tone: ${tone || 'casual'}\n`;
  prompt += `- Include Emojis: ${includeEmojis ? 'Yes' : 'No'}\n`;
  prompt += `- Include Hashtags: ${includeHashtags ? 'Yes' : 'No'}\n`;
  
  if (maxLength) {
    prompt += `- Maximum Length: ${maxLength} characters\n`;
  }
  
  if (brandContext) {
    prompt += `\n${brandContext}\n`;
  }
  
  if (request.customPrompt) {
    prompt += `\nAdditional Instructions: ${request.customPrompt}\n`;
  }
  
  prompt += `\nGenerate 3 variations of the copy.`;
  
  return prompt;
}

// Call AI service (placeholder - would integrate with actual AI service)
async function callAIService(prompt: string): Promise<string> {
  // This would integrate with OpenAI, Anthropic, or other AI services
  // For now, return a mock response
  console.log('AI Prompt:', prompt);
  
  // Mock response
  return `
    Variation 1: 🎵 Get ready for an unforgettable night! Join us for an amazing event featuring incredible artists. Limited tickets available - grab yours now! #LiveMusic #EventName
    
    Variation 2: The countdown is on! Experience the best in live entertainment at our upcoming event. Don't miss out on this epic night! 🔥 #MusicLovers #PartyTime
    
    Variation 3: JUST ANNOUNCED: An incredible lineup awaits you! Secure your spot for a night of non-stop entertainment. Link in bio for tickets! 🎉 #ConcertVibes #MustSee
  `;
}

// Process AI response
function processCopyResponse(
  response: string, 
  request: CopyGenerationRequest
): { content: string; metadata: any; variations: string[] } {
  const lines = response.trim().split('\n').filter(line => line.trim());
  const variations = lines.filter(line => line.includes('Variation'));
  
  // Extract main content and variations
  const mainContent = variations[0]?.replace(/Variation \d+:\s*/, '') || response;
  const allVariations = variations.map(v => v.replace(/Variation \d+:\s*/, ''));
  
  // Extract metadata
  const metadata = {
    characterCount: mainContent.length,
    wordCount: mainContent.split(/\s+/).length,
    hashtags: mainContent.match(/#\w+/g) || [],
    emojis: mainContent.match(/[\u{1F300}-\u{1F9FF}]/gu) || []
  };
  
  return {
    content: mainContent,
    metadata,
    variations: allVariations.slice(1) // Exclude the first one as it's the main content
  };
}

// Get generated copy history
export async function getGeneratedCopyHistory(
  orgId: string,
  limit: number = 50
): Promise<GeneratedCopy[]> {
  try {
    // First get all brand packs for the org
    const brandPacks = await getOrgBrandPacks(orgId);
    const brandPackIds = brandPacks.map(bp => bp.id).filter(Boolean);
    
    if (brandPackIds.length === 0) {
      return [];
    }
    
    const q = query(
      collection(db, GENERATED_COPY_COLLECTION),
      where('brandPackId', 'in', brandPackIds),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const copies: GeneratedCopy[] = [];
    
    querySnapshot.forEach((doc) => {
      if (copies.length < limit) {
        copies.push({
          id: doc.id,
          ...doc.data()
        } as GeneratedCopy);
      }
    });
    
    return copies;
  } catch (error) {
    console.error('Error getting generated copy history:', error);
    throw error;
  }
}

// Generate asset from template
export async function generateAssetFromTemplate(
  config: AssetGenerationConfig
): Promise<string[]> {
  try {
    // Get brand pack and template
    const brandPack = await getBrandPackById(config.brandPackId);
    if (!brandPack) {
      throw new Error('Brand pack not found');
    }
    
    // This would integrate with a canvas rendering service
    // For now, return mock URLs
    const generatedAssets: string[] = [];
    
    if (config.batch?.variations) {
      // Generate batch variations
      for (const variation of config.batch.variations) {
        const assetUrl = await renderAsset(brandPack, config.templateId, {
          ...config.variables,
          ...variation
        }, config);
        generatedAssets.push(assetUrl);
      }
    } else {
      // Generate single asset
      const assetUrl = await renderAsset(brandPack, config.templateId, config.variables, config);
      generatedAssets.push(assetUrl);
    }
    
    return generatedAssets;
  } catch (error) {
    console.error('Error generating asset from template:', error);
    throw error;
  }
}

// Render asset (placeholder - would integrate with canvas rendering)
async function renderAsset(
  brandPack: BrandPack,
  templateId: string | undefined,
  variables: Record<string, any>,
  config: AssetGenerationConfig
): Promise<string> {
  // This would use Canvas API or a service like Bannerbear, Canva API, etc.
  console.log('Rendering asset with:', { brandPack, templateId, variables, config });
  
  // Return mock URL
  return `https://placeholder.com/generated-asset-${Date.now()}.${config.format}`;
}