# TypeScript run by node, packaged with Flox — no static-binary rewrite

The obvious CLI path is a Go/Rust static binary. We deliberately kept the
tested TypeScript (run natively by node 24's type stripping, no build step)
and made Flox carry the runtime: `[build.brag]` packages the sources with
`runtime-packages = ["nodejs"]`, so `flox install imkarrer/brag` delivers a
working `brag` with node in the closure. This is also the point of the
project as a Flox showcase — distribution solves the runtime problem, so a
rewrite would cost weeks and demonstrate less. Don't "fix" this by porting
to a compiled language.
