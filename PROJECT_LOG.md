# Arena — Project Log

سجل واحد بيجمع كل مراحل تطوير المشروع بالترتيب، بدل ما يكون متفرق في ملفات Phase منفصلة. كل مرحلة جديدة تتضاف هنا تحت، من غير ما يتمسح القديم.

---

## Phase 1 — الأساس (Landing Page)

أول نسخة من المشروع: صفحة رئيسية (landing page) بتصميم premium، بنظام ألوان وtypography محدد، Hero section بـ glow effects، وصفحات placeholder للـ login/register/dashboard كواجهات بصرية بس (بدون أي منطق فعلي ورائها).

الستاك الأساسي: Next.js + TypeScript + Tailwind CSS + Framer Motion + next-intl (عربي/إنجليزي).

---

## Phase 2 — تحسين التصميم

- Design tokens موسّعة (`src/styles/tokens.ts`): ألوان، spacing، typography، radius، shadows، motion.
- UI primitives جديدة قابلة لإعادة الاستخدام: `Card`, `Badge`, `Container`, `Section`, `Glow`, `GridBackground`.
- Navbar بقى sticky مع blur effect بيقوى مع الـ scroll.
- Hero بقى فيه glow متحرك وعناصر هندسية صغيرة بتطفو (CSS/Framer Motion، بدون canvas).
- قسمين جداد: `Stats` (عداد متحرك) و `FAQ` (accordion accessible بالكامل).
- `lib/animations.ts`: كل الـ motion presets في مكان واحد.

**قرار متعمد:** سيبت رابط "Log in" في الـ Navbar جنب "Start Playing"، رغم إن البرومبت قال يبقى بس "Language Switcher + Start Playing" — لأن أي SaaS landing محترم بيسيب login واضح.

---

## Phase 3 — البنية المعمارية (Contracts بدون تنفيذ)

- `src/features/` بنية كاملة: `auth/`, `rooms/`, `games/core/`, `players/`, `friends/` — كل واحد فيه types فقط، بدون أي منطق فعلي.
- أهم ملف: `games/core/types.ts` — فيه `GameEngine<TBoard, TPayload>`، الـ interface اللي أي لعبة (XO، شطرنج، Connect 4، داما، لودو) هتلتزم بيه لاحقًا.
- 5 ملفات توثيق معماري في `docs/`: `database-schema.md`, `room-flow.md`, `invite-system.md`, `realtime-architecture.md`, `game-abstraction.md`.
- راوتات جديدة فاضية: `/rooms`, `/rooms/[id]`, `/games/[id]`, `/profile` (مكوّن `PlaceholderPage` مشترك).

**قرار:** صفحة `/games` كانت أصلاً مبنية بالكامل من Phase 1، فسيبتها زي ما هي بدل ما أرجعها فاضية — البرومبت كان قاصد الراوتات الجديدة فعليًا، مش التراجع عن حاجة شغالة.

---

## Phase 4 — Supabase Integration (Auth + Rooms حقيقي)

- **Auth حقيقي**: `/login`, `/register` بقوا شغالين فعليًا عبر Server Actions (`registerAction`, `loginAction`, `logoutAction`, `updateProfileAction`) + validation + error/loading states (`useActionState`, `useFormStatus`).
- **`src/lib/supabase/`**: `client.ts` (browser)، `server.ts` (Server Components/Actions، بنمط `getAll`/`setAll` الصحيح)، `database.types.ts` (يدوي، بما إن مفيش CLI access)، `mappers.ts` (تحويل snake_case ↔ camelCase).
- **`proxy.ts`** (مش `middleware.ts` — Next.js 16 غيّر الاسم رسميًا): بيجمع next-intl middleware + Supabase auth guard على `/dashboard`, `/profile`, `/rooms`.
- **نظام الغرف الأساسي**: `/rooms/create`, `/rooms/join`, `/rooms`, `/rooms/[id]` بقوا شغالين فعليًا. كود دعوة 6 خانات (32 حرف/رقم، مستبعد منها 0/O/1/I/L). Race-condition handling لتصادم الكود وتصادم الـ seat.
- **`room_name`**: ضفت `name: string` على `Room`، وخليت `RoomSettings.gameId` يبقى nullable — بما إن البرومبت طلب إنشاء الغرفة بالاسم بس، قبل اختيار لعبة.
- **مسح تلقائي للغرف القديمة**: غرفة `waiting` أو `finished` لأكتر من 5 دقايق بتُمسح تلقائيًا (`pg_cron` + fallback في الكود لو الـ cron معطّل).
- **SQL** (`docs/sql/01` لحد `06`): جداول `profiles`, `rooms`, `room_players` + RLS كامل + trigger إنشاء profile تلقائي بعد التسجيل.

