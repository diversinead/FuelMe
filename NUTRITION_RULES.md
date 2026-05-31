# Nutrition Rules

**This document is the source of truth for all sports nutrition logic used by the Fuel app. The AI prompts in `lib/prompts.ts` are derived from these rules. Edit this file to update the app's expertise.**

When this file changes, ask Claude Code: *"Read NUTRITION_RULES.md and update `lib/prompts.ts` to reflect any changes."*

---

## How this document is structured

1. **Core principles** — apply to all athletes, all sports
2. **Carbohydrate periodisation** — the core fuelling logic, scaled by training demand
3. **Protein strategy** — daily totals, distribution, timing
4. **Hydration & electrolytes**
5. **Pre/intra/post-session fuelling** — timing rules around workouts
6. **Sport-specific overlays** — running, cycling, triathlon, swimming, strength
7. **Female athlete considerations** — cycle phases, LEA, iron, bone health
8. **Dietary patterns** — vegetarian, vegan, gluten-free, dairy-free, IBS-friendly
9. **Race-day protocols** — carb loading, race morning, during-race fuelling
10. **Special situations** — illness, travel, heat, altitude, tapering
11. **Hard constraints** — things the AI must never do

---

## 1. Core principles

These apply universally. Override them only with explicit user constraints.

1. **Eat for the work.** Carbohydrate intake scales with training demand. Easy days are not low-carb days; they are slightly lower than hard days. Periodisation happens across the week, not across years.
2. **Food first, supplements last.** Whole foods provide micronutrients, fibre, and satiety that powders don't. Recommend supplements (gels, drinks, bars) only when whole food is impractical — during sessions, immediately post-session, or for athletes who genuinely can't eat enough volume.
3. **Recovery starts within 30 minutes of finishing a hard or long session.** Glycogen replenishment is fastest in this window. Miss it and you compromise the next session.
4. **Sleep and digestion matter.** Recommend dinners that are not so heavy they impair sleep, but contain enough protein and carbs for overnight recovery. Avoid recommending high-fibre or high-fat meals within 2 hours of bed.
5. **Consistency beats variety.** Repeating foods that work is better than chasing variety and getting it wrong. Recommend the same breakfast 4-5 times a week if it works.
6. **Under-fuelling is the bigger risk than over-fuelling for most endurance athletes.** Default to the higher end of carbohydrate recommendations when in doubt, especially for women, masters athletes, and anyone with a stated history of fatigue, recurrent illness, or poor recovery.
7. **No moralising about food.** Pizza, chocolate, ice cream, alcohol — all fine in context. A plan that prohibits enjoyment fails within two weeks.

---

## 2. Carbohydrate periodisation

This is the most important calculation in the entire app. The AI must apply these targets precisely. Plans that don't differentiate between day types have failed at the most basic level of sports nutrition.

### Step 1 — Classify each day

For each day in a 7-day plan, classify by the primary session. If the day has two sessions, use the harder of the two:

- **REST** — no session
- **EASY** — single session under 60 min at low intensity (recovery jog, easy spin)
- **MODERATE** — 60-90 min including tempo, threshold, or interval work
- **HARD** — intervals, threshold, or hard tempo of any duration under 90 min
- **LONG** — any session 90 min or longer, regardless of intensity
- **DOUBLE** — two sessions in one day, OR any single session 2.5+ hours
- **RACE** — race day

### Step 2 — Apply the carb prescription

For athlete bodyweight `W` kg, daily carbs in grams = `W × multiplier`:

| Day type | Multiplier (g/kg) | 55 kg | 65 kg | 75 kg |
|---|---|---|---|---|
| REST | 3-5 | 165-275 g | 195-325 g | 225-375 g |
| EASY | 5-7 | 275-385 g | 325-455 g | 375-525 g |
| MODERATE | 6-8 | 330-440 g | 390-520 g | 450-600 g |
| HARD | 7-9 | 385-495 g | 455-585 g | 525-675 g |
| LONG | 8-10 | 440-550 g | 520-650 g | 600-750 g |
| DOUBLE | 9-11 | 495-605 g | 585-715 g | 675-825 g |
| RACE | 10-12 | 550-660 g | 650-780 g | 750-900 g |

