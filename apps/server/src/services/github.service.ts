import { Octokit } from '@octokit/rest';
import { env } from '../config/env';

const octokit = new Octokit({ auth: env.GITHUB_PRIVATE_KEY }); // Treats it as a PAT because it's a simple string

export class GithubService {
  /**
   * Pushes the given file contents to a GitHub repository using the native
   * Git Tree API — no local git binary required.
   *
   * Returns the new commit SHA. Throws on failure (callers handle rollback).
   */
  static async executeMergePush(
    repoOwner: string,
    repoName: string,
    diffPayload: string,
    filesChanged: string[],
    commitMessage: string = 'Consensus merge 🚀',
  ): Promise<string> {
    console.log(`[GitHub] Pushing to ${repoOwner}/${repoName}...`);

    // 1. Resolve latest commit SHA on `main`
    const { data: refData } = await octokit.rest.git.getRef({
      owner: repoOwner,
      repo: repoName,
      ref: 'heads/main',
    });
    const baseCommitSha = refData.object.sha;

    // 2. Get base tree SHA from that commit
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner: repoOwner,
      repo: repoName,
      commit_sha: baseCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // 3. Build Git tree entries — one blob per changed file
    // In a full implementation you'd parse the unified diff into per-file content;
    // here each file in filesChanged gets the full diffPayload as its content.
    const treeEntries = filesChanged.map(filePath => ({
      path: filePath,
      mode: '100644' as const,
      type: 'blob' as const,
      content: diffPayload,
    }));

    const { data: newTree } = await octokit.rest.git.createTree({
      owner: repoOwner,
      repo: repoName,
      base_tree: baseTreeSha,
      tree: treeEntries,
    });

    // 4. Create the consensus commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner: repoOwner,
      repo: repoName,
      message: commitMessage,
      tree: newTree.sha,
      parents: [baseCommitSha],
    });

    // 5. Fast-forward the branch ref
    await octokit.rest.git.updateRef({
      owner: repoOwner,
      repo: repoName,
      ref: 'heads/main',
      sha: newCommit.sha,
    });

    console.log(`[GitHub] Consensus commit pushed: ${newCommit.sha}`);
    return newCommit.sha;
  }
}
