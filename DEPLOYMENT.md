# Handleiding voor Livegang (Deployment)

Om je applicatie "live" te zetten zodat anderen deze kunnen gebruiken, heb je twee hoofdonderdelen nodig: een plek voor je **Frontend** (de website die gebruikers zien) en een plek voor je **Backend** (de server die de data en logica afhandelt).

Hieronder beschrijf ik de meest gangbare en moderne methode: **Vercel** (voor frontend) en **Railway** (voor backend + database).

## Stap 1: Voorbereiding (Database)

Je gebruikt momenteel `SQLite`. Dit is een bestand (`database.sqlite`) op je computer. Op cloud-platforms werkt dit vaak niet goed omdat bestanden daar niet permanent worden bewaard.
**Advies:** Stap over naar **PostgreSQL** voor de productie-versie. Omdat je `Sequelize` gebruikt, is dit heel makkelijk!

1.  In je backend map: `npm install pg pg-hstore`
2.  In `backend/config/database.js` pas je de `development` (of maak een `production`) config aan om omgevingsvariabelen te gebruiken (zie stap 3).

## Stap 2: Frontend Deployen (Vercel)

Vercel is gemaakt door de makers van Next.js en is de beste plek voor je frontend.

1.  Maak een account op [Vercel.com](https://vercel.com).
2.  Installeer de Vercel CLI: `npm i -g vercel` of koppel je GitHub repository (aanbevolen).
3.  Als je via GitHub werkt:
    - Push je code naar GitHub.
    - Ga naar Vercel -> "Add New Project" -> Importeer je repo.
    - **Belangrijk:** Stel de `Environment Variables` in:
      - `NEXT_PUBLIC_API_URL`: De URL van je backend (die krijg je in stap 3, voor nu even leeg laten of placeholder).
4.  Klik op **Deploy**.

## Stap 3: Backend Deployen (Railway)

Railway is erg gebruiksvriendelijk voor Node.js en Databases.

1.  Maak een account op [Railway.app](https://railway.app).
2.  Kies "New Project" -> "Deploy from GitHub repo".
3.  Kies je repository.
4.  Ga naar de instellingen van je project in Railway en voeg een **Database** toe:
    - Klik "New" -> "Database" -> "PostgreSQL".
5.  Koppel deze database aan je backend service:
    - Railway doet dit vaak automatisch via variabelen als `DATABASE_URL`.
    - Pas je `backend/config/database.js` aan zodat hij deze `process.env.DATABASE_URL` gebruikt.
6.  Stel overige **Environment Variables** in bij je backend service in Railway:
    - `JWT_SECRET`: Verzin een sterk wachtwoord.
    - `PORT`: `0.0.0.0` of laat Railway dit beheren (standaard luistert hij vaak op de poort die je in je code hebt, of `PORT` env).
7.  Railway geeft je een publieke URL (bijv. `https://ergo-app-production.up.railway.app`).

## Stap 4: Koppelen

1.  Ga terug naar **Vercel** (Frontend).
2.  Update de `NEXT_PUBLIC_API_URL` variabele naar de URL die je van Railway hebt gekregen (bijv. `https://ergo-app-production.up.railway.app`).
3.  Redeploy je frontend op Vercel.

---

## Alternatief: Alles op één server (VPS)

Heb je een eigen server (bijv. van school)? Dan kun je de applicatie daarop draaien net zoals je nu lokaal doet.

1.  Zet de bestanden op de server.
2.  Installeer Node.js.
3.  Backend: `cd backend` -> `npm install` -> `node server.js` (gebruik een tool als `pm2` om hem te laten draaien).
4.  Frontend: `cd frontend` -> `npm install` -> `npm run build` -> `npm start`.
5.  Gebruik **Nginx** om de poorten (3000 en 3001) bereikbaar te maken via 1 domeinnaam.

---

**Hulp nodig?**
Het overzetten van SQLite naar PostgreSQL is de meest technische stap. Als je wilt, kan ik de configuratiebestanden voor je aanpassen zodat ze klaar zijn voor Railway (PostgreSQL). Zeg dan: "Maak de backend klaar voor PostgreSQL".
