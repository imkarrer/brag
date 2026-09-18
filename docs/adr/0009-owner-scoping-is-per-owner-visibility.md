# Harvest scope is per-owner visibility, not a repo denylist

`brag candidates` searches every repository the author has touched, which
sweeps personal side projects into a professional record alongside real work.
The scope has to narrow, and the obvious levers are both wrong.

Filtering on visibility alone fails because visibility does not mean the same
thing under every owner. In the ledger this was built for, the employer's
repositories run public, internal **and** private — five private ones carry
the handbook, the installers and the website — while the author's own private
repositories are side projects. Excluding private globally would have deleted
ten merged handbook PRs to drop two personal ones. The rule people actually
hold is a conjunction: private **under my own account** is personal; private
**under the org** is work.

A repository denylist expresses that too, but it fails open. Start a new
private side project, forget to add it, and it silently enters the ledger —
which is exactly the failure that prompted this. Anything requiring a human to
remember a step at repository-creation time will eventually not happen.

So `github_owners` takes an optional visibility filter per owner:

```json
"github_owners": [
  "flox",
  { "owner": "imkarrer", "visibility": ["public"] }
]
```

This fails closed: a new private personal repository is out of scope the
moment it exists, with nothing to remember. A bare string still means every
visibility, so existing configs keep working.

The cost is that visibility is a property of a GitHub search rather than of an
owner, so owners scoped differently cannot share one search. `brag candidates`
groups owners by their filter and issues one search per group — two instead of
one for the config above, per window, per authored/reviewed. Entry ids dedupe
the results downstream, so overlapping groups are safe rather than merely
tolerable.

Note what this does not do: it decides which repositories are _searched_, not
which entries deserve to exist. The `impact` requirement (ADR 0005) remains
the filter on whether work is worth recording at all.
