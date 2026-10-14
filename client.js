/**
 * dsh-aris-glass - browser half.
 *
 * Injects one stylesheet that gives the work surface its liquid glass:
 *   - every assistant message body gets a frosted, rounded plate
 *     (tune with --aris-glass-alpha / --aris-glass-blur if you want);
 *   - the left sidebar column - the session list plus the panel rows
 *     (sessions, plugins, task board, ...), the brand row and the foot - gets
 *     the same plate instead of the flat, opaque sidebar fill;
 *   - the caption menu items (the Desktop-owned "Application" / "Edit" menus
 *     that sit in the titlebar, next to the sidebar toggle) each get a plate.
 * The plated blocks inside an assistant bubble drop their own glass so it does
 * not stack; code blocks (pre) keep their background. The user bubble is
 * excluded: it lives under [class*="userStack"].
 *
 * Anchors are structural, never build-hashed class names:
 *   - the sidebar column is selected with :has(> [data-slot="sidebar"]). The
 *     slot outlet itself carries display:contents (the slot renderer's
 *     ANCHOR_STYLE), so it generates no box - the glass has to be painted on
 *     the parent column.
 *   - --dsw-specific-sidebar-fill is zeroed ON that column instead of
 *     repainting each layer: the column and the shell inside it both read that
 *     one token, so every fill goes transparent together and only the ::before
 *     plate remains.
 * backdrop-filter rides the column's ::before deliberately: a non-none
 * backdrop-filter makes its element the containing block for its
 * position:fixed descendants, and the sidebar toggle / new-session buttons are
 * fixed once the Windows titlebar is in play (shifting and clipping them). A
 * pseudo-element has no descendants, so it can never capture them.
 *
 * The caption menu is a `div[data-windows-menu]` whose contents live in an
 * OPEN shadow root (preload-menu.js), so page CSS cannot reach its buttons -
 * the page rules only dress the host. Its plate therefore has to be written
 * INTO that shadow root from script; the host itself is left transparent so
 * the two items read as floating glass pills rather than one wide slab.
 *
 * Both the page tag and the menu tag are rewritten on every apply rather than
 * created once: the client loader re-runs this factory on an HMR rebuild, and
 * skipping the write when the tag already existed would leave the old CSS in
 * place. The menu stylesheet is parked on a window global so the single
 * long-lived MutationObserver (created by whichever factory run came first,
 * and never re-created, to avoid leaking one per rebuild) always writes the
 * CURRENT text.
 *
 * Removal: drop this row from dsh.profile.bundles, or disable the plugin.
 */
