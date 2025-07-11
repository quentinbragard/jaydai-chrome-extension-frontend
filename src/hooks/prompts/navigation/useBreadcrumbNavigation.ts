import { useState, useMemo } from 'react';
import { TemplateFolder, Template } from '@/types/prompts/templates';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { useTemplatesByFolder } from '@/hooks/prompts/queries/templates';

export interface Breadcrumb {
  id: number;
  title: string;
  type: 'user' | 'organization';
}

export interface UseBreadcrumbNavigationProps {
  userFolders: TemplateFolder[];
  organizationFolders: TemplateFolder[];
  /**
   * Templates that are not assigned to any folder (folder_id is null)
   * These will be displayed after the user folders at the root level
   */
  unorganizedTemplates?: Template[];
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

export function useBreadcrumbNavigation({ userFolders, organizationFolders, unorganizedTemplates = [] }: UseBreadcrumbNavigationProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  const getItemTitle = (item: TemplateFolder | Template): string => {
    if ((item as TemplateFolder).Folders !== undefined || (item as TemplateFolder).templates !== undefined) {
      return getLocalizedContent((item as TemplateFolder).title ?? (item as TemplateFolder).name) || '';
    }
    return getLocalizedContent((item as Template).title) || '';
  };

  const sortItems = (items: Array<TemplateFolder | Template>) => {
    return [...items].sort((a, b) => getItemTitle(a).localeCompare(getItemTitle(b), undefined, { sensitivity: 'base' }));
  };

  const currentFolder = useMemo(() => {
    if (breadcrumbs.length === 0) return null;
    const last = breadcrumbs[breadcrumbs.length - 1];
    const source = last.type === 'user' ? userFolders : organizationFolders;
    return findFolderById(source, last.id);
  }, [breadcrumbs, userFolders, organizationFolders]);

  const { data: fetchedTemplates = [] } = useTemplatesByFolder(
    currentFolder?.id,
    !!currentFolder && (!currentFolder.templates || currentFolder.templates.length === 0)
  );

  const folderWithTemplates = useMemo(() => {
    if (!currentFolder) return null;
    if (currentFolder.templates && currentFolder.templates.length > 0) {
      return currentFolder;
    }
    return { ...currentFolder, templates: fetchedTemplates };
  }, [currentFolder, fetchedTemplates]);

  const currentItems = useMemo(() => {
    if (!folderWithTemplates) {
      const userRootFolders = userFolders.map(f => ({ ...f, type: 'user' as const }));
      const orgRootFolders = organizationFolders.map(f => ({ ...f, type: 'organization' as const }));

      const rootTemplates = (unorganizedTemplates || []).map(t => ({ ...t, type: 'user' as const }));

      return sortItems([...userRootFolders, ...rootTemplates, ...orgRootFolders]);
    }

    const type = breadcrumbs[0].type;
    const items: Array<TemplateFolder | Template> = [];
    folderWithTemplates.Folders?.forEach(f => items.push({ ...f, type }));
    folderWithTemplates.templates?.forEach(t => items.push({ ...t, type }));
    return sortItems(items);
  }, [folderWithTemplates, userFolders, organizationFolders, unorganizedTemplates, breadcrumbs]);

  const navigateToFolder = (folder: TemplateFolder & { type: 'user' | 'organization' }) => {
    setBreadcrumbs(prev => [...prev, { id: folder.id, title: folder.title || '', type: folder.type! }]);
  };

  const navigateBack = () => setBreadcrumbs(prev => prev.slice(0, -1));

  const navigateToRoot = () => setBreadcrumbs([]);

  const navigateToPathIndex = (index: number) => setBreadcrumbs(prev => prev.slice(0, index + 1));

  const getItemType = (item: TemplateFolder | Template): 'user' | 'organization' => (item as TemplateFolder).type as 'user' | 'organization';

  return {
    breadcrumbs,
    currentFolder: folderWithTemplates,
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
