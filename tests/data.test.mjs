import test from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_DATA } from '../js/data/mock-data.js';

test('MOCK_DATA - Root Structure & Collections Integrity', async (t) => {
  await t.test('Root object exports all required domain collections', () => {
    assert.ok(MOCK_DATA, 'MOCK_DATA should be defined');
    assert.ok(Array.isArray(MOCK_DATA.chefs), 'chefs must be an array');
    assert.ok(Array.isArray(MOCK_DATA.recipes), 'recipes must be an array');
    assert.ok(Array.isArray(MOCK_DATA.supplies), 'supplies must be an array');
    assert.ok(Array.isArray(MOCK_DATA.courses), 'courses must be an array');
    assert.ok(Array.isArray(MOCK_DATA.chats), 'chats must be an array');
    assert.ok(Array.isArray(MOCK_DATA.notifications), 'notifications must be an array');
    assert.ok(typeof MOCK_DATA.trends === 'object', 'trends must be an object');
    assert.ok(typeof MOCK_DATA.user === 'object', 'user must be an object');
    assert.ok(typeof MOCK_DATA.stats === 'object', 'stats must be an object');
  });

  await t.test('Collection sizes meet minimum platform requirements', () => {
    assert.strictEqual(MOCK_DATA.chefs.length, 6, 'Should have exactly 6 verified chefs');
    assert.strictEqual(MOCK_DATA.recipes.length, 8, 'Should have exactly 8 gourmet recipes');
    assert.strictEqual(MOCK_DATA.supplies.length, 8, 'Should have exactly 8 B2B commercial supplies');
    assert.strictEqual(MOCK_DATA.courses.length, 4, 'Should have exactly 4 masterclasses');
    assert.ok(MOCK_DATA.chats.length >= 3, 'Should have at least 3 initial chat threads');
    assert.ok(MOCK_DATA.notifications.length >= 6, 'Should have at least 6 notification items');
  });
});

