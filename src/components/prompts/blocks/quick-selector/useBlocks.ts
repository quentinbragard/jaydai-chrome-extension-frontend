// src/components/prompts/blocks/quick-selector/useBlocks.ts
import { useEffect, useState } from 'react';
import { Block } from '@/types/prompts/blocks';
import { blocksApi } from '@/services/api/BlocksApi';

export function useBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await blocksApi.getBlocks();
      if (res.success) {
        const published = res.data.filter(
          b => (b as any).published
        );
        setBlocks(published);
      } else {
        setBlocks([]);
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const addBlock = (block: Block) => {
    setBlocks(prev => [block, ...prev]);
  };

  const updateBlock = (updatedBlock: Block) => {
    setBlocks(prev => 
      prev.map(block => 
        block.id === updatedBlock.id ? updatedBlock : block
      )
    );
  };

  const removeBlock = (blockId: number) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
  };

  const refreshBlocks = async () => {
    await fetchBlocks();
  };

  return { 
    blocks, 
    loading, 
    addBlock, 
    updateBlock, 
    removeBlock, 
    refreshBlocks 
  };
}