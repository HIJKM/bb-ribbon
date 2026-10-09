# bb-ribbon

<p align="center">
  <strong>icon ribbon navigation for the BB sidebar.</strong>
</p>

<p align="center">
  <a href="#install">install</a> · <a href="#what-it-does">what it does</a> · <a href="#related">related</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-666666?labelColor=333333" alt="MIT license" /></a>
</p>

---

A BB plugin that replaces the default sidebar navigation with a compact icon ribbon.
Desktop uses a vertical rail on the left; compact viewports use a horizontal strip above the thread list.
Open/close motion stays in `sidebar`; thread row styling stays in `bb-thread-theme`.

- **desktop** — vertical icon rail; hover/keyboard focus expands the rail to show labels
- **mobile** — horizontal icon strip; labels via button `title`; `impact-light` on tap when available
- **overflow** — a `...` control always stays; overflow and hidden items go into More
- **customize** — open BB’s Customize sidebar from the icon context menu (or More)

## install

Requires [bb](https://getbb.app) with a compatible Plugin SDK (`engines` in `package.json`).

From a clone:

```bash
git clone https://github.com/HIJKM/bb-ribbon.git
cd bb-ribbon
bb plugin install . --yes
```

Or from GitHub:

```bash
bb plugin install 'git:https://github.com/HIJKM/bb-ribbon.git@main' --yes
```

Plugin id: `bb-ribbon`.

Enable it in **Settings → Appearance → Navigation** (value `bb-ribbon/ribbon`).

Toggle desktop hover expansion in **Settings → Ribbon → 데스크톱 리본 hover 확장** (enabled by default).
The ribbon expands over the thread list and fades labels in; it collapses when the pointer and keyboard focus leave. Icons stay in place throughout the transition. Phone navigation keeps its horizontal layout.

## what it does

Registers `experimental_sidebarNavigation` with id `ribbon` in `app.tsx`.
It lays out as many icons as fit, keeps Customize reachable, and does not own sidebar open/close animation.

## related

| plugin | role |
| --- | --- |
| `sidebar` | open/close depth motion |
| `bb-thread-theme` | thread list look and row chrome |

## license

MIT. See [LICENSE](LICENSE).
