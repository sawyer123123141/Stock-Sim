# Market Overview v2 — game-first UI research

## Why v1 misses

The v1 mockup is clean and readable, but its composition is still fundamentally a web/dashboard composition: stacked rectangular regions, large cards, soft shadows, editorial headline treatment, and a content-feed rhythm. That visual grammar is now common in AI-generated SaaS interfaces and makes the screen feel like something to read rather than somewhere to play.

This is not primarily a color problem. Changing purple to blue or making the cards darker would not fix it.

## New reference set

### Mini Motorways — the system itself is the visual identity

Reference: https://store.steampowered.com/app/1127500/Mini_Motorways/

Use:
- the simulated system occupies the canvas rather than being summarized by cards;
- a very small HUD can coexist with surprisingly deep gameplay;
- color and motion communicate state directly;
- the player can understand the important state before reading much text.

Do not copy:
- map/road mechanics;
- extreme abstraction if it makes companies hard to understand;
- dark palette as a requirement.

### Planet Zoo — world first, modular information second

References:
- https://interfaceingame.com/games/planet-zoo/
- https://www.behance.net/gallery/136883915/Lead-UI-Planet-Zoo

Use:
- the game world remains visually dominant while information panels appear only when needed;
- modular overlays can carry deep simulation data without making the whole screen a dashboard;
- custom icons, animation, and art direction add personality to otherwise functional UI;
- information can be contextual to the selected object instead of permanently visible.

Do not copy:
- the amount of management complexity;
- tiny toolbar density;
- 3D-world requirements.

### Two Point Campus — readable management game HUD

Reference: https://www.mobygames.com/game/189088/two-point-campus/screenshots/

Use:
- colorful, chunky visual language that unmistakably reads as a game;
- objectives and alerts live at the edge of the main play space rather than occupying the center;
- icons and illustrated world elements carry identity;
- top/bottom HUD gives stable orientation while the center remains active.

Do not copy:
- constant alert clutter;
- dozens of simultaneous management indicators;
- toy-like comedy if it undermines Market Era's cleaner tone.

### News Tower — theme can replace generic interface chrome

Reference: https://store.steampowered.com/app/1649950/News_Tower/

Use:
- a strong visual theme makes utilitarian information feel like part of a game;
- the player's business/world is the primary visual object;
- panels feel authored for the fictional world instead of borrowed from productivity software.

Do not copy:
- skeuomorphic period styling;
- dense employee-management views;
- ornate decoration that competes with market information.

### Big Ambitions — useful warning about hiding information

References:
- https://www.bigambitionsgame.com/
- https://forum.bigambitionsgame.com/t/ui-cleanup/995

Use:
- world-first presentation can make a business game feel immediately playable;
- collapsible/contextual overlays are useful.

Warning:
- do not force players through many screens to compare information needed for one decision;
- making the UI feel like a game is not permission to make it less efficient.

## Core conclusion

**Market Overview should stop being a page and become a play space.**

The strongest v2 direction is a **living 2D Market Map / Market Board** occupying roughly 70–80% of the screen. It is an abstract visual representation of the economy, not a literal city simulator.

Conceptually:

```text
┌────────────────────────────────────────────────────────────┐
│ $12,480   Era 01 / Day 12        Market mood ↑     Alerts │
│                                                            │
│          TECHNOLOGY                    MOBILITY             │
│       ◉ LUMA +1.1%                ◉ NOVA +3.2%             │
│            ╲                          ╱                     │
│             ╲      LIVING MARKET    ╱                      │
│              ◉ smaller companies ◉                         │
│                                                            │
│     ENERGY                       CRYPTO                     │
│   ◉ HGRD -0.8%             ◉ PULSE +4.6%                  │
│                                                            │
│   [small animated event appears beside NOVA]               │
│   Prototype reveal → confidence rising                     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Market      Portfolio      Discover               Goal 2/3 │
└────────────────────────────────────────────────────────────┘
```

The exact geometry does not need to be a geographic map. Sector areas can be soft regions/islands/clusters, while companies appear as distinctive logos/nodes with subtle motion and short state cues.

## Why this is a better fit for Market Era

- Opening the game immediately shows a **living economy**, not a report about one.
- Fictional company branding becomes part of the core visual identity.
- New companies can appear naturally as nodes without adding navigation tabs.
- Sector booms, crashes, news, and Era events can become visible changes in the play space.
- Clicking a company can open one focused detail panel without losing market context.
- The design remains 2D and technically reasonable; it does not require building a 3D city game.
- Mobile can use the same conceptual market map with pan/zoom and a simplified HUD.

## Proposed v2 interaction hierarchy

### Persistent HUD
Keep only:
- portfolio value;
- current Era/day;
- broad market mood;
- alerts/profile;
- 3–4 core navigation destinations.

### Market canvas
Show:
- sector regions;
- company/coin nodes;
- direction/magnitude with shape, motion, and text, not color alone;
- one or two current market stories visually attached to the affected companies;
- subtle ambient motion so the market feels alive but not frantic.

### On selection
Clicking NOVA should produce a focused side/bottom sheet containing:
- identity;
- price + relevant time change;
- one simple explanation;
- friendly chart;
- recent story;
- Buy / Sell;
- deeper research as progressive disclosure.

The main canvas remains visible behind it.

### Career goal
Do not dedicate a giant card to it. Keep it as a compact edge element that can expand when selected.

## Visual direction reset

Drop or heavily reduce:
- giant pastel cards;
- dashboard-grid symmetry;
- editorial/news-site headline layout;
- excessive rounded rectangles;
- every region having its own background container.

Keep:
- bright approachable colors;
- soft geometry;
- excellent whitespace;
- readable typography;
- playful company branding;
- illustrated events;
- plain-language explanations.

Add:
- a dominant visual play field;
- recognizable company shapes/logos;
- sector regions with distinct visual character;
- subtle ambient animation;
- selected-state depth and focus;
- a compact HUD rather than page navigation chrome.

## Anti-gimmick constraint

Do not turn the market map into a second game that requires pathfinding, city construction, or constant clicking. It is primarily a **visual and navigational representation of the simulated economy**. The actual gameplay remains research, investing, reacting, progressing, and eventually influencing companies.

## v2 mockup goal

The next mockup should answer one question:

> If someone saw the screen for three seconds with no explanation, would they assume this is a game with a living market, or a finance website?

If the answer is not clearly “game,” it needs another pass.