# Tool and data live in separate repositories

brag started as one private repo holding both the tool and the owner's
ledger. We split them: this repo is the public, installable tool; each
user's ledger lives in a data dir they choose (git-backed or plain files),
located via `--data-dir` > `$BRAG_HOME` > `~/.config/brag/config.json` >
`~/.local/share/brag`. A ledger holds performance claims and colleagues'
kudos — it can never be part of a public repo, and coupling it to the tool
would have made the tool unshareable. The explicit no: the tool repo never
contains anyone's entries, and nothing in it may assume it does.
