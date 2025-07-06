import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

export interface GitOperation {
    type: 'create_branch' | 'commit' | 'push' | 'merge' | 'revert';
    branchName?: string;
    commitMessage?: string;
    files?: string[];
    description?: string;
}

export interface GitResult {
    success: boolean;
    message: string;
    branchName?: string;
    commitHash?: string;
    filesChanged?: string[];
    error?: string;
}

export class GitAutomationService {
    private repoPath: string;

    constructor(repoPath: string = process.cwd()) {
        this.repoPath = repoPath;
    }

    /**
     * Create a new branch for AI-generated code
     */
    async createBranch(branchName: string, description?: string): Promise<GitResult> {
        try {
            // Check if we're in a git repository
            if (!this.isGitRepository()) {
                return {
                    success: false,
                    message: 'Not a git repository',
                    error: 'Git repository not found'
                };
            }

            // Check if branch already exists
            const branches = this.getBranches();
            if (branches.includes(branchName)) {
                return {
                    success: false,
                    message: `Branch '${branchName}' already exists`,
                    error: 'Branch already exists'
                };
            }

            // Create and checkout new branch
            execSync(`git checkout -b ${branchName}`, { 
                cwd: this.repoPath,
                stdio: 'pipe'
            });

            return {
                success: true,
                message: `Successfully created and switched to branch '${branchName}'`,
                branchName: branchName
            };

        } catch (error) {
            return {
                success: false,
                message: `Failed to create branch '${branchName}'`,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Generate code and save it to files
     */
    async generateAndSaveCode(
        filePath: string, 
        code: string, 
        description?: string
    ): Promise<GitResult> {
        try {
            // Ensure directory exists
            const dir = join(this.repoPath, filePath.split('/').slice(0, -1).join('/'));
            if (!existsSync(dir)) {
                execSync(`mkdir -p "${dir}"`, { cwd: this.repoPath });
            }

            // Write the code to file
            writeFileSync(join(this.repoPath, filePath), code, 'utf8');

            return {
                success: true,
                message: `Successfully generated and saved code to ${filePath}`,
                filesChanged: [filePath]
            };

        } catch (error) {
            return {
                success: false,
                message: `Failed to save code to ${filePath}`,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Commit generated code with AI-generated commit message
     */
    async commitChanges(
        files: string[], 
        commitMessage?: string,
        generateCommitMessage?: (files: string[]) => Promise<string>
    ): Promise<GitResult> {
        try {
            // Add files to staging
            files.forEach(file => {
                execSync(`git add "${file}"`, { 
                    cwd: this.repoPath,
                    stdio: 'pipe'
                });
            });

            // Generate commit message if not provided
            let finalCommitMessage = commitMessage;
            if (!finalCommitMessage && generateCommitMessage) {
                finalCommitMessage = await generateCommitMessage(files);
            } else if (!finalCommitMessage) {
                finalCommitMessage = `AI-generated: Update ${files.join(', ')}`;
            }

            // Commit changes
            execSync(`git commit -m "${finalCommitMessage}"`, { 
                cwd: this.repoPath,
                stdio: 'pipe'
            });

            // Get commit hash
            const commitHash = execSync('git rev-parse HEAD', { 
                cwd: this.repoPath,
                encoding: 'utf8'
            }).trim();

            return {
                success: true,
                message: `Successfully committed changes: ${finalCommitMessage}`,
                commitHash: commitHash,
                filesChanged: files
            };

        } catch (error) {
            return {
                success: false,
                message: 'Failed to commit changes',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Push branch to remote repository
     */
    async pushBranch(branchName?: string): Promise<GitResult> {
        try {
            const currentBranch = branchName || this.getCurrentBranch();
            
            execSync(`git push -u origin ${currentBranch}`, { 
                cwd: this.repoPath,
                stdio: 'pipe'
            });

            return {
                success: true,
                message: `Successfully pushed branch '${currentBranch}' to remote`,
                branchName: currentBranch
            };

        } catch (error) {
            return {
                success: false,
                message: 'Failed to push branch to remote',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Complete workflow: Create branch, generate code, commit, and push
     */
    async completeWorkflow(
        branchName: string,
        files: Array<{ path: string; code: string }>,
        commitMessage?: string,
        generateCommitMessage?: (files: string[]) => Promise<string>
    ): Promise<GitResult> {
        try {
            // Step 1: Create branch
            const branchResult = await this.createBranch(branchName);
            if (!branchResult.success) {
                return branchResult;
            }

            // Step 2: Generate and save all files
            const savedFiles: string[] = [];
            for (const file of files) {
                const saveResult = await this.generateAndSaveCode(file.path, file.code);
                if (!saveResult.success) {
                    return saveResult;
                }
                savedFiles.push(file.path);
            }

            // Step 3: Commit changes
            const commitResult = await this.commitChanges(savedFiles, commitMessage, generateCommitMessage);
            if (!commitResult.success) {
                return commitResult;
            }

            // Step 4: Push to remote
            const pushResult = await this.pushBranch(branchName);
            if (!pushResult.success) {
                return pushResult;
            }

            return {
                success: true,
                message: `Complete workflow successful: Created branch '${branchName}', generated ${files.length} files, committed, and pushed`,
                branchName: branchName,
                commitHash: commitResult.commitHash,
                filesChanged: savedFiles
            };

        } catch (error) {
            return {
                success: false,
                message: 'Workflow failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get current branch name
     */
    getCurrentBranch(): string {
        try {
            return execSync('git branch --show-current', { 
                cwd: this.repoPath,
                encoding: 'utf8'
            }).trim();
        } catch (error) {
            return 'main';
        }
    }

    /**
     * Get all branches
     */
    getBranches(): string[] {
        try {
            const branches = execSync('git branch --format="%(refname:short)"', { 
                cwd: this.repoPath,
                encoding: 'utf8'
            }).trim().split('\n');
            return branches.filter(branch => branch.length > 0);
        } catch (error) {
            return [];
        }
    }

    /**
     * Check if current directory is a git repository
     */
    private isGitRepository(): boolean {
        try {
            execSync('git rev-parse --git-dir', { 
                cwd: this.repoPath,
                stdio: 'pipe'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get git status
     */
    getStatus(): string {
        try {
            return execSync('git status --porcelain', { 
                cwd: this.repoPath,
                encoding: 'utf8'
            }).trim();
        } catch (error) {
            return '';
        }
    }

    /**
     * Get recent commits
     */
    getRecentCommits(limit: number = 5): string[] {
        try {
            const commits = execSync(`git log --oneline -${limit}`, { 
                cwd: this.repoPath,
                encoding: 'utf8'
            }).trim().split('\n');
            return commits.filter(commit => commit.length > 0);
        } catch (error) {
            return [];
        }
    }
} 