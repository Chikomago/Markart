export type GithubRepo = { name: string; fullName: string; url: string }

export function mergeGithubRepos(remote: GithubRepo[], created: GithubRepo[]): { repos: GithubRepo[]; missing: GithubRepo[] } {
  const remoteUrls = new Set(remote.map(repo => repo.url.toLowerCase()))
  const missing = created.filter(repo => !remoteUrls.has(repo.url.toLowerCase()))
  return { repos: [...missing, ...remote], missing }
}