test('Chefs Dataset - Schema, Bilingual Fields & Constraints', async (t) => {
  const chefIds = new Set();

  for (const chef of MOCK_DATA.chefs) {
    await t.test(`Chef ${chef.id} - ${chef.name_en}`, () => {
      // Uniqueness
      assert.ok(!chefIds.has(chef.id), `Duplicate chef ID: ${chef.id}`);
      chefIds.add(chef.id);

      // Identity & Verification
      assert.ok(chef.id && typeof chef.id === 'string', 'Chef ID must be non-empty string');
      assert.strictEqual(chef.verified, true, 'All 6 featured chefs must be verified');
      assert.ok(chef.handle && chef.handle.startsWith('@'), 'Chef handle must start with @');
      assert.ok(chef.avatar && chef.avatar.startsWith('https://'), 'Chef avatar must be valid HTTPS URL');
      assert.ok(chef.cover && chef.cover.startsWith('https://'), 'Chef cover must be valid HTTPS URL');

      // Bilingual Names & Titles
      assert.ok(chef.name_ar && chef.name_ar.trim().length > 0, 'Chef name_ar is required');
      assert.ok(chef.name_en && chef.name_en.trim().length > 0, 'Chef name_en is required');
      assert.ok(chef.title_ar && chef.title_ar.trim().length > 0, 'Chef title_ar is required');
      assert.ok(chef.title_en && chef.title_en.trim().length > 0, 'Chef title_en is required');

      // Bilingual Bios & Specialties
      assert.ok(chef.bio_ar && chef.bio_ar.trim().length > 20, 'Chef bio_ar must be detailed (>20 chars)');
      assert.ok(chef.bio_en && chef.bio_en.trim().length > 20, 'Chef bio_en must be detailed (>20 chars)');
      assert.ok(chef.specialty_ar && chef.specialty_ar.trim().length > 0, 'Chef specialty_ar is required');
      assert.ok(chef.specialty_en && chef.specialty_en.trim().length > 0, 'Chef specialty_en is required');
      assert.ok(chef.philosophy_ar && chef.philosophy_ar.trim().length > 0, 'Chef philosophy_ar is required');
      assert.ok(chef.philosophy_en && chef.philosophy_en.trim().length > 0, 'Chef philosophy_en is required');

      // Numeric bounds
      assert.ok(chef.followers > 1000, 'Featured chefs must have >1,000 followers');
      assert.ok(chef.following >= 0, 'Following count must be >= 0');
      assert.ok(chef.recipes_count > 0, 'Chef must have published recipes');
      assert.ok(chef.experience_years >= 10, 'Master chefs must have >= 10 years experience');
      assert.ok(chef.rating >= 4.5 && chef.rating <= 5.0, 'Rating must be between 4.5 and 5.0');
      assert.ok(chef.reviews_count > 0, 'Reviews count must be positive');

      // Awards
      assert.ok(Array.isArray(chef.awards) && chef.awards.length > 0, 'Chef must have awards');
      for (const award of chef.awards) {
        assert.ok(award.name_ar && award.name_en, 'Award must have bilingual names');
        assert.ok(award.year >= 2000 && award.year <= 2026, 'Award year must be realistic');
        assert.ok(award.organization_ar && award.organization_en, 'Award must have bilingual organization');
      }

      // Signature Dishes & Restaurants
      assert.ok(Array.isArray(chef.signature_dishes) && chef.signature_dishes.length > 0, 'Must have signature dishes');
      for (const dish of chef.signature_dishes) {
        assert.ok(dish.id && dish.name_ar && dish.name_en && dish.image, 'Signature dish must have ID, names, image');
        if (dish.recipe_id) {
          const recipeExists = MOCK_DATA.recipes.some(r => r.id === dish.recipe_id);
          assert.ok(recipeExists, `Signature dish recipe_id ${dish.recipe_id} must reference existing recipe`);
        }
      }

      assert.ok(Array.isArray(chef.restaurants) && chef.restaurants.length > 0, 'Must have past restaurant affiliations');
      for (const rest of chef.restaurants) {
        assert.ok(rest.name_ar && rest.name_en && rest.role_ar && rest.role_en, 'Restaurant must have bilingual names and roles');
      }
    });
  }
});

