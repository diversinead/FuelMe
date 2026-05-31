<!-- This file is auto-generated from config/nutritionRules.json. Do not edit directly. -->

# Nutrition Rules

**This file is generated from `config/nutritionRules.json`. Edit the rules through the `/admin` page (or the JSON directly), then regenerate — do not hand-edit this file.**

---

## 1. Core principles

- Eat for the work. Carb intake scales with training demand; easy days are slightly lower than hard days. Periodise across the week.
- Food first, supplements last. Gels/drinks/bars only during or immediately post-session, or when whole food is impractical.
- Recovery starts within 30 minutes of a hard or long session.
- Sleep and digestion matter. Dinners not so heavy they impair sleep; avoid high-fibre/high-fat within 2 hours of bed.
- Consistency beats variety. Repeating foods that work is fine — same breakfast 4-5x/week if it works.
- Under-fuelling is the bigger risk than over-fuelling. Default to the higher end of carb ranges, especially for women, masters athletes, and anyone with fatigue/illness/poor-recovery history.
- No moralising about food. Pizza, chocolate, alcohol, ice cream — all fine in context.

---

## 2. Carbohydrate periodisation

Classify each day by its hardest session, then apply the per-day-type carb prescription. Daily carbs (g) = bodyweight (kg) × multiplier.

| Day type | Multiplier (g/kg) | 55 kg | 65 kg | 75 kg |
|---|---|---|---|---|
| REST | 3-5 | 165-275 g | 195-325 g | 225-375 g |
| EASY | 5-7 | 275-385 g | 325-455 g | 375-525 g |
| MODERATE | 6-8 | 330-440 g | 390-520 g | 450-600 g |
| HARD | 7-9 | 385-495 g | 455-585 g | 525-675 g |
| LONG | 8-10 | 440-550 g | 520-650 g | 600-750 g |
| DOUBLE | 9-11 | 495-605 g | 585-715 g | 675-825 g |
| RACE | 10-12 | 550-660 g | 650-780 g | 750-900 g |

**Preload rule:** if tomorrow is LONG, HARD, or RACE, add `W × 1` to `W × 2` g of extra carbs to today's dinner, reducing fibre and fat.

**Minimum-variance rule:** the highest-carb day must be at least `W × 3` g above the lowest-carb day.

**Within-day distribution (% of daily carbs):**

- Breakfast: 20-25%
- Post-AM refuel: 10-15%
- Lunch: 20-25%
- Afternoon: 10-15%
- Dinner: 25-30%
- Optional pre-bed: 5-10%

---

## 3. Protein strategy

Daily protein (g) = bodyweight (kg) × multiplier.

| Athlete profile | Multiplier (g/kg) | 55 kg | 65 kg | 75 kg |
|---|---|---|---|---|
| Endurance, maintenance | 1.6-1.8 | 88-99 g | 104-117 g | 120-135 g |
| Endurance + muscle building OR calorie deficit | 1.8-2.2 | 99-121 g | 117-143 g | 135-165 g |
| Strength or combined endurance + strength | 1.8-2.4 | 99-132 g | 117-156 g | 135-180 g |
| Vegan (digestibility adjustment) | 1.8-2.2 | 99-121 g | 117-143 g | 135-165 g |

- Masters athlete (40+): add 0.1-0.2 g/kg.
- Female athlete in confirmed luteal phase: add 0.1-0.2 g/kg.
- Per-meal dosing: `W × 0.3` to `W × 0.4` across 4-5 meals.
- Post-session: `W × 0.3` fast-digesting protein.
- Pre-bed (heavy blocks): `W × 0.3` to `W × 0.4` slow-digesting protein.

---

## 4. Hydration & electrolytes

- Baseline: 30-40 ml/kg/day.
- Around training: add 500-750 ml per hour.
- Sessions over 60 min (or in heat): add electrolytes — 300-700 mg sodium per litre of sweat lost.

---

## 5. Pre / intra / post-session fuelling

**Pre-session:**

- 3-4 h before: 1-4 g/kg carbs. Full meal, moderate protein, low-moderate fat, low fibre.
- 1-2 h before: 1-2 g/kg carbs. Smaller meal/snack, low fat, low fibre.
- 0-0.5 h before: 30-60 g carbs. Only if needed. Avoid the 30-60 min pre-session insulin-dip window.

**During session:**

| Duration | Carbs per hour |
|---|---|
| 0-60 min | 0-0 g/hr |
| 60-90 min | 30-60 g/hr |
| 90-150 min | 60-90 g/hr |
| 150+ min | 90-120 g/hr |

