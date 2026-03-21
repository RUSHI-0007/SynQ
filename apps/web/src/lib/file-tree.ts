export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  extension?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

/**
 * buildFileTree
 * Converts a flat array of relative file paths (e.g. ["src/App.tsx", "package.json"])
 * into a deeply nested FileNode tree.
 *
 * Rules:
 * - Folders are always sorted first, then files, both alphabetically.
 * - All folders default to isOpen: true.
 */
export function buildFileTree(paths: string[]): FileNode[] {
  // Build a nested map: key = segment name, value = sub-map (folder) or null (file + path)
  const root: Record<string, any> = {};

  for (const filePath of paths) {
    const parts = filePath.split('/').filter(Boolean);
    let cursor: Record<string, any> = root;

    for (let i = 0; i < parts.length; i++) {
      const part: string | undefined = parts[i];
      if (!part) continue; // guard against undefined — satisfies strict TypeScript
      const isLast = i === parts.length - 1;

      if (isLast) {
        // File leaf — only write if not already a folder node
        if (!(part in cursor)) {
          cursor[part] = { __type: 'file', __path: filePath };
        }
      } else {
        // Folder intermediate node
        if (!(part in cursor) || cursor[part].__type === 'file') {
          cursor[part] = { __type: 'folder', __children: {} };
        }
        cursor = cursor[part].__children as Record<string, any>;
      }
    }
  }

  function toNodes(map: Record<string, any>, parentPath: string): FileNode[] {
    const entries = Object.entries(map);

    // Folders first, then files — both alphabetical
    entries.sort(([aKey, aVal], [bKey, bVal]) => {
      const aIsFolder = aVal.__type === 'folder';
      const bIsFolder = bVal.__type === 'folder';
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return aKey.localeCompare(bKey);
    });

    return entries.map(([name, val]): FileNode => {
      const path = parentPath ? `${parentPath}/${name}` : name;
      const dotIdx = name.lastIndexOf('.');
      const extension = dotIdx > 0 ? name.slice(dotIdx + 1) : undefined;

      if (val.__type === 'file') {
        const node: FileNode = {
          id: path,
          name,
          type: 'file',
          path: (val.__path as string) || path,
        };
        if (extension) node.extension = extension;
        return node;
      }

      return {
        id: path,
        name,
        type: 'folder',
        path,
        isOpen: true,
        children: toNodes(val.__children as Record<string, any> || {}, path),
      };
    });
  }

  return toNodes(root, '');
}