**Always provide a range** (e.g. "390-450g") rather than a single number — gives the athlete flexibility and acknowledges measurement imprecision.

### Step 3 — Apply the preload rule

If tomorrow is LONG, HARD, or RACE: add `(W × 1)` to `(W × 2)` grams of extra carbs to today's dinner. Reduce fibre and fat in that dinner.

- Saturday dinner before Sunday long run → larger rice/pasta portion, lower-fibre vegetables (zucchini, carrots over broccoli/kale), no large salads
- Avoid new foods or high-fat meals (curries, fried food) the night before a long effort

### Step 4 — Apply the minimum-variance rule (CRITICAL)

**The highest-carb day in any typical training week MUST be at least `W × 3` grams above the lowest-carb day.**

For a 65 kg athlete, that means at least 195 g difference between the rest day and the long-run day. A plan where Monday-rest is 280 g and Saturday-long-run is 290 g has FAILED to periodise and must be recalculated.

This rule exists because LLMs default to averaging when given ranges. The minimum variance rule forces meaningful differentiation across the week.

### Step 5 — Distribute carbs within each day

Don't recommend hitting the daily carb target in one or two meals. Distribute across:

- Breakfast: 20-25% of daily carbs
- Post-AM session refuel (only on days with morning sessions): 10-15%
- Lunch: 20-25%
- Afternoon snack: 10-15%
- Dinner: 25-30%
- Optional pre-bed snack: 5-10% (only if needed)

### Step 6 — Verify before returning the plan

Before finalising, the AI must check:

1. **Day classification correct?** Each day mapped to REST / EASY / MODERATE / HARD / LONG / DOUBLE / RACE based on its session.
2. **Daily totals within prescribed ranges?** Each day's total carbs falls inside the range for its classification.
3. **Minimum variance met?** Highest-carb day minus lowest-carb day ≥ `W × 3` grams.
4. **Preload applied?** Days before LONG/DOUBLE/RACE have extra dinner carbs and reduced fibre/fat.
5. **Within-day distribution sensible?** No single meal contains > 35% of daily carbs.
6. **Post-session refuel meets targets?** See Section 5 — within 30 min of HARD or LONG sessions.

If any check fails, recalculate. Do not return a plan that fails verification.

---

## 3. Protein strategy

### Daily protein prescription

For athlete bodyweight `W` kg, daily protein in grams = `W × multiplier`:

| Athlete profile | Multiplier (g/kg) | 55 kg | 65 kg | 75 kg |
|---|---|---|---|---|
| Endurance, maintenance | 1.6-1.8 | 88-99 g | 104-117 g | 120-135 g |
| Endurance + muscle building OR in calorie deficit | 1.8-2.2 | 99-121 g | 117-143 g | 135-165 g |
| Strength or combined endurance + strength | 1.8-2.4 | 99-132 g | 117-156 g | 135-180 g |
| Vegan (digestibility adjustment) | 1.8-2.2 | 99-121 g | 117-143 g | 135-165 g |

**Add to base multiplier:**
- Masters athlete (40+): `+ 0.1 to + 0.2` g/kg — older athletes are less efficient at protein synthesis
- Female athlete in confirmed luteal phase: `+ 0.1 to + 0.2` g/kg — protein turnover is elevated

### Per-meal protein dosing

Aim for `W × 0.3` to `W × 0.4` grams per meal, distributed across **4-5 meals daily**.

For a 65 kg athlete: ~20-25 g per meal, 4-5 times a day.

Hitting daily total with two big meals (e.g. 60g lunch, 0g dinner) is suboptimal — muscle protein synthesis caps around 0.4 g/kg per meal. The body cannot use a 60 g protein dose as efficiently as two 30 g doses.

### Post-session protein

Within 30 min of HARD or LONG session:
- Protein: `W × 0.3` fast-digesting (whey, milk, Greek yoghurt, eggs, Up&Go/Rokeby-style protein drinks)
- For 65 kg athlete: ~20 g

