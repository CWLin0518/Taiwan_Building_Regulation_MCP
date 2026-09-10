import path from 'path';

// Resolve files from the project itself instead of relying on the MCP client's
// working directory. Different clients launch stdio servers from different
// directories and not all of them support a `cwd` setting.
export const PROJECT_ROOT = path.resolve(path.dirname(process.argv[1]), '..');
