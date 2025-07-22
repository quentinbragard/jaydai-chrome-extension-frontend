// src/components/prompts/blocks/quick-selector/useBlocks.ts
import { useEffect, useState } from 'react';
import { Block } from '@/types/prompts/blocks';
import { blocksApi } from '@/services/api/BlocksApi';
import { useQueryClient } from 'react-query';

export function useBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Initial fetch
  useEffect(() => {
    const cached = queryClient.getQueryData<Block[]>('blocks');
    if (cached && cached.length > 0) {
      setBlocks(cached);
      setLoading(false);
    } else {
      fetchBlocks();
    }
  }, []);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await blocksApi.getBlocks({ published: true });
      if (res.success) {
        setBlocks(res.data);
        queryClient.setQueryData('blocks', res.data);
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