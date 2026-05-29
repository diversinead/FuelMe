# Architecture primer — for a Java developer

A guide to understanding how this Next.js / React / TypeScript app hangs together, mapped onto Java/Spring concepts. Read this when something in the codebase doesn't make sense — you'll probably find the Java analogue here.

---

## The Java parallel, top down

Think of a typical Spring Boot web app: REST controllers + a service layer + JPA repositories + a templating engine. This app does the same jobs, with a different stack.

| Java world | This app (Next.js / React) | Job |
|---|---|---|
| Spring Boot app | **Next.js** | The framework that ties everything together |
| `@Controller` returning HTML | **Page components** (`page.tsx`) | Render a URL into a page |
| `@RestController` returning JSON | **Route Handlers** (`route.ts`) | API endpoints |
| Service layer | **`lib/*.ts` helpers** | Business logic, reusable |
| Spring Data JPA + Postgres | **Dexie + IndexedDB** | Database access |
| Thymeleaf / JSP templates | **JSX (React)** | HTML with embedded logic |
| Static CSS / Bootstrap | **Tailwind CSS** | Styling |
| Maven / Gradle | **npm** | Dependency manager + build tool |
| `pom.xml` / `build.gradle` | **`package.json`** | Lists dependencies |

The project structure feels familiar in shape even if the syntax is alien.

---

## TypeScript ≈ Java with a different syntax

TypeScript is JavaScript with types bolted on. If you can read Java, you can read TypeScript.

```ts
interface Profile {       // like a Java record or POJO
  name: string;
  age: number;
  weightKg: number;
  goal: 'performance' | 'maintenance';  // an enum, but inline
}

function generatePlan(profile: Profile): FuellingPlan {
  // ...
}
```

Key differences from Java:

- No classes required for data shapes — `interface` is enough
- Types are *structural* not *nominal* — if two objects have the same shape, they're compatible. No `implements` clauses needed.
- Types are erased at runtime (like Java generics) — they exist only to catch mistakes during development
- `string | number` means "either string or number" — Java has no direct equivalent, you'd use `Object` and cast
- Optional fields marked with `?`: `name?: string` means the field may or may not be present

**File extensions:**
- `.ts` — TypeScript file (with types)
- `.tsx` — TypeScript + JSX (can contain React components)

---

## React ≈ Server-side templating, but in the browser

In Java you might write a JSP that renders HTML on the server, then ships it to the browser. React does the same job but the *components* run in the browser, and re-render themselves when data changes.

A React component is just a function that returns HTML-like markup:

```tsx
function ProfileCard({ name, age }: { name: string; age: number }) {
  return (
    <div className="card">
      <h2>{name}</h2>
      <p>Age: {age}</p>
    </div>
  );
}
```

That `<div className="card">` is **JSX** — looks like HTML but it's actually JavaScript that gets compiled into function calls. `className` instead of `class` because `class` is a reserved word in JavaScript.

Curly braces `{name}` embed variables. Like `${name}` in a Thymeleaf template.

**State** in React is the equivalent of instance variables on a controller, but they trigger re-renders when changed:

```tsx
const [count, setCount] = useState(0);  // declare state
setCount(count + 1);                     // change state → component re-renders
```

This is the bit Java devs find weirdest at first. Just remember: **change state → React redraws the affected parts of the page automatically.** You never manually update the DOM.

---

## Next.js ≈ Spring Boot for React

React on its own is just a UI library. Next.js wraps React with the conventions you'd expect from a web framework:

- **File-based routing** — your folder structure *is* your URL structure. `app/dashboard/page.tsx` → URL `/dashboard`. No `@RequestMapping` annotations.
- **API routes** — files named `route.ts` become REST endpoints. `app/api/plan/route.ts` → `POST /api/plan`. Like a `@RestController` but tied to its file location.
- **Server-side rendering** — Next.js can render React components on the server (faster first paint), then "hydrate" them in the browser to become interactive.
- **Dev server** — `npm run dev` starts a server with hot reload. Edit a file, browser auto-updates. Like Spring Boot DevTools.

**The App Router convention** (what this project uses):

```
app/
├── layout.tsx          ← wraps every page (like a master template)
├── page.tsx            ← the root URL "/"
├── dashboard/
│   └── page.tsx        ← URL "/dashboard"
├── plan/
│   └── [weekId]/
│       └── page.tsx    ← URL "/plan/anything-here" — [weekId] is a parameter
└── api/
    └── plan/
        └── route.ts    ← POST/GET /api/plan endpoint
```

The square brackets in `[weekId]` work like a path parameter — equivalent to `@PathVariable` in Spring.

---

## The data layer — Dexie + IndexedDB