window.__ModuleLoader__.load({
	id: "dsh-aris-glass",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const SEL = '[data-slot="main.conversation"] [class*="markdown"]:not(:is([class*="userStack"] *))';

		const flat = [
			'> p',
			'> :where(h1, h2, h3, h4, h5, h6)',
			'> blockquote',
			'> :where(ul, ol)'
		].map((suffix) => SEL + ' ' + suffix).join(', ');

		/* The sidebar column: the pane that holds the slot outlet as a direct
		 * child. Only that one element matches. */
		const SIDEBAR = 'div:has(> [data-slot="sidebar"])';

		const CSS = [
			'/* dsh-aris-glass: assistant message liquid glass */',
			SEL + ' {',
			'  background: rgb(255 255 255 / var(--aris-glass-alpha, .55));',
			'  -webkit-backdrop-filter: blur(var(--aris-glass-blur, 14px)) saturate(1.35);',
			'  backdrop-filter: blur(var(--aris-glass-blur, 14px)) saturate(1.35);',
			'  border-radius: var(--dsw-radius-xl, 16px);',
			'  padding: 10px 14px;',
			'  box-shadow: 0 1px 3px rgb(28 37 70 / .10), 0 8px 24px rgb(28 37 70 / .06);',
			'}',
			'body[data-ds-dark-theme] ' + SEL + ' {',
			'  background: rgb(16 22 42 / var(--aris-glass-alpha, .62));',
			'}',
			flat + ' {',
			'  background: none;',
			'  -webkit-backdrop-filter: none;',
			'  backdrop-filter: none;',
			'  box-shadow: none;',
			'}',

			'/* dsh-aris-glass: left sidebar liquid glass */',
			SIDEBAR + ' {',
			'  --dsw-specific-sidebar-fill: transparent;',
			'  position: relative;',
			'  z-index: 0;',
			'}',
			SIDEBAR + '::before {',
			'  content: "";',
			'  position: absolute;',
			'  inset: 0;',
			'  z-index: -1;',
			'  pointer-events: none;',
			'  background: rgb(255 255 255 / var(--aris-glass-alpha, .55));',
			'  -webkit-backdrop-filter: blur(var(--aris-glass-blur, 14px)) saturate(1.35);',
			'  backdrop-filter: blur(var(--aris-glass-blur, 14px)) saturate(1.35);',
			'}',
			'body[data-ds-dark-theme] ' + SIDEBAR + '::before {',
			'  background: rgb(16 22 42 / var(--aris-glass-alpha, .62));',
			'}',
			/* Yield to the wallpaper plugin's own left-sidebar glass switch
			 * (body[data-we-left-sidebar], setting "leftSidebarGlass"): it paints
			 * the same column with a fuller recipe, and a second plate under it
			 * would only stack two tints. With that switch on this plugin goes
			 * quiet; with it off (the default) this plate is the only one. */
			'body[data-we-left-sidebar] ' + SIDEBAR + '::before {',
			'  background: none;',
			'  -webkit-backdrop-filter: none;',
			'  backdrop-filter: none;',
			'}',
			'@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {',
			'  ' + SIDEBAR + '::before {',
			'    background: var(--dsw-alias-bg-layer-1, rgb(255 255 255 / .92));',
			'  }',
			'}',
			'@media (prefers-reduced-transparency: reduce) {',
			'  ' + SIDEBAR + '::before {',
			'    -webkit-backdrop-filter: none;',
			'    backdrop-filter: none;',
			'    background: var(--dsw-alias-bg-layer-1, rgb(255 255 255 / .92));',
			'  }',
			'}'
		].join('\n');

		/* Caption menus: written into the host's open shadow root. Kept as a
		 * separate sheet because it is installed by a different mechanism (see
		 * the file header) and its lifetime follows the menu host, not the page.
		 * Only the two buttons are painted - the host stays transparent. */
		const MENU_CSS = [
			'/* dsh-aris-glass: caption menu liquid glass */',
			'button {',
			'  background: rgb(255 255 255 / var(--aris-glass-alpha, .55));',
			'  -webkit-backdrop-filter: blur(var(--aris-glass-blur, 14px)) saturate(1.35);',
			'  backdrop-filter: blur(var(--aris-glass-blur, 14px)) saturate(1.35);',
			'  border-radius: var(--dsw-radius-md, 8px);',
			'  box-shadow: 0 1px 3px rgb(28 37 70 / .10), 0 8px 24px rgb(28 37 70 / .06);',
			'}',
			':host-context(body[data-ds-dark-theme]) button {',
			'  background: rgb(16 22 42 / var(--aris-glass-alpha, .62));',
			'}',
			/* Hover / open keeps the built-in emphasis, layered on the plate so
			 * the plate never disappears under the highlight. */
			'button:hover, button[aria-expanded="true"] {',
			'  background: rgb(255 255 255 / calc(var(--aris-glass-alpha, .55) + .18));',
			'  color: var(--dsw-alias-label-primary);',
			'}',
			':host-context(body[data-ds-dark-theme]) button:hover,',
			':host-context(body[data-ds-dark-theme]) button[aria-expanded="true"] {',
			'  background: rgb(16 22 42 / calc(var(--aris-glass-alpha, .62) + .16));',
			'}',
			'@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {',
			'  button {',
			'    background: var(--dsw-alias-bg-layer-1, rgb(255 255 255 / .92));',
			'  }',
			'}',
			'@media (prefers-reduced-transparency: reduce) {',
			'  button {',
			'    -webkit-backdrop-filter: none;',
			'    backdrop-filter: none;',
			'    background: var(--dsw-alias-bg-layer-1, rgb(255 255 255 / .92));',
			'  }',
			'}'
		].join('\n');

		const G = typeof window === "undefined" ? globalThis : window;

		/** Write the current menu sheet into the caption menu's shadow root. */
		function dressCaptionMenu() {
			try {
				const css = G.__dshArisGlassMenuCss__;
				if (typeof css !== "string") return;
				const host = document.querySelector("[data-windows-menu]");
				const root = host === null ? null : host.shadowRoot;
				if (root === null || root === undefined) return;
				let tag = root.querySelector("style[data-dsh-aris-glass-menu]");
				if (tag === null) {
					tag = document.createElement("style");
					tag.dataset.dshArisGlassMenu = "1";
					root.appendChild(tag);
				}
				if (tag.textContent !== css) tag.textContent = css;
			} catch (error) {
				/* no menu host, or a closed shadow root: nothing to dress */
			}
		}

		function writePageStyles() {
			try {
				let tag = document.querySelector('style[data-dsh-aris-glass]');
				if (tag === null) {
					tag = document.createElement('style');
					tag.dataset.dshArisGlass = '1';
					document.head.appendChild(tag);
				}
				if (tag.textContent !== CSS) tag.textContent = CSS;
			} catch (error) {
				/* no document head: nothing to attach to */
			}
		}

		const inject = [];

		function apply() {
			writePageStyles();
			G.__dshArisGlassMenuCss__ = MENU_CSS;
			dressCaptionMenu();
			if (G.__dshArisGlassMenuWatch__ !== true) {
				G.__dshArisGlassMenuWatch__ = true;
				try {
					/* The menu host is appended to body once the shell overlay
					 * exists, i.e. after this runs, so a body childList watch is
					 * what catches it. Cheap: direct children only, no subtree. */
					new MutationObserver(dressCaptionMenu).observe(document.body, { childList: true });
				} catch (error) {
					/* no body yet: a later apply retries */
				}
			}
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