### Pre-bed protein

For athletes in heavy training blocks or building muscle: `W × 0.3` to `W × 0.4` slow-digesting protein within 60 min of bed supports overnight recovery. Best sources: Greek yoghurt (casein-rich), cottage cheese, casein powder.

For athletes not in heavy training, this is optional. Don't force it.

### Protein quality

Recommend complete protein sources at each meal (animal protein, dairy, eggs, soy, or carefully combined plant proteins). For plant-only athletes see Vegan section.

### Verification step for protein

Before finalising the plan:
1. Does each day's total protein fall within `W × 1.6` to `W × 2.4` depending on athlete profile?
2. Is protein distributed across at least 4 meals, with each meal in the `W × 0.3` to `W × 0.4` range?
3. Is post-session protein delivered within 30 min after HARD or LONG sessions?

Note: protein totals should stay **relatively stable across days** (within ~10-15% variance day-to-day). Protein is NOT periodised the way carbs are. Don't drop protein on rest days.

---

## 4. Hydration & electrolytes

### Baseline daily hydration

`30-40 ml/kg bodyweight` per day. For 65 kg athlete that's ~2-2.6 L per day **before training**.

### Around training

- Add **500-750 ml per hour of training** depending on heat and sweat rate
- Sessions over 60 min, or in heat → include electrolytes (sodium 300-700 mg/L sweat lost; commercial sports drinks or DIY salt + carb mix)
- Sessions under 60 min in cool conditions → water is fine

### Sweat-heavy athletes

Salt cravings, white salt rings on clothing, or muscle cramping in training → recommend a higher electrolyte intake (LMNT, Precision Hydration, or 1/4 tsp salt in water with a pinch of potassium).

---

## 5. Pre / intra / post-session fuelling

### Pre-session (the meal before)

- **3-4 hours before:** full meal, 1-4 g/kg carbs, moderate protein, low-moderate fat, low fibre
- **1-2 hours before:** smaller meal/snack, 1-2 g/kg carbs, low fat, low fibre
- **0-30 min before:** only if needed — 30-60 g fast-acting carbs (banana, white toast with honey, sports drink). Avoid the "insulin dip zone" of 30-60 min pre-session when blood sugar can crash mid-warmup.

### During session

| Session duration | Carbs per hour | Sources |
|---|---|---|
| < 60 min | None needed | Water |
| 60-90 min | 30-60 g/hr | Sports drink, banana, gel |
| 90 min - 2.5 hr | 60-90 g/hr | Mix glucose + fructose (gels with both, real food + drink) |
| 2.5+ hr | 90-120 g/hr (gut-trained) | Same — and practice this in training, not race day |

### Post-session (the 30-minute window)

**Only matters after hard or long sessions, not after easy 45-minute jogs.**

Within 30 min of finishing:
- **1.0-1.2 g/kg carbs** (fast-digesting — rice, white bread, banana, sports drink)
- **0.3 g/kg protein** (~20-25 g for most athletes)
- 500-750 ml fluid

Then a full balanced meal within 2 hours.

### Two-a-day sessions

Between sessions: refuel within 30 min of finishing AM, full meal within 90 min, second refuel just before PM session. Treat the gap as one extended recovery window.

---

## 6. Sport-specific overlays

The AI applies the appropriate overlay based on the athlete's primary sport. If they do multiple sports, layer them.

### Running

- **Higher impact** than cycling — gut tolerance for fuelling during runs is lower. Default to liquid carbs over solids during runs > 60 min.
- **Long runs** typically deplete glycogen faster per minute than cycling. Apply the long-run multiplier (8-10 g/kg) even at 90 min rather than 2 hours.
- **Recovery** is harder than for cyclists — eccentric muscle damage extends recovery window. Protein post-run is non-negotiable for any session > 45 min hard.
- **Marathon training blocks**: increase total daily carbs by 10-15% during peak weeks. Iron intake matters — see Iron section.

### Cycling

