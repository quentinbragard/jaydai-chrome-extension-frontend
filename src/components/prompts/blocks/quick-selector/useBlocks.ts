import { useEffect, useState } from 'react';
import { Block } from '@/types/prompts/blocks';
import { blocksApi } from '@/services/api/BlocksApi';

export function useBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blocksApi.getBlocks().then(res => {
      if (res.success) {
        const published = res.data.filter(
          b => (b as any).published === true || (b as any).is_published === true
        );
        setBlocks(published);
      }
      setLoading(false);
    });
  }, []);

  const addBlock = (block: Block) => {
    setBlocks(prev => [block, ...prev]);
  };

  return { blocks, loading, addBlock };
}