**Post-session (within 30 min of HARD/LONG):** 1-1.2 g/kg carbs + `W × 0.3` protein + 500-750 ml fluid.

---

## 6. Sport-specific overlays

### Running

- Higher impact than cycling — gut tolerance during runs is lower; default to liquid carbs over solids on runs > 60 min.
- Long runs deplete glycogen faster per minute — apply LONG classification at 90 min, not 2 hours.
- Recovery is harder (eccentric muscle damage); post-run protein is non-negotiable for any session > 45 min hard.
- Marathon training: increase total daily carbs 10-15% during peak weeks; mind iron intake.

### Cycling

- Better gut tolerance — solid food (rice cakes, bars, banana + nut butter) works on the bike.
- Higher absolute calorie burn per hour at the same RPE — often needs more total daily food than a runner of the same weight.
- Long rides (3+ hours) require 90-120 g carbs/hour and explicit drink-mix recommendations.
- Indoor trainer sessions: sweat rate 2-3x higher — triple electrolyte intake.

### Triathlon

- Brick days (bike + run): apply long-day or two-a-day rules even if total duration is modest.
- Race week: practise race-day fuelling in the final long brick — don't experiment on race day.
- Multi-discipline weeks mean higher total volume — bias to the higher end of carb ranges.
- Account for early-morning swim (often pre-breakfast) when planning breakfast and pre-workout fuelling.

### Swimming

- Cold water increases appetite — expect larger meals after pool sessions.
- Chlorine + early starts suppress pre-workout appetite — default to a small carb-only snack 30 min before.
- Glycogen demand is similar to running per minute of work — apply the same daily carb targets.

### Strength / combined

- Higher protein target (1.8-2.4 g/kg).
- Carbohydrates still matter — low-carb compromises performance and recovery.
- Pre-workout meal 1-2 hours out with moderate carbs + protein.
- Post-workout less time-critical than endurance, but eat within 1-2 hours.
- Combined strength + endurance: schedule to avoid interference (strength after endurance, or 6+ hours apart).

---

## 7. Female athlete considerations

**Follicular phase:**

- Higher insulin sensitivity — carbs utilised more efficiently.
- Easier fat access during low-intensity work.
- Standard carb periodisation applies.

**Luteal phase:** increase carbs 5-10%, add 0.1-0.2 g/kg protein.

- Higher in-session carb needs — fuel from 45 min instead of 60.
- Sleep often disrupted — pre-bed casein/Greek yoghurt + magnesium-rich foods.
- PMS support: complex carbs, omega-3 sources, avoid heavy alcohol.

**Menstruation:**

- Iron focus — heavier flow means more iron loss; pair iron with vitamin C.
- Avoid restriction/under-fuelling despite bloating discomfort.
- Anti-inflammatory foods: berries, fatty fish, turmeric, ginger.

**LEA threshold:** never below 30 kcal/kg fat-free mass.

**Iron:** red meat, liver, oysters, lentils, fortified cereals, dark leafy greens, pumpkin seeds. Pair with vitamin C (citrus, capsicum, tomato). Avoid coffee/tea within 1 hour of iron-rich meals.

**Bone health:** calcium 1000-1300 mg/day; vitamin D 600-1000 IU/day.

---

## 8. Dietary patterns

### Vegetarian (dairy + eggs)

- Avoid: meat, fish
- Protein from Greek yoghurt, eggs, cottage cheese, tofu, tempeh, legumes, quinoa.
- Watch B12 and iron — fortified foods or supplements.
- Combine plant proteins across the day (legumes + grains).

### Vegan

- Avoid: all animal products
- Protein target 1.8-2.2 g/kg (lower plant digestibility).
- B12 supplementation required.
- Pair non-heme iron with vitamin C; avoid tea/coffee with meals.
- Omega-3 from flax/chia/walnuts; consider algae DHA. Creatine can help. Mind zinc/iodine.

### Gluten-free

- Avoid: wheat, barley, rye
- Allowed: rice, certified GF oats, potatoes, sweet potatoes, quinoa, buckwheat, GF pasta, GF bread, polenta, corn tortillas
- Confirm gels and recovery drinks are GF — many contain wheat-derived ingredients.

### Dairy-free