- **Better gut tolerance** during sessions than running. Solid food (rice cakes, bars, bananas with nut butter) works on the bike.
- **Higher absolute calorie burn** per hour at the same RPE — cyclists often need more total daily food than runners of the same weight.
- **Long rides (3+ hours)** require 90-120 g carbs/hour and explicit drink-mix recommendations. Plain water on long rides is a recipe for bonking.
- **Indoor trainer sessions**: sweat rate is 2-3x higher than outdoor at the same effort due to no air cooling. Triple electrolyte intake.

### Triathlon

- **Brick training days** (bike + run) — apply long-day or two-a-day rules even if total duration is modest.
- **Race week**: practice race-day fuelling (gels, drinks) in the final long brick — don't experiment on race day.
- **Multi-discipline weeks** mean higher total volume — bias toward the higher end of carb ranges.
- Consider both **swim** (early morning, often pre-breakfast) and **bike/run** demands when planning breakfast and pre-workout fuelling.

### Swimming

- **Cold water** increases appetite — don't be surprised by larger meals after pool sessions.
- **Chlorine exposure + early starts** → many swimmers struggle to eat pre-workout. Default to a small carb-only snack 30 min before (banana, toast, honey) rather than full breakfast.
- **Glycogen demand** is similar to running per minute of work — apply the same daily carb targets.

### Strength training / combined

- **Higher protein target** (1.8-2.4 g/kg) — see Protein section.
- **Carbohydrates still matter**: lifters who go low-carb compromise both performance and recovery.
- **Pre-workout meal** 1-2 hours out with moderate carbs + protein.
- **Post-workout window** less time-critical than for endurance (24-hour anabolic window applies), but eating within 1-2 hours is still ideal.
- For athletes combining strength + endurance, schedule sessions to avoid interference — ideally strength after endurance on the same day, or 6+ hours apart.

---

## 7. Female athlete considerations

**Apply these rules when the athlete's profile has gender = 'female' AND cycleTracking = true. When cycleTracking is false but gender = 'female', still apply the iron, LEA, and bone health rules.**

### Menstrual cycle phases

#### Follicular phase (day 1 of period through ovulation, ~days 1-14)
- Higher insulin sensitivity → carbs are utilised more efficiently
- Often easier to access fat as fuel during low-intensity work
- Standard carb periodisation applies. Some women feel they can push higher-intensity work here.

#### Luteal phase (ovulation through day before next period, ~days 15-28)
- **Increase daily carbs by 5-10%** — basal metabolic rate is elevated, glycogen storage is less efficient
- **Increase protein by 0.1-0.2 g/kg/day** — protein breakdown is elevated
- **Higher carbohydrate needs during sessions** — recommend in-session fuelling at lower thresholds (e.g. 30 g/hr from 45 min instead of 60 min)
- **Sleep often disrupted** — emphasise pre-bed casein/Greek yoghurt + magnesium-rich foods (leafy greens, nuts, dark chocolate)
- **PMS support**: complex carbs, omega-3 sources (fatty fish, walnuts, flax), avoid heavy alcohol

#### Menstruation (days 1-5 of period)
- **Iron focus**: heavier flow = more iron loss. Include red meat, lentils, dark leafy greens, fortified cereals. Pair with vitamin C to enhance absorption.
- **Avoid restriction** — many women under-fuel during their period due to bloating discomfort. This worsens recovery and prolongs cycle dysfunction.
- **Anti-inflammatory foods** can help: berries, fatty fish, turmeric, ginger

### Low Energy Availability (LEA) / RED-S risk

LEA is the most under-recognised threat to female endurance athlete health. Watch for and prevent it.

**Definition**: Energy availability = (energy intake – exercise energy expenditure) / fat-free mass. Below **30 kcal/kg FFM/day** is the clinical threshold for LEA.

**Signs to watch for in user check-ins** (and flag in AI feedback):
- Missed periods or irregular cycles
- Recurrent illness or injury
- Low energy or chronic fatigue
- Hair loss, brittle nails, feeling cold
- Mood disturbance, low libido

**Rule**: Never recommend a plan whose total daily energy intake falls below 30 kcal/kg FFM for any female athlete. When in doubt, default to higher carb intake.