test('Recipes Dataset - Schema, Scaler Ingredients & Relational Integrity', async (t) => {
  const recipeIds = new Set();
  const validChefIds = new Set(MOCK_DATA.chefs.map(c => c.id));

  for (const recipe of MOCK_DATA.recipes) {
    await t.test(`Recipe ${recipe.id} - ${recipe.title_en}`, () => {
      // Uniqueness
      assert.ok(!recipeIds.has(recipe.id), `Duplicate recipe ID: ${recipe.id}`);
      recipeIds.add(recipe.id);

      // Relational Integrity: Author must exist
      assert.ok(validChefIds.has(recipe.author_id), `author_id ${recipe.author_id} must exist in chefs dataset`);
      const authorChef = MOCK_DATA.chefs.find(c => c.id === recipe.author_id);
      assert.strictEqual(recipe.author_name_ar, authorChef.name_ar, 'Recipe author_name_ar must match chef record');
      assert.strictEqual(recipe.author_name_en, authorChef.name_en, 'Recipe author_name_en must match chef record');

      // Bilingual Details
      assert.ok(recipe.title_ar && recipe.title_ar.trim().length > 0, 'Recipe title_ar is required');
      assert.ok(recipe.title_en && recipe.title_en.trim().length > 0, 'Recipe title_en is required');
      assert.ok(recipe.description_ar && recipe.description_ar.trim().length > 20, 'Recipe description_ar must be rich');
      assert.ok(recipe.description_en && recipe.description_en.trim().length > 20, 'Recipe description_en must be rich');
      assert.ok(recipe.cuisine_ar && recipe.cuisine_en, 'Cuisine must be bilingual');
      assert.ok(recipe.category_ar && recipe.category_en, 'Category must be bilingual');
      assert.ok(recipe.difficulty_ar && recipe.difficulty_en, 'Difficulty must be bilingual');

      // Images
      assert.ok(recipe.image && recipe.image.startsWith('https://'), 'Recipe image must be valid HTTPS URL');
      assert.ok(Array.isArray(recipe.gallery) && recipe.gallery.length > 0, 'Recipe gallery must be non-empty array');

      // Numeric Bounds
      assert.ok(recipe.base_servings >= 1 && recipe.base_servings <= 24, 'Base servings must be between 1 and 24');
      assert.ok(recipe.prep_time > 0, 'Prep time must be positive');
      assert.ok(recipe.cook_time >= 0, 'Cook time must be non-negative');
      assert.strictEqual(recipe.total_time, recipe.prep_time + recipe.cook_time, 'Total time must equal prep + cook');
      assert.ok(recipe.calories > 0, 'Calories must be positive');
      assert.ok(recipe.likes_count >= 0 && recipe.saves_count >= 0, 'Likes and saves must be non-negative');
      assert.ok(recipe.rating >= 4.0 && recipe.rating <= 5.0, 'Rating must be between 4.0 and 5.0');

      // Ingredients Structure for Dynamic Serving Scaler
      assert.ok(Array.isArray(recipe.ingredients) && recipe.ingredients.length >= 6, 'Recipe must have at least 6 ingredients');
      const ingIds = new Set();
      for (const ing of recipe.ingredients) {
        assert.ok(ing.id, 'Ingredient must have ID');
        assert.ok(!ingIds.has(ing.id), `Duplicate ingredient ID ${ing.id}`);
        ingIds.add(ing.id);

        assert.ok(ing.name_ar && ing.name_ar.trim().length > 0, 'Ingredient name_ar is required');
        assert.ok(ing.name_en && ing.name_en.trim().length > 0, 'Ingredient name_en is required');
        assert.ok(typeof ing.baseAmount === 'number' && ing.baseAmount > 0, 'Ingredient baseAmount must be positive number');
        assert.ok(ing.unit_ar && ing.unit_en, 'Ingredient unit must be bilingual');
        assert.ok(ing.notes_ar !== undefined && ing.notes_en !== undefined, 'Ingredient notes must be defined');
      }

      // Step-by-Step Instructions with Timers and Tips
      assert.ok(Array.isArray(recipe.steps) && recipe.steps.length >= 3, 'Recipe must have at least 3 steps');
      recipe.steps.forEach((step, idx) => {
        assert.strictEqual(step.step_number, idx + 1, 'Step numbers must be sequential 1-indexed');
        assert.ok(step.title_ar && step.title_en, 'Step must have bilingual titles');
        assert.ok(step.instruction_ar && step.instruction_en, 'Step must have bilingual instructions');
        assert.ok(step.timer_minutes > 0, 'Step timer must be positive integer');
        assert.ok(step.tip_ar && step.tip_en, 'Step must have bilingual chef tips');
      });

      // Nutrition Breakdown
      assert.ok(recipe.nutrition, 'Recipe nutrition must exist');
      assert.strictEqual(recipe.nutrition.calories, recipe.calories, 'Nutrition calories must match recipe calories');
      assert.ok(recipe.nutrition.protein && recipe.nutrition.carbs && recipe.nutrition.fats, 'Macro nutrients must be defined');

      // Pairings
      assert.ok(recipe.pairings, 'Pairings must exist');
      assert.ok(recipe.pairings.drink_ar && recipe.pairings.drink_en, 'Drink pairings must be bilingual');
      assert.ok(recipe.pairings.side_ar && recipe.pairings.side_en, 'Side dish pairings must be bilingual');
      assert.ok(recipe.pairings.notes_ar && recipe.pairings.notes_en, 'Pairing notes must be bilingual');
    });
  }
});

