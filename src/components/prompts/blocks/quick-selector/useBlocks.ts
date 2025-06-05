import { useEffect, useState } from 'react';
import { Block } from '@/types/prompts/blocks';
import { blocksApi } from '@/services/api/BlocksApi';

export function useBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blocksApi.getBlocks().then(res => {
      if (res.success) {
        setBlocks(res.data);
      }
      setLoading(false);
    });
  }, []);

  return { blocks, loading };
}
