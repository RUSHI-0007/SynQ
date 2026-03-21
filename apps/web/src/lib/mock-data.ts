export const MOCK_TEAMMATES = [
  { id: '1', name: 'Alice', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', role: 'owner' },
  { id: '2', name: 'Bob', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', role: 'member' },
  { id: '3', name: 'Charlie', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', role: 'member' }
];

export const MOCK_FILE_TREE = [
  {
    name: 'src',
    type: 'directory',
    children: [
      {
        name: 'components',
        type: 'directory',
        children: [
          { name: 'Button.tsx', type: 'file' },
          { name: 'Header.tsx', type: 'file' }
        ]
      },
      { name: 'App.tsx', type: 'file' },
      { name: 'index.ts', type: 'file' }
    ]
  },
  { name: 'package.json', type: 'file' },
  { name: 'README.md', type: 'file' }
];