test('B2B Supplies Dataset - Schema, Pricing & Specifications', async (t) => {
  const supplyIds = new Set();
  const validCategories = new Set(['heavy_equipment', 'bulk_ingredients', 'knives_cutlery', 'eco_packaging']);

  for (const item of MOCK_DATA.supplies) {
    await t.test(`Supply Item ${item.id} - ${item.name_en}`, () => {
      // Uniqueness
      assert.ok(!supplyIds.has(item.id), `Duplicate supply ID: ${item.id}`);
      supplyIds.add(item.id);

      // Identity & Category
      assert.ok(validCategories.has(item.category), `Invalid supply category: ${item.category}`);
      assert.ok(item.category_ar && item.category_en, 'Category must be bilingual');
      assert.ok(item.name_ar && item.name_ar.trim().length > 0, 'Supply name_ar is required');
      assert.ok(item.name_en && item.name_en.trim().length > 0, 'Supply name_en is required');
      assert.ok(item.description_ar && item.description_en, 'Description must be bilingual');

      // Pricing & Inventory
      assert.ok(typeof item.price === 'number' && item.price > 0, 'Price must be positive number');
      assert.strictEqual(item.currency, 'SAR', 'Currency must be SAR');
      assert.ok(item.price_formatted && item.price_formatted.includes('ر.س'), 'Formatted price must contain SAR symbol');
      assert.ok(typeof item.moq === 'number' && item.moq >= 1, 'MOQ must be at least 1');
      assert.ok(item.unit_ar && item.unit_en, 'Supply unit must be bilingual');
      assert.strictEqual(item.in_stock, true, 'Sample items should be in stock');
      assert.ok(item.stock_count > 0, 'Stock count must be positive');

      // Supplier Profile
      assert.ok(item.supplier, 'Supplier profile must exist');
      assert.ok(item.supplier.id && item.supplier.name_ar && item.supplier.name_en, 'Supplier must have ID and bilingual names');
      assert.strictEqual(item.supplier.verified, true, 'Featured suppliers must be verified');
      assert.ok(item.supplier.rating >= 4.5, 'Supplier rating must be >= 4.5');
      assert.ok(item.supplier.location_ar && item.supplier.location_en, 'Supplier location must be bilingual');

      // Technical Specs & Certifications
      assert.ok(Array.isArray(item.specs) && item.specs.length >= 3, 'Must have at least 3 technical specs');
      for (const spec of item.specs) {
        assert.ok(spec.label_ar && spec.label_en, 'Spec label must be bilingual');
        assert.ok(spec.value_ar && spec.value_en, 'Spec value must be bilingual');
      }

      assert.ok(Array.isArray(item.certifications) && item.certifications.length >= 2, 'Must have at least 2 certifications');
      assert.ok(item.lead_time_ar && item.lead_time_en, 'Lead time must be bilingual');
      assert.ok(item.warranty_ar && item.warranty_en, 'Warranty must be bilingual');
    });
  }
});

