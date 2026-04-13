// ============================================================
// MedMeal Planner — Food & Condition Database
// ============================================================

const CONDITIONS = [
    { id: 'diabetes', name: 'Type 2 Diabetes', icon: '\u{1F4C9}', desc: 'Low glycemic, controlled carbs' },
    { id: 'hypertension', name: 'Hypertension', icon: '\u{2764}\u{FE0F}', desc: 'Low sodium, DASH-friendly' },
    { id: 'heart_disease', name: 'Heart Disease', icon: '\u{1FA7A}', desc: 'Low saturated fat, heart-healthy' },
    { id: 'kidney_disease', name: 'Kidney Disease', icon: '\u{1FAC0}', desc: 'Low potassium, phosphorus, sodium' },
    { id: 'celiac', name: 'Celiac Disease', icon: '\u{1F33E}', desc: 'Strictly gluten-free' },
    { id: 'gout', name: 'Gout', icon: '\u{1F9B6}', desc: 'Low purine foods' },
    { id: 'ibs', name: 'IBS', icon: '\u{1F601}', desc: 'Low FODMAP friendly' },
    { id: 'obesity', name: 'Obesity', icon: '\u{2696}\u{FE0F}', desc: 'Calorie-controlled, high satiety' },
    { id: 'anemia', name: 'Iron-Deficiency Anemia', icon: '\u{1FA78}', desc: 'Iron-rich foods' },
    { id: 'osteoporosis', name: 'Osteoporosis', icon: '\u{1F9B4}', desc: 'Calcium & Vitamin D rich' },
    { id: 'liver_disease', name: 'Liver Disease', icon: '\u{1FAC1}', desc: 'Low fat, easy to digest' },
    { id: 'cholesterol', name: 'High Cholesterol', icon: '\u{1F9EA}', desc: 'Low LDL, high fiber' }
];

const ALLERGIES = [
    { id: 'gluten', name: 'Gluten', icon: '\u{1F35E}' },
    { id: 'dairy', name: 'Dairy', icon: '\u{1F95B}' },
    { id: 'nuts', name: 'Tree Nuts', icon: '\u{1F95C}' },
    { id: 'peanuts', name: 'Peanuts', icon: '\u{1F95C}' },
    { id: 'eggs', name: 'Eggs', icon: '\u{1F95A}' },
    { id: 'soy', name: 'Soy', icon: '\u{1FAD8}' },
    { id: 'shellfish', name: 'Shellfish', icon: '\u{1F990}' },
    { id: 'fish', name: 'Fish', icon: '\u{1F41F}' },
    { id: 'sesame', name: 'Sesame', icon: '\u{1F330}' },
    { id: 'corn', name: 'Corn', icon: '\u{1F33D}' }
];

// Condition-specific dietary rules
const CONDITION_RULES = {
    diabetes: {
        maxCarbPercent: 40,
        preferLowGI: true,
        avoid: ['sugar', 'white_rice', 'white_bread'],
        prefer: ['whole_grains', 'leafy_greens', 'lean_protein'],
        notes: [
            'Carbohydrates are limited to ~40% of daily calories to help manage blood sugar.',
            'Meals focus on low glycemic index foods that release glucose slowly.',
            'Fiber-rich foods are prioritized to slow carbohydrate absorption.',
            'Meals are balanced with protein and healthy fats to stabilize glucose levels.'
        ]
    },
    hypertension: {
        maxSodiumMg: 1500,
        avoid: ['high_sodium', 'processed_meat', 'canned_soup'],
        prefer: ['potassium_rich', 'leafy_greens', 'whole_grains', 'low_fat_dairy'],
        notes: [
            'Sodium is restricted to under 1500mg per day (DASH diet guidelines).',
            'Potassium-rich foods are included to help regulate blood pressure.',
            'Meals emphasize fruits, vegetables, whole grains, and lean proteins.',
            'Processed and pre-packaged foods are minimized.'
        ]
    },
    heart_disease: {
        maxSatFatPercent: 6,
        avoid: ['saturated_fat', 'trans_fat', 'fried', 'processed_meat'],
        prefer: ['omega3', 'fiber', 'whole_grains', 'lean_protein'],
        notes: [
            'Saturated fat is kept below 6% of daily calories (AHA guidelines).',
            'Omega-3 fatty acids from fish and plant sources are emphasized.',
            'Soluble fiber is included to help lower LDL cholesterol.',
            'Trans fats and heavily processed foods are eliminated.'
        ]
    },
    kidney_disease: {
        maxSodiumMg: 2000,
        maxPotassiumMg: 2000,
        maxPhosphorusMg: 800,
        avoid: ['high_potassium', 'high_phosphorus', 'high_sodium', 'processed'],
        prefer: ['low_potassium_veg', 'white_rice', 'egg_whites'],
        notes: [
            'Potassium is limited to help prevent dangerous heart rhythm issues.',
            'Phosphorus is restricted to protect bone health.',
            'Sodium is kept moderate to prevent fluid retention.',
            'Protein portions are controlled to reduce kidney workload.'
        ]
    },
    celiac: {
        strictAvoid: ['gluten'],
        avoid: ['wheat', 'barley', 'rye', 'cross_contamination'],
        prefer: ['rice', 'quinoa', 'corn', 'potatoes', 'gf_oats'],
        notes: [
            'All gluten-containing grains (wheat, barley, rye) are completely excluded.',
            'Only certified gluten-free oats are included where oats appear.',
            'Cross-contamination risks are noted where relevant.',
            'Naturally gluten-free whole grains like quinoa and rice are featured.'
        ]
    },
    gout: {
        avoid: ['high_purine', 'organ_meat', 'shellfish', 'beer', 'fructose'],
        prefer: ['low_purine', 'cherries', 'low_fat_dairy', 'vegetables'],
        notes: [
            'High-purine foods (organ meats, certain seafood) are avoided to reduce uric acid.',
            'Low-fat dairy is included as it may help lower uric acid levels.',
            'Hydration-promoting foods are emphasized.',
            'Fructose-heavy foods are limited as they can raise uric acid.'
        ]
    },
    ibs: {
        avoid: ['high_fodmap', 'garlic', 'onion', 'beans', 'wheat_large'],
        prefer: ['low_fodmap', 'rice', 'potatoes', 'lean_protein', 'bananas'],
        notes: [
            'Meals follow low-FODMAP principles to minimize digestive symptoms.',
            'Common triggers like garlic, onion, and excess wheat are avoided.',
            'Soluble fiber sources are preferred over insoluble fiber.',
            'Meal portions are moderate to avoid overloading digestion.'
        ]
    },
    obesity: {
        highProtein: true,
        highFiber: true,
        avoid: ['calorie_dense', 'sugar', 'fried', 'refined_carbs'],
        prefer: ['lean_protein', 'vegetables', 'whole_grains', 'high_satiety'],
        notes: [
            'Meals are designed for high satiety with controlled calories.',
            'Protein is increased to preserve muscle mass during weight management.',
            'High-fiber foods are included to promote fullness.',
            'Nutrient density is prioritized over calorie density.'
        ]
    },
    anemia: {
        prefer: ['iron_rich', 'vitamin_c', 'lean_red_meat', 'spinach', 'legumes'],
        avoid: ['tea_with_meals', 'calcium_with_iron'],
        notes: [
            'Iron-rich foods are featured in most meals.',
            'Vitamin C sources are paired with iron-rich foods to boost absorption.',
            'Both heme iron (meat) and non-heme iron (plant) sources are included.',
            'Calcium-rich foods are separated from iron-rich meals when possible.'
        ]
    },
    osteoporosis: {
        prefer: ['calcium_rich', 'vitamin_d', 'leafy_greens', 'dairy', 'fortified'],
        avoid: ['excess_sodium', 'excess_caffeine', 'excess_alcohol'],
        notes: [
            'Calcium intake is targeted at 1000-1200mg per day from food sources.',
            'Vitamin D-rich foods are included to aid calcium absorption.',
            'Leafy greens and dairy products are featured prominently.',
            'Excess sodium is avoided as it can increase calcium loss.'
        ]
    },
    liver_disease: {
        avoid: ['alcohol', 'high_fat', 'fried', 'excess_protein', 'raw_shellfish'],
        prefer: ['lean_protein_moderate', 'whole_grains', 'fruits', 'vegetables'],
        notes: [
            'Fat content is kept low to reduce liver workload.',
            'Protein is moderate and comes from lean sources.',
            'Antioxidant-rich fruits and vegetables are emphasized.',
            'Meals are easy to digest with simple preparation methods.'
        ]
    },
    cholesterol: {
        avoid: ['saturated_fat', 'trans_fat', 'full_fat_dairy', 'processed_meat'],
        prefer: ['soluble_fiber', 'omega3', 'plant_sterols', 'nuts', 'oats'],
        notes: [
            'Soluble fiber (oats, beans, fruits) is included to lower LDL cholesterol.',
            'Omega-3 rich foods are featured for their heart-protective benefits.',
            'Saturated fat is kept below 7% of daily calories.',
            'Plant-based proteins are favored where possible.'
        ]
    }
};

// Health tips per condition
const HEALTH_TIPS = {
    diabetes: [
        { title: 'Monitor Carb Portions', text: 'Use the plate method: fill half your plate with non-starchy vegetables, a quarter with lean protein, and a quarter with whole grains or starchy foods.' },
        { title: 'Timing Matters', text: 'Eating meals at consistent times each day helps maintain stable blood sugar levels. Try not to skip meals.' },
        { title: 'Smart Snacking', text: 'Pair carbohydrates with protein or healthy fat to slow glucose absorption. An apple with almond butter is better than an apple alone.' },
        { title: 'Stay Hydrated', text: 'Water is the best beverage choice. Avoid sugary drinks and limit fruit juices, which can spike blood sugar rapidly.' }
    ],
    hypertension: [
        { title: 'The DASH Diet Works', text: 'The DASH diet has been clinically proven to lower blood pressure. This meal plan follows its principles: rich in fruits, vegetables, and low-fat dairy.' },
        { title: 'Read Labels for Sodium', text: 'Most dietary sodium comes from processed and restaurant food, not the salt shaker. Check nutrition labels and aim for items under 140mg sodium per serving.' },
        { title: 'Potassium Balance', text: 'Potassium helps counteract sodium\'s effects on blood pressure. Bananas, sweet potatoes, and spinach are excellent sources.' },
        { title: 'Limit Caffeine', text: 'Caffeine can cause short-term spikes in blood pressure. If you drink coffee, limit to 1-2 cups and monitor your response.' }
    ],
    heart_disease: [
        { title: 'Omega-3 Benefits', text: 'Fatty fish like salmon, mackerel, and sardines contain omega-3 fatty acids that reduce inflammation and lower heart disease risk. Aim for 2 servings per week.' },
        { title: 'Fiber for Heart Health', text: 'Soluble fiber from oats, beans, and fruits can help lower LDL cholesterol by 5-10%. Aim for at least 25-30g of total fiber daily.' },
        { title: 'Healthy Cooking Methods', text: 'Bake, grill, steam, or saut\u00e9 instead of frying. Use olive oil or avocado oil instead of butter for cooking.' },
        { title: 'Portion Awareness', text: 'Even healthy fats are calorie-dense. A serving of nuts is about a small handful (1 oz), and oil is 1 tablespoon.' }
    ],
    kidney_disease: [
        { title: 'Watch Portion Sizes', text: 'For kidney disease, controlling portions of protein, potassium, and phosphorus is crucial. Work closely with a renal dietitian for personalized guidance.' },
        { title: 'Fluid Management', text: 'Your doctor may recommend limiting fluid intake. Remember that soups, ice cream, and some fruits count toward your fluid allowance.' },
        { title: 'Phosphorus Additives', text: 'Phosphorus additives in processed foods are more easily absorbed than natural phosphorus. Check ingredient lists for words containing "phos".' },
        { title: 'Cooking to Reduce Potassium', text: 'Leaching (soaking cut vegetables in water for 2+ hours) can reduce potassium content by up to 50%.' }
    ],
    celiac: [
        { title: 'Hidden Gluten Sources', text: 'Gluten can hide in soy sauce, salad dressings, marinades, and even some medications. Always read labels carefully and look for certified gluten-free products.' },
        { title: 'Cross-Contamination', text: 'Use separate cutting boards, toasters, and cooking utensils for gluten-free foods. Even small amounts of gluten can trigger a reaction.' },
        { title: 'Nutrient Considerations', text: 'Celiac disease can impair absorption of iron, calcium, and B vitamins. Include nutrient-dense foods and consider supplements as recommended by your doctor.' },
        { title: 'Dining Out Safely', text: 'When eating out, inform your server about celiac disease (not just a preference). Many restaurants now offer gluten-free menus.' }
    ],
    gout: [
        { title: 'Hydration is Key', text: 'Drink at least 8-12 glasses of water daily to help flush uric acid from your body. Dehydration can trigger gout flares.' },
        { title: 'Cherries May Help', text: 'Studies suggest that cherries and cherry juice may help lower uric acid levels and reduce gout flare frequency.' },
        { title: 'Limit Alcohol', text: 'Beer is particularly problematic for gout due to its purine content. If you drink, wine in moderation appears to be less risky.' },
        { title: 'Weight Management', text: 'Excess weight increases uric acid production. Gradual weight loss can help, but avoid crash diets which can temporarily raise uric acid.' }
    ],
    ibs: [
        { title: 'Food Diary', text: 'Keep a food and symptom diary to identify your personal triggers. IBS is highly individual — what bothers one person may be fine for another.' },
        { title: 'Eat Slowly', text: 'Eating too quickly can worsen IBS symptoms. Take your time, chew thoroughly, and eat in a relaxed environment when possible.' },
        { title: 'FODMAP Reintroduction', text: 'The low-FODMAP diet is meant to be temporary. After 2-6 weeks of elimination, work with a dietitian to systematically reintroduce foods.' },
        { title: 'Stress Management', text: 'The gut-brain connection is real. Stress and anxiety can trigger or worsen IBS symptoms. Consider mindfulness, yoga, or other stress-reduction techniques.' }
    ],
    obesity: [
        { title: 'Sustainable Changes', text: 'Focus on small, sustainable changes rather than extreme restrictions. A moderate deficit of 500 calories/day leads to about 1 pound of weight loss per week.' },
        { title: 'Protein at Every Meal', text: 'Protein is the most satiating macronutrient. Including protein at every meal helps control hunger and preserves muscle during weight loss.' },
        { title: 'Volume Eating', text: 'Non-starchy vegetables are low in calories but high in volume. Fill half your plate with vegetables to feel satisfied with fewer calories.' },
        { title: 'Sleep Matters', text: 'Poor sleep disrupts hunger hormones (ghrelin and leptin), leading to increased appetite. Aim for 7-9 hours of quality sleep.' }
    ],
    anemia: [
        { title: 'Pair Iron with Vitamin C', text: 'Vitamin C dramatically increases non-heme iron absorption. Squeeze lemon on spinach, eat strawberries with fortified cereal, or have tomatoes with beans.' },
        { title: 'Avoid Iron Blockers at Meals', text: 'Calcium, tea, coffee, and high-fiber bran can inhibit iron absorption. Separate these from iron-rich meals by 1-2 hours.' },
        { title: 'Cast Iron Cooking', text: 'Cooking acidic foods (like tomato sauce) in cast iron cookware can increase the iron content of your food.' },
        { title: 'Two Types of Iron', text: 'Heme iron (from meat) is absorbed 2-3x better than non-heme iron (from plants). If you eat meat, include it regularly. If vegetarian, eat more iron-rich plants with vitamin C.' }
    ],
    osteoporosis: [
        { title: 'Calcium Throughout the Day', text: 'Your body absorbs calcium best in amounts of 500mg or less at a time. Spread calcium-rich foods across all meals rather than loading up at once.' },
        { title: 'Vitamin D is Essential', text: 'Without adequate vitamin D, your body can\'t properly absorb calcium. Fatty fish, fortified foods, and safe sun exposure all help.' },
        { title: 'Weight-Bearing Exercise', text: 'Diet alone isn\'t enough. Weight-bearing exercises like walking, dancing, and resistance training stimulate bone formation.' },
        { title: 'Limit Bone Robbers', text: 'Excess sodium, caffeine, and alcohol can all increase calcium loss. Moderate your intake of these.' }
    ],
    liver_disease: [
        { title: 'Small, Frequent Meals', text: 'Eating 4-6 smaller meals throughout the day is easier on the liver than 2-3 large meals. Include a late-evening snack to prevent overnight muscle breakdown.' },
        { title: 'Avoid Raw Shellfish', text: 'People with liver disease are at higher risk from bacteria (Vibrio) found in raw shellfish. Always eat shellfish fully cooked.' },
        { title: 'Limit Processed Foods', text: 'Processed foods often contain additives and preservatives that put extra strain on the liver. Choose whole, fresh foods when possible.' },
        { title: 'Adequate Protein', text: 'Despite past beliefs, most people with liver disease need adequate protein (not restriction). Plant-based proteins may be easier to tolerate.' }
    ],
    cholesterol: [
        { title: 'Soluble Fiber Power', text: 'Aim for 10-25g of soluble fiber daily. Oatmeal (3g per serving), beans (4-6g per cup), and apples (1g each) are excellent sources.' },
        { title: 'Plant Sterols', text: 'Plant sterols/stanols can lower LDL by 6-15%. Found naturally in nuts, seeds, and vegetable oils, or in fortified foods like certain margarines.' },
        { title: 'Nuts for Heart Health', text: 'Eating 1.5 oz of nuts daily (almonds, walnuts, pistachios) can lower LDL cholesterol by about 5%. They make great snack replacements.' },
        { title: 'Good vs Bad Fats', text: 'Replace saturated fats (butter, fatty meat) with unsaturated fats (olive oil, avocado, fatty fish). The type of fat matters more than the total amount.' }
    ]
};

