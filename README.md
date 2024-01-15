# SVGFM

SVG Filter Maker is a tool to help you build out your SVG filters viasually in a node graph editor.

## Known issues

-   Cyclic dependencies are mostly ignored, I'm not here to shame your ouroboros.
-   Terribly not responsive and terribly unusable on mobile or touch-only devices.
-   Using a lot of nodes leads to performance issues.

## Missing features

-   Preview each node's result to see how they affect the overall result ([requested by Scott Kellum](https://mastodon.social/@scott@typetura.social/111761480271767653)).
-   Save latest graph configuration so it can be restored upon repeat visits.
-   Create a shareable link of the current configuration.
-   Create a list of recipes that can be loaded into the filter maker.
-   Allow inserting a custom SVG into the preview window