### Iron

Female endurance athletes are at high risk of iron deficiency (foot strike haemolysis in runners, menstrual loss, low intake).

- Recommend **iron-rich foods 2-3 times per week**: red meat, liver, oysters, lentils, fortified cereals, dark leafy greens, pumpkin seeds
- **Pair plant iron with vitamin C** (citrus, capsicum, tomato) to enhance non-heme iron absorption
- **Avoid coffee/tea within 1 hour of iron-rich meals** — tannins inhibit absorption
- If an athlete reports symptoms of low iron (fatigue, breathlessness, restless legs, pica) flag it in feedback and recommend a blood test

### Bone health

Especially relevant for runners and any athlete with history of LEA.

- **Calcium**: 1000-1300 mg/day. Sources: dairy, fortified plant milks, sardines, tofu, kale, broccoli.
- **Vitamin D**: 600-1000 IU/day. Sources: fatty fish, fortified foods, sunlight. Supplement in winter at higher latitudes.
- **Vitamin K2**: helps direct calcium to bones. Sources: natto, hard cheeses, egg yolks.

---

## 8. Dietary patterns

The AI must respect dietary patterns specified in the user's `dietaryNotes` field. Common patterns:

### Vegetarian (dairy + eggs allowed)

- Protein adequacy is easy. Sources: Greek yoghurt, eggs, cottage cheese, tofu, tempeh, legumes, quinoa.
- Watch B12 and iron — recommend B12-fortified foods or supplements.
- Combine plant proteins across the day for complete amino acid profile (legumes + grains is the classic pairing).

### Vegan (no animal products)

- Protein target increases to **1.8-2.2 g/kg/day** — plant protein has lower digestibility (~80% vs 95% for animal).
- Essential sources: tofu, tempeh, edamame, lentils, chickpeas, black beans, quinoa, vegan protein powder (pea or soy isolate).
- **B12 supplementation is required** — non-negotiable. Plant foods do not contain reliable B12.
- **Iron**: pair non-heme iron with vitamin C, avoid tea/coffee with meals.
- **Omega-3**: ALA from flax, chia, walnuts; consider algae-based DHA supplement.
- **Creatine** supplementation can be valuable (vegans naturally have lower stores).
- **Zinc and iodine** require attention — recommend iodised salt or sea vegetables.

### Gluten-free (coeliac or sensitivity)

- Carb sources: rice, oats (certified GF), potatoes, sweet potatoes, quinoa, buckwheat, GF pasta, GF bread, polenta, corn tortillas.
- Avoid: wheat, barley, rye, most commercial sports drinks/gels (check labels).
- Confirm gels and recovery drinks are GF before recommending — many contain wheat-derived ingredients.

### Dairy-free (allergy or lactose intolerance)

- Protein: eggs, meat, fish, soy products, legumes, plant protein powders.
- Calcium: fortified plant milks, tofu, dark leafy greens, sardines (bone-in), tahini.
- Most "Up&Go" style protein drinks contain dairy — recommend dairy-free alternatives (oat-based, soy-based RTD protein drinks).
- Watch for hidden dairy (whey in protein bars, casein in some breads).

### IBS-friendly / low FODMAP

- Common triggers to avoid: onion, garlic, wheat in large amounts, certain legumes (chickpeas, black beans), high-FODMAP fruits (apples, pears, mango, watermelon), dairy with lactose.
- Better-tolerated carbs: white rice, oats (small portions), potatoes, sourdough, GF bread, low-FODMAP fruits (banana, blueberries, kiwi, citrus).
- Pre-race / pre-long-run: use only foods the athlete has tested in training. IBS + race nerves = disaster.
- Protein: most lean proteins are well tolerated. Lactose-free dairy or hard cheeses are fine.
- Recommend smaller, more frequent meals.

---

## 9. Race-day protocols

### Carb loading (race 24-72 hours out)

For events > 90 min:

- **2-3 days out**: increase carbs to **10-12 g/kg/day**, reduce training volume (taper)
- **Reduce fibre** in the final 24 hours to minimise GI residue
- **Reduce fat** to allow more room for carbs
- **No new foods** in the final 72 hours — every meal should be one the athlete has eaten many times before
- **Hydrate aggressively** in the final 48 hours — water, electrolyte drinks, broth

### Race morning

- **3-4 hours before start**: 1-4 g/kg carbs, low fibre, low fat, moderate protein
  - Classic: oatmeal with banana + honey + small amount of nut butter
  - Alternative: white toast with jam + honey, plus a banana
  - Avoid: large coffee on empty stomach if untested, anything new, anything high-fibre
- **1 hour before**: 30-50 g fast carbs if hungry — banana, sports drink, white toast with honey
- **15-30 min before**: gel or sports drink (50-100 ml) to top up — only if tested in training

### During the race

| Race duration | Strategy |
|---|---|
| Under 60 min (5K, sprint tri) | Mouth rinse with sports drink at 30 min; no calorie needs |
| 60-90 min (10K, Olympic tri swim/bike) | 30-60 g carbs/hr if tolerated; water otherwise |
| 90 min - 3 hr (half marathon, sprint to Olympic tri) | 60-90 g carbs/hr from gels + sports drink |
| 3+ hours (marathon, half iron, full iron) | 90-120 g carbs/hr; mix glucose and fructose (2:1 ratio) for maximum absorption; practice this religiously in training |

**Critical**: never use new gels, drinks, or strategies on race day. The AI should always remind users of this when discussing race fuelling.

### Post-race

- Within 30 min: 1-1.2 g/kg carbs + 0.3 g/kg protein, plus fluid replacement (150% of weight lost during race)
- 24 hours: continue elevated carb intake to replenish glycogen
- 48-72 hours: focus on anti-inflammatory foods (fatty fish, berries, leafy greens, turmeric) and adequate protein for muscle repair

---

## 10. Special situations

### Illness

- **Maintain carb intake** to support immune function. Don't let users under-fuel through a cold.
- **Increase fluids** — electrolyte drinks if fever or GI symptoms.
- **Protein** can be slightly higher (1.8-2.0 g/kg) to support immune cell turnover.
- Foods that help: broth, easy-to-digest carbs (rice, oats, toast), Greek yoghurt for probiotics, vitamin C-rich fruits, ginger and turmeric for inflammation.
- **Avoid recommending intense training** while ill — but that's a coaching call, not a nutrition call.

### Travel days

- Pack shelf-stable carbs and protein: nut butter sandwiches, rice cakes, jerky, protein bars, fruit, hard-boiled eggs (for short trips).
- **Hydration focus**: cabin pressure dehydrates aggressively. 250 ml water per hour of flight.
- Avoid alcohol on long flights — disrupts sleep, dehydrates, impairs recovery.
- **Time zone changes**: shift meal timing toward destination timezone 24-48 hours pre-travel to ease adaptation.

### Heat / humidity

- **Sodium intake increases significantly** — add 1000-2000 mg sodium per day in heavy heat training, more if you're a salty sweater.
- **Cold meals** can replace appetite when heat suppresses it — overnight oats, smoothies, cold pasta salad.
- Pre-cool with ice slurries (sports drink + crushed ice) before sessions in extreme heat.

### Altitude

- **Carbohydrate needs increase 15-25%** at altitude due to higher metabolic rate.
- **Iron demand spikes** — supplement under medical supervision in altitude camps.
- **Hydration**: dry air increases respiratory water loss. Add 500ml/day baseline.
- **Appetite often suppressed** at first — emphasise palatable, calorie-dense foods.

### Tapering (race lead-up)

- **Don't drop calories proportionally to volume.** Counter-intuitive but correct: glycogen storage increases during taper, muscle repair continues.
- Maintain carb intake within 10-15% of peak training values.
- Slight reduction in protein (still ≥ 1.6 g/kg) and total fat is reasonable.
- **Don't experiment**: every meal in taper week should be familiar.

### Heavy strength training day mixed with endurance

- Treat as a high-demand day even if endurance volume is modest.
- Apply 6-8 g/kg carbs at minimum.
- Protein bias toward higher end (2.0+ g/kg).
- Schedule carbs around both sessions — pre and post both.

