// Owner scoping for `brag candidates`.
//
// A GitHub search can be narrowed by owner and by repository visibility, but
// visibility is a property of the search, not of an owner — so scoping one
// owner differently from another means issuing more than one search. These
// helpers turn the configured owners into the argument groups to run.

export type OwnerScope = {
  owner: string;
  /** Repository visibilities to include. Undefined means all of them. */
  visibility?: string[];
};

const VISIBILITIES = ["public", "private", "internal"] as const;

function normalizeVisibility(
  raw: unknown,
  owner: string
): string[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  const list = Array.isArray(raw) ? raw : [raw];
  const values = list.map((v) => {
    if (typeof v !== "string") {
      throw new Error(
        `github_owners: visibility for "${owner}" must be strings, got ${typeof v}`
      );
    }
    const value = v.toLowerCase();
    if (!VISIBILITIES.includes(value as (typeof VISIBILITIES)[number])) {
      throw new Error(
        `github_owners: unknown visibility "${v}" for "${owner}" — expected ${VISIBILITIES.join(", ")}`
      );
    }
    return value;
  });
  if (values.length === 0) {
    throw new Error(`github_owners: visibility for "${owner}" is empty`);
  }
  // Sorted and deduped so two owners written in a different order still group.
  return [...new Set(values)].sort();
}

/**
 * Accepts the `github_owners` config value in either form: a bare string for
 * "every repository this owner has", or an object naming the visibilities to
 * include. Both may appear in the same list.
 */
export function normalizeOwners(raw: unknown): OwnerScope[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    throw new Error("github_owners must be an array");
  }
  return raw.map((item) => {
    if (typeof item === "string") return { owner: item };
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const { owner, visibility } = item as {
        owner?: unknown;
        visibility?: unknown;
      };
      if (typeof owner !== "string" || owner === "") {
        throw new Error("github_owners: each entry needs a non-empty owner");
      }
      const normalized = normalizeVisibility(visibility, owner);
      return normalized ? { owner, visibility: normalized } : { owner };
    }
    throw new Error(
      "github_owners: entries must be a string or an object with an owner"
    );
  });
}

/**
 * Groups owners that share a visibility filter into one search each, and
 * returns the `gh search prs` arguments for every group. Owners with no
 * visibility filter group together. An empty owner list yields a single
 * unscoped search, which is what `brag candidates` did before scoping existed.
 */
export function ownerSearchGroups(owners: OwnerScope[]): string[][] {
  if (owners.length === 0) return [[]];
  const groups = new Map<string, { visibility?: string[]; owners: string[] }>();
  for (const { owner, visibility } of owners) {
    const key = visibility ? visibility.join(",") : "";
    const group = groups.get(key) ?? { visibility, owners: [] };
    if (!group.owners.includes(owner)) group.owners.push(owner);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => [
    ...group.owners.flatMap((o) => ["--owner", o]),
    ...(group.visibility ? ["--visibility", group.visibility.join(",")] : []),
  ]);
}