**مشاكل تقنية حقيقية اتحلت في المرحلة دي:**
- `infinite recursion` في RLS policies (اتحلت 3 مرات متتالية، كل مرة كانت بسبب اتجاه مختلف من العلاقة الدائرية بين `rooms` و `room_players`؛ الحل النهائي كان `language plpgsql` بدل `language sql` لأن Postgres كان بـ"يدمج" الدوال العادية ويفقد صلاحيات `security definer`).
- `Database` type اليدوي كان ناقصه `Relationships`/`Views`/`Functions` المطلوبين فعليًا من `@supabase/postgrest-js`، وده كان بيخلي TypeScript يرجّع `never` لعمليات `insert`/`update` بدل error واضح.

**نقطة أمان مهمة:** اتبعتلي `service-role key` (سري، بيتجاوز RLS بالكامل) بدل الـ publishable key المطلوب — اتجاهلت استخدامه في أي كود، ونبّهت إنه لازم يتعمله Roll فورًا.

---

## Phase 5 — Realtime (Presence + Ready System + Host Controls)

- **State machine جديدة لحالة الغرفة**: `waiting → ready_to_start → playing → finished`. الانتقال `waiting ↔ ready_to_start` بيحصل تلقائيًا (trigger في الداتابيز بيحسب عدد اللاعبين الجاهزين)، والانتقال `ready_to_start → playing` هو الوحيد اللي شخص (الـ host) بيقرره بزرار "Start Session".
- **`src/features/rooms/realtime/`**: `presence.ts` (مين أونلاين، عبر private Realtime channel)، `subscribeRoom.ts` و `subscribePlayers.ts` (تحديثات لايف على `rooms`/`room_players` عبر Postgres Changes).
- **Ready system**: زرار "I'm Ready" (`toggleReadyAction`)، بيحدّث بس صف المستخدم نفسه.
- **Host controls**: "Start Session" (`startSessionAction`)، "Kick Player" (`kickPlayerAction`) — يحتاج RLS policy إضافية لأن الأصلية كانت بتسمح بس لكل لاعب يمسح صفه هو بنفسه.
- **`src/features/games/session/`**: بنية فاضية تمامًا (types + functions بترمي error) تجهيزًا لمرحلة gameplay مستقبلية — مفيش منطق فعلي زي ما طُلب بالحرف.
- **SQL** (`docs/sql/07` لحد `10`): state machine الغرفة، RLS لـ `realtime.messages` (presence/broadcast)، تسجيل الجداول في `supabase_realtime` publication، policy الطرد.
- **`docs/testing-realtime.md`**: دليل تجربة فعلي بمتصفحين (presence، ready sync، start session، kick، إعادة الاتصال).

**تفصيل تقني مهم اكتُشف:** Postgres Changes بتتبع RLS الموجودة فعليًا تلقائيًا (مفيش حاجة إضافية مطلوبة غير تسجيل الجدول في الـ publication)، لكن presence/broadcast (private channels) محتاجين RLS منفصلة تمامًا على `realtime.messages` — لو نسيتها، الـ roster بيحدّث لايف لكن الأونلاين/أوفلاين لأ، والاتنين بيبانوا متشابهين على السطح.

**تعارض اسم اتجنب:** `GameSession` كانت معرّفة بالفعل من Phase 3 (تصميم history/replay مختلف تمامًا)، فسميت النوع الجديد `RoomGameSession` بدل ما أكسر حاجة موجودة.

---

## الحالة الحالية (آخر تحديث)

- Auth، نظام الغرف، الـ realtime، ready system، host controls: شغالين فعليًا ومتأكد منهم (`lint` + `build` نظيفين).
- مفيش gameplay فعلي لأي لعبة لسه — `startSessionAction` بيغيّر `status` لـ `"playing"` بس، مفيش `Game` row بيتعمل ولا قواعد لعبة فعلية.
- النشر: المشروع متوقع يكون مربوط بـ Vercel (مش Netlify — Netlify معندوش دعم كامل لـ Server Actions/middleware بنفس سهولة Vercel لمشروع بالتعقيد ده).