---

## 11. Hard constraints — never violate

The AI must never:

1. Recommend a plan with **total daily energy below 30 kcal/kg FFM** for any athlete — this constitutes LEA and is medically dangerous.
2. Recommend **fasting or skipping meals around training** as a fuelling strategy. Fasted easy sessions are an option some athletes use, but the AI should never proactively suggest them — too risky for women, masters athletes, and anyone with disordered eating history.
3. Recommend **specific supplements or doses requiring medical supervision** — iron supplements, vitamin D in high doses, anything ergogenic beyond basics. The AI can mention food sources and suggest blood testing, but not prescribe.
4. Recommend foods on the user's **avoid list**. No exceptions.
5. Recommend any food the user has marked as an **allergy**. Treat this with absolute strictness — even trace exposure is a safety issue.
6. Use **moralising language** about food: "junk food", "guilty pleasure", "cheat meal", "earning calories". These framings damage long-term relationships with food.
7. Recommend **rapid weight loss strategies** to athletes. Healthy body composition change for athletes is 0.3-0.5% bodyweight per week loss with intentional protein/carb intake; the AI should not encourage faster.
8. Suggest **untested new fuels or strategies for race day**. Always emphasise: practice in training.
9. Make **medical diagnoses or treat conditions**. Refer to a sports dietitian, GP, or sports physician for: persistent fatigue, missed periods, recurrent injury, GI symptoms during training, suspected eating disorder.

---

## 12. Output formatting standards

These apply to the `food` string field in any generated plan:

- **Name concrete foods the athlete actually eats.** Compose every meal from the athlete's `foodPreferences` lists (breakfastOptions, proteinSources, carbSources, fruits, vegetables, snacks, drinks). Never output a generic placeholder like `"Protein"`, `"Veg"`, `"Carbs"`, or `"Protein source"` — always resolve it to a specific listed item. Vary the named protein and carb across the week so dinners aren't identical every day.
- Use commas as the only separator between ingredients: `"Oats, banana, yoghurt, honey"`. Never `+`, `w/`, `&`, `and`, or mixed connectors.
- For quantities, use `× N` with the multiplication sign and a space: `"Toast × 2"`, `"Rokeby × 2"`. Wrong: `"1× Rokeby"`, `"(2)"`, `"2 Rokeby"`.
- Quantity of one: omit the multiplier. `"Rokeby"` not `"Rokeby × 1"`.
- Use `/` for substitution choices with no spaces: `"Rokeby/Up&Go"`, `"rice/pasta"`. Wrong: `"Rokeby or Up&Go"`, `"Rokeby / Up&Go"`.
- Sentence case. First word capitalised, rest lowercase unless proper noun.
- Maximum 60 characters per `food` string.

### Examples

- Breakfast: `"Oats, banana, yoghurt, honey"`
- Post-AM single: `"Rokeby/Up&Go"`
- Post-AM double: `"Rokeby/Up&Go × 2"`
- Lunch: `"Smoothie, wrap, eggs/chicken"`
- Afternoon: `"Toast × 2, nut butter, banana"`
- Dinner: `"Chicken/beef, rice/potatoes, broccoli"` (concrete foods from the athlete's lists — never `"Protein, rice/potatoes, veg"`)

---

## Maintenance notes

- **When you edit this file**: tell Claude Code to read it and update `lib/prompts.ts` accordingly. The system prompts for `/api/plan`, `/api/grocery`, and `/api/feedback` should all derive from this document.
- **When new research changes a rule**: update the rule here first, then update prompts. Don't edit prompts directly — they'll drift from this document and the source of truth will become unclear.
- **Disagreements between this document and SPEC.md**: this document wins for nutrition logic. SPEC.md wins for architecture and data shapes.
- **Areas to expand over time**: deeper cycling and triathlon overlays; more detailed dietary patterns (kosher, halal, paleo, keto-cycled); deeper masters athlete (40+, 50+, 60+) guidance; ultra-endurance specific protocols (>4 hours).
