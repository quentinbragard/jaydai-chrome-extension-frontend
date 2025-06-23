import React, { useState, useCallback, useMemo } from 'react';
import { FolderOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FolderNavigation } from './FolderNavigation';
import { TemplateFolder } from '@/types/prompts/templates';

interface FolderPickerProps {
  folders: TemplateFolder[];
  onSelect: (folder: TemplateFolder | null, path: string) => void;
  className?: string;
}

type NavState = {
  path: { id: number; title: string }[];
  currentFolder: TemplateFolder | null;
};

export const FolderPicker: React.FC<FolderPickerProps> = ({ folders, onSelect, className = '' }) => {
  const [nav, setNav] = useState<NavState>({ path: [], currentFolder: null });
  console.log("FOLDERS--->", folders);

  const findFolderById = useCallback((list: TemplateFolder[], id?: number): TemplateFolder | null => {
    for (const f of list) {
      if (f.id === id) return f;
      if (f.Folders) {
        const found = findFolderById(f.Folders, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const navigateToFolder = useCallback((folder: TemplateFolder) => {
    setNav(prev => ({
      path: [...prev.path, { id: folder.id, title: folder.title ?? '' }],
      currentFolder: folder,
    }));
  }, []);

  const navigateBack = useCallback(() => {
    setNav(prev => {
      const newPath = prev.path.slice(0, -1);
      const newCurrent = findFolderById(folders, newPath[newPath.length - 1]?.id);
      return { path: newPath, currentFolder: newCurrent };
    });
  }, [folders, findFolderById]);

  const navigateToRoot = useCallback(() => setNav({ path: [], currentFolder: null }), []);

  const navigateToPath = useCallback(
    (index: number) => {
      const newPath = nav.path.slice(0, index + 1);
      const newCurrent = findFolderById(folders, newPath[newPath.length - 1]?.id);
      setNav({ path: newPath, currentFolder: newCurrent });
    },
    [nav.path, folders, findFolderById]
  );

  const currentFolders = useMemo(() => {
    return nav.currentFolder ? nav.currentFolder.Folders || [] : folders;
  }, [nav.currentFolder, folders]);

  const handleSelect = useCallback(() => {
    const path = nav.path.map(p => p.title).join(' / ');
    onSelect(nav.currentFolder, path);
  }, [nav.path, nav.currentFolder, onSelect]);

  return (
    <div className={`jd-space-y-2 ${className}`}>
      <FolderNavigation
        path={nav.path}
        onNavigateToRoot={navigateToRoot}
        onNavigateBack={navigateBack}
        onNavigateToPath={navigateToPath}
      />
      <div className="jd-space-y-1 jd-max-h-56 jd-overflow-y-auto jd-px-2">
        {currentFolders.map(folder => (
          <div
            key={folder.id}
            className="jd-group jd-flex jd-items-center jd-p-2 jd-rounded-sm hover:jd-bg-accent/60 jd-cursor-pointer"
            onClick={() => navigateToFolder(folder)}
          >
            <FolderOpen className="jd-h-4 jd-w-4 jd-mr-2 jd-text-muted-foreground" />
            <span className="jd-text-sm jd-flex-1 jd-truncate">{folder.title}</span>
            <ChevronRight className="jd-h-3 jd-w-3 jd-text-muted-foreground" />
          </div>
        ))}
        {currentFolders.length === 0 && (
          <div className="jd-text-xs jd-text-muted-foreground jd-p-2">No subfolders</div>
        )}
      </div>
      <div className="jd-flex jd-justify-end">
        <Button type="button" size="sm" variant="secondary" onClick={handleSelect}>
          {nav.currentFolder ? `Select "${nav.currentFolder.title}"` : 'Select Root'}
        </Button>
      </div>
    </div>
  );
};

export default FolderPicker;
