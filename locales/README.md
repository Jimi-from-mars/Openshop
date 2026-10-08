# Editor languages

The editor follows the host site's `private-image-lab-language` preference on the same origin. It supports the same eight languages: English, Japanese, Korean, French, German, Spanish, Simplified Chinese and Traditional Chinese. Without a host preference, the saved editor language is used; unsupported languages fall back to English.

Catalogs are embedded into the editor shell so translations work offline without an external translation service. After editing a catalog, run `node tools/sync-editor-locales.mjs`, `npm run security:write`, and `node tools/sync-editor-locales.mjs --check`. Preserve the English keys and placeholders across all catalogs.

Static controls, detached tool menus and newly created dialogs are translated. Interface translation does not change canvas text, user layer names, form values, file contents or export formats. The brand and the host's **Back to home** link remain English. Settings retain the legacy `zh` locale for compatibility.
