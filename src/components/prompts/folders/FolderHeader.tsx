// src/components/folders/FolderHeader.tsx
import { Folder } from "lucide-react";
import { OrganizationImage } from '@/components/organizations';
import { Organization } from '@/types/organizations';
import { useOrganizationById } from '@/hooks/organizations';

const folderIconColors = {
  user: 'jd-text-blue-500',
  company: 'jd-text-red-500',
  organization: 'jd-text-gray-600'
} as const;

export function FolderHeader({
  folder,
  isExpanded,
  onToggle,
  actionButtons,
  level = 0,
  organizations,
  type
}: {
  folder: any;
  isExpanded: boolean;
  onToggle: () => void;
  actionButtons: React.ReactNode;
  level?: number;
  organizations?: Organization[];
  type?: 'company' | 'organization' | 'user';
}) {
  const { data: organization } = useOrganizationById(folder?.organization_id);

  const resolvedOrg =
    organizations?.find(o => o.id === folder?.organization_id) ||
    organization ||
    folder.organization;
    return (
      <div 
        className="jd-group jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-cursor-pointer jd-rounded-sm"
        onClick={onToggle}
      >
        {/* Removed chevron icons for a cleaner look */}
        <Folder className={`jd-h-4 jd-w-4 jd-mr-2 ${folderIconColors[type || folder.type || 'user']}`} />
        <span className="jd-text-sm jd-flex-1 jd-truncate">{folder.title}</span>
        {folder.type === 'organization' && level === 0 && (
          <OrganizationImage
            imageUrl={resolvedOrg?.image_url || folder.image_url}
            organizationName={resolvedOrg?.name || folder.title}
            size="sm"
            className="jd-ml-2"
          />
        )}
        
        {folder.templates?.length > 0 && (
          <span className="jd-text-xs jd-text-muted-foreground jd-mr-2">
            {folder.templates.length} {folder.templates.length === 1 ? 'template' : 'templates'}
          </span>
        )}
        
        {actionButtons}
      </div>
    );
  }