This is the most unusual piece coming from Java. **The "database" runs inside the user's browser.**

- **IndexedDB** is a NoSQL-ish key-value store built into every browser. Each domain (like `localhost:3000`) gets its own private storage, isolated from other sites.
- **Dexie** is a friendly wrapper around IndexedDB — it makes the API feel more like a normal database query.

Java parallel: imagine if every laptop running your Spring Boot app had its own embedded H2 database that lived inside the browser, with no server connection. That's IndexedDB.

```ts
// Like a JPA repository but lives in the browser
await db.profile.put({ id: 'me', name: 'Sam', age: 30, weightKg: 65 });
const me = await db.profile.get('me');
```

The `await` keyword means "wait for this async operation to finish" — like a Java `Future.get()` but cleaner. Pretty much every database or network call is async.

**Why local storage instead of a backend database?** For the early phases of this project, you don't need a backend, hosting costs, or auth. The data stays on the user's device. When you eventually want cloud sync, you'd add Supabase (a hosted Postgres) and the data model already maps cleanly across.

---

## The API routes — where OpenAI lives

The browser shouldn't call OpenAI directly because that would expose your API key to everyone. So you have a thin server-side layer:

```
[Browser/React] → POST /api/plan → [Next.js Route Handler] → OpenAI → response
                                          ↑
                              reads OPENAI_API_KEY env var
```