test('Masterclasses Dataset - Schedule, Pricing & Syllabus', async (t) => {
  const courseIds = new Set();
  const validChefIds = new Set(MOCK_DATA.chefs.map(c => c.id));

  for (const course of MOCK_DATA.courses) {
    await t.test(`Course ${course.id} - ${course.title_en}`, () => {
      // Uniqueness
      assert.ok(!courseIds.has(course.id), `Duplicate course ID: ${course.id}`);
      courseIds.add(course.id);

      // Relational Integrity: Instructor must exist
      assert.ok(validChefIds.has(course.instructor_id), `instructor_id ${course.instructor_id} must exist in chefs dataset`);
      const instructorChef = MOCK_DATA.chefs.find(c => c.id === course.instructor_id);
      assert.strictEqual(course.instructor_name_ar, instructorChef.name_ar, 'Course instructor_name_ar must match chef record');
      assert.strictEqual(course.instructor_name_en, instructorChef.name_en, 'Course instructor_name_en must match chef record');

      // Bilingual Details
      assert.ok(course.title_ar && course.title_en, 'Course title must be bilingual');
      assert.ok(course.subtitle_ar && course.subtitle_en, 'Course subtitle must be bilingual');
      assert.ok(course.level_ar && course.level_en, 'Course level must be bilingual');
      assert.ok(course.duration_ar && course.duration_en, 'Course duration must be bilingual');
      assert.ok(course.schedule_ar && course.schedule_en, 'Course schedule must be bilingual');

      // Pricing & Seats
      assert.ok(typeof course.price === 'number' && course.price > 0, 'Course price must be positive number');
      assert.strictEqual(course.currency, 'SAR', 'Currency must be SAR');
      assert.ok(course.total_seats > 0, 'Total seats must be positive');
      assert.ok(course.seats_left >= 0 && course.seats_left <= course.total_seats, 'Seats left must be within bounds');
      assert.strictEqual(course.includes_certificate, true, 'All masterclasses include certificate');
      assert.strictEqual(course.total_seats, course.seats_left + course.enrolled_count, 'Total seats must equal seats_left + enrolled');

      // Syllabus & Lessons
      assert.ok(Array.isArray(course.syllabus) && course.syllabus.length >= 3, 'Course must have at least 3 syllabus modules');
      for (const mod of course.syllabus) {
        assert.ok(mod.module_number > 0, 'Module number must be positive');
        assert.ok(mod.title_ar && mod.title_en, 'Module title must be bilingual');
        assert.ok(mod.duration_ar && mod.duration_en, 'Module duration must be bilingual');
        assert.ok(Array.isArray(mod.lessons) && mod.lessons.length >= 2, 'Module must contain at least 2 lessons');
        for (const lesson of mod.lessons) {
          assert.ok(lesson.title_ar && lesson.title_en, 'Lesson title must be bilingual');
          assert.ok(lesson.duration_ar && lesson.duration_en, 'Lesson duration must be bilingual');
        }
      }
    });
  }
});

test('Chats & RFQ Threads - Conversation History & Quote Cards', async (t) => {
  const validSupplyIds = new Set(MOCK_DATA.supplies.map(s => s.id));

  for (const chat of MOCK_DATA.chats) {
    await t.test(`Chat ${chat.id} with ${chat.partner.name_en}`, () => {
      assert.ok(chat.id, 'Chat ID is required');
      assert.ok(chat.partner && chat.partner.name_ar && chat.partner.name_en, 'Chat partner must have bilingual names');
      assert.ok(['chef', 'supplier'].includes(chat.category), 'Chat category must be chef or supplier');
      assert.ok(chat.last_message_ar && chat.last_message_en, 'Last message must be bilingual');
      assert.ok(Array.isArray(chat.messages) && chat.messages.length > 0, 'Chat must have message history');

      // RFQ Card Validation if present
      if (chat.rfq_card) {
        const rfq = chat.rfq_card;
        assert.ok(rfq.rfq_id, 'RFQ card must have RFQ ID');
        assert.ok(validSupplyIds.has(rfq.item_id), `RFQ item_id ${rfq.item_id} must reference existing supply item`);
        assert.ok(rfq.quantity >= 1, 'RFQ quantity must be >= 1');
        assert.ok(rfq.unit_price > 0, 'RFQ unit_price must be > 0');
        assert.strictEqual(rfq.total_price, rfq.quantity * rfq.unit_price, 'RFQ total_price must equal quantity * unit_price');
        assert.ok(['pending', 'quoted', 'accepted', 'rejected'].includes(rfq.status), `Invalid RFQ status: ${rfq.status}`);
        assert.ok(rfq.destination_ar && rfq.destination_en, 'RFQ destination must be bilingual');
      }
    });
  }
});

