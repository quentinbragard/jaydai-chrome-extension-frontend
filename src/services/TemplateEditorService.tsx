// src/services/TemplateEditorService.ts
import { PromptMetadata } from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';
import { blocksApi } from '@/services/api/BlocksApi';
import { promptApi } from '@/services/api/PromptApi';
import { useBlockManager } from '@/hooks/prompts/editors/useBlockManager';

interface TemplateData {
  name: string;
  description: string;
  content: string;
  metadata: PromptMetadata;
  folderId?: string;
}

export class TemplateEditorService {
  /**
   * Load template data for editing
   */
  static async loadTemplate(templateId: number) {
    try {
      const response = await promptApi.getTemplate(templateId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to load template');
      }

      const template = response.data;
      const metadata = template.metadata || {};
      
      // Load associated blocks
      const blockIds = this.extractBlockIds(metadata);
      const blocks = await this.loadBlocks(blockIds);

      return {
        template,
        metadata,
        blocks,
        blockContentCache: this.buildBlockContentCache(blocks)
      };
    } catch (error) {
      console.error('Error loading template:', error);
      throw error;
    }
  }

  /**
   * Save template (create or update)
   */
  static async saveTemplate(data: TemplateData, templateId?: number) {
    try {
      const payload = {
        title: data.name.trim(),
        content: data.content.trim(),
        description: data.description?.trim(),
        folder_id: data.folderId ? parseInt(data.folderId) : null,
        metadata: this.serializeMetadata(data.metadata)
      };

      const response = templateId 
        ? await promptApi.updateTemplate(templateId, payload)
        : await promptApi.createTemplate(payload);

      if (!response.success) {
        throw new Error(response.message || 'Failed to save template');
      }

      return response.data;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  /**
   * Load blocks by IDs
   */
  static async loadBlocks(blockIds: number[]): Promise<Block[]> {
    const promises = blockIds.map(id => blocksApi.getBlock(id));
    const responses = await Promise.allSettled(promises);
    
    return responses
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value.success
      )
      .map(result => result.value.data);
  }

  /**
   * Extract block IDs from metadata
   */
  static extractBlockIds(metadata: PromptMetadata): number[] {
    const ids: number[] = [];
    
    // Single metadata types
    ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'].forEach(type => {
      const id = (metadata as any)[type];
      if (id && id > 0) ids.push(id);
    });

    // Multiple metadata types
    if (metadata.constraints) {
      metadata.constraints.forEach(item => {
        if (item.blockId && item.blockId > 0) ids.push(item.blockId);
      });
    }

    if (metadata.examples) {
      metadata.examples.forEach(item => {
        if (item.blockId && item.blockId > 0) ids.push(item.blockId);
      });
    }

    return Array.from(new Set(ids)); // Remove duplicates
  }

  /**
   * Build block content cache for quick lookup
   */
  static buildBlockContentCache(blocks: Block[]): Record<number, string> {
    return blocks.reduce((cache, block) => {
      const content = typeof block.content === 'string' 
        ? block.content 
        : block.content?.en || '';
      cache[block.id] = content;
      return cache;
    }, {} as Record<number, string>);
  }

  /**
   * Serialize metadata for API
   */
  static serializeMetadata(metadata: PromptMetadata): Record<string, any> {
    // Convert metadata to the format expected by the backend
    const serialized: Record<string, any> = {};
    
    // Single types
    ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'].forEach(type => {
      const value = (metadata as any)[type];
      if (value && value > 0) {
        serialized[type] = value;
      }
    });

    // Multiple types
    if (metadata.constraints && metadata.constraints.length > 0) {
      serialized.constraints = metadata.constraints
        .filter(item => item.blockId && item.blockId > 0)
        .map(item => item.blockId);
    }

    if (metadata.examples && metadata.examples.length > 0) {
      serialized.examples = metadata.examples
        .filter(item => item.blockId && item.blockId > 0)
        .map(item => item.blockId);
    }

    return serialized;
  }

  /**
   * Validate template data
   */
  static validateTemplate(data: TemplateData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
      errors.name = 'Template name is required';
    }

    if (!data.content?.trim()) {
      errors.content = 'Template content is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// === SIMPLIFIED HOOKS ===




// === REFACTORED EDITORS (SIMPLIFIED) ===