`app/api/plan/route.ts` is the equivalent of a Spring `@PostMapping("/api/plan")` method. It runs on the server (Vercel's serverless functions in production), reads your API key from environment variables, calls OpenAI, returns JSON to the browser.

The browser then takes that JSON and saves it to IndexedDB via Dexie. From then on, it's available offline.

---

## Tailwind ≈ Bootstrap, but utility-first

In Java/Spring world you'd write CSS in a separate `.css` file and reference class names. Tailwind flips this: you write the styling inline as class names on elements:

```tsx
// Instead of: <div class="card-large primary-bg">
<div className="rounded-lg bg-surface-1 p-6 shadow-card">
//              ↑           ↑              ↑   ↑
//              radius      background      padding  shadow
```

Each class is one CSS property. Feels weird at first ("isn't this what we said to never do?") but it scales surprisingly well because you stop writing custom CSS.

---

## The build pipeline

When you run `npm run dev`:

1. Next.js starts a local server on port 3000
2. It compiles TypeScript → JavaScript on the fly
3. It serves your React components, either pre-rendered on the server or as JavaScript bundles
4. It watches your files — save a `.tsx` file and the browser hot-reloads in milliseconds

When you eventually run `npm run build` for production:

1. Compiles everything ahead of time
2. Optimises images, bundles JS, splits code per route
3. Outputs a `.next/` folder that gets deployed to Vercel (or any Node host)

Closest Java equivalent: `mvn spring-boot:run` for dev, `mvn package` for production. Same idea.

---

## A request walkthrough — onboarding submit

To make it concrete, here's what happens when a user finishes onboarding. Annotated with Java equivalents:

**1. User clicks "Continue" on the training step**
- React's `onClick` handler fires (≈ Spring MVC form submit)

**2. The component gathers the data and saves locally:**
```ts
const trainingWeek = { weekStart: '2026-06-01', sessions: [...] };
await db.trainingWeeks.put(trainingWeek);
```
- `db.trainingWeeks.put` writes to IndexedDB (≈ `repository.save(entity)`)

**3. It calls the API route:**
```ts
const res = await fetch('/api/plan', {
  method: 'POST',
  body: JSON.stringify({ profile, foodPreferences, trainingWeek })
});
```
- This `fetch` is the browser making an HTTP call to its own server (≈ `RestTemplate.postForObject(...)`)

**4. The route handler runs on the server:**
```ts
export async function POST(req: Request) {
  const body = await req.json();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({ ... });
  return Response.json(completion);
}
```
- This is `app/api/plan/route.ts`. Effectively a `@RestController`'s `@PostMapping` method.

**5. The response comes back to the browser, gets saved to Dexie:**
```ts
const plan = await res.json();
await db.plans.put(plan);
```

**6. The router navigates to the plan page:**
```ts
router.push(`/plan/${plan.weekId}`);
```

**7. The plan page component loads**, reads the plan from Dexie, and renders the grid.

---

## What's confusing for Java devs (warnings)

A few things that catch Java people off guard:

**1. No `null`, use `undefined`.**
TypeScript distinguishes them but in practice you use `undefined` for "no value." Optional fields are marked `field?: type`.

**2. No mutable variables, mostly.**
React leans heavily on immutability — instead of `list.add(x)`, you write `setList([...list, x])` (create a new array). Feels wasteful but it's how React detects what to re-render.

**3. `async/await` is everywhere.**
Almost every Dexie call, every fetch, every OpenAI call is async. If you forget `await`, you get a `Promise` object instead of the data — a common bug.

**4. No type checking at runtime.**
TypeScript catches mistakes in your editor and during build. But once compiled to JavaScript, all the types vanish. If a JSON response doesn't match your TypeScript interface, nothing complains — you just get `undefined` errors later.

**5. `==` vs `===`.**
`===` is strict equality (no type coercion). Always use `===`. `==` does weird stuff like `0 == false` being true. Don't use `==`.

**6. Closures and scope.**
JavaScript closes over variables by reference, not value. This causes a class of bugs where you think you captured a value but actually captured a pointer to a variable that later changed. Less of an issue in modern React with `useState` but worth knowing.

**7. Single-threaded by default.**
No threads, no synchronization primitives. JavaScript runs in one thread with an event loop. Concurrency comes from async operations yielding control while waiting. If you're tempted to reach for a `synchronized` block — you don't need one.

---

## File-to-Java cheat sheet

When you open the project tomorrow, here's roughly where to look for what:

| Looking for... | File location |
|---|---|
| Domain model (POJOs / entities) | `lib/db.ts` (interfaces) |
| Repository / DAO | `lib/db.ts` (the Dexie instance) |
| REST controller | `app/api/*/route.ts` |
| Service layer | `lib/*.ts` (e.g. `lib/prompts.ts`, `lib/openai.ts`) |
| HTML templates | `app/*/page.tsx` and `components/**/*.tsx` |
| `application.properties` | `.env.local` (for secrets) and `next.config.js` (for app config) |
| `pom.xml` | `package.json` |
| Static resources | `public/` |
| Global styles | `app/globals.css` |
| Layout / master template | `app/layout.tsx` |

---

## Glossary of unfamiliar terms

**JSX** — JavaScript XML. The HTML-like syntax inside React components. Compiles to function calls.

**Hook** — A function starting with `use*` (e.g. `useState`, `useEffect`). Hooks let function components hold state and side effects. Roughly analogous to lifecycle methods on a Spring bean.

**Component** — A function that returns JSX. Reusable like a Java class but with no instances — just call it.

**Props** — Arguments passed to a React component. Like constructor arguments to a Java class.

**State** — Mutable data inside a component that triggers a re-render when changed.

**Hydration** — When server-rendered HTML "wakes up" in the browser and becomes interactive. The initial HTML is static; React attaches event handlers after.

**Promise** — JavaScript's equivalent of a Java `Future` or `CompletableFuture`. Represents a value that will exist later. Used with `await`.

**Async function** — A function declared with `async` keyword. It implicitly returns a `Promise`. You can use `await` inside it.

**Module** — A `.ts` or `.tsx` file. Each file is its own module. Use `export` to expose things, `import` to consume them. Like Java packages but per-file.

**npm package** — Equivalent to a Maven artifact. Lives in `node_modules/` (the equivalent of `~/.m2/repository`).

**Bundler** — A tool that combines many `.js` files into a smaller number of bundles for the browser to download. Next.js handles this automatically.

---

## When you're lost in the codebase

A quick decision tree:

- **"Where's the page that renders at URL X?"** → `app/X/page.tsx`
- **"Where's the API endpoint at /api/X?"** → `app/api/X/route.ts`
- **"Where's the data shape for Y?"** → `lib/db.ts`, search for `interface Y`
- **"Where's the styling for component Z?"** → Inside the component itself, on the `className` attribute (Tailwind utility classes)
- **"Where's the AI prompt for plan generation?"** → `lib/prompts.ts` (once Phase 3 is complete; until then, see SPEC.md Appendix A)
- **"How do I read/write data?"** → `lib/db.ts` exports a `db` object with tables. Use `db.tableName.put(x)`, `db.tableName.get(id)`, `db.tableName.toArray()`.

---

## Recommended exploration order

When you have an hour and want to actually understand the code rather than just modify it:

1. **`lib/db.ts`** — the data model. Read the interfaces, you'll understand the domain.
2. **`app/layout.tsx`** — the master template wrapping every page.
3. **`app/onboarding/page.tsx`** — see how a form-heavy page handles state, validation, and saving to Dexie.
4. **`app/api/plan/route.ts`** (once Phase 3 exists) — see how the OpenAI integration works.
5. **`app/plan/[weekId]/page.tsx`** — see how a page reads from Dexie, renders data, and handles inline editing.

By the end of those five files, ~80% of the project structure clicks into place. Everything else is variations on these patterns.
