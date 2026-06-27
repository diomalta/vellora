# Changelog

vellora is a [Changesets](https://github.com/changesets/changesets)-managed monorepo. Each published
package keeps its own changelog:

- [vellora](packages/vellora/CHANGELOG.md)
- [@vellora/native](packages/native/CHANGELOG.md)
- [@vellora/lint](packages/lint/CHANGELOG.md)
- [@vellora/cli](packages/cli/CHANGELOG.md)
- [@vellora/engine-chromium](packages/engine-chromium/CHANGELOG.md)

Public alpha releases are published to npm under the `latest` dist-tag. Use
`npm view vellora version` to confirm the current published version; release
publishing itself is described in [RELEASING.md](RELEASING.md).