- Avoid: dairy, lactose
- Protein from eggs, meat, fish, soy, legumes, plant protein powders.
- Calcium from fortified plant milks, tofu, dark leafy greens, sardines, tahini.
- Most Up&Go-style drinks contain dairy — use oat/soy alternatives. Watch hidden whey/casein.

### IBS-friendly / low FODMAP

- Avoid: onion, garlic, wheat in large amounts, chickpeas, black beans, apple, pear, mango, watermelon, lactose dairy
- Allowed: white rice, oats (small portions), potatoes, sourdough, GF bread, banana, blueberries, kiwi, citrus
- Pre-race: only foods tested in training.
- Smaller, more frequent meals.

---

## 9. Race-day protocols

- Carb loading: 2-3 days out, 10-12 g/kg/day, reduce fibre and fat, no new foods.
- Race morning: 3-4 h before — 1-4 g/kg carbs, low fibre, low fat, moderate protein.

**During the race:**

| Duration | Carbs per hour | Notes |
|---|---|---|
| 0-60 min | 0-0 g/hr | Mouth-rinse sports drink at 30 min; no calorie needs. |
| 60-90 min | 30-60 g/hr | If tolerated; water otherwise. |
| 90-180 min | 60-90 g/hr | Gels + sports drink. |
| 180+ min | 90-120 g/hr | Mix glucose + fructose (2:1); practise religiously in training. |

---

## 10. Special situations

### Illness

- Maintain carb intake to support immune function.
- Increase fluids; electrolytes if fever or GI symptoms.
- Protein slightly higher (1.8-2.0 g/kg).
- Broth, easy-to-digest carbs, Greek yoghurt, vitamin-C fruit, ginger, turmeric.
- Avoid intense training while ill (a coaching call, not nutrition).

### Travel days

- Pack shelf-stable carbs + protein (nut-butter sandwiches, rice cakes, jerky, bars, fruit, hard-boiled eggs).
- Hydrate: ~250 ml water per hour of flight.
- Avoid alcohol on long flights.
- Shift meal timing toward destination timezone 24-48 h pre-travel.

### Heat / humidity

- Increase sodium 1000-2000 mg/day in heavy heat training.
- Cold meals (overnight oats, smoothies, cold pasta salad) when heat suppresses appetite.
- Pre-cool with ice slurries before sessions in extreme heat.

### Altitude

- Carb needs increase 15-25%.
- Iron demand spikes — supplement only under medical supervision.
- Add ~500 ml/day baseline for respiratory water loss.
- Appetite often suppressed — emphasise palatable, calorie-dense foods.

### Tapering

- Don't drop calories proportionally to volume — glycogen storage rises during taper.
- Maintain carbs within 10-15% of peak training values.
- Slight protein (still >= 1.6 g/kg) and fat reduction is fine.
- Don't experiment — every meal should be familiar.

### Strength + endurance same day

- Treat as a high-demand day even if endurance volume is modest.
- Minimum 6-8 g/kg carbs.
- Protein bias toward the higher end (2.0+ g/kg).
- Schedule carbs around both sessions — pre and post each.

---

## 11. Hard constraints — never violate

1. Never recommend a plan with total daily energy below 30 kcal/kg fat-free mass (LEA).
2. Never recommend fasting or skipping meals around training as a fuelling strategy.
3. Never prescribe specific supplements/doses needing medical supervision (iron, high-dose vit D, ergogenics). Food sources + blood-test suggestions only.
4. Never recommend foods on the athlete's avoid list.
5. Never recommend any food the athlete has marked as an allergy.
6. Never use moralising language about food ('junk', 'guilty pleasure', 'cheat meal', 'earning calories').
7. Never recommend rapid weight-loss strategies (max 0.3-0.5% bodyweight/week).
8. Never suggest untested new fuels or strategies for race day.
9. Never make medical diagnoses — refer to a sports dietitian, GP, or sports physician.

---

## 12. Output formatting standards (food strings)

- Separator: ingredients joined by `,`.
- Quantity: × N with the multiplication sign and a leading space; omit when N = 1.
- Substitution: / with no spaces.
- Case: Sentence case.
- Maximum 60 characters per food string.

Examples:

- Breakfast: `"Oats, banana, yoghurt, honey"`
- Post-AM single: `"Rokeby/Up&Go"`
- Post-AM double: `"Rokeby/Up&Go × 2"`
- Lunch: `"Smoothie, wrap, eggs/chicken"`
- Afternoon: `"Toast × 2, nut butter, banana"`
- Dinner: `"Chicken/beef, rice/potatoes, broccoli"`
