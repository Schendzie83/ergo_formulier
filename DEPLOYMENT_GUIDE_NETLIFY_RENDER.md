# Handleiding: Livegang met GitHub, Netlify & Render

Deze handleiding legt stap voor stap uit hoe je je applicatie gratis & professioneel online zet.
We gebruiken:

1.  **GitHub**: Om je code op te slaan.
2.  **Netlify**: Om je **Frontend** (de website) te hosten.
3.  **Render**: Om je **Backend** (server & database) te hosten.

---

## Stap 1: Code op GitHub zetten

Als je dat nog niet hebt gedaan:

1.  Maak een account op [GitHub.com](https://github.com).
2.  Maak een nieuwe Repository (bijv. `ergo-form-app`).
3.  Upload je code (dit hele projectmapje) naar die repository.
    - _Tip:_ Zorg dat bestanden zoals `node_modules` en `.env` **niet** worden geüpload (gebruik een `.gitignore` bestand).

## Stap 2: Backend Deployen (Render)

Render gaat je server en database draaien.

1.  Maak een account op [Render.com](https://render.com).
2.  **Database aanmaken**:
    - Klik "New +" -> **PostgreSQL**.
    - Name: `ergo-db`.
    - Region: `Frankfurt` (dichtbij NL).
    - Plan: `Free`.
    - Wacht tot hij klaar is en kopieer de **Internal Database URL** (voor later gebruik in de backend service, als ze in hetzelfde netwerk zitten) of de **External Database URL**. _Tip: Bij Render services onderling werkt Internal het snelst, maar External werkt altijd._
3.  **Backend Web Service aanmaken**:
    - Klik "New +" -> **Web Service**.
    - Installeer GitHub app en kies je `ergo-form-app` repository.
    - Instellingen:
      - Name: `ergo-backend`.
      - Region: `Frankfurt`.
      - Branch: `main`.
      - **Root Directory**: `backend` (Belangrijk! We hebben hier een apart package.json voor gemaakt).
      - Runtime: `Node`.
      - Build Command: `npm install`.
      - Start Command: `node server.js`.
    - **Environment Variables** (voeg toe):
      - `DATABASE_URL`: Plak hier de connection string van je PostgreSQL database (uit stap 2).
      - `JWT_SECRET`: Verzin een sterk wachtwoord (bijv. `MijnGeheimeSleutel123!`).
    - Klik **Create Web Service**.
4.  Wacht tot de deploy klaar is. Je krijgt een URL (bijv. `https://ergo-backend.onrender.com`). **Kopieer deze.**

## Stap 3: Frontend Deployen (Netlify)

Netlify gaat je website tonen en praten met de Render backend.

1.  Maak een account op [Netlify.com](https://netlify.com).
2.  Klik "Add new site" -> "Import from existing project" -> "Deploy with GitHub".
3.  Kies je `ergo-form-app` repository.
4.  Instellingen:
    - **Base directory**: `frontend`.
    - **Build command**: `npm run build` (of `next build`).
    - **Publish directory**: `.next` (Next.js regelt dit vaak zelf via de Netlify plugin).
5.  **Environment Variables** (Klik op "Add environment variables"):
    - `NEXT_PUBLIC_API_URL`: Plak hier de URL van je Render backend (uit stap 3, bijv. `https://ergo-backend.onrender.com/api`). **Let op: Vergeet `/api` niet erachter te zetten als je frontend dat verwacht!** (Check je `lib/api.ts` bestand: staat daar `/api` in de base URL of in de calls? Meestal is de server URL `...onrender.com` en voegt axios `/api` toe, of axios base is `...onrender.com/api`. Controleer dit lokaal even: `http://localhost:3001/api` is je base nu waarschijnlijk).
6.  Klik **Deploy ergo-form-app**.

## Stap 4: Afronden

1.  Wacht tot Netlify klaar is. Je krijgt een URL (bijv. `https://ergo-form.netlify.app`).
2.  Ga naar die URL.
3.  Probeer in te loggen.
    - _Let op:_ Omdat je een **nieuwe database** hebt op Render, is deze leeg!
    - Je moet de admin user opnieuw aanmaken.
    - Omdat je nu geen toegang hebt tot de terminal van de server, kun je dit het beste doen door de `reset-password.js` script aan te passen zodat het een API endpoint wordt, OF (veiliger) lokaal verbinding maken met de externe database URL en het script draaien, OF in de "Shell" tab van Render Dashboard het commando `node reset-password.js` uitvoeren (als dat bestand in je backend repo zit).
    - **Makkelijkste manier op Render**:
      - Ga in Render naar je "Web Service".
      - Klik op "Shell" (of "Connect").
      - Typ: `node sync-db.js` (om tabellen te maken) en daarna `node reset-password.js` (om admin user te maken).

Veel succes! 🚀