test('Notifications & Trends - Grouping & Real-Time Metadata', async (t) => {
  await t.test('Notifications contain bilingual text and valid categories', () => {
    const validCategories = new Set(['likes', 'rfqs', 'courses']);
    for (const notif of MOCK_DATA.notifications) {
      assert.ok(notif.id, 'Notification ID is required');
      assert.ok(validCategories.has(notif.category), `Invalid notification category: ${notif.category}`);
      assert.ok(notif.title_ar && notif.title_en, 'Notification title must be bilingual');
      assert.ok(notif.message_ar && notif.message_en, 'Notification message must be bilingual');
      assert.ok(notif.time_ar && notif.time_en, 'Notification relative time must be bilingual');
      assert.ok(typeof notif.read === 'boolean', 'Notification read status must be boolean');
      assert.ok(notif.target_url, 'Notification target URL is required');
    }
  });

  await t.test('Trends stories link to valid chefs', () => {
    const validChefIds = new Set(MOCK_DATA.chefs.map(c => c.id));
    for (const story of MOCK_DATA.trends.stories) {
      assert.ok(validChefIds.has(story.chef_id), `Story chef_id ${story.chef_id} must exist in chefs dataset`);
    }
  });

  await t.test('Trends top suppliers link to valid marketplace vendors', () => {
    assert.ok(Array.isArray(MOCK_DATA.trends.top_suppliers) && MOCK_DATA.trends.top_suppliers.length > 0);
    for (const sup of MOCK_DATA.trends.top_suppliers) {
      assert.ok(sup.name_ar && sup.name_en, 'Top supplier must have bilingual names');
      assert.ok(sup.rating >= 4.5, 'Top supplier rating must be >= 4.5');
    }
  });

  await t.test('Trends upcoming workshops link to valid masterclasses', () => {
    const validCourseIds = new Set(MOCK_DATA.courses.map(c => c.id));
    for (const ws of MOCK_DATA.trends.upcoming_workshops) {
      assert.ok(validCourseIds.has(ws.id), `Workshop ID ${ws.id} must exist in courses dataset`);
    }
  });
});

test('Active User Session & Analytics Dashboard Stats', async (t) => {
  await t.test('User session mock contains complete profile and B2B credentials', () => {
    const user = MOCK_DATA.user;
    assert.ok(user.id, 'User ID is required');
    assert.strictEqual(user.role, 'chef', 'Mock user role should be chef');
    assert.strictEqual(user.verified, true, 'Mock user is verified');
    assert.ok(user.name_ar && user.name_en, 'User name must be bilingual');
    assert.ok(user.email && user.email.includes('@'), 'User email must be valid');
    assert.ok(user.business_profile, 'User business profile must exist');
    assert.ok(user.business_profile.cr_number, 'CR number must be defined');
    assert.ok(user.business_profile.vat_number, 'VAT number must be defined');
    assert.ok(user.stats.recipes_count > 0, 'User stats recipes_count must be positive');
  });

  await t.test('Dashboard stats contain positive KPI metrics and monthly chart arrays', () => {
    const stats = MOCK_DATA.stats;
    assert.ok(stats.kpis.views > 0, 'KPI views must be positive');
    assert.ok(stats.kpis.impressions > 0, 'KPI impressions must be positive');
    assert.ok(stats.kpis.rfqs > 0, 'KPI RFQs must be positive');
    assert.ok(stats.kpis.revenue > 0, 'KPI revenue must be positive');
    assert.ok(Array.isArray(stats.chart_monthly) && stats.chart_monthly.length === 6, 'Monthly chart must have 6 months');
    for (const entry of stats.chart_monthly) {
      assert.ok(entry.month_ar && entry.month_en, 'Chart month must be bilingual');
      assert.ok(entry.views > 0 && entry.revenue > 0 && entry.rfqs > 0, 'Chart metrics must be positive');
    }
  });
});
