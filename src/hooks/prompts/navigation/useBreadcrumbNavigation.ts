import { useState, useMemo } from 'react';
import { TemplateFolder, Template } from '@/types/prompts/templates';

export interface Breadcrumb {
  id: number;
  title: string;
  type: 'user' | 'organization';
}

export interface UseBreadcrumbNavigationProps {
  userFolders: TemplateFolder[];
  organizationFolders: TemplateFolder[];
}

function findFolderById(folders: TemplateFolder[], id: number): TemplateFolder | null {
  for (const f of folders) {
    if (f.id === id) return f;
    if (f.Folders) {
      const found = findFolderById(f.Folders, id);
      if (found) return found;
    }
  }
  return null;
}

export function useBreadcrumbNavigation({ userFolders, organizationFolders }: UseBreadcrumbNavigationProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  const currentFolder = useMemo(() => {
    if (breadcrumbs.length === 0) return null;
    const last = breadcrumbs[breadcrumbs.length - 1];
    const source = last.type === 'user' ? userFolders : organizationFolders;
    return findFolderById(source, last.id);
  }, [breadcrumbs, userFolders, organizationFolders]);

  const currentItems = useMemo(() => {
    if (!currentFolder) {
      const roots = [
        ...userFolders.map(f => ({ ...f, type: 'user' as const })),
        ...organizationFolders.map(f => ({ ...f, type: 'organization' as const }))
      ];
      const rootTemplates: Template[] = [];
      userFolders.forEach(f => {
        f.templates?.filter(t => !t.folder_id).forEach(t => rootTemplates.push({ ...t, type: 'user' as const }));
      });
      return [...roots, ...rootTemplates];
    }

    const type = breadcrumbs[0].type;
    const items: Array<TemplateFolder | Template> = [];
    currentFolder.Folders?.forEach(f => items.push({ ...f, type }));
    currentFolder.templates?.forEach(t => items.push({ ...t, type }));
    return items;
  }, [currentFolder, userFolders, organizationFolders, breadcrumbs]);

  const navigateToFolder = (folder: TemplateFolder & { type: 'user' | 'organization' }) => {
    setBreadcrumbs(prev => [...prev, { id: folder.id, title: folder.title || '', type: folder.type! }]);
  };

  const navigateBack = () => setBreadcrumbs(prev => prev.slice(0, -1));

  const navigateToRoot = () => setBreadcrumbs([]);

  const navigateToPathIndex = (index: number) => setBreadcrumbs(prev => prev.slice(0, index + 1));

  const getItemType = (item: TemplateFolder | Template): 'user' | 'organization' => (item as TemplateFolder).type as 'user' | 'organization';

  return {
    breadcrumbs,
    currentFolder,
    currentItems,
    navigateToFolder,
    navigateBack,
    navigateToRoot,
    navigateToPathIndex,
    getItemType,
    isAtRoot: breadcrumbs.length === 0
  };
}

export default useBreadcrumbNavigation;
