// Template related types

export interface Placeholder {
  key: string;
  value: string;
}

export interface Block {
  id: number;
  type: string;
  content: string;
  title?: string;
  description?: string;
  user_id?: string;
  organization_id?: string | null;
  company_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExpandedBlock extends Block {
  name?: string;
  isCustom?: boolean;
  originalId?: number;
}

export interface Template {
  id: number | string;
  title: string;
  content: string;
  description?: string;
  folder_id?: number | null;
  folder?: string;
  type: 'user' | 'official' | 'organization' | 'company';
  usage_count?: number;
  last_used_at?: string;
  created_at?: string;
  tags?: string[];
  user_id?: string;
  organization_id?: string | null;
  company_id?: string | null;
  
  // New block-related properties
  blocks?: number[]; // Array of block IDs
  expanded_blocks?: ExpandedBlock[]; // Expanded block data for UI
}

export interface TemplateFolder {
  id: number;
  name: string;
  path?: string;
  type: 'user' | 'official' | 'organization' | 'company';
  description?: string;
  is_pinned?: boolean;
  templates?: Template[];
  Folders?: TemplateFolder[];
  user_id?: string;
  organization_id?: string | null;
  company_id?: string | null;
}

// Form data for template creation/editing
export const DEFAULT_FORM_DATA = {
  name: '',
  content: '',
  description: '',
  folder: '',
  folder_id: undefined as number | undefined,
  blocks: [] as (number | string)[] // Now includes block IDs
};

// Block type definition
export enum BlockType {
  ROLE = 'role',
  CONTEXT = 'context',
  INSTRUCTION = 'instruction',
  EXAMPLE = 'example',
  KNOWLEDGE = 'knowledge',
  CONSTRAINT = 'constraint',
  FORMAT = 'format',
  CONTENT = 'content'
}

// Block create/update interfaces
export interface BlockCreate {
  type: BlockType;
  content: string;
  title: string;
  description?: string;
  organization_id?: string | null;
  company_id?: string | null;
}

export interface BlockUpdate {
  type?: BlockType;
  content?: string;
  title?: string;
  description?: string;
}

export interface BlockResponse extends Block {
  // Additional response fields if needed
}

// Template create/update interfaces
export interface TemplateCreate {
  title: string;
  content: string;
  description?: string;
  folder_id?: number | null;
  blocks?: number[];
  tags?: string[];
  type?: 'user' | 'official' | 'organization' | 'company';
  locale?: string;
}

export interface TemplateUpdate {
  title?: string;
  content?: string;
  description?: string;
  folder_id?: number | null;
  blocks?: number[];
  tags?: string[];
}

export interface TemplateResponse extends Template {
  // Additional response fields if needed
}

// Add query key constants
export const TEMPLATE_QUERY_KEYS = {
  USER_TEMPLATES: 'userTemplates',
  OFFICIAL_TEMPLATES: 'officialTemplates',
  ORGANIZATION_TEMPLATES: 'organizationTemplates',
  COMPANY_TEMPLATES: 'companyTemplates',
  UNORGANIZED_TEMPLATES: 'unorganizedTemplates',
  TEMPLATE_BY_ID: 'templateById'
};

export const BLOCK_QUERY_KEYS = {
  BLOCKS: 'blocks',
  BLOCK_TYPES: 'blockTypes',
  BLOCK_BY_ID: 'blockById'
};