// ============================================================
// MEAL DATABASE
// ============================================================
const MEALS = {
    breakfast: [
        {
            name: 'High-Protein Egg & Turkey Scramble',
            description: 'Scrambled eggs and egg whites with diced turkey breast, served with cottage cheese and sliced tomato.',
            calories: 420, protein: 48, carbs: 10, fat: 20, fiber: 1, sodium: 480,
            tags: ['high_protein', 'lean_protein', 'low_carb', 'iron_rich'],
            allergens: ['eggs', 'dairy'],
            suitable: ['obesity', 'diabetes', 'anemia', 'heart_disease', 'cholesterol', 'celiac'],
            unsuitable: ['kidney_disease'],
            diet: [],
            ingredients: ['eggs', 'egg whites', 'turkey breast', 'cottage cheese', 'tomato'],
            category_ingredients: { proteins: ['eggs', 'egg whites', 'turkey breast'], dairy: ['cottage cheese'], vegetables: ['tomato'] }
        },
        {
            name: 'Protein Oats',
            description: 'Oatmeal mixed with protein powder, topped with Greek yogurt, banana, and a drizzle of honey.',
            calories: 440, protein: 38, carbs: 52, fat: 10, fiber: 6, sodium: 120,
            tags: ['high_protein', 'whole_grains', 'fiber', 'calcium_rich'],
            allergens: ['gluten', 'dairy'],
            suitable: ['obesity', 'anemia', 'heart_disease', 'hypertension', 'osteoporosis'],
            unsuitable: ['celiac', 'kidney_disease'],
            diet: ['vegetarian'],
            ingredients: ['rolled oats', 'protein powder', 'Greek yogurt', 'banana', 'honey'],
            category_ingredients: { grains: ['rolled oats'], proteins: ['protein powder'], dairy: ['Greek yogurt'], fruits: ['banana'], pantry: ['honey'] }
        },
        {
            name: 'Oatmeal with Berries & Walnuts',
            description: 'Steel-cut oats topped with fresh blueberries, sliced strawberries, and crushed walnuts with a drizzle of honey.',
            calories: 380, protein: 12, carbs: 58, fat: 12, fiber: 8, sodium: 10,
            tags: ['whole_grains', 'fiber', 'antioxidants', 'omega3'],
            allergens: ['nuts', 'gluten'],
            suitable: ['heart_disease', 'cholesterol', 'diabetes', 'hypertension', 'obesity', 'anemia'],
            unsuitable: ['celiac', 'kidney_disease'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['steel-cut oats', 'blueberries', 'strawberries', 'walnuts', 'honey'],
            category_ingredients: { grains: ['steel-cut oats'], fruits: ['blueberries', 'strawberries'], nuts: ['walnuts'], pantry: ['honey'] }
        },
        {
            name: 'Veggie Egg White Omelette',
            description: 'Fluffy egg white omelette loaded with spinach, bell peppers, mushrooms, and a sprinkle of feta cheese.',
            calories: 220, protein: 24, carbs: 8, fat: 10, fiber: 3, sodium: 320,
            tags: ['high_protein', 'low_carb', 'iron_rich', 'calcium_rich'],
            allergens: ['eggs', 'dairy'],
            suitable: ['diabetes', 'obesity', 'heart_disease', 'cholesterol', 'gout', 'anemia'],
            unsuitable: [],
            diet: ['vegetarian'],
            ingredients: ['egg whites', 'spinach', 'bell peppers', 'mushrooms', 'feta cheese', 'olive oil'],
            category_ingredients: { proteins: ['egg whites'], vegetables: ['spinach', 'bell peppers', 'mushrooms'], dairy: ['feta cheese'], pantry: ['olive oil'] }
        },
        {
            name: 'Greek Yogurt Parfait',
            description: 'Low-fat Greek yogurt layered with granola, mixed berries, chia seeds, and a touch of maple syrup.',
            calories: 340, protein: 20, carbs: 45, fat: 9, fiber: 6, sodium: 80,
            tags: ['calcium_rich', 'probiotics', 'high_protein', 'fiber'],
            allergens: ['dairy', 'gluten'],
            suitable: ['osteoporosis', 'obesity', 'gout', 'anemia', 'hypertension'],
            unsuitable: ['celiac', 'kidney_disease'],
            diet: ['vegetarian'],
            ingredients: ['Greek yogurt (low-fat)', 'granola', 'mixed berries', 'chia seeds', 'maple syrup'],
            category_ingredients: { dairy: ['Greek yogurt (low-fat)'], grains: ['granola'], fruits: ['mixed berries'], pantry: ['chia seeds', 'maple syrup'] }
        },
        {
            name: 'Avocado Toast with Poached Egg',
            description: 'Whole grain toast topped with mashed avocado, a poached egg, cherry tomatoes, and red pepper flakes.',
            calories: 350, protein: 14, carbs: 30, fat: 20, fiber: 8, sodium: 290,
            tags: ['healthy_fats', 'fiber', 'whole_grains', 'vitamin_c'],
            allergens: ['eggs', 'gluten'],
            suitable: ['heart_disease', 'cholesterol', 'anemia', 'hypertension'],
            unsuitable: ['kidney_disease'],
            diet: ['vegetarian'],
            ingredients: ['whole grain bread', 'avocado', 'egg', 'cherry tomatoes', 'red pepper flakes'],
            category_ingredients: { grains: ['whole grain bread'], proteins: ['egg'], vegetables: ['avocado', 'cherry tomatoes'], pantry: ['red pepper flakes'] }
        },
        {
            name: 'Banana Peanut Butter Smoothie',
            description: 'Creamy smoothie with banana, natural peanut butter, spinach, almond milk, and a scoop of flaxseed.',
            calories: 360, protein: 14, carbs: 42, fat: 16, fiber: 7, sodium: 150,
            tags: ['potassium_rich', 'healthy_fats', 'iron_rich', 'fiber'],
            allergens: ['peanuts'],
            suitable: ['hypertension', 'anemia', 'heart_disease', 'cholesterol'],
            unsuitable: ['kidney_disease', 'ibs'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['banana', 'peanut butter (natural)', 'spinach', 'almond milk', 'flaxseed'],
            category_ingredients: { fruits: ['banana'], proteins: ['peanut butter (natural)'], vegetables: ['spinach'], dairy: ['almond milk'], pantry: ['flaxseed'] }
        },
        {
            name: 'Quinoa Breakfast Bowl',
            description: 'Warm quinoa with cinnamon, diced apple, pumpkin seeds, and a splash of almond milk.',
            calories: 320, protein: 11, carbs: 48, fat: 10, fiber: 6, sodium: 40,
            tags: ['whole_grains', 'iron_rich', 'low_sodium', 'fiber'],
            allergens: [],
            suitable: ['celiac', 'hypertension', 'diabetes', 'anemia', 'heart_disease', 'ibs', 'liver_disease'],
            unsuitable: [],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['quinoa', 'apple', 'pumpkin seeds', 'cinnamon', 'almond milk'],
            category_ingredients: { grains: ['quinoa'], fruits: ['apple'], nuts: ['pumpkin seeds'], pantry: ['cinnamon'], dairy: ['almond milk'] }
        },
        {
            name: 'Smoked Salmon on Rice Cakes',
            description: 'Brown rice cakes topped with smoked salmon, cream cheese, capers, and fresh dill.',
            calories: 290, protein: 18, carbs: 28, fat: 12, fiber: 2, sodium: 480,
            tags: ['omega3', 'high_protein', 'low_carb'],
            allergens: ['fish', 'dairy'],
            suitable: ['heart_disease', 'cholesterol', 'celiac', 'diabetes', 'osteoporosis'],
            unsuitable: ['hypertension', 'kidney_disease', 'gout'],
            diet: ['pescatarian'],
            ingredients: ['brown rice cakes', 'smoked salmon', 'cream cheese (light)', 'capers', 'fresh dill'],
            category_ingredients: { grains: ['brown rice cakes'], proteins: ['smoked salmon'], dairy: ['cream cheese (light)'], pantry: ['capers', 'fresh dill'] }
        },
        {
            name: 'Sweet Potato & Black Bean Hash',
            description: 'Roasted sweet potato cubes with black beans, corn, cumin, and topped with fresh cilantro.',
            calories: 340, protein: 12, carbs: 55, fat: 8, fiber: 11, sodium: 180,
            tags: ['fiber', 'iron_rich', 'potassium_rich', 'low_fat'],
            allergens: ['corn'],
            suitable: ['hypertension', 'anemia', 'heart_disease', 'cholesterol', 'diabetes', 'liver_disease'],
            unsuitable: ['kidney_disease', 'ibs'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['sweet potato', 'black beans', 'corn', 'cumin', 'cilantro', 'olive oil'],
            category_ingredients: { vegetables: ['sweet potato', 'cilantro'], proteins: ['black beans'], pantry: ['corn', 'cumin', 'olive oil'] }
        },
        {
            name: 'Turkey & Spinach Breakfast Wrap',
            description: 'Whole wheat tortilla with lean turkey, spinach, tomato, and a light spread of hummus.',
            calories: 310, protein: 22, carbs: 32, fat: 10, fiber: 5, sodium: 420,
            tags: ['high_protein', 'iron_rich', 'lean_protein', 'whole_grains'],
            allergens: ['gluten', 'sesame'],
            suitable: ['obesity', 'diabetes', 'anemia', 'cholesterol'],
            unsuitable: ['celiac', 'kidney_disease'],
            diet: [],
            ingredients: ['whole wheat tortilla', 'turkey breast (sliced)', 'spinach', 'tomato', 'hummus'],
            category_ingredients: { grains: ['whole wheat tortilla'], proteins: ['turkey breast (sliced)'], vegetables: ['spinach', 'tomato'], pantry: ['hummus'] }
        },
        {
            name: 'Rice Porridge with Ginger & Chicken',
            description: 'Comforting rice congee with shredded chicken, fresh ginger, scallions, and a dash of sesame oil.',
            calories: 280, protein: 18, carbs: 36, fat: 6, fiber: 1, sodium: 350,
            tags: ['easy_digest', 'lean_protein', 'low_fiber', 'comfort'],
            allergens: ['sesame'],
            suitable: ['ibs', 'liver_disease', 'kidney_disease', 'celiac'],
            unsuitable: [],
            diet: [],
            ingredients: ['white rice', 'chicken breast', 'fresh ginger', 'scallions', 'sesame oil'],
            category_ingredients: { grains: ['white rice'], proteins: ['chicken breast'], vegetables: ['fresh ginger', 'scallions'], pantry: ['sesame oil'] }
        },
        {
            name: 'Cottage Cheese & Fruit Bowl',
            description: 'Low-fat cottage cheese with sliced peaches, a handful of almonds, and a drizzle of honey.',
            calories: 300, protein: 22, carbs: 30, fat: 10, fiber: 3, sodium: 380,
            tags: ['calcium_rich', 'high_protein', 'low_fat'],
            allergens: ['dairy', 'nuts'],
            suitable: ['osteoporosis', 'obesity', 'gout', 'diabetes'],
            unsuitable: ['kidney_disease'],
            diet: ['vegetarian'],
            ingredients: ['cottage cheese (low-fat)', 'peaches', 'almonds', 'honey'],
            category_ingredients: { dairy: ['cottage cheese (low-fat)'], fruits: ['peaches'], nuts: ['almonds'], pantry: ['honey'] }
        },
        {
            name: 'Buckwheat Pancakes with Berries',
            description: 'Fluffy buckwheat pancakes served with fresh berries and a light drizzle of pure maple syrup.',
            calories: 340, protein: 10, carbs: 52, fat: 10, fiber: 5, sodium: 280,
            tags: ['whole_grains', 'antioxidants', 'gluten_free_grain'],
            allergens: ['eggs'],
            suitable: ['celiac', 'heart_disease', 'hypertension', 'anemia'],
            unsuitable: [],
            diet: ['vegetarian'],
            ingredients: ['buckwheat flour', 'egg', 'mixed berries', 'maple syrup', 'coconut oil'],
            category_ingredients: { grains: ['buckwheat flour'], proteins: ['egg'], fruits: ['mixed berries'], pantry: ['maple syrup', 'coconut oil'] }
        }
    ],
    lunch: [
        {
            name: 'Double Chicken & Rice Power Bowl',
            description: 'Two grilled chicken breasts over brown rice with steamed broccoli and a squeeze of lemon.',
            calories: 560, protein: 52, carbs: 48, fat: 12, fiber: 6, sodium: 320,
            tags: ['high_protein', 'lean_protein', 'whole_grains', 'iron_rich'],
            allergens: [],
            suitable: ['obesity', 'diabetes', 'anemia', 'heart_disease', 'cholesterol', 'hypertension', 'celiac', 'gout'],
            unsuitable: [],
            diet: [],
            ingredients: ['chicken breast (2)', 'brown rice', 'broccoli', 'lemon', 'olive oil'],
            category_ingredients: { proteins: ['chicken breast (2)'], grains: ['brown rice'], vegetables: ['broccoli'], pantry: ['lemon', 'olive oil'] }
        },
        {
            name: 'Tuna & White Bean Salad',
            description: 'Canned tuna mixed with white beans, cherry tomatoes, red onion, and a lemon-olive oil dressing over mixed greens.',
            calories: 420, protein: 44, carbs: 30, fat: 14, fiber: 8, sodium: 380,
            tags: ['high_protein', 'omega3', 'fiber', 'iron_rich'],
            allergens: ['fish'],
            suitable: ['obesity', 'diabetes', 'anemia', 'heart_disease', 'cholesterol', 'hypertension', 'celiac'],
            unsuitable: ['gout', 'kidney_disease'],
            diet: ['pescatarian'],
            ingredients: ['canned tuna', 'white beans', 'cherry tomatoes', 'red onion', 'mixed greens', 'lemon', 'olive oil'],
            category_ingredients: { proteins: ['canned tuna', 'white beans'], vegetables: ['cherry tomatoes', 'red onion', 'mixed greens'], pantry: ['lemon', 'olive oil'] }
        },
        {
            name: 'Grilled Chicken Salad',
            description: 'Mixed greens with grilled chicken breast, cherry tomatoes, cucumber, avocado, and lemon vinaigrette.',
            calories: 420, protein: 35, carbs: 18, fat: 24, fiber: 7, sodium: 280,
            tags: ['high_protein', 'lean_protein', 'healthy_fats', 'low_carb'],
            allergens: [],
            suitable: ['diabetes', 'obesity', 'heart_disease', 'cholesterol', 'hypertension', 'celiac', 'ibs', 'gout'],
            unsuitable: [],
            diet: [],
            ingredients: ['chicken breast', 'mixed greens', 'cherry tomatoes', 'cucumber', 'avocado', 'lemon', 'olive oil'],
            category_ingredients: { proteins: ['chicken breast'], vegetables: ['mixed greens', 'cherry tomatoes', 'cucumber', 'avocado'], pantry: ['lemon', 'olive oil'] }
        },
        {
            name: 'Lentil & Vegetable Soup',
            description: 'Hearty soup with red lentils, carrots, celery, tomatoes, and warming spices. Served with a side of crusty bread.',
            calories: 380, protein: 18, carbs: 56, fat: 8, fiber: 14, sodium: 320,
            tags: ['fiber', 'iron_rich', 'high_protein', 'low_fat'],
            allergens: ['gluten'],
            suitable: ['anemia', 'heart_disease', 'cholesterol', 'diabetes', 'obesity', 'hypertension'],
            unsuitable: ['kidney_disease', 'ibs', 'celiac'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['red lentils', 'carrots', 'celery', 'diced tomatoes', 'cumin', 'crusty bread', 'olive oil'],
            category_ingredients: { proteins: ['red lentils'], vegetables: ['carrots', 'celery', 'diced tomatoes'], grains: ['crusty bread'], pantry: ['cumin', 'olive oil'] }
        },
        {
            name: 'Salmon & Quinoa Bowl',
            description: 'Baked salmon fillet over quinoa with steamed broccoli, edamame, and a ginger-soy glaze.',
            calories: 480, protein: 36, carbs: 40, fat: 18, fiber: 7, sodium: 380,
            tags: ['omega3', 'high_protein', 'whole_grains', 'calcium_rich'],
            allergens: ['fish', 'soy'],
            suitable: ['heart_disease', 'cholesterol', 'osteoporosis', 'anemia', 'diabetes', 'hypertension'],
            unsuitable: ['kidney_disease', 'gout'],
            diet: ['pescatarian'],
            ingredients: ['salmon fillet', 'quinoa', 'broccoli', 'edamame', 'ginger', 'low-sodium soy sauce'],
            category_ingredients: { proteins: ['salmon fillet', 'edamame'], grains: ['quinoa'], vegetables: ['broccoli', 'ginger'], pantry: ['low-sodium soy sauce'] }
        },
        {
            name: 'Turkey & Avocado Lettuce Wraps',
            description: 'Butter lettuce wraps filled with seasoned ground turkey, diced avocado, salsa, and lime.',
            calories: 360, protein: 28, carbs: 14, fat: 22, fiber: 6, sodium: 340,
            tags: ['low_carb', 'lean_protein', 'healthy_fats', 'gluten_free'],
            allergens: [],
            suitable: ['diabetes', 'obesity', 'celiac', 'heart_disease', 'ibs', 'liver_disease', 'cholesterol'],
            unsuitable: [],
            diet: [],
            ingredients: ['ground turkey (lean)', 'butter lettuce', 'avocado', 'salsa', 'lime', 'cumin'],
            category_ingredients: { proteins: ['ground turkey (lean)'], vegetables: ['butter lettuce', 'avocado'], pantry: ['salsa', 'lime', 'cumin'] }
        },
        {
            name: 'Mediterranean Chickpea Bowl',
            description: 'Chickpeas with cucumber, tomatoes, red onion, Kalamata olives, feta, and oregano dressing over brown rice.',
            calories: 440, protein: 16, carbs: 58, fat: 16, fiber: 10, sodium: 420,
            tags: ['fiber', 'plant_protein', 'healthy_fats', 'iron_rich'],
            allergens: ['dairy'],
            suitable: ['heart_disease', 'cholesterol', 'anemia', 'diabetes', 'hypertension'],
            unsuitable: ['kidney_disease', 'ibs'],
            diet: ['vegetarian'],
            ingredients: ['chickpeas', 'cucumber', 'tomatoes', 'red onion', 'Kalamata olives', 'feta cheese', 'brown rice', 'oregano', 'olive oil'],
            category_ingredients: { proteins: ['chickpeas'], vegetables: ['cucumber', 'tomatoes', 'red onion', 'Kalamata olives'], dairy: ['feta cheese'], grains: ['brown rice'], pantry: ['oregano', 'olive oil'] }
        },
        {
            name: 'Chicken Stir-Fry with Rice',
            description: 'Chicken breast stir-fried with bell peppers, snap peas, carrots, and ginger-garlic sauce over jasmine rice.',
            calories: 450, protein: 30, carbs: 52, fat: 12, fiber: 5, sodium: 440,
            tags: ['lean_protein', 'vitamin_c', 'balanced'],
            allergens: ['soy'],
            suitable: ['diabetes', 'anemia', 'obesity', 'osteoporosis', 'cholesterol'],
            unsuitable: ['ibs', 'kidney_disease'],
            diet: [],
            ingredients: ['chicken breast', 'bell peppers', 'snap peas', 'carrots', 'ginger', 'garlic', 'low-sodium soy sauce', 'jasmine rice'],
            category_ingredients: { proteins: ['chicken breast'], vegetables: ['bell peppers', 'snap peas', 'carrots', 'ginger', 'garlic'], grains: ['jasmine rice'], pantry: ['low-sodium soy sauce'] }
        },
        {
            name: 'Tuna Nicoise Salad',
            description: 'Seared tuna over mixed greens with green beans, boiled egg, olives, potatoes, and Dijon vinaigrette.',
            calories: 410, protein: 32, carbs: 28, fat: 18, fiber: 6, sodium: 350,
            tags: ['omega3', 'high_protein', 'iron_rich', 'vitamin_c'],
            allergens: ['fish', 'eggs'],
            suitable: ['heart_disease', 'cholesterol', 'anemia', 'osteoporosis', 'diabetes'],
            unsuitable: ['gout', 'kidney_disease'],
            diet: ['pescatarian'],
            ingredients: ['tuna steak', 'mixed greens', 'green beans', 'egg', 'olives', 'baby potatoes', 'Dijon mustard', 'olive oil'],
            category_ingredients: { proteins: ['tuna steak', 'egg'], vegetables: ['mixed greens', 'green beans', 'olives', 'baby potatoes'], pantry: ['Dijon mustard', 'olive oil'] }
        },
        {
            name: 'Black Bean & Sweet Potato Tacos',
            description: 'Corn tortillas filled with roasted sweet potato, seasoned black beans, cabbage slaw, and lime crema.',
            calories: 420, protein: 14, carbs: 62, fat: 14, fiber: 12, sodium: 300,
            tags: ['fiber', 'plant_protein', 'iron_rich', 'potassium_rich'],
            allergens: ['corn', 'dairy'],
            suitable: ['hypertension', 'anemia', 'heart_disease', 'cholesterol', 'celiac', 'gout'],
            unsuitable: ['kidney_disease', 'ibs'],
            diet: ['vegetarian'],
            ingredients: ['corn tortillas', 'sweet potato', 'black beans', 'cabbage', 'lime', 'Greek yogurt', 'cumin', 'chili powder'],
            category_ingredients: { grains: ['corn tortillas'], vegetables: ['sweet potato', 'cabbage'], proteins: ['black beans'], dairy: ['Greek yogurt'], pantry: ['lime', 'cumin', 'chili powder'] }
        },
        {
            name: 'Chicken & Rice Soup',
            description: 'Light and comforting soup with shredded chicken, white rice, carrots, and celery in a clear broth.',
            calories: 300, protein: 24, carbs: 34, fat: 6, fiber: 2, sodium: 380,
            tags: ['easy_digest', 'lean_protein', 'comfort', 'low_fat'],
            allergens: [],
            suitable: ['ibs', 'liver_disease', 'kidney_disease', 'celiac', 'gout', 'obesity'],
            unsuitable: [],
            diet: [],
            ingredients: ['chicken breast', 'white rice', 'carrots', 'celery', 'chicken broth (low-sodium)', 'parsley'],
            category_ingredients: { proteins: ['chicken breast'], grains: ['white rice'], vegetables: ['carrots', 'celery', 'parsley'], pantry: ['chicken broth (low-sodium)'] }
        },
        {
            name: 'Caprese Sandwich on Whole Grain',
            description: 'Fresh mozzarella, tomato, basil, and balsamic glaze on toasted whole grain bread.',
            calories: 400, protein: 18, carbs: 40, fat: 18, fiber: 5, sodium: 480,
            tags: ['calcium_rich', 'whole_grains', 'antioxidants'],
            allergens: ['dairy', 'gluten'],
            suitable: ['osteoporosis', 'anemia', 'gout'],
            unsuitable: ['celiac', 'kidney_disease', 'hypertension'],
            diet: ['vegetarian'],
            ingredients: ['whole grain bread', 'fresh mozzarella', 'tomato', 'fresh basil', 'balsamic glaze', 'olive oil'],
            category_ingredients: { grains: ['whole grain bread'], dairy: ['fresh mozzarella'], vegetables: ['tomato', 'fresh basil'], pantry: ['balsamic glaze', 'olive oil'] }
        },
        {
            name: 'Shrimp & Zucchini Noodles',
            description: 'Sauteed shrimp with spiralized zucchini, cherry tomatoes, garlic, and a squeeze of lemon.',
            calories: 280, protein: 28, carbs: 14, fat: 12, fiber: 4, sodium: 380,
            tags: ['low_carb', 'high_protein', 'low_calorie', 'vitamin_c'],
            allergens: ['shellfish'],
            suitable: ['diabetes', 'obesity', 'celiac', 'heart_disease', 'cholesterol', 'liver_disease'],
            unsuitable: ['gout', 'kidney_disease'],
            diet: ['pescatarian'],
            ingredients: ['shrimp', 'zucchini', 'cherry tomatoes', 'garlic', 'lemon', 'olive oil'],
            category_ingredients: { proteins: ['shrimp'], vegetables: ['zucchini', 'cherry tomatoes', 'garlic'], pantry: ['lemon', 'olive oil'] }
        },
        {
            name: 'Tofu & Vegetable Curry',
            description: 'Firm tofu in a mild coconut curry sauce with spinach, bell peppers, and served over basmati rice.',
            calories: 430, protein: 18, carbs: 50, fat: 18, fiber: 6, sodium: 320,
            tags: ['plant_protein', 'iron_rich', 'calcium_rich', 'anti_inflammatory'],
            allergens: ['soy'],
            suitable: ['heart_disease', 'cholesterol', 'anemia', 'gout', 'hypertension', 'osteoporosis'],
            unsuitable: ['ibs'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['firm tofu', 'coconut milk (light)', 'spinach', 'bell peppers', 'curry powder', 'basmati rice'],
            category_ingredients: { proteins: ['firm tofu'], vegetables: ['spinach', 'bell peppers'], grains: ['basmati rice'], pantry: ['coconut milk (light)', 'curry powder'] }
        }
    ],
    dinner: [
        {
            name: 'Grilled Steak with Sweet Potato',
            description: 'Lean grilled sirloin steak with a baked sweet potato and steamed green beans.',
            calories: 520, protein: 48, carbs: 38, fat: 18, fiber: 6, sodium: 280,
            tags: ['high_protein', 'iron_rich', 'lean_protein', 'potassium_rich'],
            allergens: [],
            suitable: ['anemia', 'obesity', 'diabetes', 'hypertension', 'celiac', 'osteoporosis'],
            unsuitable: ['gout', 'kidney_disease'],
            diet: [],
            ingredients: ['sirloin steak (lean)', 'sweet potato', 'green beans', 'olive oil', 'garlic'],
            category_ingredients: { proteins: ['sirloin steak (lean)'], vegetables: ['sweet potato', 'green beans', 'garlic'], pantry: ['olive oil'] }
        },
        {
            name: 'Turkey Meatballs with Quinoa',
            description: 'Baked turkey meatballs in marinara sauce served over quinoa with a side of steamed spinach.',
            calories: 500, protein: 44, carbs: 42, fat: 16, fiber: 7, sodium: 400,
            tags: ['high_protein', 'lean_protein', 'iron_rich', 'whole_grains'],
            allergens: ['eggs', 'gluten'],
            suitable: ['obesity', 'anemia', 'diabetes', 'heart_disease', 'cholesterol'],
            unsuitable: ['celiac', 'kidney_disease'],
            diet: [],
            ingredients: ['ground turkey (lean)', 'quinoa', 'marinara sauce', 'egg', 'breadcrumbs', 'spinach', 'garlic'],
            category_ingredients: { proteins: ['ground turkey (lean)', 'egg'], grains: ['quinoa', 'breadcrumbs'], vegetables: ['spinach', 'garlic'], pantry: ['marinara sauce'] }
        },
        {
            name: 'Baked Salmon with Roasted Vegetables',
            description: 'Herb-crusted salmon fillet with roasted asparagus, sweet potato, and a lemon-dill sauce.',
            calories: 480, protein: 36, carbs: 32, fat: 22, fiber: 7, sodium: 300,
            tags: ['omega3', 'high_protein', 'vitamin_d', 'potassium_rich'],
            allergens: ['fish'],
            suitable: ['heart_disease', 'cholesterol', 'osteoporosis', 'diabetes', 'hypertension', 'anemia'],
            unsuitable: ['kidney_disease', 'gout'],
            diet: ['pescatarian'],
            ingredients: ['salmon fillet', 'asparagus', 'sweet potato', 'lemon', 'fresh dill', 'olive oil', 'garlic'],
            category_ingredients: { proteins: ['salmon fillet'], vegetables: ['asparagus', 'sweet potato', 'garlic'], pantry: ['lemon', 'fresh dill', 'olive oil'] }
        },
        {
            name: 'Lean Beef & Broccoli Stir-Fry',
            description: 'Tender strips of lean beef with broccoli and bell peppers in a ginger-garlic sauce over brown rice.',
            calories: 460, protein: 32, carbs: 44, fat: 16, fiber: 6, sodium: 420,
            tags: ['iron_rich', 'high_protein', 'vitamin_c', 'whole_grains'],
            allergens: ['soy'],
            suitable: ['anemia', 'osteoporosis', 'obesity', 'diabetes'],
            unsuitable: ['gout', 'kidney_disease', 'ibs'],
            diet: [],
            ingredients: ['lean beef sirloin', 'broccoli', 'bell peppers', 'ginger', 'garlic', 'low-sodium soy sauce', 'brown rice'],
            category_ingredients: { proteins: ['lean beef sirloin'], vegetables: ['broccoli', 'bell peppers', 'ginger', 'garlic'], grains: ['brown rice'], pantry: ['low-sodium soy sauce'] }
        },
        {
            name: 'Grilled Chicken with Quinoa & Greens',
            description: 'Herb-marinated grilled chicken breast with fluffy quinoa, sauteed kale, and roasted cherry tomatoes.',
            calories: 440, protein: 38, carbs: 36, fat: 14, fiber: 6, sodium: 280,
            tags: ['high_protein', 'lean_protein', 'iron_rich', 'whole_grains'],
            allergens: [],
            suitable: ['diabetes', 'obesity', 'heart_disease', 'cholesterol', 'hypertension', 'anemia', 'celiac', 'gout'],
            unsuitable: [],
            diet: [],
            ingredients: ['chicken breast', 'quinoa', 'kale', 'cherry tomatoes', 'lemon', 'herbs', 'olive oil'],
            category_ingredients: { proteins: ['chicken breast'], grains: ['quinoa'], vegetables: ['kale', 'cherry tomatoes'], pantry: ['lemon', 'herbs', 'olive oil'] }
        },
        {
            name: 'Baked Cod with Herb Crust',
            description: 'Mild white cod with a herb-breadcrumb crust, served with mashed cauliflower and green beans.',
            calories: 360, protein: 32, carbs: 20, fat: 16, fiber: 5, sodium: 320,
            tags: ['lean_protein', 'low_carb', 'omega3', 'easy_digest'],
            allergens: ['fish', 'gluten'],
            suitable: ['diabetes', 'obesity', 'liver_disease', 'heart_disease', 'cholesterol', 'ibs'],
            unsuitable: ['celiac'],
            diet: ['pescatarian'],
            ingredients: ['cod fillet', 'whole wheat breadcrumbs', 'cauliflower', 'green beans', 'herbs', 'olive oil', 'lemon'],
            category_ingredients: { proteins: ['cod fillet'], grains: ['whole wheat breadcrumbs'], vegetables: ['cauliflower', 'green beans'], pantry: ['herbs', 'olive oil', 'lemon'] }
        },
        {
            name: 'Stuffed Bell Peppers',
            description: 'Bell peppers filled with lean ground turkey, brown rice, black beans, corn, and topped with melted cheese.',
            calories: 420, protein: 28, carbs: 42, fat: 14, fiber: 8, sodium: 380,
            tags: ['high_protein', 'fiber', 'iron_rich', 'vitamin_c'],
            allergens: ['dairy', 'corn'],
            suitable: ['diabetes', 'anemia', 'heart_disease', 'cholesterol', 'celiac'],
            unsuitable: ['kidney_disease', 'ibs'],
            diet: [],
            ingredients: ['bell peppers', 'ground turkey (lean)', 'brown rice', 'black beans', 'corn', 'shredded cheese', 'tomato sauce'],
            category_ingredients: { vegetables: ['bell peppers'], proteins: ['ground turkey (lean)', 'black beans'], grains: ['brown rice'], dairy: ['shredded cheese'], pantry: ['corn', 'tomato sauce'] }
        },
        {
            name: 'Vegetable & Chickpea Stew',
            description: 'Rich tomato-based stew with chickpeas, zucchini, carrots, spinach, and Mediterranean herbs.',
            calories: 380, protein: 16, carbs: 52, fat: 12, fiber: 14, sodium: 340,
            tags: ['fiber', 'iron_rich', 'plant_protein', 'low_fat', 'antioxidants'],
            allergens: [],
            suitable: ['heart_disease', 'cholesterol', 'diabetes', 'hypertension', 'anemia', 'obesity', 'celiac', 'gout'],
            unsuitable: ['kidney_disease', 'ibs'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['chickpeas', 'zucchini', 'carrots', 'spinach', 'diced tomatoes', 'oregano', 'olive oil'],
            category_ingredients: { proteins: ['chickpeas'], vegetables: ['zucchini', 'carrots', 'spinach', 'diced tomatoes'], pantry: ['oregano', 'olive oil'] }
        },
        {
            name: 'Chicken Fajita Bowl',
            description: 'Seasoned chicken strips with sauteed peppers and onions over cilantro-lime rice with guacamole.',
            calories: 460, protein: 32, carbs: 46, fat: 16, fiber: 6, sodium: 390,
            tags: ['high_protein', 'vitamin_c', 'lean_protein', 'balanced'],
            allergens: [],
            suitable: ['diabetes', 'obesity', 'celiac', 'heart_disease', 'anemia', 'cholesterol'],
            unsuitable: ['ibs', 'kidney_disease'],
            diet: [],
            ingredients: ['chicken breast', 'bell peppers', 'onion', 'jasmine rice', 'avocado', 'lime', 'cilantro', 'cumin'],
            category_ingredients: { proteins: ['chicken breast'], vegetables: ['bell peppers', 'onion', 'avocado', 'cilantro'], grains: ['jasmine rice'], pantry: ['lime', 'cumin'] }
        },
        {
            name: 'Pork Tenderloin with Apple Slaw',
            description: 'Herb-roasted pork tenderloin sliced thin, served with a crisp apple-cabbage slaw and roasted potatoes.',
            calories: 430, protein: 34, carbs: 38, fat: 14, fiber: 5, sodium: 280,
            tags: ['lean_protein', 'iron_rich', 'vitamin_c', 'balanced'],
            allergens: [],
            suitable: ['anemia', 'hypertension', 'diabetes', 'heart_disease', 'celiac', 'cholesterol'],
            unsuitable: ['kidney_disease'],
            diet: [],
            ingredients: ['pork tenderloin', 'apple', 'cabbage', 'potatoes', 'herbs', 'apple cider vinegar', 'olive oil'],
            category_ingredients: { proteins: ['pork tenderloin'], vegetables: ['cabbage', 'potatoes'], fruits: ['apple'], pantry: ['herbs', 'apple cider vinegar', 'olive oil'] }
        },
        {
            name: 'Eggplant Parmesan (Baked)',
            description: 'Sliced eggplant breaded and baked (not fried), layered with marinara sauce and melted mozzarella.',
            calories: 380, protein: 16, carbs: 38, fat: 18, fiber: 8, sodium: 450,
            tags: ['calcium_rich', 'fiber', 'antioxidants', 'vegetarian'],
            allergens: ['dairy', 'gluten', 'eggs'],
            suitable: ['osteoporosis', 'gout', 'anemia'],
            unsuitable: ['celiac', 'kidney_disease'],
            diet: ['vegetarian'],
            ingredients: ['eggplant', 'whole wheat breadcrumbs', 'marinara sauce', 'mozzarella cheese', 'egg', 'Parmesan', 'basil'],
            category_ingredients: { vegetables: ['eggplant', 'basil'], grains: ['whole wheat breadcrumbs'], dairy: ['mozzarella cheese', 'Parmesan'], proteins: ['egg'], pantry: ['marinara sauce'] }
        },
        {
            name: 'Steamed Fish with Ginger & Bok Choy',
            description: 'Delicate white fish steamed with ginger, soy sauce, and sesame oil. Served with steamed bok choy and white rice.',
            calories: 340, protein: 28, carbs: 36, fat: 8, fiber: 3, sodium: 360,
            tags: ['lean_protein', 'low_fat', 'easy_digest', 'omega3'],
            allergens: ['fish', 'soy', 'sesame'],
            suitable: ['liver_disease', 'ibs', 'kidney_disease', 'diabetes', 'obesity', 'heart_disease'],
            unsuitable: ['gout'],
            diet: ['pescatarian'],
            ingredients: ['white fish fillet (tilapia/sole)', 'ginger', 'bok choy', 'white rice', 'low-sodium soy sauce', 'sesame oil', 'scallions'],
            category_ingredients: { proteins: ['white fish fillet (tilapia/sole)'], vegetables: ['ginger', 'bok choy', 'scallions'], grains: ['white rice'], pantry: ['low-sodium soy sauce', 'sesame oil'] }
        },
        {
            name: 'Lemon Herb Roast Chicken',
            description: 'Roasted chicken thigh (skin removed) with lemon, rosemary, roasted carrots, and herbed couscous.',
            calories: 440, protein: 34, carbs: 38, fat: 16, fiber: 4, sodium: 350,
            tags: ['high_protein', 'iron_rich', 'lean_protein', 'comfort'],
            allergens: ['gluten'],
            suitable: ['anemia', 'obesity', 'diabetes', 'heart_disease', 'osteoporosis'],
            unsuitable: ['celiac', 'kidney_disease'],
            diet: [],
            ingredients: ['chicken thigh (skinless)', 'lemon', 'rosemary', 'carrots', 'couscous', 'olive oil'],
            category_ingredients: { proteins: ['chicken thigh (skinless)'], vegetables: ['carrots'], grains: ['couscous'], pantry: ['lemon', 'rosemary', 'olive oil'] }
        },
        {
            name: 'Veggie Pasta Primavera',
            description: 'Whole wheat penne with sauteed zucchini, mushrooms, cherry tomatoes, and a light garlic olive oil sauce.',
            calories: 400, protein: 14, carbs: 58, fat: 12, fiber: 8, sodium: 240,
            tags: ['fiber', 'whole_grains', 'antioxidants', 'low_sodium'],
            allergens: ['gluten'],
            suitable: ['hypertension', 'gout', 'anemia', 'heart_disease', 'cholesterol'],
            unsuitable: ['celiac', 'diabetes', 'kidney_disease'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['whole wheat penne', 'zucchini', 'mushrooms', 'cherry tomatoes', 'garlic', 'olive oil', 'basil'],
            category_ingredients: { grains: ['whole wheat penne'], vegetables: ['zucchini', 'mushrooms', 'cherry tomatoes', 'garlic', 'basil'], pantry: ['olive oil'] }
        }
    ],
    snack: [
        {
            name: 'Protein Shake',
            description: 'Protein powder blended with almond milk and a banana for a quick high-protein snack.',
            calories: 250, protein: 30, carbs: 24, fat: 4, fiber: 2, sodium: 150,
            tags: ['high_protein', 'quick', 'low_fat'],
            allergens: [],
            suitable: ['obesity', 'diabetes', 'anemia', 'heart_disease', 'celiac', 'hypertension', 'cholesterol'],
            unsuitable: ['kidney_disease'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['protein powder', 'almond milk', 'banana'],
            category_ingredients: { proteins: ['protein powder'], dairy: ['almond milk'], fruits: ['banana'] }
        },
        {
            name: 'Chicken Jerky & Almonds',
            description: 'Low-sodium chicken jerky with a small handful of almonds.',
            calories: 220, protein: 26, carbs: 8, fat: 10, fiber: 2, sodium: 320,
            tags: ['high_protein', 'low_carb', 'portable'],
            allergens: ['nuts'],
            suitable: ['obesity', 'diabetes', 'celiac', 'heart_disease', 'anemia'],
            unsuitable: ['kidney_disease', 'hypertension'],
            diet: [],
            ingredients: ['chicken jerky', 'almonds'],
            category_ingredients: { proteins: ['chicken jerky'], nuts: ['almonds'] }
        },
        {
            name: 'Apple Slices with Almond Butter',
            description: 'Crisp apple slices with a tablespoon of natural almond butter.',
            calories: 200, protein: 5, carbs: 26, fat: 10, fiber: 5, sodium: 5,
            tags: ['fiber', 'healthy_fats', 'low_sodium'],
            allergens: ['nuts'],
            suitable: ['diabetes', 'heart_disease', 'cholesterol', 'hypertension', 'ibs', 'celiac'],
            unsuitable: ['kidney_disease'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['apple', 'almond butter'],
            category_ingredients: { fruits: ['apple'], nuts: ['almond butter'] }
        },
        {
            name: 'Carrot & Celery Sticks with Hummus',
            description: 'Crunchy vegetable sticks with a quarter cup of classic hummus.',
            calories: 160, protein: 6, carbs: 18, fat: 8, fiber: 5, sodium: 240,
            tags: ['fiber', 'low_calorie', 'plant_protein'],
            allergens: ['sesame'],
            suitable: ['diabetes', 'obesity', 'heart_disease', 'cholesterol', 'celiac', 'gout'],
            unsuitable: ['kidney_disease'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['carrots', 'celery', 'hummus'],
            category_ingredients: { vegetables: ['carrots', 'celery'], pantry: ['hummus'] }
        },
        {
            name: 'Greek Yogurt with Honey',
            description: 'Small cup of plain low-fat Greek yogurt with a teaspoon of honey.',
            calories: 150, protein: 15, carbs: 16, fat: 3, fiber: 0, sodium: 60,
            tags: ['calcium_rich', 'probiotics', 'high_protein'],
            allergens: ['dairy'],
            suitable: ['osteoporosis', 'obesity', 'gout', 'hypertension', 'ibs'],
            unsuitable: ['kidney_disease'],
            diet: ['vegetarian'],
            ingredients: ['Greek yogurt (low-fat)', 'honey'],
            category_ingredients: { dairy: ['Greek yogurt (low-fat)'], pantry: ['honey'] }
        },
        {
            name: 'Mixed Nuts (Unsalted)',
            description: 'A small handful of unsalted mixed nuts: almonds, walnuts, and cashews.',
            calories: 180, protein: 6, carbs: 8, fat: 16, fiber: 2, sodium: 5,
            tags: ['healthy_fats', 'omega3', 'plant_sterols', 'low_sodium'],
            allergens: ['nuts'],
            suitable: ['heart_disease', 'cholesterol', 'diabetes', 'hypertension', 'celiac'],
            unsuitable: ['kidney_disease'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['almonds', 'walnuts', 'cashews'],
            category_ingredients: { nuts: ['almonds', 'walnuts', 'cashews'] }
        },
        {
            name: 'Rice Cakes with Avocado',
            description: 'Two brown rice cakes topped with mashed avocado and a pinch of sea salt.',
            calories: 170, protein: 3, carbs: 20, fat: 10, fiber: 4, sodium: 80,
            tags: ['healthy_fats', 'gluten_free', 'low_sodium'],
            allergens: [],
            suitable: ['celiac', 'diabetes', 'hypertension', 'heart_disease', 'ibs', 'liver_disease', 'cholesterol'],
            unsuitable: ['kidney_disease'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['brown rice cakes', 'avocado', 'sea salt'],
            category_ingredients: { grains: ['brown rice cakes'], vegetables: ['avocado'], pantry: ['sea salt'] }
        },
        {
            name: 'Hard-Boiled Eggs (2)',
            description: 'Two hard-boiled eggs with a sprinkle of paprika.',
            calories: 150, protein: 12, carbs: 1, fat: 10, fiber: 0, sodium: 140,
            tags: ['high_protein', 'vitamin_d', 'low_carb'],
            allergens: ['eggs'],
            suitable: ['diabetes', 'obesity', 'celiac', 'ibs', 'anemia', 'osteoporosis'],
            unsuitable: ['cholesterol', 'kidney_disease'],
            diet: ['vegetarian'],
            ingredients: ['eggs', 'paprika'],
            category_ingredients: { proteins: ['eggs'], pantry: ['paprika'] }
        },
        {
            name: 'Banana with Peanut Butter',
            description: 'A medium banana with a tablespoon of natural peanut butter.',
            calories: 200, protein: 6, carbs: 30, fat: 8, fiber: 4, sodium: 5,
            tags: ['potassium_rich', 'energy', 'fiber'],
            allergens: ['peanuts'],
            suitable: ['hypertension', 'heart_disease', 'anemia', 'celiac', 'cholesterol'],
            unsuitable: ['kidney_disease', 'diabetes'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['banana', 'peanut butter (natural)'],
            category_ingredients: { fruits: ['banana'], proteins: ['peanut butter (natural)'] }
        },
        {
            name: 'Cherry Tomatoes with Mozzarella',
            description: 'Cherry tomatoes paired with small fresh mozzarella balls and a drizzle of balsamic.',
            calories: 160, protein: 10, carbs: 10, fat: 10, fiber: 2, sodium: 200,
            tags: ['calcium_rich', 'antioxidants', 'low_carb'],
            allergens: ['dairy'],
            suitable: ['osteoporosis', 'diabetes', 'obesity', 'celiac', 'gout'],
            unsuitable: ['kidney_disease'],
            diet: ['vegetarian'],
            ingredients: ['cherry tomatoes', 'fresh mozzarella pearls', 'balsamic glaze'],
            category_ingredients: { vegetables: ['cherry tomatoes'], dairy: ['fresh mozzarella pearls'], pantry: ['balsamic glaze'] }
        },
        {
            name: 'Edamame (Steamed)',
            description: 'A cup of steamed edamame pods with a light sprinkle of sea salt.',
            calories: 180, protein: 16, carbs: 14, fat: 8, fiber: 8, sodium: 10,
            tags: ['plant_protein', 'fiber', 'iron_rich', 'calcium_rich'],
            allergens: ['soy'],
            suitable: ['heart_disease', 'cholesterol', 'anemia', 'obesity', 'hypertension', 'celiac', 'osteoporosis'],
            unsuitable: ['kidney_disease', 'ibs'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['edamame', 'sea salt'],
            category_ingredients: { proteins: ['edamame'], pantry: ['sea salt'] }
        },
        {
            name: 'Trail Mix (Low Sugar)',
            description: 'Mix of pumpkin seeds, sunflower seeds, dried cranberries, and dark chocolate chips.',
            calories: 200, protein: 6, carbs: 22, fat: 12, fiber: 3, sodium: 10,
            tags: ['iron_rich', 'healthy_fats', 'antioxidants'],
            allergens: [],
            suitable: ['anemia', 'celiac', 'hypertension', 'heart_disease'],
            unsuitable: ['kidney_disease', 'diabetes', 'obesity'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['pumpkin seeds', 'sunflower seeds', 'dried cranberries', 'dark chocolate chips'],
            category_ingredients: { nuts: ['pumpkin seeds', 'sunflower seeds'], fruits: ['dried cranberries'], pantry: ['dark chocolate chips'] }
        },
        {
            name: 'Cottage Cheese & Pineapple',
            description: 'Low-fat cottage cheese with fresh pineapple chunks.',
            calories: 140, protein: 14, carbs: 16, fat: 2, fiber: 1, sodium: 340,
            tags: ['calcium_rich', 'high_protein', 'low_fat', 'vitamin_c'],
            allergens: ['dairy'],
            suitable: ['osteoporosis', 'obesity', 'gout', 'anemia'],
            unsuitable: ['kidney_disease', 'hypertension'],
            diet: ['vegetarian'],
            ingredients: ['cottage cheese (low-fat)', 'pineapple'],
            category_ingredients: { dairy: ['cottage cheese (low-fat)'], fruits: ['pineapple'] }
        },
        {
            name: 'Oat Energy Balls',
            description: 'No-bake balls made with rolled oats, honey, flaxseed, and a touch of dark chocolate.',
            calories: 180, protein: 5, carbs: 28, fat: 7, fiber: 3, sodium: 20,
            tags: ['fiber', 'energy', 'whole_grains'],
            allergens: ['gluten'],
            suitable: ['heart_disease', 'cholesterol', 'hypertension', 'anemia'],
            unsuitable: ['celiac', 'diabetes', 'kidney_disease'],
            diet: ['vegetarian', 'vegan'],
            ingredients: ['rolled oats', 'honey', 'flaxseed', 'dark chocolate chips'],
            category_ingredients: { grains: ['rolled oats'], pantry: ['honey', 'flaxseed', 'dark chocolate chips'] }
        }
    ]
};

// ============================================================
// ULTRA HIGH PROTEIN MEALS (for serious bulk targets)
// ============================================================
MEALS.breakfast.push(
    {
        name: 'Mega Protein Breakfast Plate',
        description: 'Three eggs, four egg whites, lean turkey sausage, cottage cheese, and Greek yogurt with berries. Built for high-protein days.',
        calories: 560, protein: 70, carbs: 18, fat: 22, fiber: 2, sodium: 580,
        tags: ['high_protein', 'lean_protein', 'iron_rich', 'calcium_rich'],
        allergens: ['eggs', 'dairy'],
        suitable: ['obesity', 'diabetes', 'anemia', 'osteoporosis'],
        unsuitable: ['kidney_disease', 'cholesterol'],
        diet: [],
        cuisine: 'western',
        ingredients: ['eggs', 'egg whites', 'lean turkey sausage', 'cottage cheese', 'Greek yogurt', 'mixed berries'],
        category_ingredients: { proteins: ['eggs', 'egg whites', 'lean turkey sausage'], dairy: ['cottage cheese', 'Greek yogurt'], fruits: ['mixed berries'] }
    }
);

MEALS.lunch.push(
    {
        name: 'Triple Chicken Power Plate',
        description: 'Three grilled chicken breasts (12 oz total) with quinoa, steamed broccoli, and a light lemon-garlic sauce.',
        calories: 680, protein: 78, carbs: 50, fat: 14, fiber: 7, sodium: 360,
        tags: ['high_protein', 'lean_protein', 'iron_rich', 'whole_grains'],
        allergens: [],
        suitable: ['obesity', 'diabetes', 'anemia', 'heart_disease', 'cholesterol', 'celiac'],
        unsuitable: [],
        diet: [],
        cuisine: 'western',
        ingredients: ['chicken breast (3 portions)', 'quinoa', 'broccoli', 'lemon', 'garlic', 'olive oil'],
        category_ingredients: { proteins: ['chicken breast (3 portions)'], grains: ['quinoa'], vegetables: ['broccoli', 'garlic'], pantry: ['lemon', 'olive oil'] }
    }
);

MEALS.dinner.push(
    {
        name: 'Steak & Shrimp Surf-and-Turf',
        description: 'Lean sirloin steak (8 oz) and grilled shrimp (4 oz) with sweet potato and asparagus. Loaded with protein.',
        calories: 640, protein: 72, carbs: 38, fat: 20, fiber: 7, sodium: 420,
        tags: ['high_protein', 'iron_rich', 'omega3', 'lean_protein'],
        allergens: ['shellfish'],
        suitable: ['obesity', 'diabetes', 'anemia', 'osteoporosis'],
        unsuitable: ['gout', 'kidney_disease'],
        diet: [],
        cuisine: 'western',
        ingredients: ['sirloin steak (lean)', 'shrimp', 'sweet potato', 'asparagus', 'garlic', 'olive oil'],
        category_ingredients: { proteins: ['sirloin steak (lean)', 'shrimp'], vegetables: ['sweet potato', 'asparagus', 'garlic'], pantry: ['olive oil'] }
    },
    {
        name: 'Double Salmon & Quinoa Bowl',
        description: 'Two salmon fillets (12 oz total) over quinoa with edamame, kale, and a tahini drizzle.',
        calories: 720, protein: 64, carbs: 48, fat: 28, fiber: 9, sodium: 380,
        tags: ['high_protein', 'omega3', 'iron_rich', 'whole_grains'],
        allergens: ['fish', 'sesame'],
        suitable: ['heart_disease', 'cholesterol', 'osteoporosis', 'anemia', 'diabetes'],
        unsuitable: ['kidney_disease', 'gout'],
        diet: ['pescatarian'],
        cuisine: 'mediterranean',
        ingredients: ['salmon fillets (2)', 'quinoa', 'edamame', 'kale', 'tahini', 'lemon'],
        category_ingredients: { proteins: ['salmon fillets (2)', 'edamame'], grains: ['quinoa'], vegetables: ['kale'], pantry: ['tahini', 'lemon'] }
    }
);

MEALS.snack.push(
    {
        name: 'Double Protein Shake',
        description: 'Two scoops of protein powder blended with milk, banana, and peanut butter.',
        calories: 380, protein: 50, carbs: 32, fat: 10, fiber: 3, sodium: 220,
        tags: ['high_protein', 'quick'],
        allergens: ['dairy', 'peanuts'],
        suitable: ['obesity', 'diabetes', 'anemia'],
        unsuitable: ['kidney_disease'],
        diet: ['vegetarian'],
        cuisine: 'western',
        ingredients: ['protein powder (2 scoops)', 'milk', 'banana', 'peanut butter'],
        category_ingredients: { proteins: ['protein powder (2 scoops)', 'peanut butter'], dairy: ['milk'], fruits: ['banana'] }
    }
);

// Recipes for the ultra-high-protein additions
const ULTRA_PROTEIN_RECIPES = {
    'Mega Protein Breakfast Plate': {
        prepTime: '5 min', cookTime: '10 min', servings: 1,
        ingredientsList: ['3 large eggs', '4 egg whites', '3 oz (85g) lean turkey sausage', '1/2 cup (115g) cottage cheese', '1/2 cup (115g) Greek yogurt', '1/2 cup (75g) mixed berries', 'Cooking spray'],
        steps: [
            'Cook turkey sausage in a non-stick pan until browned, 4-5 minutes.',
            'Whisk eggs and egg whites together with salt and pepper.',
            'Pour into the same pan and scramble until set.',
            'Plate the eggs and sausage.',
            'Serve with cottage cheese on the side and Greek yogurt topped with berries.'
        ]
    },
    'Triple Chicken Power Plate': {
        prepTime: '10 min', cookTime: '20 min', servings: 1,
        ingredientsList: ['3 chicken breasts (12 oz / 340g total)', '3/4 cup (130g) cooked quinoa', '2 cups (180g) broccoli florets', '1 lemon, juiced', '3 garlic cloves, minced', '1 tbsp olive oil', 'Salt and pepper'],
        steps: [
            'Season chicken with salt, pepper, garlic, and lemon juice.',
            'Grill or pan-sear 5-6 minutes per side until cooked through.',
            'Cook quinoa according to package directions.',
            'Steam broccoli for 4-5 minutes.',
            'Slice chicken and serve over quinoa with broccoli on the side.',
            'Drizzle with olive oil and an extra squeeze of lemon.'
        ]
    },
    'Steak & Shrimp Surf-and-Turf': {
        prepTime: '10 min', cookTime: '20 min', servings: 1,
        ingredientsList: ['8 oz (225g) lean sirloin steak', '4 oz (115g) raw shrimp, peeled', '1 medium sweet potato', '1 bunch (200g) asparagus', '3 garlic cloves, minced', '1 tbsp olive oil', 'Salt and pepper'],
        steps: [
            'Preheat oven to 400°F (200°C).',
            'Pierce sweet potato and bake 40 minutes (or microwave 6-7 minutes).',
            'Season steak with salt, pepper, and garlic. Grill 4-5 minutes per side for medium.',
            'Toss shrimp with olive oil, salt, and pepper. Sear 2 minutes per side until pink.',
            'Steam or roast asparagus 5-6 minutes.',
            'Plate everything together and serve.'
        ]
    },
    'Double Salmon & Quinoa Bowl': {
        prepTime: '10 min', cookTime: '20 min', servings: 1,
        ingredientsList: ['2 salmon fillets (12 oz / 340g total)', '3/4 cup (130g) cooked quinoa', '1/2 cup (75g) edamame', '2 cups (60g) kale, chopped', '1 tbsp tahini', '1 lemon, juiced', 'Salt and pepper'],
        steps: [
            'Preheat oven to 400°F (200°C).',
            'Season salmon with salt, pepper, and lemon juice. Bake 12-15 minutes.',
            'Cook quinoa according to package directions.',
            'Steam edamame for 4 minutes.',
            'Massage kale with a little olive oil and lemon juice.',
            'Build bowl: quinoa base, salmon on top, edamame and kale on the sides.',
            'Drizzle with tahini and serve.'
        ]
    },
    'Double Protein Shake': {
        prepTime: '3 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['2 scoops (60g) whey protein powder', '1.5 cups (360ml) milk', '1 medium banana', '1 tbsp natural peanut butter'],
        steps: [
            'Add all ingredients to a blender.',
            'Blend on high for 45-60 seconds until smooth.',
            'Pour and drink immediately.'
        ]
    }
};

// ============================================================
// CURATED INTERNET RECIPES — Inspired by popular healthy recipe sites
// ============================================================
MEALS.lunch.push(
    {
        name: 'Honey Garlic Chicken Meal Prep',
        description: 'Pan-seared chicken thighs glazed with a sweet honey-garlic-soy sauce, served with brown rice and steamed broccoli. Inspired by Healthy Fitness Meals.',
        calories: 574, protein: 58, carbs: 46, fat: 18, fiber: 4, sodium: 480,
        tags: ['high_protein', 'meal_prep', 'lean_protein', 'iron_rich'],
        allergens: ['soy'],
        suitable: ['obesity', 'diabetes', 'anemia', 'heart_disease', 'cholesterol'],
        unsuitable: ['kidney_disease', 'hypertension'],
        diet: [],
        cuisine: 'east_asian',
        ingredients: ['chicken thighs (boneless, skinless)', 'honey', 'soy sauce', 'garlic', 'rice vinegar', 'sesame oil', 'brown rice', 'broccoli'],
        category_ingredients: { proteins: ['chicken thighs (boneless, skinless)'], grains: ['brown rice'], vegetables: ['broccoli', 'garlic'], pantry: ['honey', 'soy sauce', 'rice vinegar', 'sesame oil'] }
    },
    {
        name: 'Healthy Sesame Chicken',
        description: 'Better-than-takeout sesame chicken with a light, sweet-savory sauce, sesame seeds, and steamed jasmine rice. Inspired by The Protein Chef.',
        calories: 333, protein: 37, carbs: 12, fat: 15, fiber: 2, sodium: 420,
        tags: ['high_protein', 'low_carb', 'lean_protein'],
        allergens: ['soy', 'sesame'],
        suitable: ['obesity', 'diabetes', 'anemia', 'heart_disease', 'cholesterol'],
        unsuitable: ['kidney_disease', 'hypertension'],
        diet: [],
        cuisine: 'east_asian',
        ingredients: ['chicken breast', 'low-sodium soy sauce', 'honey', 'rice vinegar', 'sesame seeds', 'garlic', 'cornstarch', 'green onions'],
        category_ingredients: { proteins: ['chicken breast'], vegetables: ['garlic', 'green onions'], pantry: ['low-sodium soy sauce', 'honey', 'rice vinegar', 'sesame seeds', 'cornstarch'] }
    },
    {
        name: 'High Protein Tuscan Chicken',
        description: 'Creamy Tuscan chicken with sun-dried tomatoes, spinach, and garlic in a light cream sauce. Inspired by Joy to the Food.',
        calories: 527, protein: 61, carbs: 12, fat: 26, fiber: 3, sodium: 460,
        tags: ['high_protein', 'low_carb', 'iron_rich', 'calcium_rich'],
        allergens: ['dairy'],
        suitable: ['obesity', 'diabetes', 'anemia', 'osteoporosis'],
        unsuitable: ['kidney_disease', 'cholesterol'],
        diet: [],
        cuisine: 'mediterranean',
        ingredients: ['chicken breast', 'sun-dried tomatoes', 'spinach', 'garlic', 'cream cheese (light)', 'parmesan cheese', 'chicken broth', 'Italian herbs', 'olive oil'],
        category_ingredients: { proteins: ['chicken breast'], vegetables: ['sun-dried tomatoes', 'spinach', 'garlic'], dairy: ['cream cheese (light)', 'parmesan cheese'], pantry: ['chicken broth', 'Italian herbs', 'olive oil'] }
    }
);

MEALS.dinner.push(
    {
        name: 'Sheet Pan Salmon with Potatoes',
        description: 'One-pan salmon with baby potatoes and roasted vegetables in a zesty lemon-garlic-Dijon sauce. Inspired by Food by Maria.',
        calories: 614, protein: 43, carbs: 43, fat: 32, fiber: 6, sodium: 380,
        tags: ['omega3', 'high_protein', 'one_pan', 'potassium_rich'],
        allergens: ['fish'],
        suitable: ['heart_disease', 'cholesterol', 'osteoporosis', 'anemia', 'diabetes', 'hypertension'],
        unsuitable: ['kidney_disease', 'gout', 'obesity'],
        diet: ['pescatarian'],
        cuisine: 'mediterranean',
        ingredients: ['salmon fillets', 'baby potatoes', 'lemon juice', 'olive oil', 'Dijon mustard', 'dried oregano', 'garlic cloves', 'asparagus', 'salt', 'black pepper'],
        category_ingredients: { proteins: ['salmon fillets'], vegetables: ['baby potatoes', 'asparagus', 'garlic cloves'], pantry: ['lemon juice', 'olive oil', 'Dijon mustard', 'dried oregano', 'salt', 'black pepper'] }
    },
    {
        name: 'Honey Garlic Salmon',
        description: 'Quick pan-seared salmon glazed with a 3-ingredient honey-garlic-soy sauce. Inspired by Healthy Fitness Meals.',
        calories: 314, protein: 35, carbs: 9, fat: 14, fiber: 0, sodium: 360,
        tags: ['omega3', 'high_protein', 'quick', 'low_carb'],
        allergens: ['fish', 'soy'],
        suitable: ['heart_disease', 'cholesterol', 'diabetes', 'obesity', 'anemia'],
        unsuitable: ['kidney_disease', 'gout', 'hypertension'],
        diet: ['pescatarian'],
        cuisine: 'east_asian',
        ingredients: ['salmon fillets', 'honey', 'low-sodium soy sauce', 'garlic', 'olive oil', 'lemon juice'],
        category_ingredients: { proteins: ['salmon fillets'], vegetables: ['garlic'], pantry: ['honey', 'low-sodium soy sauce', 'olive oil', 'lemon juice'] }
    },
    {
        name: 'EatingWell Grilled Chicken with Peaches',
        description: 'Grilled chicken thighs paired with sweet grilled peaches, fresh basil, and a balsamic glaze. Inspired by EatingWell summer dinner.',
        calories: 342, protein: 33, carbs: 7, fat: 20, fiber: 1, sodium: 320,
        tags: ['high_protein', 'lean_protein', 'low_carb', 'antioxidants'],
        allergens: [],
        suitable: ['obesity', 'diabetes', 'celiac', 'heart_disease', 'anemia', 'gout'],
        unsuitable: ['kidney_disease'],
        diet: [],
        cuisine: 'mediterranean',
        ingredients: ['chicken thighs (boneless, skinless)', 'fresh peaches', 'fresh basil', 'balsamic vinegar', 'olive oil', 'garlic', 'salt', 'black pepper'],
        category_ingredients: { proteins: ['chicken thighs (boneless, skinless)'], fruits: ['fresh peaches'], vegetables: ['fresh basil', 'garlic'], pantry: ['balsamic vinegar', 'olive oil', 'salt', 'black pepper'] }
    }
);

// Recipes for the curated internet additions
const INTERNET_RECIPES = {
    'Honey Garlic Chicken Meal Prep': {
        prepTime: '10 min', cookTime: '20 min', servings: 4,
        source: 'Healthy Fitness Meals',
        ingredientsList: [
            '1.5 lbs (680g) boneless skinless chicken thighs',
            '1/3 cup (113g) honey',
            '1/4 cup (60ml) low-sodium soy sauce',
            '6 cloves garlic, minced',
            '2 tbsp rice vinegar',
            '1 tbsp sesame oil',
            '2 cups (370g) cooked brown rice',
            '4 cups (350g) broccoli florets',
            '1 tbsp olive oil for searing',
            'Salt and black pepper to taste'
        ],
        steps: [
            'Pat chicken thighs dry and season with salt and pepper.',
            'In a small bowl, whisk together honey, soy sauce, minced garlic, rice vinegar, and sesame oil.',
            'Heat olive oil in a large skillet over medium-high heat.',
            'Add chicken thighs and sear 5-6 minutes per side until golden and cooked through (165°F internal).',
            'Pour the honey garlic sauce over the chicken and simmer 2-3 minutes until thickened.',
            'Steam broccoli florets for 4-5 minutes until tender-crisp.',
            'Divide brown rice, broccoli, and chicken among 4 meal prep containers.',
            'Drizzle remaining sauce over each portion. Refrigerate up to 4 days.'
        ]
    },
    'Healthy Sesame Chicken': {
        prepTime: '10 min', cookTime: '15 min', servings: 4,
        source: 'The Protein Chef',
        ingredientsList: [
            '1.5 lbs (680g) chicken breast, cubed',
            '3 tbsp low-sodium soy sauce',
            '2 tbsp honey',
            '2 tbsp rice vinegar',
            '1 tbsp sesame seeds',
            '3 cloves garlic, minced',
            '1 tbsp cornstarch',
            '2 green onions, sliced',
            '1 tbsp olive oil',
            '1/4 cup (60ml) water'
        ],
        steps: [
            'Cube chicken breast into bite-sized pieces.',
            'In a bowl, whisk soy sauce, honey, rice vinegar, garlic, cornstarch, and water.',
            'Heat olive oil in a non-stick pan over medium-high heat.',
            'Add chicken and cook 6-8 minutes, stirring occasionally, until golden and cooked through.',
            'Pour the sauce over the chicken and stir until thickened, about 2 minutes.',
            'Sprinkle with sesame seeds and sliced green onions.',
            'Serve hot, optionally over steamed jasmine rice.'
        ]
    },
    'High Protein Tuscan Chicken': {
        prepTime: '10 min', cookTime: '20 min', servings: 4,
        source: 'Joy to the Food',
        ingredientsList: [
            '1.5 lbs (680g) chicken breast',
            '1/2 cup (50g) sun-dried tomatoes, chopped',
            '4 cups (120g) fresh spinach',
            '4 cloves garlic, minced',
            '4 oz (115g) light cream cheese',
            '1/4 cup (25g) grated parmesan',
            '1/2 cup (120ml) low-sodium chicken broth',
            '1 tsp Italian herbs',
            '2 tbsp olive oil',
            'Salt and black pepper to taste'
        ],
        steps: [
            'Season chicken breasts with salt, pepper, and Italian herbs.',
            'Heat olive oil in a large skillet over medium-high heat.',
            'Sear chicken 5-6 minutes per side until golden and cooked through. Remove and set aside.',
            'In the same skillet, add minced garlic and sun-dried tomatoes. Cook 1 minute.',
            'Pour in chicken broth and bring to a simmer, scraping up any brown bits.',
            'Stir in cream cheese until smooth, then add parmesan.',
            'Add spinach and stir until wilted, about 2 minutes.',
            'Return chicken to the pan, spoon sauce over, and simmer 2 more minutes. Serve.'
        ]
    },
    'Sheet Pan Salmon with Potatoes': {
        prepTime: '15 min', cookTime: '30 min', servings: 4,
        source: 'Food by Maria',
        ingredientsList: [
            '4 salmon fillets (6 oz / 170g each)',
            '1.5 lbs (680g) baby potatoes, halved',
            '1 bunch asparagus (about 1 lb / 450g), trimmed',
            '3 tbsp olive oil',
            '3 tbsp lemon juice',
            '2 tbsp Dijon mustard',
            '1 tsp dried oregano',
            '4 cloves garlic, minced',
            '1 tsp salt',
            '1/2 tsp black pepper',
            'Lemon wedges for serving'
        ],
        steps: [
            'Preheat oven to 425°F (220°C). Line a sheet pan with parchment paper.',
            'In a small bowl, whisk olive oil, lemon juice, Dijon mustard, oregano, garlic, salt, and pepper.',
            'Toss baby potatoes with 1/3 of the sauce and spread on the sheet pan.',
            'Roast potatoes for 15 minutes.',
            'Push potatoes to one side. Add salmon fillets and asparagus to the pan.',
            'Brush salmon and asparagus with the remaining sauce.',
            'Return to oven and bake 12-15 more minutes, until salmon flakes easily.',
            'Serve hot with lemon wedges.'
        ]
    },
    'Honey Garlic Salmon': {
        prepTime: '5 min', cookTime: '10 min', servings: 4,
        source: 'Healthy Fitness Meals',
        ingredientsList: [
            '4 salmon fillets (6 oz / 170g each)',
            '3 tbsp honey',
            '3 tbsp low-sodium soy sauce',
            '4 cloves garlic, minced',
            '2 tbsp olive oil',
            '1 tbsp lemon juice',
            'Salt and black pepper to taste',
            'Fresh parsley for garnish (optional)'
        ],
        steps: [
            'Pat salmon fillets dry and season with salt and pepper.',
            'In a small bowl, whisk honey, soy sauce, minced garlic, and lemon juice.',
            'Heat olive oil in a large skillet over medium-high heat.',
            'Add salmon skin-side up and sear 4 minutes until golden.',
            'Flip the salmon and pour the honey garlic sauce over the top.',
            'Cook 3-4 more minutes, basting with sauce, until salmon flakes easily.',
            'Garnish with fresh parsley and serve immediately.'
        ]
    },
    'EatingWell Grilled Chicken with Peaches': {
        prepTime: '10 min', cookTime: '15 min', servings: 4,
        source: 'EatingWell',
        ingredientsList: [
            '1.5 lbs (680g) boneless skinless chicken thighs',
            '3 ripe peaches, halved and pitted',
            '1/4 cup (10g) fresh basil leaves',
            '3 tbsp balsamic vinegar',
            '2 tbsp olive oil',
            '2 cloves garlic, minced',
            '1 tsp salt',
            '1/2 tsp black pepper'
        ],
        steps: [
            'Preheat grill or grill pan to medium-high heat.',
            'In a small bowl, whisk balsamic vinegar, 1 tbsp olive oil, minced garlic, salt, and pepper.',
            'Brush chicken thighs with the remaining olive oil and season with salt and pepper.',
            'Grill chicken 6-7 minutes per side until charred and cooked through (165°F internal).',
            'In the last 4 minutes, add peach halves cut-side down to the grill.',
            'Plate chicken and grilled peaches, drizzle with balsamic glaze.',
            'Top with torn fresh basil leaves and serve.'
        ]
    }
};

// ============================================================
// AUTO-TAG EXISTING MEALS WITH CUISINE
// ============================================================
const CUISINE_MAP = {
    // Breakfast
    'High-Protein Egg & Turkey Scramble': 'western',
    'Protein Oats': 'western',
    'Oatmeal with Berries & Walnuts': 'western',
    'Veggie Egg White Omelette': 'western',
    'Greek Yogurt Parfait': 'mediterranean',
    'Avocado Toast with Poached Egg': 'western',
    'Banana Peanut Butter Smoothie': 'western',
    'Quinoa Breakfast Bowl': 'western',
    'Smoked Salmon on Rice Cakes': 'western',
    'Sweet Potato & Black Bean Hash': 'latin',
    'Turkey & Spinach Breakfast Wrap': 'western',
    'Rice Porridge with Ginger & Chicken': 'east_asian',
    'Cottage Cheese & Fruit Bowl': 'western',
    'Buckwheat Pancakes with Berries': 'western',
    // Lunch
    'Double Chicken & Rice Power Bowl': 'western',
    'Tuna & White Bean Salad': 'mediterranean',
    'Grilled Chicken Salad': 'western',
    'Lentil & Vegetable Soup': 'mediterranean',
    'Salmon & Quinoa Bowl': 'western',
    'Turkey & Avocado Lettuce Wraps': 'western',
    'Mediterranean Chickpea Bowl': 'mediterranean',
    'Chicken Stir-Fry with Rice': 'east_asian',
    'Tuna Nicoise Salad': 'mediterranean',
    'Black Bean & Sweet Potato Tacos': 'latin',
    'Chicken & Rice Soup': 'western',
    'Caprese Sandwich on Whole Grain': 'mediterranean',
    'Shrimp & Zucchini Noodles': 'mediterranean',
    'Tofu & Vegetable Curry': 'south_asian',
    // Dinner
    'Grilled Steak with Sweet Potato': 'western',
    'Turkey Meatballs with Quinoa': 'western',
    'Baked Salmon with Roasted Vegetables': 'western',
    'Lean Beef & Broccoli Stir-Fry': 'east_asian',
    'Grilled Chicken with Quinoa & Greens': 'western',
    'Baked Cod with Herb Crust': 'western',
    'Stuffed Bell Peppers': 'western',
    'Vegetable & Chickpea Stew': 'mediterranean',
    'Chicken Fajita Bowl': 'latin',
    'Pork Tenderloin with Apple Slaw': 'western',
    'Eggplant Parmesan (Baked)': 'mediterranean',
    'Steamed Fish with Ginger & Bok Choy': 'east_asian',
    'Lemon Herb Roast Chicken': 'mediterranean',
    'Veggie Pasta Primavera': 'mediterranean',
    // Snacks
    'Protein Shake': 'western',
    'Chicken Jerky & Almonds': 'western',
    'Apple Slices with Almond Butter': 'western',
    'Carrot & Celery Sticks with Hummus': 'middle_eastern',
    'Greek Yogurt with Honey': 'mediterranean',
    'Mixed Nuts (Unsalted)': 'western',
    'Rice Cakes with Avocado': 'western',
    'Hard-Boiled Eggs (2)': 'western',
    'Banana with Peanut Butter': 'western',
    'Cherry Tomatoes with Mozzarella': 'mediterranean',
    'Edamame (Steamed)': 'japanese',
    'Trail Mix (Low Sugar)': 'western',
    'Cottage Cheese & Pineapple': 'western',
    'Oat Energy Balls': 'western',
    // Internet recipes
    'Honey Garlic Chicken Meal Prep': 'east_asian',
    'Healthy Sesame Chicken': 'east_asian',
    'High Protein Tuscan Chicken': 'mediterranean',
    'Sheet Pan Salmon with Potatoes': 'mediterranean',
    'Honey Garlic Salmon': 'east_asian',
    'EatingWell Grilled Chicken with Peaches': 'mediterranean',
    // Ultra high protein
    'Mega Protein Breakfast Plate': 'western',
    'Triple Chicken Power Plate': 'western',
    'Steak & Shrimp Surf-and-Turf': 'western',
    'Double Salmon & Quinoa Bowl': 'mediterranean',
    'Double Protein Shake': 'western'
};

// Apply cuisine tags
Object.values(MEALS).forEach(mealList => {
    mealList.forEach(meal => {
        meal.cuisine = CUISINE_MAP[meal.name] || 'western';
    });
});

// ============================================================
// CULTURAL MEALS — Additional meals from world cuisines
// ============================================================

// --- SOUTH ASIAN ---
MEALS.breakfast.push(
    {
        name: 'Masala Omelette with Roti',
        description: 'Spiced egg omelette with onions, green chillies, tomatoes, and cilantro, served with whole wheat roti.',
        calories: 360, protein: 20, carbs: 32, fat: 16, fiber: 4, sodium: 380,
        tags: ['high_protein', 'iron_rich', 'whole_grains'],
        allergens: ['eggs', 'gluten'],
        suitable: ['anemia', 'diabetes', 'obesity'],
        unsuitable: ['celiac'],
        diet: ['vegetarian'],
        cuisine: 'south_asian',
        ingredients: ['eggs', 'onion', 'green chilli', 'tomato', 'cilantro', 'whole wheat roti', 'oil'],
        category_ingredients: { proteins: ['eggs'], vegetables: ['onion', 'green chilli', 'tomato', 'cilantro'], grains: ['whole wheat roti'], pantry: ['oil'] }
    },
    {
        name: 'Poha (Flattened Rice)',
        description: 'Light and fluffy flattened rice tempered with mustard seeds, turmeric, peanuts, onions, and curry leaves.',
        calories: 280, protein: 8, carbs: 42, fat: 10, fiber: 3, sodium: 200,
        tags: ['low_fat', 'iron_rich', 'quick'],
        allergens: ['peanuts'],
        suitable: ['hypertension', 'heart_disease', 'celiac', 'liver_disease'],
        unsuitable: [],
        diet: ['vegetarian', 'vegan'],
        cuisine: 'south_asian',
        ingredients: ['poha (flattened rice)', 'mustard seeds', 'turmeric', 'peanuts', 'onion', 'curry leaves', 'lemon'],
        category_ingredients: { grains: ['poha (flattened rice)'], nuts: ['peanuts'], vegetables: ['onion', 'curry leaves'], pantry: ['mustard seeds', 'turmeric', 'lemon'] }
    },
    {
        name: 'Idli with Sambar',
        description: 'Steamed rice-lentil cakes served with a spiced lentil-vegetable stew and coconut chutney.',
        calories: 300, protein: 12, carbs: 50, fat: 6, fiber: 6, sodium: 280,
        tags: ['low_fat', 'fiber', 'probiotics', 'easy_digest'],
        allergens: [],
        suitable: ['heart_disease', 'cholesterol', 'hypertension', 'ibs', 'liver_disease', 'celiac', 'gout'],
        unsuitable: [],
        diet: ['vegetarian', 'vegan'],
        cuisine: 'south_asian',
        ingredients: ['idli batter (rice & urad dal)', 'mixed vegetables', 'toor dal', 'sambar powder', 'coconut', 'mustard seeds'],
        category_ingredients: { grains: ['idli batter (rice & urad dal)'], proteins: ['toor dal'], vegetables: ['mixed vegetables'], pantry: ['sambar powder', 'coconut', 'mustard seeds'] }
    }
);

MEALS.lunch.push(
    {
        name: 'Chicken Tikka with Brown Rice',
        description: 'Yogurt-marinated grilled chicken tikka with brown rice, raita, and a fresh salad.',
        calories: 460, protein: 36, carbs: 42, fat: 14, fiber: 4, sodium: 380,
        tags: ['high_protein', 'lean_protein', 'calcium_rich', 'whole_grains'],
        allergens: ['dairy'],
        suitable: ['diabetes', 'obesity', 'anemia', 'osteoporosis', 'heart_disease'],
        unsuitable: ['kidney_disease'],
        diet: [],
        cuisine: 'south_asian',
        ingredients: ['chicken breast', 'yogurt', 'tikka spices', 'brown rice', 'cucumber', 'tomato', 'mint'],
        category_ingredients: { proteins: ['chicken breast'], dairy: ['yogurt'], grains: ['brown rice'], vegetables: ['cucumber', 'tomato', 'mint'], pantry: ['tikka spices'] }
    },
    {
        name: 'Dal Tadka with Jeera Rice',
        description: 'Yellow lentils tempered with cumin, garlic, and ghee, served with cumin-spiced basmati rice.',
        calories: 420, protein: 18, carbs: 62, fat: 10, fiber: 10, sodium: 240,
        tags: ['fiber', 'iron_rich', 'plant_protein', 'low_sodium'],
        allergens: ['dairy'],
        suitable: ['anemia', 'heart_disease', 'cholesterol', 'hypertension', 'diabetes', 'gout'],
        unsuitable: ['kidney_disease', 'ibs'],
        diet: ['vegetarian'],
        cuisine: 'south_asian',
        ingredients: ['yellow lentils (toor dal)', 'basmati rice', 'cumin seeds', 'garlic', 'ghee', 'turmeric', 'tomato'],
        category_ingredients: { proteins: ['yellow lentils (toor dal)'], grains: ['basmati rice'], vegetables: ['garlic', 'tomato'], pantry: ['cumin seeds', 'ghee', 'turmeric'] }
    },
    {
        name: 'Chana Masala with Roti',
        description: 'Spiced chickpea curry with tomatoes, onions, and aromatic spices. Served with whole wheat roti.',
        calories: 400, protein: 16, carbs: 56, fat: 12, fiber: 12, sodium: 320,
        tags: ['fiber', 'iron_rich', 'plant_protein', 'antioxidants'],
        allergens: ['gluten'],
        suitable: ['anemia', 'heart_disease', 'cholesterol', 'diabetes', 'hypertension', 'gout'],
        unsuitable: ['celiac', 'kidney_disease', 'ibs'],
        diet: ['vegetarian', 'vegan'],
        cuisine: 'south_asian',
        ingredients: ['chickpeas', 'onion', 'tomatoes', 'garam masala', 'cumin', 'whole wheat roti', 'cilantro'],
        category_ingredients: { proteins: ['chickpeas'], vegetables: ['onion', 'tomatoes', 'cilantro'], grains: ['whole wheat roti'], pantry: ['garam masala', 'cumin'] }
    }
);

MEALS.dinner.push(
    {
        name: 'Tandoori Salmon with Mint Chutney',
        description: 'Salmon marinated in tandoori spices and yogurt, baked until charred, with fresh mint chutney and rice.',
        calories: 460, protein: 36, carbs: 36, fat: 18, fiber: 3, sodium: 340,
        tags: ['omega3', 'high_protein', 'calcium_rich'],
        allergens: ['fish', 'dairy'],
        suitable: ['heart_disease', 'cholesterol', 'osteoporosis', 'diabetes'],
        unsuitable: ['gout', 'kidney_disease'],
        diet: ['pescatarian'],
        cuisine: 'south_asian',
        ingredients: ['salmon fillet', 'yogurt', 'tandoori spice mix', 'basmati rice', 'mint', 'cilantro', 'lemon'],
        category_ingredients: { proteins: ['salmon fillet'], dairy: ['yogurt'], grains: ['basmati rice'], vegetables: ['mint', 'cilantro'], pantry: ['tandoori spice mix', 'lemon'] }
    },
    {
        name: 'Palak Paneer with Naan',
        description: 'Creamy spinach curry with paneer cheese, served with whole wheat naan bread.',
        calories: 440, protein: 22, carbs: 38, fat: 22, fiber: 6, sodium: 360,
        tags: ['calcium_rich', 'iron_rich', 'high_protein'],
        allergens: ['dairy', 'gluten'],
        suitable: ['anemia', 'osteoporosis', 'gout'],
        unsuitable: ['celiac', 'kidney_disease', 'obesity'],
        diet: ['vegetarian'],
        cuisine: 'south_asian',
        ingredients: ['spinach', 'paneer', 'onion', 'garlic', 'ginger', 'cream', 'whole wheat naan'],
        category_ingredients: { vegetables: ['spinach', 'onion', 'garlic', 'ginger'], dairy: ['paneer', 'cream'], grains: ['whole wheat naan'] }
    }
);

// --- EAST ASIAN ---
MEALS.breakfast.push(
    {
        name: 'Congee with Century Egg & Pork',
        description: 'Silky rice porridge topped with sliced century egg, shredded pork, ginger, and scallions.',
        calories: 320, protein: 18, carbs: 40, fat: 8, fiber: 1, sodium: 400,
        tags: ['easy_digest', 'comfort', 'lean_protein'],
        allergens: ['eggs'],
        suitable: ['ibs', 'liver_disease', 'celiac'],
        unsuitable: ['hypertension'],
        diet: [],
        cuisine: 'east_asian',
        ingredients: ['jasmine rice', 'century egg', 'pork loin', 'ginger', 'scallions', 'sesame oil', 'white pepper'],
        category_ingredients: { grains: ['jasmine rice'], proteins: ['century egg', 'pork loin'], vegetables: ['ginger', 'scallions'], pantry: ['sesame oil', 'white pepper'] }
    }
);

MEALS.lunch.push(
    {
        name: 'Kung Pao Chicken',
        description: 'Spicy diced chicken with peanuts, vegetables, and dried chillies in a savory sauce over steamed rice.',
        calories: 460, protein: 32, carbs: 44, fat: 16, fiber: 4, sodium: 480,
        tags: ['high_protein', 'vitamin_c'],
        allergens: ['peanuts', 'soy'],
        suitable: ['anemia', 'diabetes', 'obesity'],
        unsuitable: ['hypertension', 'kidney_disease', 'ibs'],
        diet: [],
        cuisine: 'east_asian',
        ingredients: ['chicken breast', 'peanuts', 'bell peppers', 'zucchini', 'dried chillies', 'low-sodium soy sauce', 'rice vinegar', 'steamed rice'],
        category_ingredients: { proteins: ['chicken breast'], nuts: ['peanuts'], vegetables: ['bell peppers', 'zucchini', 'dried chillies'], grains: ['steamed rice'], pantry: ['low-sodium soy sauce', 'rice vinegar'] }
    },
    {
        name: 'Mapo Tofu with Rice',
        description: 'Silky tofu in a spicy, savory sauce with ground pork, Sichuan peppercorns, and scallions over rice.',
        calories: 400, protein: 22, carbs: 44, fat: 14, fiber: 3, sodium: 420,
        tags: ['plant_protein', 'calcium_rich', 'iron_rich'],
        allergens: ['soy'],
        suitable: ['osteoporosis', 'anemia', 'heart_disease'],
        unsuitable: ['ibs', 'hypertension', 'kidney_disease'],
        diet: [],
        cuisine: 'east_asian',
        ingredients: ['firm tofu', 'ground pork (lean)', 'Sichuan peppercorns', 'chili bean paste', 'scallions', 'garlic', 'steamed rice'],
        category_ingredients: { proteins: ['firm tofu', 'ground pork (lean)'], vegetables: ['scallions', 'garlic'], grains: ['steamed rice'], pantry: ['Sichuan peppercorns', 'chili bean paste'] }
    }
);

MEALS.dinner.push(
    {
        name: 'Sweet & Sour Fish',
        description: 'Crispy baked white fish in a tangy sweet and sour sauce with pineapple, bell peppers, over jasmine rice.',
        calories: 400, protein: 28, carbs: 48, fat: 10, fiber: 3, sodium: 380,
        tags: ['lean_protein', 'vitamin_c', 'omega3'],
        allergens: ['fish', 'soy'],
        suitable: ['heart_disease', 'diabetes', 'cholesterol', 'obesity'],
        unsuitable: ['gout', 'kidney_disease'],
        diet: ['pescatarian'],
        cuisine: 'east_asian',
        ingredients: ['white fish fillet', 'pineapple', 'bell peppers', 'rice vinegar', 'tomato paste', 'jasmine rice'],
        category_ingredients: { proteins: ['white fish fillet'], fruits: ['pineapple'], vegetables: ['bell peppers'], grains: ['jasmine rice'], pantry: ['rice vinegar', 'tomato paste'] }
    }
);

// --- JAPANESE ---
MEALS.lunch.push(
    {
        name: 'Salmon Poke Bowl',
        description: 'Fresh salmon cubes over sushi rice with edamame, cucumber, avocado, pickled ginger, and soy-sesame dressing.',
        calories: 450, protein: 30, carbs: 46, fat: 16, fiber: 5, sodium: 420,
        tags: ['omega3', 'high_protein', 'healthy_fats'],
        allergens: ['fish', 'soy', 'sesame'],
        suitable: ['heart_disease', 'cholesterol', 'osteoporosis', 'anemia'],
        unsuitable: ['gout', 'kidney_disease', 'hypertension'],
        diet: ['pescatarian'],
        cuisine: 'japanese',
        ingredients: ['fresh salmon', 'sushi rice', 'edamame', 'cucumber', 'avocado', 'pickled ginger', 'soy sauce', 'sesame seeds'],
        category_ingredients: { proteins: ['fresh salmon', 'edamame'], grains: ['sushi rice'], vegetables: ['cucumber', 'avocado', 'pickled ginger'], pantry: ['soy sauce', 'sesame seeds'] }
    },
    {
        name: 'Chicken Teriyaki Don',
        description: 'Grilled chicken thigh glazed with homemade teriyaki sauce over steamed rice with steamed broccoli.',
        calories: 470, protein: 32, carbs: 52, fat: 14, fiber: 3, sodium: 440,
        tags: ['high_protein', 'lean_protein', 'balanced'],
        allergens: ['soy'],
        suitable: ['anemia', 'obesity', 'diabetes'],
        unsuitable: ['hypertension', 'kidney_disease'],
        diet: [],
        cuisine: 'japanese',
        ingredients: ['chicken thigh (skinless)', 'soy sauce', 'mirin', 'honey', 'steamed rice', 'broccoli', 'sesame seeds'],
        category_ingredients: { proteins: ['chicken thigh (skinless)'], grains: ['steamed rice'], vegetables: ['broccoli'], pantry: ['soy sauce', 'mirin', 'honey', 'sesame seeds'] }
    }
);

MEALS.dinner.push(
    {
        name: 'Miso Glazed Cod with Soba Noodles',
        description: 'White miso-marinated cod fillet, broiled until caramelized, with buckwheat soba noodles and steamed bok choy.',
        calories: 420, protein: 32, carbs: 44, fat: 10, fiber: 4, sodium: 380,
        tags: ['omega3', 'lean_protein', 'probiotics'],
        allergens: ['fish', 'soy', 'gluten'],
        suitable: ['heart_disease', 'cholesterol', 'diabetes', 'obesity'],
        unsuitable: ['celiac', 'gout', 'kidney_disease'],
        diet: ['pescatarian'],
        cuisine: 'japanese',
        ingredients: ['cod fillet', 'white miso paste', 'soba noodles', 'bok choy', 'mirin', 'ginger'],
        category_ingredients: { proteins: ['cod fillet'], grains: ['soba noodles'], vegetables: ['bok choy', 'ginger'], pantry: ['white miso paste', 'mirin'] }
    }
);

// --- KOREAN ---
MEALS.lunch.push(
    {
        name: 'Bibimbap',
        description: 'Korean rice bowl with seasoned vegetables (spinach, bean sprouts, carrots, zucchini), a fried egg, and gochujang sauce.',
        calories: 440, protein: 18, carbs: 58, fat: 14, fiber: 6, sodium: 380,
        tags: ['balanced', 'iron_rich', 'vitamin_c', 'fiber'],
        allergens: ['eggs', 'soy', 'sesame'],
        suitable: ['anemia', 'heart_disease', 'diabetes'],
        unsuitable: ['ibs', 'kidney_disease'],
        diet: ['vegetarian'],
        cuisine: 'korean',
        ingredients: ['steamed rice', 'spinach', 'bean sprouts', 'carrots', 'zucchini', 'egg', 'gochujang', 'sesame oil'],
        category_ingredients: { grains: ['steamed rice'], vegetables: ['spinach', 'bean sprouts', 'carrots', 'zucchini'], proteins: ['egg'], pantry: ['gochujang', 'sesame oil'] }
    }
);

MEALS.dinner.push(
    {
        name: 'Korean Beef Bulgogi with Rice',
        description: 'Thinly sliced beef marinated in soy, sesame, garlic, and pear, grilled and served with rice and kimchi.',
        calories: 480, protein: 34, carbs: 48, fat: 16, fiber: 3, sodium: 450,
        tags: ['high_protein', 'iron_rich', 'probiotics'],
        allergens: ['soy', 'sesame'],
        suitable: ['anemia', 'osteoporosis', 'obesity', 'diabetes'],
        unsuitable: ['gout', 'hypertension', 'kidney_disease'],
        diet: [],
        cuisine: 'korean',
        ingredients: ['beef sirloin (thin sliced)', 'soy sauce', 'sesame oil', 'garlic', 'pear', 'steamed rice', 'kimchi', 'scallions'],
        category_ingredients: { proteins: ['beef sirloin (thin sliced)'], grains: ['steamed rice'], vegetables: ['garlic', 'scallions', 'kimchi'], fruits: ['pear'], pantry: ['soy sauce', 'sesame oil'] }
    },
    {
        name: 'Kimchi Jjigae (Kimchi Stew)',
        description: 'Hearty Korean stew with kimchi, tofu, pork, and vegetables in a spicy broth. Served with steamed rice.',
        calories: 380, protein: 24, carbs: 38, fat: 14, fiber: 5, sodium: 480,
        tags: ['probiotics', 'high_protein', 'comfort', 'iron_rich'],
        allergens: ['soy'],
        suitable: ['anemia', 'osteoporosis', 'obesity'],
        unsuitable: ['hypertension', 'kidney_disease', 'ibs'],
        diet: [],
        cuisine: 'korean',
        ingredients: ['kimchi', 'firm tofu', 'pork belly (lean)', 'zucchini', 'scallions', 'gochugaru', 'steamed rice'],
        category_ingredients: { proteins: ['firm tofu', 'pork belly (lean)'], vegetables: ['kimchi', 'zucchini', 'scallions'], grains: ['steamed rice'], pantry: ['gochugaru'] }
    }
);

// --- LATIN AMERICAN ---
MEALS.breakfast.push(
    {
        name: 'Huevos Rancheros',
        description: 'Fried eggs on corn tortillas with black beans, ranchero salsa, avocado, and queso fresco.',
        calories: 420, protein: 22, carbs: 38, fat: 20, fiber: 10, sodium: 400,
        tags: ['high_protein', 'fiber', 'iron_rich', 'vitamin_c'],
        allergens: ['eggs', 'dairy', 'corn'],
        suitable: ['anemia', 'diabetes', 'celiac'],
        unsuitable: ['kidney_disease'],
        diet: ['vegetarian'],
        cuisine: 'latin',
        ingredients: ['eggs', 'corn tortillas', 'black beans', 'ranchero salsa', 'avocado', 'queso fresco', 'cilantro'],
        category_ingredients: { proteins: ['eggs', 'black beans'], grains: ['corn tortillas'], vegetables: ['avocado', 'cilantro'], dairy: ['queso fresco'], pantry: ['ranchero salsa'] }
    },
    {
        name: 'Arepas with Black Beans & Cheese',
        description: 'Crispy corn arepas stuffed with seasoned black beans, shredded cheese, and avocado.',
        calories: 380, protein: 16, carbs: 48, fat: 14, fiber: 8, sodium: 340,
        tags: ['fiber', 'iron_rich', 'plant_protein'],
        allergens: ['dairy', 'corn'],
        suitable: ['celiac', 'anemia', 'heart_disease'],
        unsuitable: ['kidney_disease'],
        diet: ['vegetarian'],
        cuisine: 'latin',
        ingredients: ['masa harina', 'black beans', 'shredded cheese', 'avocado', 'cumin', 'salt'],
        category_ingredients: { grains: ['masa harina'], proteins: ['black beans'], dairy: ['shredded cheese'], vegetables: ['avocado'], pantry: ['cumin'] }
    }
);

MEALS.lunch.push(
    {
        name: 'Chicken Burrito Bowl',
        description: 'Seasoned chicken over cilantro-lime rice with black beans, corn, pico de gallo, and guacamole.',
        calories: 480, protein: 34, carbs: 52, fat: 14, fiber: 10, sodium: 380,
        tags: ['high_protein', 'fiber', 'vitamin_c', 'iron_rich'],
        allergens: ['corn'],
        suitable: ['anemia', 'diabetes', 'obesity', 'heart_disease', 'celiac'],
        unsuitable: ['kidney_disease', 'ibs'],
        diet: [],
        cuisine: 'latin',
        ingredients: ['chicken breast', 'rice', 'black beans', 'corn', 'tomato', 'onion', 'avocado', 'lime', 'cilantro'],
        category_ingredients: { proteins: ['chicken breast', 'black beans'], grains: ['rice'], vegetables: ['tomato', 'onion', 'avocado', 'cilantro'], pantry: ['corn', 'lime'] }
    },
    {
        name: 'Ceviche with Tostadas',
        description: 'Fresh white fish cured in lime juice with tomato, onion, cilantro, avocado, served on baked tostadas.',
        calories: 320, protein: 26, carbs: 28, fat: 12, fiber: 5, sodium: 300,
        tags: ['lean_protein', 'omega3', 'vitamin_c', 'low_fat'],
        allergens: ['fish', 'corn'],
        suitable: ['obesity', 'heart_disease', 'cholesterol', 'diabetes', 'celiac'],
        unsuitable: ['liver_disease', 'gout'],
        diet: ['pescatarian'],
        cuisine: 'latin',
        ingredients: ['white fish', 'lime juice', 'tomato', 'red onion', 'cilantro', 'avocado', 'corn tostadas', 'jalapeno'],
        category_ingredients: { proteins: ['white fish'], vegetables: ['tomato', 'red onion', 'cilantro', 'avocado', 'jalapeno'], grains: ['corn tostadas'], pantry: ['lime juice'] }
    }
);

MEALS.dinner.push(
    {
        name: 'Arroz con Pollo',
        description: 'One-pot Latin chicken and rice with bell peppers, peas, olives, and sofrito spices.',
        calories: 460, protein: 32, carbs: 50, fat: 12, fiber: 5, sodium: 380,
        tags: ['high_protein', 'iron_rich', 'balanced', 'comfort'],
        allergens: [],
        suitable: ['anemia', 'diabetes', 'heart_disease', 'celiac', 'gout'],
        unsuitable: ['kidney_disease'],
        diet: [],
        cuisine: 'latin',
        ingredients: ['chicken thigh (skinless)', 'rice', 'bell peppers', 'peas', 'olives', 'garlic', 'cumin', 'tomato sauce'],
        category_ingredients: { proteins: ['chicken thigh (skinless)'], grains: ['rice'], vegetables: ['bell peppers', 'peas', 'olives', 'garlic'], pantry: ['cumin', 'tomato sauce'] }
    }
);

// --- MIDDLE EASTERN ---
MEALS.lunch.push(
    {
        name: 'Chicken Shawarma Bowl',
        description: 'Spiced grilled chicken with hummus, tabbouleh, pickled turnips, and warm pita over mixed greens.',
        calories: 460, protein: 34, carbs: 40, fat: 16, fiber: 6, sodium: 420,
        tags: ['high_protein', 'lean_protein', 'fiber'],
        allergens: ['gluten', 'sesame'],
        suitable: ['diabetes', 'obesity', 'anemia', 'heart_disease'],
        unsuitable: ['celiac', 'kidney_disease'],
        diet: [],
        cuisine: 'middle_eastern',
        ingredients: ['chicken breast', 'shawarma spices', 'hummus', 'parsley', 'bulgur wheat', 'tomato', 'pita bread', 'pickled turnips'],
        category_ingredients: { proteins: ['chicken breast'], grains: ['bulgur wheat', 'pita bread'], vegetables: ['parsley', 'tomato', 'pickled turnips'], pantry: ['shawarma spices', 'hummus'] }
    },
    {
        name: 'Falafel Wrap',
        description: 'Baked falafel in a whole wheat wrap with tahini sauce, mixed greens, tomato, and pickles.',
        calories: 420, protein: 16, carbs: 52, fat: 16, fiber: 10, sodium: 380,
        tags: ['fiber', 'plant_protein', 'iron_rich'],
        allergens: ['gluten', 'sesame'],
        suitable: ['heart_disease', 'cholesterol', 'anemia', 'diabetes', 'gout'],
        unsuitable: ['celiac', 'kidney_disease'],
        diet: ['vegetarian', 'vegan'],
        cuisine: 'middle_eastern',
        ingredients: ['chickpeas', 'parsley', 'cumin', 'whole wheat wrap', 'tahini', 'mixed greens', 'tomato', 'pickles'],
        category_ingredients: { proteins: ['chickpeas'], grains: ['whole wheat wrap'], vegetables: ['parsley', 'mixed greens', 'tomato', 'pickles'], pantry: ['cumin', 'tahini'] }
    }
);

MEALS.dinner.push(
    {
        name: 'Lamb Kofta with Tabbouleh',
        description: 'Spiced lean lamb kofta kebabs with a fresh parsley-bulgur tabbouleh and a dollop of yogurt.',
        calories: 440, protein: 30, carbs: 34, fat: 20, fiber: 6, sodium: 360,
        tags: ['high_protein', 'iron_rich', 'whole_grains'],
        allergens: ['dairy', 'gluten'],
        suitable: ['anemia', 'diabetes', 'osteoporosis'],
        unsuitable: ['gout', 'kidney_disease', 'celiac'],
        diet: [],
        cuisine: 'middle_eastern',
        ingredients: ['lean ground lamb', 'bulgur wheat', 'parsley', 'tomato', 'lemon', 'yogurt', 'cumin', 'mint'],
        category_ingredients: { proteins: ['lean ground lamb'], grains: ['bulgur wheat'], vegetables: ['parsley', 'tomato', 'mint'], dairy: ['yogurt'], pantry: ['lemon', 'cumin'] }
    }
);

MEALS.snack.push(
    {
        name: 'Labneh with Za\'atar & Pita',
        description: 'Thick strained yogurt drizzled with olive oil and za\'atar spice, served with toasted pita wedges.',
        calories: 180, protein: 10, carbs: 18, fat: 8, fiber: 2, sodium: 200,
        tags: ['calcium_rich', 'probiotics', 'high_protein'],
        allergens: ['dairy', 'gluten', 'sesame'],
        suitable: ['osteoporosis', 'gout', 'hypertension'],
        unsuitable: ['celiac', 'kidney_disease'],
        diet: ['vegetarian'],
        cuisine: 'middle_eastern',
        ingredients: ['labneh (strained yogurt)', 'za\'atar', 'olive oil', 'pita bread'],
        category_ingredients: { dairy: ['labneh (strained yogurt)'], grains: ['pita bread'], pantry: ['za\'atar', 'olive oil'] }
    }
);

// --- AFRICAN ---
MEALS.lunch.push(
    {
        name: 'Jollof Rice with Grilled Chicken',
        description: 'West African one-pot tomato rice with aromatic spices, served with grilled chicken and fried plantain.',
        calories: 480, protein: 30, carbs: 56, fat: 14, fiber: 4, sodium: 380,
        tags: ['high_protein', 'iron_rich', 'vitamin_c', 'comfort'],
        allergens: [],
        suitable: ['anemia', 'celiac', 'gout', 'diabetes'],
        unsuitable: ['kidney_disease'],
        diet: [],
        cuisine: 'african',
        ingredients: ['rice', 'chicken thigh (skinless)', 'tomato paste', 'tomatoes', 'onion', 'scotch bonnet pepper', 'plantain', 'thyme'],
        category_ingredients: { proteins: ['chicken thigh (skinless)'], grains: ['rice'], vegetables: ['tomatoes', 'onion', 'scotch bonnet pepper'], fruits: ['plantain'], pantry: ['tomato paste', 'thyme'] }
    }
);

MEALS.dinner.push(
    {
        name: 'Ethiopian Lentil Stew (Misir Wot)',
        description: 'Spiced red lentil stew with berbere seasoning, served with injera (or rice for gluten-free).',
        calories: 380, protein: 18, carbs: 54, fat: 8, fiber: 12, sodium: 280,
        tags: ['fiber', 'iron_rich', 'plant_protein', 'low_fat'],
        allergens: [],
        suitable: ['anemia', 'heart_disease', 'cholesterol', 'hypertension', 'diabetes', 'celiac', 'gout', 'obesity'],
        unsuitable: ['kidney_disease', 'ibs'],
        diet: ['vegetarian', 'vegan'],
        cuisine: 'african',
        ingredients: ['red lentils', 'onion', 'garlic', 'berbere spice', 'tomato paste', 'injera or rice', 'olive oil'],
        category_ingredients: { proteins: ['red lentils'], vegetables: ['onion', 'garlic'], grains: ['injera or rice'], pantry: ['berbere spice', 'tomato paste', 'olive oil'] }
    },
    {
        name: 'Moroccan Chicken Tagine',
        description: 'Slow-cooked chicken with preserved lemons, olives, onions, and aromatic spices over couscous.',
        calories: 440, protein: 32, carbs: 42, fat: 14, fiber: 5, sodium: 380,
        tags: ['high_protein', 'iron_rich', 'comfort', 'antioxidants'],
        allergens: ['gluten'],
        suitable: ['anemia', 'diabetes', 'heart_disease', 'osteoporosis'],
        unsuitable: ['celiac', 'kidney_disease'],
        diet: [],
        cuisine: 'african',
        ingredients: ['chicken thigh (skinless)', 'preserved lemon', 'green olives', 'onion', 'saffron', 'cinnamon', 'couscous'],
        category_ingredients: { proteins: ['chicken thigh (skinless)'], vegetables: ['onion', 'green olives'], grains: ['couscous'], pantry: ['preserved lemon', 'saffron', 'cinnamon'] }
    }
);

// --- CARIBBEAN ---
MEALS.lunch.push(
    {
        name: 'Jerk Chicken with Rice & Peas',
        description: 'Spicy jerk-marinated grilled chicken with coconut rice and kidney beans, and a side of coleslaw.',
        calories: 480, protein: 32, carbs: 52, fat: 14, fiber: 6, sodium: 420,
        tags: ['high_protein', 'iron_rich', 'fiber'],
        allergens: [],
        suitable: ['anemia', 'celiac', 'diabetes', 'heart_disease'],
        unsuitable: ['kidney_disease', 'ibs', 'hypertension'],
        diet: [],
        cuisine: 'caribbean',
        ingredients: ['chicken breast', 'jerk seasoning', 'rice', 'kidney beans', 'coconut milk', 'cabbage', 'lime'],
        category_ingredients: { proteins: ['chicken breast', 'kidney beans'], grains: ['rice'], vegetables: ['cabbage'], pantry: ['jerk seasoning', 'coconut milk', 'lime'] }
    }
);

MEALS.dinner.push(
    {
        name: 'Caribbean Fish Curry',
        description: 'Mild coconut curry with white fish, sweet potato, bell peppers, and scotch bonnet, served with rice.',
        calories: 420, protein: 28, carbs: 46, fat: 12, fiber: 5, sodium: 340,
        tags: ['omega3', 'lean_protein', 'potassium_rich', 'vitamin_c'],
        allergens: ['fish'],
        suitable: ['heart_disease', 'cholesterol', 'diabetes', 'hypertension', 'anemia', 'celiac'],
        unsuitable: ['gout', 'kidney_disease'],
        diet: ['pescatarian'],
        cuisine: 'caribbean',
        ingredients: ['white fish fillet', 'coconut milk (light)', 'sweet potato', 'bell peppers', 'scotch bonnet pepper', 'curry powder', 'rice', 'lime'],
        category_ingredients: { proteins: ['white fish fillet'], vegetables: ['sweet potato', 'bell peppers', 'scotch bonnet pepper'], grains: ['rice'], pantry: ['coconut milk (light)', 'curry powder', 'lime'] }
    },
    {
        name: 'Oxtail Stew with Butter Beans',
        description: 'Rich, slow-cooked oxtail stew with butter beans, carrots, and thyme. Served with steamed rice.',
        calories: 480, protein: 34, carbs: 40, fat: 20, fiber: 8, sodium: 400,
        tags: ['high_protein', 'iron_rich', 'fiber', 'comfort'],
        allergens: [],
        suitable: ['anemia', 'celiac'],
        unsuitable: ['gout', 'kidney_disease', 'hypertension', 'cholesterol', 'obesity'],
        diet: [],
        cuisine: 'caribbean',
        ingredients: ['oxtail', 'butter beans', 'carrots', 'thyme', 'garlic', 'allspice', 'steamed rice'],
        category_ingredients: { proteins: ['oxtail', 'butter beans'], vegetables: ['carrots', 'garlic'], grains: ['steamed rice'], pantry: ['thyme', 'allspice'] }
    }
);

MEALS.snack.push(
    {
        name: 'Plantain Chips with Guacamole',
        description: 'Baked plantain chips served with fresh homemade guacamole.',
        calories: 190, protein: 3, carbs: 28, fat: 9, fiber: 4, sodium: 80,
        tags: ['potassium_rich', 'healthy_fats', 'fiber'],
        allergens: [],
        suitable: ['celiac', 'hypertension', 'heart_disease', 'cholesterol', 'gout'],
        unsuitable: ['kidney_disease', 'diabetes'],
        diet: ['vegetarian', 'vegan'],
        cuisine: 'caribbean',
        ingredients: ['plantain', 'avocado', 'lime', 'cilantro', 'onion', 'sea salt'],
        category_ingredients: { fruits: ['plantain'], vegetables: ['avocado', 'cilantro', 'onion'], pantry: ['lime', 'sea salt'] }
    }
);

// ============================================================
// RECIPES — Cooking instructions keyed by meal name
// ============================================================
const RECIPES = {
    // BREAKFAST
    'Oatmeal with Berries & Walnuts': {
        prepTime: '5 min', cookTime: '15 min', servings: 1,
        ingredientsList: ['1/2 cup (45g) steel-cut oats', '1.5 cups water', '1/2 cup (75g) blueberries', '1/2 cup (75g) strawberries, sliced', '2 tbsp (15g) walnuts, crushed', '1 tsp honey'],
        steps: [
            'Bring 1.5 cups of water to a boil in a small saucepan.',
            'Add 1/2 cup steel-cut oats, reduce heat to low, and simmer for 12-15 minutes, stirring occasionally.',
            'Transfer to a bowl, top with a handful of blueberries and sliced strawberries.',
            'Sprinkle crushed walnuts on top and drizzle with a teaspoon of honey.',
            'Serve warm.'
        ]
    },
    'Veggie Egg White Omelette': {
        prepTime: '5 min', cookTime: '8 min', servings: 1,
        ingredientsList: ['4 egg whites', '1 handful (30g) spinach', '1/4 bell pepper, diced', '2-3 mushrooms, sliced', '2 tbsp (30g) feta cheese, crumbled', '1 tsp olive oil', 'Salt and pepper to taste'],
        steps: [
            'Whisk 4 egg whites with a pinch of salt and pepper.',
            'Heat 1 tsp olive oil in a non-stick pan over medium heat.',
            'Saut\u00e9 a handful of spinach, diced bell peppers, and sliced mushrooms for 2-3 minutes.',
            'Pour egg whites over the vegetables and cook undisturbed for 2 minutes.',
            'Sprinkle crumbled feta on one half, fold the omelette, and cook 1 more minute.',
            'Slide onto a plate and serve.'
        ]
    },
    'Greek Yogurt Parfait': {
        prepTime: '5 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1 cup (225g) low-fat Greek yogurt', '1/4 cup (30g) granola', '1/2 cup (75g) mixed berries', '1 tbsp chia seeds', '1 tsp maple syrup'],
        steps: [
            'Spoon half the Greek yogurt into a glass or bowl.',
            'Add a layer of granola and mixed berries.',
            'Add the remaining yogurt on top.',
            'Finish with more berries, a sprinkle of chia seeds, and a drizzle of maple syrup.',
            'Serve immediately for best crunch.'
        ]
    },
    'Avocado Toast with Poached Egg': {
        prepTime: '5 min', cookTime: '5 min', servings: 1,
        ingredientsList: ['1 slice whole grain bread', '1/2 avocado', '1 large egg', '1 tsp white vinegar (for poaching)', '5-6 cherry tomatoes, halved', 'Pinch of red pepper flakes', 'Salt and pepper'],
        steps: [
            'Toast a slice of whole grain bread until golden.',
            'Mash half an avocado with a fork and spread onto the toast.',
            'Bring a small pot of water to a gentle simmer, add a splash of vinegar.',
            'Crack an egg into the water and poach for 3-4 minutes until whites are set.',
            'Place the poached egg on the avocado toast, add halved cherry tomatoes.',
            'Season with salt, pepper, and red pepper flakes.'
        ]
    },
    'Banana Peanut Butter Smoothie': {
        prepTime: '5 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1 medium banana', '1 tbsp (16g) natural peanut butter', '1 handful (30g) spinach', '1 cup (240ml) almond milk', '1 tbsp ground flaxseed'],
        steps: [
            'Add 1 banana, 1 tbsp peanut butter, a handful of spinach, and 1 cup almond milk to a blender.',
            'Add 1 tbsp ground flaxseed.',
            'Blend on high for 60 seconds until smooth and creamy.',
            'Pour into a glass and serve immediately.'
        ]
    },
    'Quinoa Breakfast Bowl': {
        prepTime: '5 min', cookTime: '15 min', servings: 1,
        ingredientsList: ['1/2 cup (85g) quinoa, rinsed', '1 cup (240ml) almond milk', '1/2 tsp cinnamon', '1/2 apple, diced', '1 tbsp pumpkin seeds'],
        steps: [
            'Rinse 1/2 cup quinoa and add to a saucepan with 1 cup almond milk.',
            'Bring to a boil, reduce heat, cover, and simmer 12-15 minutes.',
            'Stir in 1/2 tsp cinnamon.',
            'Top with diced apple and pumpkin seeds.',
            'Serve warm.'
        ]
    },
    'Smoked Salmon on Rice Cakes': {
        prepTime: '5 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['2 brown rice cakes', '2 oz (60g) smoked salmon', '2 tbsp light cream cheese', '1 tsp capers', 'Fresh dill', 'Black pepper to taste'],
        steps: [
            'Spread a thin layer of light cream cheese on 2 brown rice cakes.',
            'Top each with slices of smoked salmon.',
            'Garnish with capers and fresh dill.',
            'Season with black pepper and serve.'
        ]
    },
    'Sweet Potato & Black Bean Hash': {
        prepTime: '10 min', cookTime: '15 min', servings: 1,
        ingredientsList: ['1 medium sweet potato (200g), diced', '1/2 cup (90g) black beans, drained', '1/4 cup (40g) corn', '1/2 tsp cumin', '1 tsp olive oil', '2 tbsp fresh cilantro, chopped', 'Salt and pepper to taste'],
        steps: [
            'Dice 1 medium sweet potato into small cubes.',
            'Heat 1 tsp olive oil in a skillet over medium-high heat.',
            'Add sweet potato cubes and cook 8-10 minutes, stirring occasionally, until tender.',
            'Add drained black beans, a handful of corn, and 1/2 tsp cumin.',
            'Cook 3-4 more minutes until heated through.',
            'Top with fresh cilantro and serve.'
        ]
    },
    'Turkey & Spinach Breakfast Wrap': {
        prepTime: '5 min', cookTime: '3 min', servings: 1,
        ingredientsList: ['1 whole wheat tortilla (8-inch)', '3 oz (85g) sliced turkey breast', '1 handful (30g) fresh spinach', '1 small tomato, sliced', '2 tbsp hummus'],
        steps: [
            'Warm a whole wheat tortilla in a dry pan for 30 seconds per side.',
            'Spread a thin layer of hummus down the center.',
            'Layer turkey slices, fresh spinach, and sliced tomato.',
            'Roll up tightly, tucking in the sides as you go.',
            'Slice in half diagonally and serve.'
        ]
    },
    'Rice Porridge with Ginger & Chicken': {
        prepTime: '5 min', cookTime: '25 min', servings: 1,
        ingredientsList: ['1/3 cup (65g) white rice', '2.5 cups (600ml) water', '3 oz (85g) cooked chicken breast, shredded', '1 tsp fresh ginger, grated', '2 scallions, chopped', '1/2 tsp sesame oil', 'Salt to taste'],
        steps: [
            'Simmer 1/3 cup white rice in 2.5 cups of water, stirring frequently, for 20 minutes until it breaks down into porridge.',
            'While the rice cooks, poach or shred pre-cooked chicken breast.',
            'Add grated fresh ginger to the porridge in the last 5 minutes.',
            'Ladle into a bowl, top with shredded chicken and chopped scallions.',
            'Drizzle with a few drops of sesame oil and serve hot.'
        ]
    },
    'Cottage Cheese & Fruit Bowl': {
        prepTime: '5 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['3/4 cup (170g) low-fat cottage cheese', '1 medium peach, sliced', '2 tbsp (15g) almonds', '1 tsp honey'],
        steps: [
            'Scoop low-fat cottage cheese into a bowl.',
            'Arrange sliced peaches on top.',
            'Scatter a small handful of almonds over the fruit.',
            'Drizzle with a teaspoon of honey and serve.'
        ]
    },
    'Buckwheat Pancakes with Berries': {
        prepTime: '5 min', cookTime: '10 min', servings: 1,
        ingredientsList: ['1/2 cup (60g) buckwheat flour', '1 large egg', '1/3 cup (80ml) water or milk', '1/2 cup (75g) mixed berries', '1 tbsp maple syrup', '1 tsp coconut oil for cooking'],
        steps: [
            'Mix 1/2 cup buckwheat flour, 1 egg, and 1/3 cup water until smooth.',
            'Heat a non-stick pan with a little coconut oil over medium heat.',
            'Pour small circles of batter and cook 2-3 minutes per side until golden.',
            'Stack pancakes, top with fresh mixed berries.',
            'Drizzle with a little maple syrup and serve.'
        ]
    },
    'High-Protein Egg & Turkey Scramble': {
        prepTime: '5 min', cookTime: '10 min', servings: 1,
        ingredientsList: ['2 whole eggs', '3 egg whites', '4 oz (115g) turkey breast, diced', '1/2 cup (115g) cottage cheese', '1 medium tomato, sliced', 'Cooking spray', 'Salt and pepper to taste'],
        steps: [
            'Heat a non-stick pan over medium heat with cooking spray.',
            'Add diced turkey breast and cook 4-5 minutes until browned.',
            'Whisk 2 whole eggs and 3 egg whites, pour into the pan.',
            'Scramble together until eggs are set.',
            'Serve with a side of cottage cheese and sliced tomato.'
        ]
    },
    'Protein Oats': {
        prepTime: '5 min', cookTime: '10 min', servings: 1,
        ingredientsList: ['1/2 cup (45g) rolled oats', '1 cup (240ml) water', '1 scoop (30g) vanilla protein powder', '1/4 cup (60g) Greek yogurt', '1 medium banana, sliced', '1 tsp honey'],
        steps: [
            'Cook oats with water according to package directions.',
            'Stir in a scoop of protein powder while still hot.',
            'Top with Greek yogurt, sliced banana, and a drizzle of honey.',
            'Serve warm.'
        ]
    },
    // LUNCH
    'Grilled Chicken Salad': {
        prepTime: '10 min', cookTime: '12 min', servings: 1,
        ingredientsList: ['6 oz (170g) chicken breast', '3 cups (90g) mixed greens', '1 cup (150g) cherry tomatoes, halved', '1/2 cucumber, sliced', '1/2 avocado, diced', '1 tbsp olive oil', '1 tbsp lemon juice', 'Salt and pepper to taste'],
        steps: [
            'Season chicken breast with salt, pepper, and a squeeze of lemon.',
            'Grill or pan-sear over medium-high heat for 5-6 minutes per side until cooked through.',
            'Let rest 3 minutes, then slice into strips.',
            'Toss mixed greens, halved cherry tomatoes, sliced cucumber, and diced avocado in a bowl.',
            'Top with chicken strips.',
            'Whisk together lemon juice, olive oil, salt and pepper for the vinaigrette. Drizzle over salad.'
        ]
    },
    'Lentil & Vegetable Soup': {
        prepTime: '10 min', cookTime: '30 min', servings: 2,
        ingredientsList: ['1/2 cup (100g) red lentils', '2 carrots, diced', '2 celery stalks, diced', '1 can (400g) diced tomatoes', '1/2 tsp cumin', '3 cups (720ml) water or vegetable broth', '1 tbsp olive oil', '2 slices crusty bread (per serving)', 'Salt and pepper to taste'],
        steps: [
            'Heat olive oil in a pot over medium heat. Saut\u00e9 diced carrots and celery for 3-4 minutes.',
            'Add 1/2 tsp cumin and stir for 30 seconds.',
            'Add 1/2 cup rinsed red lentils, a can of diced tomatoes, and 3 cups water.',
            'Bring to a boil, reduce heat, and simmer 20-25 minutes until lentils are soft.',
            'Season with salt and pepper.',
            'Serve in bowls with a side of crusty bread.'
        ]
    },
    'Salmon & Quinoa Bowl': {
        prepTime: '10 min', cookTime: '20 min', servings: 1,
        ingredientsList: ['1 salmon fillet (6 oz / 170g)', '1/2 cup (85g) quinoa', '1 cup (90g) broccoli florets', '1/2 cup (75g) edamame', '1 tbsp low-sodium soy sauce', '1 tsp grated ginger', 'Salt and pepper to taste'],
        steps: [
            'Cook 1/2 cup quinoa according to package directions.',
            'Season salmon fillet with salt and pepper. Bake at 400\u00b0F (200\u00b0C) for 12-15 minutes.',
            'Steam broccoli florets for 4-5 minutes until bright green.',
            'Mix low-sodium soy sauce with grated ginger for the glaze.',
            'Assemble bowl: quinoa base, salmon on top, broccoli and edamame on the sides.',
            'Drizzle with ginger-soy glaze.'
        ]
    },
    'Turkey & Avocado Lettuce Wraps': {
        prepTime: '10 min', cookTime: '8 min', servings: 1,
        ingredientsList: ['6 oz (170g) lean ground turkey', '6 large butter lettuce leaves', '1/2 avocado, diced', '1/4 cup salsa', '1 lime, juiced', '1/2 tsp cumin', 'Salt and pepper to taste'],
        steps: [
            'Brown lean ground turkey in a skillet over medium heat, breaking it apart.',
            'Season with cumin, salt, and pepper. Cook 6-8 minutes until done.',
            'Wash and separate large butter lettuce leaves.',
            'Spoon turkey into lettuce cups.',
            'Top with diced avocado, a spoonful of salsa, and a squeeze of lime.',
            'Serve immediately.'
        ]
    },
    'Mediterranean Chickpea Bowl': {
        prepTime: '10 min', cookTime: '10 min', servings: 1,
        ingredientsList: ['1/2 cup (95g) brown rice (cooked)', '3/4 cup (135g) chickpeas, drained', '1/2 cucumber, diced', '1 medium tomato, diced', '1/4 red onion, diced', '8 Kalamata olives', '2 tbsp (30g) feta cheese', '1 tbsp olive oil', '1/2 tsp dried oregano'],
        steps: [
            'Cook brown rice according to package directions (or use pre-cooked).',
            'Drain and rinse a can of chickpeas.',
            'Dice cucumber, tomatoes, and red onion.',
            'Assemble bowl: rice base, chickpeas, diced vegetables, and Kalamata olives.',
            'Crumble feta cheese on top.',
            'Drizzle with olive oil and sprinkle with dried oregano.'
        ]
    },
    'Chicken Stir-Fry with Rice': {
        prepTime: '10 min', cookTime: '15 min', servings: 1,
        ingredientsList: ['6 oz (170g) chicken breast, sliced', '1/2 cup (95g) jasmine rice', '1 bell pepper, sliced', '1 cup (100g) snap peas', '1 carrot, julienned', '1 tsp grated ginger', '2 garlic cloves, minced', '1 tbsp low-sodium soy sauce', '1 tbsp vegetable oil'],
        steps: [
            'Cook jasmine rice according to package directions.',
            'Slice chicken breast into thin strips.',
            'Heat oil in a wok or large pan over high heat.',
            'Stir-fry chicken 3-4 minutes until cooked. Remove and set aside.',
            'Add sliced bell peppers, snap peas, and carrots. Stir-fry 3-4 minutes.',
            'Return chicken to pan, add minced ginger, garlic, and a splash of low-sodium soy sauce.',
            'Toss together and serve over rice.'
        ]
    },
    'Tuna Nicoise Salad': {
        prepTime: '10 min', cookTime: '15 min', servings: 1,
        ingredientsList: ['1 tuna steak (5 oz / 140g)', '3 cups (90g) mixed greens', '1 cup (110g) green beans', '1 large egg', '8 black olives', '6 baby potatoes', '1 tsp Dijon mustard', '1 tbsp olive oil', '1 tbsp red wine vinegar'],
        steps: [
            'Boil baby potatoes for 10-12 minutes until tender. Halve them.',
            'Blanch green beans in boiling water for 3 minutes, then cool in ice water.',
            'Hard-boil an egg (10 minutes), peel and halve it.',
            'Sear tuna steak in a hot oiled pan, 2 minutes per side for medium-rare.',
            'Arrange mixed greens on a plate, top with potatoes, green beans, egg, and olives.',
            'Slice tuna and place on top. Drizzle with Dijon-olive oil vinaigrette.'
        ]
    },
    'Black Bean & Sweet Potato Tacos': {
        prepTime: '10 min', cookTime: '20 min', servings: 1,
        ingredientsList: ['1 medium sweet potato (200g), cubed', '3/4 cup (135g) black beans', '3 corn tortillas (6-inch)', '1 cup (70g) shredded cabbage', '1 lime, juiced', '2 tbsp Greek yogurt', '1/2 tsp cumin', '1/2 tsp chili powder', '1 tbsp olive oil'],
        steps: [
            'Peel and dice sweet potato into small cubes.',
            'Toss with olive oil, cumin, and chili powder. Roast at 400\u00b0F (200\u00b0C) for 18-20 minutes.',
            'Warm black beans in a small saucepan with a pinch of cumin.',
            'Shred cabbage for slaw and squeeze lime juice over it.',
            'Warm corn tortillas in a dry pan.',
            'Fill tortillas with sweet potato, black beans, and cabbage slaw.',
            'Top with a dollop of Greek yogurt mixed with lime juice.'
        ]
    },
    'Chicken & Rice Soup': {
        prepTime: '10 min', cookTime: '20 min', servings: 2,
        ingredientsList: ['8 oz (225g) cooked chicken breast, shredded', '1/3 cup (65g) white rice', '4 cups (960ml) low-sodium chicken broth', '2 carrots, diced', '2 celery stalks, diced', '2 tbsp fresh parsley, chopped', 'Salt and pepper to taste'],
        steps: [
            'In a pot, bring 4 cups of low-sodium chicken broth to a boil.',
            'Add diced carrots and celery, simmer 5 minutes.',
            'Add 1/3 cup white rice and cook 10-12 minutes until tender.',
            'Add shredded pre-cooked chicken breast and heat through.',
            'Season with salt, pepper, and chopped parsley.',
            'Ladle into bowls and serve hot.'
        ]
    },
    'Caprese Sandwich on Whole Grain': {
        prepTime: '5 min', cookTime: '3 min', servings: 1,
        ingredientsList: ['2 slices whole grain bread', '3 oz (85g) fresh mozzarella, sliced', '1 large tomato, sliced', '6 fresh basil leaves', '1 tbsp balsamic glaze', '1 tsp olive oil'],
        steps: [
            'Toast 2 slices of whole grain bread.',
            'Layer thick slices of fresh mozzarella and ripe tomato.',
            'Add fresh basil leaves.',
            'Drizzle with balsamic glaze and a touch of olive oil.',
            'Close the sandwich, slice in half, and serve.'
        ]
    },
    'Shrimp & Zucchini Noodles': {
        prepTime: '10 min', cookTime: '8 min', servings: 1,
        ingredientsList: ['6 oz (170g) raw shrimp, peeled', '2 medium zucchini, spiralized', '1 cup (150g) cherry tomatoes, halved', '3 garlic cloves, minced', '1 tbsp olive oil', '1 lemon, juiced', 'Salt, pepper, red pepper flakes to taste'],
        steps: [
            'Spiralize 1-2 zucchini into noodles (or use pre-spiralized).',
            'Heat olive oil in a large pan over medium-high heat.',
            'Add shrimp, season with salt, pepper, and garlic. Cook 2-3 minutes per side until pink.',
            'Remove shrimp, add zucchini noodles and cherry tomatoes to the pan.',
            'Saut\u00e9 2-3 minutes until just tender (don\'t overcook).',
            'Return shrimp, squeeze lemon over everything, toss and serve.'
        ]
    },
    'Tofu & Vegetable Curry': {
        prepTime: '10 min', cookTime: '20 min', servings: 2,
        ingredientsList: ['14 oz (400g) firm tofu, cubed', '1 can (400ml) light coconut milk', '2 cups (60g) fresh spinach', '1 bell pepper, sliced', '1 tbsp curry powder', '1 cup (190g) basmati rice', '1 tbsp vegetable oil', 'Salt to taste'],
        steps: [
            'Press firm tofu for 10 minutes, then cube it.',
            'Cook basmati rice according to package directions.',
            'Heat oil in a pan, add tofu cubes, and cook until golden on all sides. Remove.',
            'In the same pan, add diced bell peppers and cook 2 minutes.',
            'Add light coconut milk and 1 tbsp curry powder. Simmer 10 minutes.',
            'Add spinach and tofu back to the pan. Stir until spinach wilts.',
            'Serve over basmati rice.'
        ]
    },
    // DINNER
    'Baked Salmon with Roasted Vegetables': {
        prepTime: '10 min', cookTime: '25 min', servings: 1,
        ingredientsList: ['1 salmon fillet (6 oz / 170g)', '1 medium sweet potato (200g)', '1 bunch (200g) asparagus', '1 lemon, juiced', '1 tsp fresh dill', '2 garlic cloves, minced', '1 tbsp olive oil', 'Salt and pepper to taste'],
        steps: [
            'Preheat oven to 400\u00b0F (200\u00b0C).',
            'Cut sweet potato into wedges and trim asparagus. Toss with olive oil and place on a baking sheet.',
            'Season salmon fillet with lemon juice, dill, garlic, salt, and pepper.',
            'Add salmon to the baking sheet after vegetables have roasted 10 minutes.',
            'Roast everything together for 12-15 minutes until salmon flakes easily.',
            'Plate the salmon with roasted vegetables and serve with a lemon wedge.'
        ]
    },
    'Lean Beef & Broccoli Stir-Fry': {
        prepTime: '10 min', cookTime: '12 min', servings: 1,
        ingredientsList: ['6 oz (170g) lean beef sirloin, sliced', '2 cups (180g) broccoli florets', '1 bell pepper, sliced', '1 tsp grated ginger', '2 garlic cloves, minced', '1 tbsp low-sodium soy sauce', '1/2 cup (95g) brown rice', '1 tbsp vegetable oil'],
        steps: [
            'Cook brown rice according to package directions.',
            'Slice lean beef sirloin into thin strips against the grain.',
            'Heat oil in a wok over high heat. Sear beef 2-3 minutes until browned. Remove.',
            'Add broccoli florets and sliced bell peppers. Stir-fry 3-4 minutes.',
            'Add minced ginger and garlic, cook 30 seconds.',
            'Return beef, add a splash of low-sodium soy sauce, toss everything together.',
            'Serve over brown rice.'
        ]
    },
    'Grilled Chicken with Quinoa & Greens': {
        prepTime: '10 min', cookTime: '20 min', servings: 1,
        ingredientsList: ['6 oz (170g) chicken breast', '1/2 cup (85g) quinoa', '2 cups (60g) kale, chopped', '1 cup (150g) cherry tomatoes', '1 lemon, juiced', '1 tsp mixed herbs', '1 tbsp olive oil', 'Salt and pepper'],
        steps: [
            'Cook quinoa according to package directions.',
            'Marinate chicken breast in lemon juice, olive oil, and mixed herbs for 10 minutes.',
            'Grill or pan-sear chicken 5-6 minutes per side until cooked through.',
            'Saut\u00e9 kale in a little olive oil for 2-3 minutes until wilted.',
            'Roast cherry tomatoes in the oven at 400\u00b0F for 10 minutes.',
            'Slice chicken and serve over quinoa with kale and roasted tomatoes.'
        ]
    },
    'Baked Cod with Herb Crust': {
        prepTime: '10 min', cookTime: '18 min', servings: 1,
        ingredientsList: ['1 cod fillet (6 oz / 170g)', '1/4 cup (30g) whole wheat breadcrumbs', '2 cups (200g) cauliflower florets', '1 cup (110g) green beans', '1 tbsp fresh parsley', '1 tsp fresh thyme', '1 tbsp olive oil', '1 lemon (zest and juice)'],
        steps: [
            'Preheat oven to 400\u00b0F (200\u00b0C).',
            'Mix breadcrumbs with chopped herbs (parsley, thyme), a drizzle of olive oil, and lemon zest.',
            'Place cod fillet on a lined baking sheet. Press the herb mixture on top.',
            'Bake 15-18 minutes until fish flakes easily.',
            'Meanwhile, steam cauliflower and mash with a little olive oil and seasoning.',
            'Steam green beans for 4 minutes.',
            'Serve cod over mashed cauliflower with green beans on the side.'
        ]
    },
    'Stuffed Bell Peppers': {
        prepTime: '15 min', cookTime: '30 min', servings: 2,
        ingredientsList: ['4 large bell peppers', '1 lb (450g) lean ground turkey', '1 cup (190g) cooked brown rice', '1/2 cup (90g) black beans', '1/2 cup (80g) corn', '1/2 cup (55g) shredded cheese', '1 cup (240ml) tomato sauce', '1 tsp cumin', 'Salt and pepper'],
        steps: [
            'Preheat oven to 375\u00b0F (190\u00b0C).',
            'Cut tops off bell peppers and remove seeds.',
            'Brown lean ground turkey in a skillet. Add cooked brown rice, drained black beans, corn, and tomato sauce.',
            'Season with cumin, salt, and pepper. Mix well.',
            'Fill each pepper with the mixture and place in a baking dish.',
            'Top with shredded cheese.',
            'Cover with foil and bake 25 minutes, then remove foil and bake 5 more minutes until cheese melts.',
            'Let cool slightly and serve.'
        ]
    },
    'Vegetable & Chickpea Stew': {
        prepTime: '10 min', cookTime: '25 min', servings: 2,
        ingredientsList: ['1.5 cups (270g) chickpeas, drained', '1 zucchini, diced', '2 carrots, diced', '2 cups (60g) fresh spinach', '1 can (400g) diced tomatoes', '1 cup (240ml) water', '1 tsp dried oregano', '1 tbsp olive oil', 'Salt and pepper to taste'],
        steps: [
            'Heat olive oil in a large pot over medium heat.',
            'Add diced carrots and sliced zucchini. Cook 4-5 minutes.',
            'Add drained chickpeas, a can of diced tomatoes, and 1 cup water.',
            'Season with oregano, salt, and pepper.',
            'Simmer 15-20 minutes until vegetables are tender.',
            'Stir in a large handful of fresh spinach and cook until wilted.',
            'Serve in bowls.'
        ]
    },
    'Chicken Fajita Bowl': {
        prepTime: '10 min', cookTime: '15 min', servings: 1,
        ingredientsList: ['6 oz (170g) chicken breast, sliced', '1/2 cup (95g) jasmine rice', '1 bell pepper, sliced', '1/2 onion, sliced', '1/2 avocado', '1 lime, juiced', '2 tbsp fresh cilantro', '1 tsp cumin', '1 tbsp olive oil', 'Salt and pepper'],
        steps: [
            'Cook jasmine rice with a squeeze of lime and chopped cilantro.',
            'Slice chicken breast into strips and season with cumin, salt, and pepper.',
            'Cook chicken in a hot oiled skillet 4-5 minutes per side. Set aside.',
            'In the same pan, saut\u00e9 sliced bell peppers and onion 3-4 minutes.',
            'Assemble bowl: cilantro-lime rice, chicken strips, peppers and onions.',
            'Top with guacamole (mashed avocado with lime, salt, and pepper).'
        ]
    },
    'Pork Tenderloin with Apple Slaw': {
        prepTime: '10 min', cookTime: '25 min', servings: 2,
        ingredientsList: ['1 lb (450g) pork tenderloin', '1 large apple, sliced thin', '2 cups (140g) shredded cabbage', '1 lb (450g) baby potatoes', '1 tbsp apple cider vinegar', '1 tsp dried herbs', '2 tbsp olive oil', 'Salt and pepper to taste'],
        steps: [
            'Preheat oven to 400\u00b0F (200\u00b0C).',
            'Rub pork tenderloin with olive oil, herbs, salt, and pepper.',
            'Roast 20-25 minutes until internal temp reaches 145\u00b0F (63\u00b0C). Let rest 5 minutes.',
            'While pork cooks, cut potatoes into wedges, toss with oil, and roast alongside.',
            'Shred cabbage and slice apple thinly. Toss with apple cider vinegar and a pinch of salt.',
            'Slice pork into medallions. Serve with roasted potatoes and apple-cabbage slaw.'
        ]
    },
    'Eggplant Parmesan (Baked)': {
        prepTime: '15 min', cookTime: '30 min', servings: 2,
        ingredientsList: ['1 large eggplant, sliced into rounds', '1/2 cup (60g) whole wheat breadcrumbs', '1 cup (240ml) marinara sauce', '4 oz (115g) mozzarella cheese, shredded', '1 large egg, beaten', '2 tbsp grated Parmesan', '6 fresh basil leaves', 'Salt and pepper'],
        steps: [
            'Preheat oven to 400\u00b0F (200\u00b0C).',
            'Slice eggplant into 1/2-inch rounds. Salt and let sit 10 minutes, then pat dry.',
            'Dip slices in beaten egg, then coat in whole wheat breadcrumbs mixed with Parmesan.',
            'Place on a lined baking sheet and bake 15 minutes, flip, bake 10 more minutes.',
            'Spread marinara sauce in a baking dish, layer eggplant slices, more sauce, and mozzarella.',
            'Bake 10 minutes until cheese is melted and bubbly.',
            'Garnish with fresh basil and serve.'
        ]
    },
    'Steamed Fish with Ginger & Bok Choy': {
        prepTime: '10 min', cookTime: '12 min', servings: 1,
        ingredientsList: ['1 white fish fillet (6 oz / 170g) — tilapia or sole', '2 baby bok choy, halved', '1/2 cup (95g) white rice', '1 tbsp julienned fresh ginger', '1 tbsp low-sodium soy sauce', '1 tsp sesame oil', '2 scallions, chopped'],
        steps: [
            'Cook white rice according to package directions.',
            'Place fish fillet on a heatproof plate. Top with julienned ginger.',
            'Set up a steamer and steam the fish for 8-10 minutes until it flakes easily.',
            'In the last 3 minutes, add halved bok choy to the steamer.',
            'Drizzle fish with low-sodium soy sauce and a few drops of sesame oil.',
            'Garnish with chopped scallions. Serve with rice and bok choy.'
        ]
    },
    'Lemon Herb Roast Chicken': {
        prepTime: '10 min', cookTime: '30 min', servings: 1,
        ingredientsList: ['1 chicken thigh (skinless, ~6 oz / 170g)', '1 lemon, juiced', '1 sprig fresh rosemary', '2 carrots, cut into chunks', '1/2 cup (90g) couscous', '1 tbsp olive oil', 'Salt and pepper to taste'],
        steps: [
            'Preheat oven to 425\u00b0F (220\u00b0C).',
            'Place skinless chicken thigh on a baking sheet with chopped carrots.',
            'Drizzle with olive oil, squeeze lemon juice over, and scatter rosemary.',
            'Season with salt and pepper.',
            'Roast 25-30 minutes until chicken reaches 165\u00b0F (74\u00b0C) internal temp.',
            'Meanwhile, prepare couscous according to package directions and fluff with herbs.',
            'Serve chicken and roasted carrots over herbed couscous.'
        ]
    },
    'Veggie Pasta Primavera': {
        prepTime: '10 min', cookTime: '15 min', servings: 2,
        ingredientsList: ['8 oz (225g) whole wheat penne', '1 zucchini, sliced', '1 cup (80g) mushrooms, sliced', '1 cup (150g) cherry tomatoes, halved', '3 garlic cloves, minced', '2 tbsp olive oil', '1/4 cup fresh basil leaves', 'Salt and pepper to taste'],
        steps: [
            'Cook whole wheat penne according to package directions. Reserve 1/2 cup pasta water.',
            'Heat olive oil in a large pan. Saut\u00e9 sliced zucchini and mushrooms 3-4 minutes.',
            'Add halved cherry tomatoes and minced garlic, cook 2 more minutes.',
            'Toss in the drained pasta and a splash of pasta water.',
            'Season with salt, pepper, and torn fresh basil.',
            'Serve with an optional drizzle of olive oil.'
        ]
    },
    'Grilled Steak with Sweet Potato': {
        prepTime: '10 min', cookTime: '20 min', servings: 1,
        ingredientsList: ['7 oz (200g) lean sirloin steak', '1 medium sweet potato', '1 cup (110g) green beans', '2 garlic cloves, minced', '1 tbsp olive oil', 'Salt and pepper to taste'],
        steps: [
            'Preheat grill or grill pan to high heat.',
            'Season lean sirloin steak with salt, pepper, and minced garlic.',
            'Pierce sweet potato with a fork and microwave 5-7 minutes until tender (or bake at 400°F for 40 min).',
            'Grill steak 4-5 minutes per side for medium. Let rest 5 minutes.',
            'Steam green beans for 4 minutes.',
            'Slice steak, split open sweet potato, and serve with green beans.'
        ]
    },
    'Turkey Meatballs with Quinoa': {
        prepTime: '15 min', cookTime: '25 min', servings: 2,
        ingredientsList: ['1 lb (450g) lean ground turkey', '1/2 cup (85g) quinoa', '1 cup (240ml) marinara sauce', '1 large egg', '1/4 cup (30g) breadcrumbs', '2 cups (60g) fresh spinach', '2 garlic cloves, minced', 'Salt and pepper'],
        steps: [
            'Preheat oven to 400°F (200°C).',
            'Mix lean ground turkey with 1 egg, breadcrumbs, minced garlic, salt, and pepper.',
            'Roll into golf ball-sized meatballs and place on a lined baking sheet.',
            'Bake 18-20 minutes until cooked through.',
            'Cook quinoa according to package directions.',
            'Warm marinara sauce in a pan, add meatballs and coat.',
            'Serve meatballs and sauce over quinoa with steamed spinach.'
        ]
    },
    'Double Chicken & Rice Power Bowl': {
        prepTime: '10 min', cookTime: '20 min', servings: 1,
        ingredientsList: ['2 chicken breasts (12 oz / 340g total)', '3/4 cup (140g) brown rice', '2 cups (180g) broccoli florets', '1 lemon, juiced', '1 tbsp olive oil', 'Salt and pepper to taste'],
        steps: [
            'Cook brown rice according to package directions.',
            'Season 2 chicken breasts with salt, pepper, and a squeeze of lemon.',
            'Grill or pan-sear 5-6 minutes per side until cooked through.',
            'Steam broccoli florets for 4-5 minutes.',
            'Slice chicken and serve over brown rice with broccoli.',
            'Drizzle with a little olive oil and lemon juice.'
        ]
    },
    'Tuna & White Bean Salad': {
        prepTime: '10 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1 can (5 oz / 140g) tuna in water, drained', '1 cup (180g) cannellini beans, drained', '1 cup (150g) cherry tomatoes, halved', '1/4 red onion, diced', '2 cups (60g) mixed greens', '1 lemon, juiced', '1 tbsp olive oil', 'Salt and pepper'],
        steps: [
            'Drain canned tuna and flake into a bowl.',
            'Add drained white beans, halved cherry tomatoes, and diced red onion.',
            'Whisk lemon juice and olive oil for dressing.',
            'Toss everything together and season with salt and pepper.',
            'Serve over a bed of mixed greens.'
        ]
    },
    // SNACKS
    'Protein Shake': {
        prepTime: '3 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1 scoop (30g) protein powder', '1 cup (240ml) almond milk', '1 medium banana'],
        steps: [
            'Add 1 scoop protein powder, 1 cup almond milk, and 1 banana to a blender.',
            'Blend on high for 30-60 seconds until smooth.',
            'Pour and enjoy immediately.'
        ]
    },
    'Chicken Jerky & Almonds': {
        prepTime: '1 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1 oz (28g) low-sodium chicken jerky', '1 oz (28g) almonds'],
        steps: [
            'Grab a serving of low-sodium chicken jerky (about 1 oz).',
            'Pair with a small handful of almonds (about 1 oz).',
            'Enjoy as a portable high-protein snack.'
        ]
    },
    'Apple Slices with Almond Butter': {
        prepTime: '3 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1 medium apple', '1 tbsp (16g) natural almond butter'],
        steps: [
            'Core and slice an apple into wedges.',
            'Serve with 1 tablespoon of natural almond butter for dipping.'
        ]
    },
    'Carrot & Celery Sticks with Hummus': {
        prepTime: '5 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1 large carrot, cut into sticks', '2 celery stalks, cut into sticks', '1/4 cup (60g) hummus'],
        steps: [
            'Wash and cut carrots and celery into sticks.',
            'Scoop 1/4 cup hummus into a small bowl.',
            'Arrange veggie sticks on a plate with hummus for dipping.'
        ]
    },
    'Greek Yogurt with Honey': {
        prepTime: '2 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['3/4 cup (170g) low-fat plain Greek yogurt', '1 tsp honey'],
        steps: [
            'Scoop low-fat Greek yogurt into a bowl.',
            'Drizzle with a teaspoon of honey.',
            'Stir lightly or leave swirled and enjoy.'
        ]
    },
    'Mixed Nuts (Unsalted)': {
        prepTime: '1 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1 oz (28g) unsalted mixed nuts (almonds, walnuts, cashews)'],
        steps: [
            'Measure out a small handful (about 1 oz / 28g) of unsalted mixed nuts.',
            'Enjoy as-is for a quick, satisfying snack.'
        ]
    },
    'Rice Cakes with Avocado': {
        prepTime: '3 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['2 brown rice cakes', '1/2 avocado, mashed', 'Pinch of sea salt'],
        steps: [
            'Mash half an avocado with a fork.',
            'Spread onto 2 brown rice cakes.',
            'Sprinkle with a tiny pinch of sea salt and serve.'
        ]
    },
    'Hard-Boiled Eggs (2)': {
        prepTime: '2 min', cookTime: '12 min', servings: 1,
        ingredientsList: ['2 large eggs', 'Pinch of paprika', 'Salt to taste'],
        steps: [
            'Place 2 eggs in a saucepan and cover with cold water by 1 inch.',
            'Bring to a boil, then remove from heat and cover. Let sit 10 minutes.',
            'Transfer eggs to ice water for 2 minutes to cool.',
            'Peel, sprinkle with paprika, and enjoy.'
        ]
    },
    'Banana with Peanut Butter': {
        prepTime: '2 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1 medium banana', '1 tbsp (16g) natural peanut butter'],
        steps: [
            'Peel a medium banana.',
            'Spread or dip with 1 tablespoon of natural peanut butter.',
            'Enjoy as-is or slice banana and drizzle peanut butter on top.'
        ]
    },
    'Cherry Tomatoes with Mozzarella': {
        prepTime: '5 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1 cup (150g) cherry tomatoes', '1/4 cup (60g) fresh mozzarella pearls', '1 tsp balsamic glaze'],
        steps: [
            'Halve a handful of cherry tomatoes.',
            'Combine with fresh mozzarella pearls in a small bowl.',
            'Drizzle with balsamic glaze and serve.'
        ]
    },
    'Edamame (Steamed)': {
        prepTime: '1 min', cookTime: '5 min', servings: 1,
        ingredientsList: ['1 cup (155g) edamame pods (in shell)', 'Pinch of sea salt'],
        steps: [
            'Bring a pot of water to a boil.',
            'Add 1 cup of edamame pods and cook 4-5 minutes.',
            'Drain, sprinkle lightly with sea salt.',
            'Squeeze pods to pop out the beans and enjoy.'
        ]
    },
    'Trail Mix (Low Sugar)': {
        prepTime: '3 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['2 tbsp pumpkin seeds', '2 tbsp sunflower seeds', '2 tbsp dried cranberries', '1 tbsp dark chocolate chips'],
        steps: [
            'Mix together pumpkin seeds, sunflower seeds, dried cranberries, and a small handful of dark chocolate chips.',
            'Store extra portions in small bags for grab-and-go snacking.'
        ]
    },
    'Cottage Cheese & Pineapple': {
        prepTime: '3 min', cookTime: '0 min', servings: 1,
        ingredientsList: ['1/2 cup (115g) low-fat cottage cheese', '1/2 cup (80g) fresh pineapple chunks'],
        steps: [
            'Scoop low-fat cottage cheese into a bowl.',
            'Top with fresh pineapple chunks.',
            'Enjoy chilled.'
        ]
    },
    'Oat Energy Balls': {
        prepTime: '10 min', cookTime: '0 min', servings: 6,
        ingredientsList: ['1 cup (90g) rolled oats', '2 tbsp (40g) honey', '1 tbsp ground flaxseed', '2 tbsp dark chocolate chips'],
        steps: [
            'In a bowl, mix 1 cup rolled oats, 2 tbsp honey, 1 tbsp ground flaxseed, and 2 tbsp dark chocolate chips.',
            'Stir until everything is well combined (add a splash of water if too dry).',
            'Roll mixture into small balls (about 1 inch each).',
            'Place on a plate or tray and refrigerate for 30 minutes to firm up.',
            'Store in the fridge for up to a week.'
        ]
    },
    // --- SOUTH ASIAN RECIPES ---
    'Masala Omelette with Roti': {
        prepTime: '5 min', cookTime: '8 min', servings: 1,
        ingredientsList: ['2 large eggs', '1/4 onion, finely diced', '1 green chilli, minced', '1 small tomato, diced', '2 tbsp fresh cilantro, chopped', '1 whole wheat roti', '1/4 tsp turmeric', '1 tsp oil', 'Salt to taste'],
        steps: [
            'Whisk 2 eggs with finely diced onion, green chilli, tomato, cilantro, salt, and a pinch of turmeric.',
            'Heat oil in a non-stick pan over medium heat.',
            'Pour the egg mixture and cook 2-3 minutes until the bottom sets.',
            'Flip and cook 1-2 more minutes.',
            'Serve with a warm whole wheat roti.'
        ]
    },
    'Poha (Flattened Rice)': {
        prepTime: '5 min', cookTime: '10 min', servings: 1,
        ingredientsList: ['1 cup (60g) poha (flattened rice)', '1/2 tsp mustard seeds', '1/4 tsp turmeric', '2 tbsp peanuts', '1/2 onion, diced', '6-8 curry leaves', '1/2 lemon, juiced', '1 tbsp oil', 'Salt to taste'],
        steps: [
            'Rinse poha in water, drain, and set aside for 5 minutes to soften.',
            'Heat oil in a pan, add mustard seeds and curry leaves. Let them splutter.',
            'Add diced onion and peanuts, saut\u00e9 2-3 minutes.',
            'Add turmeric and salt, then add the softened poha.',
            'Toss gently for 2-3 minutes.',
            'Squeeze lemon juice over, garnish with cilantro, and serve.'
        ]
    },
    'Idli with Sambar': {
        prepTime: '10 min (plus batter prep)', cookTime: '15 min', servings: 2,
        ingredientsList: ['2 cups idli batter (rice & urad dal)', '1/2 cup (100g) toor dal (split pigeon peas)', '1.5 cups mixed vegetables (carrot, drumstick, etc.)', '2 tbsp sambar powder', '1/2 tsp turmeric', '1/2 tsp mustard seeds', '6-8 curry leaves', '2 tbsp grated coconut', '1 tbsp oil', 'Salt to taste'],
        steps: [
            'Pour idli batter into greased idli molds.',
            'Steam for 10-12 minutes until a toothpick comes out clean.',
            'For sambar: boil toor dal until soft. In a pot, cook diced vegetables in water with sambar powder and turmeric.',
            'Add cooked dal to the vegetable mix. Simmer 5 minutes.',
            'Temper with mustard seeds, curry leaves, and dried chillies in oil. Pour into sambar.',
            'Serve idlis hot with sambar and coconut chutney.'
        ]
    },
    'Chicken Tikka with Brown Rice': {
        prepTime: '15 min + marinate', cookTime: '15 min', servings: 1,
        ingredientsList: ['6 oz (170g) chicken breast, cubed', '1/4 cup (60g) plain yogurt', '1 tbsp tikka spice mix', '1 lemon, juiced', '1/2 cup (95g) brown rice', '1/2 cucumber, diced', '1 small tomato', '2 tbsp fresh mint', 'Salt to taste'],
        steps: [
            'Cut chicken into chunks. Marinate in yogurt, tikka spices, lemon juice, salt for 30 min (or overnight).',
            'Cook brown rice according to package directions.',
            'Thread chicken onto skewers or place on a baking sheet.',
            'Grill or broil 6-7 minutes per side until charred and cooked through.',
            'Mix yogurt with diced cucumber and mint for raita.',
            'Serve chicken tikka over rice with raita and a fresh salad.'
        ]
    },
    'Dal Tadka with Jeera Rice': {
        prepTime: '10 min', cookTime: '25 min', servings: 2,
        ingredientsList: ['1 cup (200g) toor dal (split pigeon peas)', '1 cup (190g) basmati rice', '1 tsp cumin seeds (jeera)', '4 garlic cloves, minced', '1 tbsp ghee', '1/2 tsp turmeric', '1 small tomato, diced', '1 lemon, juiced', 'Salt to taste'],
        steps: [
            'Wash toor dal and pressure cook or boil with turmeric until soft (15-20 min).',
            'Cook basmati rice with whole cumin seeds (jeera rice).',
            'For tadka: heat ghee, add cumin seeds, minced garlic, and diced tomato. Cook 2-3 minutes.',
            'Pour the tadka into the cooked dal and stir well.',
            'Simmer 5 minutes, season with salt.',
            'Serve dal over jeera rice with a squeeze of lemon.'
        ]
    },
    'Chana Masala with Roti': {
        prepTime: '10 min', cookTime: '20 min', servings: 2,
        ingredientsList: ['2 cups (360g) chickpeas, drained', '1 large onion, diced', '2 medium tomatoes, diced', '1 tbsp garam masala', '1 tsp cumin', '1 tsp ginger-garlic paste', '2 whole wheat rotis', '2 tbsp fresh cilantro', '1 tbsp oil', 'Salt to taste'],
        steps: [
            'Heat oil in a pan. Saut\u00e9 diced onion until golden, about 5 minutes.',
            'Add minced ginger-garlic, cook 1 minute.',
            'Add diced tomatoes, garam masala, cumin, turmeric, and chili powder. Cook 5 minutes.',
            'Add drained chickpeas and 1/2 cup water. Simmer 10 minutes.',
            'Garnish with fresh cilantro and a squeeze of lemon.',
            'Serve with warm whole wheat roti.'
        ]
    },
    'Tandoori Salmon with Mint Chutney': {
        prepTime: '10 min + marinate', cookTime: '15 min', servings: 1,
        ingredientsList: ['1 salmon fillet (6 oz / 170g)', '1/4 cup (60g) plain yogurt', '1 tbsp tandoori spice mix', '1/2 cup (95g) basmati rice', '1/2 cup fresh mint leaves', '2 tbsp fresh cilantro', '1 lemon, juiced', 'Salt to taste'],
        steps: [
            'Marinate salmon in yogurt, tandoori spice mix, lemon juice, and salt for 20+ minutes.',
            'Cook basmati rice according to package directions.',
            'Preheat oven to 425\u00b0F (220\u00b0C).',
            'Place salmon on a lined baking sheet and bake 12-15 minutes.',
            'Blend mint, cilantro, lemon juice, and a little water for chutney.',
            'Serve salmon over rice with mint chutney drizzled on top.'
        ]
    },
    'Palak Paneer with Naan': {
        prepTime: '10 min', cookTime: '20 min', servings: 2,
        ingredientsList: ['4 cups (120g) fresh spinach', '6 oz (170g) paneer, cubed', '1 onion, diced', '3 garlic cloves, minced', '1 tsp grated ginger', '2 tbsp cream', '1 tsp garam masala', '2 whole wheat naan', '1 tbsp oil', 'Salt to taste'],
        steps: [
            'Blanch spinach in boiling water for 2 minutes, then blend into a puree.',
            'Heat oil, saut\u00e9 diced onion, garlic, and ginger until soft.',
            'Add the spinach puree, a pinch of garam masala, and salt. Simmer 5 minutes.',
            'Cut paneer into cubes and add to the spinach gravy.',
            'Stir in a splash of cream and simmer 5 more minutes.',
            'Warm whole wheat naan in the oven or on a dry pan.',
            'Serve palak paneer with naan.'
        ]
    },
    // --- EAST ASIAN RECIPES ---
    'Congee with Century Egg & Pork': {
        prepTime: '5 min', cookTime: '40 min', servings: 2,
        ingredientsList: ['1/2 cup (95g) jasmine rice', '5 cups (1.2L) water', '1 century egg', '4 oz (115g) pork loin, cooked and shredded', '1 tbsp julienned ginger', '2 scallions, chopped', '1 tsp sesame oil', '1/4 tsp white pepper', 'Salt to taste'],
        steps: [
            'Rinse 1/2 cup rice. Add to a pot with 5 cups water.',
            'Bring to a boil, reduce heat, and simmer 30-40 minutes, stirring occasionally, until thick and creamy.',
            'While congee cooks, shred cooked pork loin.',
            'Dice century egg into small pieces.',
            'Ladle congee into bowls. Top with pork, century egg, ginger, and scallions.',
            'Drizzle with sesame oil and white pepper.'
        ]
    },
    'Kung Pao Chicken': {
        prepTime: '10 min', cookTime: '12 min', servings: 1,
        ingredientsList: ['6 oz (170g) chicken breast, cubed', '2 tbsp peanuts', '1 bell pepper, diced', '1 small zucchini, diced', '4-5 dried chillies', '1 tbsp low-sodium soy sauce', '1 tbsp rice vinegar', '1/2 tsp sugar', '1/2 cup (95g) steamed rice', '1 tbsp oil'],
        steps: [
            'Cut chicken breast into bite-sized cubes.',
            'Mix soy sauce, rice vinegar, and a pinch of sugar for the sauce.',
            'Heat oil in a wok over high heat. Stir-fry chicken 3-4 minutes. Remove.',
            'Add dried chillies and peanuts, toss 30 seconds.',
            'Add diced bell peppers and zucchini, stir-fry 2 minutes.',
            'Return chicken, pour sauce over, toss to coat.',
            'Serve over steamed rice.'
        ]
    },
    'Mapo Tofu with Rice': {
        prepTime: '10 min', cookTime: '15 min', servings: 2,
        ingredientsList: ['14 oz (400g) silken tofu, cubed', '4 oz (115g) lean ground pork', '1 tbsp Sichuan peppercorns', '2 tbsp chili bean paste (doubanjiang)', '3 garlic cloves, minced', '3 scallions, chopped', '1 tbsp low-sodium soy sauce', '1 cup (190g) steamed rice', '1 tbsp oil'],
        steps: [
            'Cut tofu into 1-inch cubes. Gently blanch in salted water for 2 minutes.',
            'Heat oil in a wok, brown lean ground pork for 3-4 minutes.',
            'Add minced garlic and chili bean paste. Stir 1 minute.',
            'Add 1/2 cup water and a splash of soy sauce. Bring to a simmer.',
            'Gently add tofu cubes, simmer 5 minutes.',
            'Sprinkle Sichuan peppercorn powder and sliced scallions.',
            'Serve over steamed rice.'
        ]
    },
    'Sweet & Sour Fish': {
        prepTime: '10 min', cookTime: '20 min', servings: 1,
        ingredientsList: ['1 white fish fillet (6 oz / 170g)', '1/2 cup (80g) pineapple chunks', '1 bell pepper, diced', '2 tbsp rice vinegar', '2 tbsp tomato paste', '1 tsp sugar', '1 tbsp low-sodium soy sauce', '1 tbsp cornstarch', '1/2 cup (95g) jasmine rice'],
        steps: [
            'Cut fish into pieces, season and lightly coat with cornstarch.',
            'Bake at 400\u00b0F for 12-15 minutes until crispy.',
            'In a pan, mix rice vinegar, tomato paste, a little sugar, and soy sauce.',
            'Add diced pineapple and bell peppers, cook 3-4 minutes.',
            'Add the baked fish to the sauce, toss gently.',
            'Serve over jasmine rice.'
        ]
    },
    // --- JAPANESE RECIPES ---
    'Salmon Poke Bowl': {
        prepTime: '15 min', cookTime: '15 min', servings: 1,
        ingredientsList: ['5 oz (140g) sushi-grade salmon, cubed', '1/2 cup (95g) sushi rice', '1 tbsp rice vinegar', '1/3 cup (50g) edamame', '1/2 cucumber, sliced', '1/2 avocado, sliced', '2 tbsp pickled ginger', '1 tbsp low-sodium soy sauce', '1 tsp sesame oil', '1 tsp sesame seeds'],
        steps: [
            'Cook sushi rice according to package, season with rice vinegar.',
            'Cut fresh salmon into 1/2-inch cubes.',
            'Marinate salmon in soy sauce and sesame oil for 5 minutes.',
            'Prepare toppings: slice cucumber, dice avocado, thaw edamame.',
            'Assemble bowl: rice base, salmon, and all toppings arranged on top.',
            'Garnish with sesame seeds and pickled ginger.'
        ]
    },
    'Chicken Teriyaki Don': {
        prepTime: '10 min', cookTime: '15 min', servings: 1,
        ingredientsList: ['1 chicken thigh (skinless, 6 oz / 170g)', '2 tbsp low-sodium soy sauce', '1 tbsp mirin', '1 tsp honey', '1/2 cup (95g) steamed rice', '1 cup (90g) broccoli florets', '1 tsp sesame seeds'],
        steps: [
            'Cook steamed rice according to package directions.',
            'Mix soy sauce, mirin, and honey for teriyaki sauce.',
            'Grill or pan-sear chicken thigh 5-6 minutes per side.',
            'In the last 2 minutes, brush teriyaki sauce on both sides.',
            'Steam broccoli for 4 minutes.',
            'Slice chicken and serve over rice with broccoli. Drizzle extra sauce and sesame seeds.'
        ]
    },
    'Miso Glazed Cod with Soba Noodles': {
        prepTime: '10 min + marinate', cookTime: '15 min', servings: 1,
        ingredientsList: ['1 cod fillet (6 oz / 170g)', '2 tbsp white miso paste', '1 tbsp mirin', '1 tsp sugar', '3 oz (85g) soba noodles', '2 baby bok choy, halved', '1 tsp grated ginger'],
        steps: [
            'Mix white miso paste with a little mirin and sugar. Coat cod and marinate 20+ minutes.',
            'Cook soba noodles according to package, rinse under cold water.',
            'Broil cod on high for 8-10 minutes until caramelized on top.',
            'Steam bok choy for 3 minutes.',
            'Serve cod over soba noodles with bok choy on the side.',
            'Garnish with sliced ginger.'
        ]
    },
    // --- KOREAN RECIPES ---
    'Bibimbap': {
        prepTime: '15 min', cookTime: '15 min', servings: 1,
        ingredientsList: ['1/2 cup (95g) steamed rice', '1 cup (30g) fresh spinach', '1/2 cup (50g) bean sprouts', '1 carrot, julienned', '1/2 zucchini, sliced', '1 large egg', '1-2 tbsp gochujang (Korean chili paste)', '1 tsp sesame oil', '2 garlic cloves, minced', '1 tsp sesame seeds'],
        steps: [
            'Cook steamed rice.',
            'Separately season and saut\u00e9 each vegetable: spinach with garlic, bean sprouts with sesame, julienned carrots, sliced zucchini.',
            'Fry an egg sunny-side up.',
            'Place rice in a bowl, arrange vegetables in sections on top.',
            'Place fried egg in the center.',
            'Serve with gochujang sauce on the side. Mix everything together before eating.'
        ]
    },
    'Korean Beef Bulgogi with Rice': {
        prepTime: '15 min + marinate', cookTime: '10 min', servings: 2,
        ingredientsList: ['12 oz (340g) beef sirloin, thinly sliced', '1/2 Asian pear, grated', '3 tbsp low-sodium soy sauce', '1 tbsp sesame oil', '4 garlic cloves, minced', '1 tsp sugar', '1 cup (190g) steamed rice', '1/2 cup (75g) kimchi', '2 scallions, chopped', '1 tsp sesame seeds'],
        steps: [
            'Thinly slice beef sirloin (freeze 30 min for easier slicing).',
            'Blend pear, soy sauce, sesame oil, garlic, and sugar for marinade. Marinate beef 30+ minutes.',
            'Cook steamed rice.',
            'Grill or pan-sear marinated beef over high heat 2-3 minutes per side.',
            'Serve over rice with kimchi and sliced scallions.',
            'Sprinkle with sesame seeds.'
        ]
    },
    'Kimchi Jjigae (Kimchi Stew)': {
        prepTime: '10 min', cookTime: '20 min', servings: 2,
        ingredientsList: ['1.5 cups (225g) aged kimchi, sliced', '7 oz (200g) firm tofu, cubed', '4 oz (115g) lean pork belly', '1 small zucchini, sliced', '2 scallions, chopped', '1 tbsp gochugaru (Korean chili flakes)', '2 cups (480ml) water', '1 cup (190g) steamed rice'],
        steps: [
            'Slice aged kimchi and lean pork belly into bite-sized pieces.',
            'Saut\u00e9 kimchi and pork in a pot for 3-4 minutes.',
            'Add 2 cups water, bring to a boil, then simmer 10 minutes.',
            'Cut tofu into cubes, add to the stew.',
            'Add sliced zucchini and gochugaru (chili flakes). Simmer 5 more minutes.',
            'Top with scallions and serve with steamed rice.'
        ]
    },
    // --- LATIN AMERICAN RECIPES ---
    'Huevos Rancheros': {
        prepTime: '5 min', cookTime: '10 min', servings: 1,
        ingredientsList: ['2 large eggs', '2 corn tortillas (6-inch)', '1/2 cup (90g) black beans', '1/3 cup (80ml) ranchero salsa', '1/2 avocado, diced', '2 tbsp queso fresco, crumbled', '2 tbsp fresh cilantro', '1/2 tsp cumin'],
        steps: [
            'Warm corn tortillas in a dry pan.',
            'Heat black beans in a small pot with a pinch of cumin.',
            'Fry 2 eggs sunny-side up or over-easy.',
            'Warm ranchero salsa in a saucepan.',
            'Layer: tortillas, beans, eggs, salsa on top.',
            'Add diced avocado, crumbled queso fresco, and cilantro.'
        ]
    },
    'Arepas with Black Beans & Cheese': {
        prepTime: '10 min', cookTime: '15 min', servings: 2,
        ingredientsList: ['1 cup (120g) masa harina (precooked corn flour)', '1.25 cups (300ml) warm water', '1 cup (180g) black beans, seasoned', '1/2 cup (55g) shredded cheese', '1/2 avocado, sliced', '1/2 tsp cumin', '1/2 tsp salt'],
        steps: [
            'Mix masa harina with warm water and salt to form a dough.',
            'Shape into thick discs about 3 inches wide.',
            'Cook on a griddle or pan 5-6 minutes per side until a crust forms.',
            'Optionally bake at 350\u00b0F for 10 more minutes for extra fluffiness.',
            'Split open and stuff with seasoned black beans, shredded cheese, and avocado slices.'
        ]
    },
    'Chicken Burrito Bowl': {
        prepTime: '10 min', cookTime: '15 min', servings: 1,
        ingredientsList: ['6 oz (170g) chicken breast', '1/2 cup (95g) rice', '1/2 cup (90g) black beans', '1/4 cup (40g) corn', '1 medium tomato, diced', '1/4 onion, diced', '1/2 avocado', '1 lime, juiced', '2 tbsp fresh cilantro'],
        steps: [
            'Cook rice with a squeeze of lime and chopped cilantro.',
            'Season chicken breast with cumin, chili powder, salt. Grill or pan-sear 5-6 min per side.',
            'Warm black beans with a pinch of cumin.',
            'Dice tomato and onion for pico de gallo, mix with lime and cilantro.',
            'Mash avocado with lime and salt for guacamole.',
            'Slice chicken. Assemble bowl: rice, beans, chicken, corn, pico, guacamole.'
        ]
    },
    'Ceviche with Tostadas': {
        prepTime: '20 min', cookTime: '0 min (cure time: 30 min)', servings: 2,
        ingredientsList: ['8 oz (225g) sushi-grade white fish, diced', '1/2 cup (120ml) fresh lime juice', '1 medium tomato, diced', '1/2 red onion, diced', '1 jalapeno, minced', '1/4 cup fresh cilantro', '1/2 avocado', '4 corn tostadas', 'Salt to taste'],
        steps: [
            'Dice white fish into small cubes.',
            'Cover with fresh lime juice in a bowl. Refrigerate 30 minutes until fish turns opaque.',
            'Drain most of the lime juice.',
            'Mix in diced tomato, red onion, jalapeno, and cilantro.',
            'Season with salt.',
            'Spoon onto baked corn tostadas. Top with avocado slices.'
        ]
    },
    'Arroz con Pollo': {
        prepTime: '10 min', cookTime: '30 min', servings: 2,
        ingredientsList: ['2 chicken thighs (skinless)', '1 cup (190g) rice', '1 bell pepper, diced', '1/2 cup (75g) frozen peas', '1/4 cup green olives', '4 garlic cloves, minced', '1 cup (240ml) tomato sauce', '1 tsp cumin', '2 cups (480ml) water', '1 tbsp olive oil'],
        steps: [
            'Season chicken thighs with cumin, salt, and pepper. Brown in a large pot 3-4 min per side. Remove.',
            'Saut\u00e9 diced onion, bell peppers, and garlic in the same pot.',
            'Add rice, tomato sauce, and 2 cups water. Stir.',
            'Nestle chicken back in, add olives and peas.',
            'Cover and simmer 20-25 minutes until rice is cooked and chicken is done.',
            'Fluff rice, garnish with cilantro, and serve.'
        ]
    },
    // --- MIDDLE EASTERN RECIPES ---
    'Chicken Shawarma Bowl': {
        prepTime: '10 min + marinate', cookTime: '15 min', servings: 1,
        ingredientsList: ['6 oz (170g) chicken breast, sliced', '1 tbsp shawarma spice mix', '1/4 cup (60g) hummus', '1/2 cup cooked bulgur wheat', '1/4 cup fresh parsley, chopped', '1 medium tomato, diced', '1 small pita bread', '2 tbsp pickled turnips', '1 tsp olive oil'],
        steps: [
            'Marinate sliced chicken in shawarma spices, yogurt, lemon, and olive oil for 30+ minutes.',
            'Make tabbouleh: mix cooked bulgur with diced parsley, tomato, lemon juice, and olive oil.',
            'Cook chicken in a hot pan or grill 4-5 minutes per side.',
            'Warm pita bread.',
            'Assemble bowl: greens, tabbouleh, sliced chicken, hummus, and pickled turnips.',
            'Drizzle with tahini or lemon juice.'
        ]
    },
    'Falafel Wrap': {
        prepTime: '15 min', cookTime: '20 min', servings: 2,
        ingredientsList: ['1 cup (180g) dried chickpeas (soaked overnight)', '1/4 cup fresh parsley', '3 garlic cloves', '1 tsp cumin', '1 tsp coriander', '2 whole wheat wraps', '2 tbsp tahini', '1 cup (30g) mixed greens', '1 medium tomato, diced', '1/4 cup pickles', 'Salt to taste'],
        steps: [
            'Blend soaked chickpeas (not canned), parsley, cumin, garlic, and salt in a food processor.',
            'Form into small patties.',
            'Bake at 375\u00b0F (190\u00b0C) for 10 minutes per side until golden and firm.',
            'Warm whole wheat wraps.',
            'Fill wraps with falafel, mixed greens, diced tomato, pickles.',
            'Drizzle generously with tahini sauce. Roll up and serve.'
        ]
    },
    'Lamb Kofta with Tabbouleh': {
        prepTime: '15 min', cookTime: '12 min', servings: 2,
        ingredientsList: ['12 oz (340g) lean ground lamb', '1/2 onion, finely minced', '1 tsp cumin', '1 tsp ground coriander', '1 cup cooked bulgur wheat', '1 cup fresh parsley, chopped', '1 medium tomato, diced', '1 lemon, juiced', '2 tbsp Greek yogurt', '2 tbsp fresh mint'],
        steps: [
            'Mix lean ground lamb with minced onion, cumin, coriander, salt, and pepper.',
            'Shape into small oval koftas around skewers.',
            'Grill or broil 5-6 minutes per side until cooked through.',
            'Make tabbouleh: combine cooked bulgur, finely chopped parsley, diced tomato, lemon juice, olive oil.',
            'Serve koftas over tabbouleh with a dollop of yogurt and fresh mint.'
        ]
    },
    'Labneh with Za\'atar & Pita': {
        prepTime: '3 min', cookTime: '3 min', servings: 1,
        ingredientsList: ['1/3 cup (75g) labneh (strained yogurt)', '1 tsp za\'atar spice', '1 tsp olive oil', '1/2 small pita bread, cut into wedges'],
        steps: [
            'Spread labneh on a small plate.',
            'Drizzle with olive oil and sprinkle za\'atar generously.',
            'Toast pita wedges in the oven or a dry pan until crisp.',
            'Scoop labneh with warm pita and enjoy.'
        ]
    },
    // --- AFRICAN RECIPES ---
    'Jollof Rice with Grilled Chicken': {
        prepTime: '15 min', cookTime: '35 min', servings: 2,
        ingredientsList: ['1 cup (190g) long-grain rice', '2 chicken thighs (skinless)', '3 tbsp tomato paste', '2 medium tomatoes, blended', '1 onion, blended', '1 scotch bonnet pepper', '1 ripe plantain, sliced', '1 tsp dried thyme', '1 tbsp oil', 'Salt to taste'],
        steps: [
            'Blend tomatoes, scotch bonnet pepper, and onion into a smooth paste.',
            'Season chicken with salt and spices. Grill or bake until cooked through.',
            'Heat oil in a pot, fry the tomato paste until reduced and the oil floats on top (about 10 min).',
            'Add washed rice, thyme, and enough water to cover. Stir.',
            'Cover tightly and cook on low 20-25 minutes until rice is tender.',
            'Fry sliced plantain in a little oil until golden.',
            'Serve jollof rice with grilled chicken and fried plantain.'
        ]
    },
    'Ethiopian Lentil Stew (Misir Wot)': {
        prepTime: '10 min', cookTime: '30 min', servings: 2,
        ingredientsList: ['1 cup (200g) red lentils, rinsed', '1 large onion, finely diced', '4 garlic cloves, minced', '2 tbsp berbere spice', '2 tbsp tomato paste', '2.5 cups (600ml) water', '2 tbsp olive oil', '2 cups (380g) cooked rice or 1 piece injera (per serving)', 'Salt to taste'],
        steps: [
            'Dice onion finely. Cook in a dry pot over medium heat until softened (no oil for traditional method).',
            'Add a splash of oil, minced garlic, and berbere spice. Stir 1-2 minutes.',
            'Add tomato paste and stir.',
            'Add rinsed red lentils and 2.5 cups water. Stir well.',
            'Bring to a boil, reduce heat, and simmer 20-25 minutes until lentils are completely soft.',
            'Season with salt. Serve with injera or rice.'
        ]
    },
    'Moroccan Chicken Tagine': {
        prepTime: '10 min', cookTime: '40 min', servings: 2,
        ingredientsList: ['2 chicken thighs (skinless)', '1 preserved lemon, sliced', '1/3 cup green olives', '1 onion, sliced', 'Pinch of saffron', '1 tsp ground cinnamon', '1 cup (180g) couscous', '1 tbsp olive oil', '1/2 cup (120ml) water', 'Salt and pepper'],
        steps: [
            'Season chicken thighs with salt, pepper, saffron, and cinnamon.',
            'Brown chicken in a tagine or heavy pot with olive oil, 3 min per side. Remove.',
            'Saut\u00e9 sliced onion until soft.',
            'Return chicken, add preserved lemon slices, green olives, and 1/2 cup water.',
            'Cover and simmer 30-35 minutes until chicken is very tender.',
            'Prepare couscous according to package directions.',
            'Serve chicken and sauce over couscous.'
        ]
    },
    // --- CARIBBEAN RECIPES ---
    'Jerk Chicken with Rice & Peas': {
        prepTime: '15 min + marinate', cookTime: '25 min', servings: 2,
        ingredientsList: ['2 chicken breasts (12 oz / 340g total)', '2 tbsp jerk seasoning', '1 cup (190g) rice', '1/2 cup (90g) kidney beans', '1/2 cup (120ml) light coconut milk', '2 cups (140g) shredded cabbage', '1 lime, juiced', '1 tsp dried thyme'],
        steps: [
            'Marinate chicken in jerk seasoning for at least 1 hour (overnight is best).',
            'Cook rice with coconut milk, kidney beans, thyme, and a pinch of salt.',
            'Grill or bake chicken at 400\u00b0F for 20-25 minutes until charred and cooked through.',
            'Make simple coleslaw: shredded cabbage with lime juice.',
            'Serve jerk chicken with coconut rice & peas and coleslaw.'
        ]
    },
    'Caribbean Fish Curry': {
        prepTime: '10 min', cookTime: '20 min', servings: 2,
        ingredientsList: ['12 oz (340g) white fish fillet, cubed', '1 can (400ml) light coconut milk', '1 medium sweet potato, cubed', '1 bell pepper, sliced', '1/2 scotch bonnet pepper', '1 tbsp curry powder', '1 cup (190g) rice', '1 lime, juiced', '1 tbsp oil', 'Salt to taste'],
        steps: [
            'Cut white fish into large chunks. Season with salt and curry powder.',
            'Dice sweet potato into small cubes.',
            'Heat oil in a pot, saut\u00e9 diced bell peppers and scotch bonnet 2 minutes.',
            'Add sweet potato cubes and light coconut milk. Simmer 10 minutes.',
            'Gently add fish chunks, cover, and simmer 8-10 minutes until fish is cooked.',
            'Squeeze lime juice over the curry. Serve with steamed rice.'
        ]
    },
    'Oxtail Stew with Butter Beans': {
        prepTime: '15 min', cookTime: '3 hours', servings: 4,
        ingredientsList: ['2 lbs (900g) oxtail pieces', '1 cup (180g) butter beans', '3 carrots, chopped', '4 garlic cloves, minced', '1 tbsp dried thyme', '1 tsp ground allspice', '4 cups (960ml) water', '2 cups (380g) cooked rice (per serving 1/2 cup)', '1 tbsp oil'],
        steps: [
            'Season oxtail pieces with allspice, garlic, thyme, salt, and pepper.',
            'Brown oxtail in a heavy pot on all sides.',
            'Add enough water to cover, bring to a boil, then reduce to a low simmer.',
            'Cook 2-2.5 hours until meat is very tender.',
            'Add butter beans, diced carrots. Cook 30 more minutes.',
            'Adjust seasoning. Serve over steamed rice.'
        ]
    },
    'Plantain Chips with Guacamole': {
        prepTime: '10 min', cookTime: '15 min', servings: 2,
        ingredientsList: ['2 green plantains, thinly sliced', '1 ripe avocado', '1 lime, juiced', '1/4 red onion, diced', '2 tbsp fresh cilantro', '1 tsp olive oil', 'Sea salt to taste'],
        steps: [
            'Peel green plantain and slice very thinly.',
            'Toss slices with a little oil and salt. Spread on a baking sheet.',
            'Bake at 375\u00b0F (190\u00b0C) for 12-15 minutes, flipping halfway, until crispy.',
            'Mash avocado with lime juice, diced onion, cilantro, and salt for guacamole.',
            'Serve chips with guacamole for dipping.'
        ]
    }
};

// Merge curated internet recipes and ultra-protein recipes into RECIPES
Object.assign(RECIPES, INTERNET_RECIPES, ULTRA_PROTEIN_RECIPES);
