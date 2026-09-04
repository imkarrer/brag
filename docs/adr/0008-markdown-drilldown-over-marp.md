# Reports are drill-down documents; Marp decks and one-pagers are rejected

A Marp pipeline (slide decks, then fixed-layout one-page PDFs) was built
and removed. The format that works for review collateral is the drill-down
document: glance-level claims that expand in place to narrative and
evidence — HTML with `<details>`, and a Markdown twin GitHub renders
natively for repo collaborators, which also removed the need for any
rendering toolchain in the package. Slide decks fragment the story and
fixed one-page layouts fight the content for space; when a PDF is needed,
the HTML page prints with every section expanded. Don't reintroduce a
slide or fixed-page export as the default output.
