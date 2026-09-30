# Slimmer Wonen

**Opmeten, materialen berekenen en een nette inkooplijst voor badkamerrenovaties** — voor aannemers en klussers.

🔗 Live demo: https://mariusvanderkolk-arch.github.io/slimmer-wonen/

![Slimmer Wonen](public/logo.png)

## Wat kan de app?

1. **Nieuw project** — naam, klant, adres, type ruimte (badkamer) en een checklist met werkzaamheden
   (sloopwerk, egaliseren, waterdicht maken, vloerverwarming, wand- en vloertegels, inloopdouche, hangtoilet,
   wastafelmeubel, kitwerk, stucwerk).
2. **Opmeten** — foto's maken met de camera van je telefoon of uploaden (bewaard bij het project), maten invoeren
   (lengte, breedte, hoogte, tegelhoogte, deuren en ramen, douchezone), tegelformaat en snijverlies. Een schematische
   plattegrond tekent live mee.
3. **Berekening** — wand- en vloeroppervlak (minus openingen) en alle materialen met onderbouwing: tegels (m² en dozen),
   tegellijm, voegmiddel, primer, waterdichting en afdichtband, egaliseermiddel, kit, tegelprofielen, vloerverwarming,
   stucwerk en sanitair.
4. **Inkooplijst** — gegroepeerd, af te vinken, met richtprijs per artikel, de goedkoopste winkel per artikel en het
   totaal per winkel (Gamma, Praxis, Hornbach, Karwei). Kopiëren en delen.
5. **Offerte** — een nette, printvriendelijke raming (materialen + optioneel arbeid) die je via de browser als PDF bewaart.
6. **Prijzen beheren** (`#/prijzen`, via de header, de Over-pagina en de prijsmelding op de inkooplijst) — onderhoud zelf
   de prijzen per artikel en per winkel: prijs incl. btw, verpakking/inhoud (bijv. zak à 20 kg), productnaam, link en
   'niet leverbaar'. Met zoeken, filters (eigen / voorbeeld / niet leverbaar), 'laatst bijgewerkt' per prijs,
   export/import als JSON of CSV en 'Terug naar voorbeeldprijzen'.

Projecten worden lokaal in de browser opgeslagen (localStorage; foto's in IndexedDB). Er gaat niets naar een server.
De app is een installeerbare PWA.

## Wat is (nog) voorbeeld?

- **Standaard zijn prijzen voorbeeldprijzen.** Er zijn géén live winkelprijzen gekoppeld. De tabel in
  [`src/lib/prices.ts`](src/lib/prices.ts) is alleen bedoeld om de werking te tonen. Zodra je via *Prijzen beheren*
  eigen prijzen invult, gaan die vóór; de melding op de inkooplijst en in de offerte laat zien hoeveel prijzen nog
  voorbeeld zijn, of 'Eigen prijzen, bijgewerkt op …' als alles eigen is.
- **Automatisch opmeten / foto-analyse komt binnenkort.** Foto's worden bewaard als referentie; de berekening gebruikt
  de handmatig ingevoerde maten.
- **Arbeidsuren** in de offerte zijn een indicatieve schatting op basis van eenvoudige normen.

## Rekenregels

Alle formules staan in [`src/lib/calc.ts`](src/lib/calc.ts) (object `REGELS`) en zijn getest in `calc.test.ts`:

| Onderdeel | Vuistregel |
| --- | --- |
| Tegels | netto m² × (1 + snijverlies), afgerond op hele dozen |
| Tegellijm | 3,5 kg/m² (≤ 30 cm) · 4,5 kg/m² (≤ 60 cm) · 5,5 kg/m² (groter), zak 25 kg |
| Voegmiddel | (A + B) / (A × B) × voegbreedte × tegeldikte × 1,6 kg/m² + 10% |
| Primer | 0,15 L/m², bus 5 L |
| Waterdichting | 1,4 kg/m² (2 lagen) op vloer + douchewanden tot 2,10 m, emmer 7 kg |
| Egaliseren | 1,6 kg per m² per mm, zak 25 kg |
| Kit | ± 8 m voeg per koker van 310 ml |
| Vloerverwarming | mat op ca. 70% van de vloer |

## Eigen prijzen

Eigen prijzen worden per apparaat in `localStorage` bewaard (sleutel `slimmer-wonen:prijzen:v1`). Gebruik
*Exporteren* (JSON of CSV) om een back-up te maken of ze naar een ander apparaat te verhuizen, en *Importeren* om
ze terug te zetten (ingelezen prijzen winnen van wat er al stond). Het CSV-bestand (`;`, decimale komma) opent
direct in Excel; je kunt het daar ook invullen en weer importeren.

Techniek: de prijslaag werkt via een `PrijsBron`-interface in [`src/lib/prices.ts`](src/lib/prices.ts):

```ts
export interface PrijsBron {
  id: string
  naam: string
  isVoorbeeld: boolean
  peildatum: string
  aanbiedingen(product: ProductId): PrijsAanbod[] // { winkel, prijs, bron, inhoud?, productNaam?, link?, bijgewerkt? }
}
```

`metEigenPrijzen(voorbeeldPrijsBron, eigen)` in [`src/lib/eigenPrijzen.ts`](src/lib/eigenPrijzen.ts) legt de eigen
prijzen over de voorbeeldbron heen (eigen prijs wint, 'niet leverbaar' haalt de winkel weg, een afwijkende inhoud
per verpakking rekent het aantal verpakkingen om). `usePrijsBron()` uit `src/lib/prijsStore.ts` levert de actieve
bron aan inkooplijst, winkeltotalen, goedkoopste winkel en offerte. Wil je later een echte feed/API koppelen, maak
dan een eigen `PrijsBron` en gebruik die als basis in plaats van `voorbeeldPrijsBron`.

## Ontwikkelen

```bash
npm install
npm run dev      # lokale ontwikkelserver
npm test         # unit tests (vitest)
npm run build    # productiebuild in dist/
npm run icons    # PWA-iconen opnieuw genereren uit public/logo-mark.svg
```

Stack: Vite, React, TypeScript, Tailwind CSS. Publicatie via GitHub Actions naar GitHub Pages.
