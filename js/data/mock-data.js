/**
 * Meyar (معيار) Rich Culinary & B2B Commercial Mock Dataset
 * Complete, highly detailed bilingual dataset for all 12 platform pages and search index.
 */

export const MOCK_DATA = {
  // 1. CHEFS (6 Verified World-Class Chefs)
  chefs: [
    {
      id: 'chef-1',
      name_ar: 'الشيف فيصل الهاشمي',
      name_en: 'Chef Faisal Al-Hashemi',
      handle: '@chef_faisal',
      title: 'Executive Culinary Director & Gastronomy Consultant',
      title_ar: 'المدير التنفيذي للطهي ومستشار فنون الطهي المعاصر',
      title_en: 'Executive Culinary Director & Gastronomy Consultant',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
      verified: true,
      followers: 42800,
      followers_formatted: '42.8k',
      following: 310,
      recipes_count: 24,
      experience_years: 16,
      rating: 4.95,
      reviews_count: 318,
      specialty: 'Modern Saudi Fine Dining & Smoke Fermentation',
      specialty_ar: 'المطبخ السعودي المعاصر وتقنيات التخمير والتدخين',
      specialty_en: 'Modern Saudi Fine Dining & Smoke Fermentation',
      bio_ar: 'رائد فنون الطهي السعودي المعاصر. يعيد ابتكار الوصفات التراثية النجدية والحجازية باستخدام أحدث تقنيات الإنضاج الجاف والتخمير الطبيعي وفنون الطهي الجزيئي.',
      bio_en: 'Pioneer of modern Saudi fine dining. Reinventing heritage Najdi and Hejazi recipes through precision dry-aging, wild fermentation, and progressive molecular gastronomy.',
      philosophy_ar: 'الطهي ليس مجرد إعداد طعام، بل هو تدوين تاريخي حي للأرض والمواسم والنكهات الأصيلة التي تتوارثها الأجيال.',
      philosophy_en: 'Culinary craft is living historical storytelling—capturing terroir, seasons, and ancient flavor wisdom into modern masterpieces.',
      awards: [
        {
          name_ar: 'المرشح النهائي لجائزة البوكوز دور للشرق الأوسط',
          name_en: "Bocuse d'Or Middle East Finalist",
          year: 2024,
          organization_ar: 'أكاديمية البوكوز دور العالمية',
          organization_en: "Bocuse d'Or World Academy",
          badge: 'Gold'
        },
        {
          name_ar: 'شيف العام لفنون الطهي التراثي الحديث',
          name_en: 'Heritage Innovation Chef of the Year',
          year: 2023,
          organization_ar: 'قمة الذواقة العالمية',
          organization_en: 'World Gourmet Summit',
          badge: 'Master'
        },
        {
          name_ar: 'نجمة دليل الذواقة للتميز الابتكاري',
          name_en: 'Culinary Distinction Star',
          year: 2022,
          organization_ar: 'دليل ميشلان الاستشاري',
          organization_en: 'Gastronomy Excellence Guild',
          badge: 'Distinction'
        }
      ],
      signature_dishes: [
        {
          id: 'dish-1',
          name_ar: 'ستيك واغيو بريب آي مع غليز التمر وثوم أسود',
          name_en: 'Wagyu Ribeye with Black Garlic Date Glaze',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
          recipe_id: 'recipe-1'
        },
        {
          id: 'dish-2',
          name_ar: 'قريدس البحر الأحمر المنقوع بالليمون الأسود',
          name_en: 'Red Sea Tiger Prawns with Dried Black Lime',
          image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80',
          recipe_id: null
        }
      ],
      restaurants: [
        {
          name_ar: 'مطعم مرخ الفاخر - الرياض',
          name_en: 'Marakh Fine Dining - Riyadh',
          role_ar: 'الشيف التنفيذي والشريك المؤسس',
          role_en: 'Executive Chef & Co-Founder',
          years: '2021 - Present'
        },
        {
          name_ar: 'لا ريزيرف - باريس',
          name_en: 'La Réserve - Paris',
          role_ar: 'شيف دي بارتي أول',
          role_en: 'Senior Chef de Partie',
          years: '2016 - 2020'
        }
      ]
    },
    {
      id: 'chef-2',
      name_ar: 'شيف إيلينا روستوفا',
      name_en: 'Chef Elena Rostova',
      handle: '@elena_pastry',
      title: 'Master Pastry Chef & Sugar Sculptor',
      title_ar: 'ماستر شيف الحلويات وفنون التشكيل بالسكر',
      title_en: 'Master Pastry Chef & Sugar Sculptor',
      avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1200&q=80',
      verified: true,
      followers: 68500,
      followers_formatted: '68.5k',
      following: 240,
      recipes_count: 31,
      experience_years: 14,
      rating: 4.98,
      reviews_count: 512,
      specialty: 'French Haute Pâtisserie & Sugar Art',
      specialty_ar: 'فنون الحلويات الفرنسية الراقية والسكريات الفنية',
      specialty_en: 'French Haute Pâtisserie & Sugar Art',
      bio_ar: 'خريجة معهد لو كوردون بلو باريس. تتخصص في ابتكار أرقى كيكات الإنتريميه والمعجنات المورقة التي تمزج النكهات الزهرية الشرقية مع الدقة الهندسية الكلاسيكية.',
      bio_en: 'Le Cordon Bleu Paris Grand Diplôme alumna. Specializes in architectural entremets and laminated viennoiserie blending delicate Middle Eastern floral essences with French classical precision.',
      philosophy_ar: 'صناعة الحلويات هي لقاء علم الكيمياء الدقيق مع الهندسة المعمارية التشكيلية لإسعاد الحواس.',
      philosophy_en: 'Pastry making is the harmonious convergence of exact chemical sciences and architectural aesthetics designed to evoke sublime joy.',
      awards: [
        {
          name_ar: 'الميدالية الفضية في كأس العالم للحلويات',
          name_en: 'Coupe du Monde de la Pâtisserie Silver Medal',
          year: 2022,
          organization_ar: 'الاتحاد الدولي للحلويات بفرنسا',
          organization_en: 'International Pastry Union France',
          badge: 'Silver'
        },
        {
          name_ar: 'أفضل شيف حلويات في الشرق الأوسط',
          name_en: 'Pastry Chef of the Year MEA',
          year: 2025,
          organization_ar: 'جوائز الضيافة العالمية',
          organization_en: 'Global Hospitality Awards',
          badge: 'Master'
        }
      ],
      signature_dishes: [
        {
          id: 'dish-3',
          name_ar: 'إنتريميه الفستق وماء الورد مع غليز المستكة',
          name_en: 'Pistachio & Rosewater Entremet with Mastic Glaze',
          image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
          recipe_id: 'recipe-5'
        },
        {
          id: 'dish-4',
          name_ar: 'تارت الشوكولاتة الداكنة بالهيل المدخن',
          name_en: 'Smoked Cardamom Dark Chocolate Tart',
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
          recipe_id: 'recipe-8'
        }
      ],
      restaurants: [
        {
          name_ar: 'أتيليه روستوفا للحلويات - دبي',
          name_en: 'Atelier Rostova Pâtisserie - Dubai',
          role_ar: 'الشيف المؤسس والمدير الإبداعي',
          role_en: 'Founder & Creative Director',
          years: '2022 - Present'
        }
      ]
    },
    {
      id: 'chef-3',
      name_ar: 'شيف طارق منصور',
      name_en: 'Chef Tariq Mansour',
      handle: '@tariq_firecraft',
      title: 'Master of Live Fire & Artisanal Smokehouse',
      title_ar: 'خبير الطهي بالنار المباشرة والتدخين التراثي',
      title_en: 'Master of Live Fire & Artisanal Smokehouse',
      avatar: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
      verified: true,
      followers: 51200,
      followers_formatted: '51.2k',
      following: 195,
      recipes_count: 19,
      experience_years: 18,
      rating: 4.92,
      reviews_count: 420,
      specialty: 'Levantine Heritage Charcoal Grill & Smokehouse',
      specialty_ar: 'المشاوي الشامية التراثية والتدخين الحرفي',
      specialty_en: 'Levantine Heritage Charcoal Grill & Smokehouse',
      bio_ar: 'متخصص في تقنيات التدخين البطيء على حطب الزيتون والسنديان وإنضاج اللحوم التراثية، مع دمج الأعشاب البرية الشامية والمكسرات المحمصة.',
      bio_en: 'Master of slow olive-wood and oak ember smoking, ancestral meat aging, and wild Levantine botanicals harmonized with ancient grain dishes.',
      philosophy_ar: 'النار الحية هي أقدم معلم للإنسان في الطهي؛ احترام اللهب والوقت يمنح المكونات عمقاً لا يضاهيه أي جهاز حديث.',
      philosophy_en: 'Live fire is humanity’s oldest culinary mentor; respecting flames and patient time unlocks an unmatchable terroir.',
      awards: [
        {
          name_ar: 'جائزة الشيف الحرفي المتميز للمشاوي',
          name_en: 'Artisanal Fire & Grill Champion',
          year: 2023,
          organization_ar: 'رابطة طهاة الشرق الأوسط',
          organization_en: 'Middle East Chefs Guild',
          badge: 'Gold'
        }
      ],
      signature_dishes: [
        {
          id: 'dish-5',
          name_ar: 'ريش غنم متبلة بإكليل الجبل المدخن والدبس',
          name_en: 'Smoked Rosemary Crusted Lamb Chops',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
          recipe_id: 'recipe-4'
        },
        {
          id: 'dish-6',
          name_ar: 'ريزوتو الفريكة المدخنة مع فطر الموريل البري',
          name_en: 'Smoked Freekeh Risotto with Wild Morels',
          image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=600&q=80',
          recipe_id: 'recipe-7'
        }
      ],
      restaurants: [
        {
          name_ar: 'مطعم الحطب والرماد - عمّان / الرياض',
          name_en: 'Ember & Oak Smokehouse - Amman / Riyadh',
          role_ar: 'الشيف التنفيذي والشريك',
          role_en: 'Executive Chef & Partner',
          years: '2019 - Present'
        }
      ]
    },
    {
      id: 'chef-4',
      name_ar: 'شيف كينجي تاكاهاشي',
      name_en: 'Chef Kenji Takahashi',
      handle: '@kenji_kaiseki',
      title: 'Two-Michelin Star Veteran & Omakase Master',
      title_ar: 'حاصل على نجمتي ميشلان وأستاذ فنون الأوماكاسي والكايسيكي',
      title_en: 'Two-Michelin Star Veteran & Omakase Master',
      avatar: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=1200&q=80',
      verified: true,
      followers: 89000,
      followers_formatted: '89.0k',
      following: 180,
      recipes_count: 22,
      experience_years: 25,
      rating: 4.99,
      reviews_count: 640,
      specialty: 'Contemporary Japanese Kaiseki & Omakase',
      specialty_ar: 'الكايسيكي الياباني المعاصر والأوماكاسي',
      specialty_en: 'Contemporary Japanese Kaiseki & Omakase',
      bio_ar: 'قضى 25 عاماً في أرقى مطاعم طوكيو وكيوتو الحاصلة على نجوم ميشلان. يركز على نقاء النكهات وتقنيات تقطيع الساشيمي الحرفية والموازنة الدقيقة للأومامي.',
      bio_en: 'Two decades in Tokyo and Kyoto Michelin-starred institutions. Devoted to seasonal micro-harvests, master blade knife crafts, and precise umami extraction.',
      philosophy_ar: 'الإتقان الحقيقي يكمن في البساطة الخالصة؛ إزالة كل ما هو زائد لإظهار الجوهر الطبيعي للنقاء.',
      philosophy_en: 'True mastery lives in sublime restraint; stripping away excess until only pristine natural essence remains.',
      awards: [
        {
          name_ar: 'نجمتا ميشلان للتميز في الطهي',
          name_en: 'Two Michelin Stars',
          year: 2021,
          organization_ar: 'دليل ميشلان طوكيو',
          organization_en: 'Michelin Guide Tokyo',
          badge: 'Michelin'
        },
        {
          name_ar: 'ماستر الأومامي العالمي',
          name_en: 'Global Umami Master',
          year: 2020,
          organization_ar: 'جمعية الطهاة اليابانية',
          organization_en: 'Japanese Culinary Society',
          badge: 'Master'
        }
      ],
      signature_dishes: [
        {
          id: 'dish-7',
          name_ar: 'كروودو سمك الهاماتشي مع اليوزو وبونزو الكافيار',
          name_en: 'Hamachi Crudo with Yuzu White Ponzu & Finger Lime',
          image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
          recipe_id: 'recipe-6'
        }
      ],
      restaurants: [
        {
          name_ar: 'مطعم تاكاهاشي أوماكاسي - طوكيو',
          name_en: 'Takahashi Omakase - Tokyo',
          role_ar: 'المالك ورئيس الطهاة',
          role_en: 'Chef Patron',
          years: '2015 - Present'
        }
      ]
    },
    {
      id: 'chef-5',
      name_ar: 'شيف ليلى بن جلون',
      name_en: 'Chef Layla Benjelloun',
      handle: '@layla_gastronomie',
      title: 'Contemporary Maghrebi & Mediterranean Gastronomist',
      title_ar: 'خبيرة فنون المطبخ المغاربي والمتوسطي الحديث',
      title_en: 'Contemporary Maghrebi & Mediterranean Gastronomist',
      avatar: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1200&q=80',
      verified: true,
      followers: 37400,
      followers_formatted: '37.4k',
      following: 340,
      recipes_count: 18,
      experience_years: 13,
      rating: 4.91,
      reviews_count: 280,
      specialty: 'North African Haute Cuisine & Spice Geometries',
      specialty_ar: 'المطبخ المغاربي الرفيع وهندسة التوابل',
      specialty_en: 'North African Haute Cuisine & Spice Geometries',
      bio_ar: 'باحثة في تاريخ المأكولات الأندلسية والمغربية. تدمج تقنيات الطهي بالبخار والتحمير البطيء في الطواجن الفخارية مع عناصر التقديم الفندقية الحديثة.',
      bio_en: 'Culinary researcher exploring Andalusian and Moroccan gastronomic heritage. Modernizing slow-simmered clay tagines with delicate herb oils and fine dining plating.',
      philosophy_ar: 'التوابل ليست نكهة إضافية، بل هي نغمات موسيقية متناغمة تعزف لحن الأرض وثقافتها.',
      philosophy_en: 'Spices are not mere seasonings; they are tonal symphonies that echo the earth and cultural memory.',
      awards: [
        {
          name_ar: 'جائزة التميز المطبخي الأفريقي',
          name_en: 'African Culinary Excellence Award',
          year: 2024,
          organization_ar: 'منظمة الذواقة الأفريقية',
          organization_en: 'African Gastronomy Guild',
          badge: 'Gold'
        }
      ],
      signature_dishes: [
        {
          id: 'dish-8',
          name_ar: 'قاروص البحر بالزعفران مع مستحلب الهيل',
          name_en: 'Saffron Infused Sea Bass with Cardamom Emulsion',
          image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
          recipe_id: 'recipe-2'
        }
      ],
      restaurants: [
        {
          name_ar: 'مطعم لارجانييه - مراكش / الدار البيضاء',
          name_en: "L'Arganier Haute Table - Marrakech",
          role_ar: 'الشيف التنفيذي',
          role_en: 'Executive Chef',
          years: '2020 - Present'
        }
      ]
    },
    {
      id: 'chef-6',
      name_ar: 'شيف ماركو بيليني',
      name_en: 'Chef Marco Bellini',
      handle: '@marco_pastaio',
      title: 'Master Pastaio & Piedmont Truffle Specialist',
      title_ar: 'ماستر الباستا الحرفية وخبير الكمأة الإيطالية',
      title_en: 'Master Pastaio & Piedmont Truffle Specialist',
      avatar: 'https://images.unsplash.com/photo-1574966740793-953ad375ded5?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?auto=format&fit=crop&w=1200&q=80',
      verified: true,
      followers: 73100,
      followers_formatted: '73.1k',
      following: 220,
      recipes_count: 27,
      experience_years: 21,
      rating: 4.97,
      reviews_count: 580,
      specialty: 'Artisanal Italian Pasta & Mycological Gastronomy',
      specialty_ar: 'الباستا الإيطالية الحرفية وفنون الفطر البري والكمأة',
      specialty_en: 'Artisanal Italian Pasta & Mycological Gastronomy',
      bio_ar: 'من سلالة صانعي الباستا في بولونيا. يكرس فنه لصناعة المعكرونة اليدوية من قمح الديورم العضوي وأندر أنواع الكمأة البيضاء والسوداء من غابات بييمونتي.',
      bio_en: 'Third-generation master pastaio from Bologna. Dedicated to hand-shaped heirloom durum pasta, artisanal bronze extrusions, and Piedmont wild truffles.',
      philosophy_ar: 'العجين كائن حي يتنفس؛ يجب أن تشعر برطوبته وحرارة يديك لتصل إلى القوام الحريري المثالي.',
      philosophy_en: 'Pasta dough is a living canvas; you must feel its moisture, tension, and soul to achieve ethereal al dente perfection.',
      awards: [
        {
          name_ar: 'الشوكات الثلاث لدليل غامبيرو روسو',
          name_en: 'Gambero Rosso 3 Tre Forchette',
          year: 2023,
          organization_ar: 'دليل غامبيرو روسو الإيطالي',
          organization_en: 'Gambero Rosso Guide',
          badge: 'Gold'
        },
        {
          name_ar: 'بطل العالم للباستا الحرفية',
          name_en: 'World Artisanal Pasta Champion',
          year: 2021,
          organization_ar: 'أكاديمية باريلا للطهي الحرفي',
          organization_en: 'Barilla Culinary Academy',
          badge: 'Master'
        }
      ],
      signature_dishes: [
        {
          id: 'dish-9',
          name_ar: 'أنولوتي بالريكوتا المدخنة والكمأة السوداء',
          name_en: 'Wild Truffle & Smoked Ricotta Agnolotti',
          image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
          recipe_id: 'recipe-3'
        }
      ],
      restaurants: [
        {
          name_ar: 'أوستيريا بيليني - فلورنسا',
          name_en: 'Osteria Bellini - Florence',
          role_ar: 'الشيف المالك',
          role_en: 'Chef Patron',
          years: '2017 - Present'
        }
      ]
    }
  ],

  // 2. RECIPES (8 Structured Gourmet Masterpieces)
  recipes: [
    {
      id: 'recipe-1',
      title: 'Wagyu Ribeye with Black Garlic Date Glaze',
      title_ar: 'ستيك واغيو ريب آي مع غليز التمر والثوم الأسود المعتق',
      title_en: 'Wagyu Ribeye with Black Garlic Date Glaze',
      description_ar: 'قطعة لحم واغيو A5 معتقة ومطهوة لدرجة متوسطة، مغطاة بغليز مركز من دبس تمر الخلاص النجد والكمأة السوداء وثوم الحبة السوداء المخمر.',
      description_en: 'Seared A5 Wagyu Ribeye brushed with a rich reduction of artisanal Najdi date molasses, fermented black garlic paste, and winter truffle jus.',
      author_id: 'chef-1',
      author_name_ar: 'الشيف فيصل الهاشمي',
      author_name_en: 'Chef Faisal Al-Hashemi',
      author_avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
      ],
      cuisine: 'Contemporary Saudi Fusion',
      cuisine_ar: 'سعودي معاصر',
      cuisine_en: 'Contemporary Saudi',
      category: 'Main Course',
      category_ar: 'أطباق رئيسية',
      category_en: 'Main Course',
      difficulty: 'Hard',
      difficulty_ar: 'متقدم',
      difficulty_en: 'Hard',
      base_servings: 4,
      prep_time: 35,
      cook_time: 45,
      total_time: 80,
      calories: 680,
      likes_count: 1420,
      saves_count: 890,
      rating: 4.96,
      reviews_count: 114,
      created_at: '2026-08-01',
      tags: ['Wagyu', 'FineDining', 'SaudiFlavors', 'BlackGarlic', 'Glaze'],
      ingredients: [
        {
          id: 'ing-1',
          name_ar: 'لحم واغيو A5 ريب آي معتق',
          name_en: 'A5 Wagyu Ribeye Steaks',
          baseAmount: 800,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'مقطعة بسماكة 3.5 سم',
          notes_en: 'Cut to 3.5cm thickness'
        },
        {
          id: 'ing-2',
          name_ar: 'معجون الثوم الأسود المخمر',
          name_en: 'Fermented Black Garlic Paste',
          baseAmount: 45,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'مهروس ناعماً',
          notes_en: 'Smoothly pureed'
        },
        {
          id: 'ing-3',
          name_ar: 'دبس تمر خلاص فاخر',
          name_en: 'Artisanal Kholas Date Molasses',
          baseAmount: 60,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'طبيعي بدون سكر مضاف',
          notes_en: '100% pure organic'
        },
        {
          id: 'ing-4',
          name_ar: 'مرق لحم مركز (ديمي غلاس)',
          name_en: 'Veal Bone Marrow Demi-Glace',
          baseAmount: 120,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'مختزل لمدة 24 ساعة',
          notes_en: '24-hour reduction'
        },
        {
          id: 'ing-5',
          name_ar: 'زبدة فرنسية غير مملحة',
          name_en: 'Unsalted Cultured French Butter',
          baseAmount: 50,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'لدهن الستيك أثناء التحمير',
          notes_en: 'For basting'
        },
        {
          id: 'ing-6',
          name_ar: 'أغصان زعتر بري طازج',
          name_en: 'Fresh Wild Thyme Sprigs',
          baseAmount: 4,
          unit_ar: 'حبة',
          unit_en: 'pcs',
          notes_ar: 'مغسولة ومجففة',
          notes_en: 'Freshly bruised'
        },
        {
          id: 'ing-7',
          name_ar: 'خل بلسمي معتق 12 عاماً',
          name_en: '12-Year Aged Balsamic Vinegar',
          baseAmount: 20,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'لموازنة الحموضة',
          notes_en: 'For acidity balance'
        },
        {
          id: 'ing-8',
          name_ar: 'ملح بحري مدخن ناعم',
          name_en: 'Flaky Smoked Sea Salt',
          baseAmount: 10,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للتلميع النهائي عند التقديم',
          notes_en: 'For final finishing'
        }
      ],
      steps: [
        {
          step_number: 1,
          title_ar: 'تحضير لحم الواغيو والتتبيل الأولي',
          title_en: 'Wagyu Tempering & Seasoning',
          instruction_ar: 'أخرج شرائح الواغيو من الثلاجة قبل الطهي بـ 45 دقيقة لتصل لحرارة الغرفة. جفف السطح بورق المطبخ ثم رش نصف كمية الملح البحري المدخن على كلا الوجهين بالتساوي.',
          instruction_en: 'Temper the Wagyu steaks at room temperature for 45 minutes. Pat dry with culinary towels and season evenly with half of the smoked flaky sea salt.',
          timer_minutes: 45,
          tip_ar: 'لا تضع اللحم بارداً أبداً في المقلاة لتفادي انخفاض حرارة سطح التحمير وفقدان العصارة.',
          tip_en: 'Never sear cold Wagyu directly from the fridge as it causes sudden temperature drop and juice loss.'
        },
        {
          step_number: 2,
          title_ar: 'إعداد غليز التمر والثوم الأسود المخمر',
          title_en: 'Preparing Black Garlic Date Glaze',
          instruction_ar: 'في قدر نحاسي صغير على نار هادئة، اخلط معجون الثوم الأسود مع دبس التمر والخل البلسمي والديمي غلاس. قلّب باستمرار حتى يتكاثف المزيج ليغطي ظهر الملعقة، ثم ارفعه عن النار واتركه دافئاً.',
          instruction_en: 'In a heavy copper saucepan over low heat, whisk together black garlic paste, date molasses, aged balsamic, and demi-glace. Simmer until it coats the back of a spoon smoothly.',
          timer_minutes: 10,
          tip_ar: 'تجنب غليان الغليز الشديد حتى لا يحترق السكر الطبيعي في دبس التمر ويصبح مراً.',
          tip_en: 'Avoid rapid boiling to preserve the nuanced natural sweetness of the dates.'
        },
        {
          step_number: 3,
          title_ar: 'التحمير العالي والدهن بالزبدة (Arrosé)',
          title_en: 'High-Heat Sear & Butter Basting',
          instruction_ar: 'سخّن مقلاة حديد زهر (Cast Iron) حتى تصاعد دخان خفيف. ضع قطع الواغيو واطهها لمدة دقيقتين لكل جانب حتى تتكون طبقة كراميل ذهبية بنية. أضف الزبدة والزعتر البري وقم بدهن الستيك بملعقة لمدة دقيقة إضافية.',
          instruction_en: 'Heat a cast iron skillet until smoking hot. Sear Wagyu for 2 minutes per side to form a deep crust. Add butter and thyme, vigorously spooning foaming butter over steaks for 1 minute.',
          timer_minutes: 6,
          tip_ar: 'الواغيو A5 يحتوي على دهون رخامية غنية تذوب بسرعة؛ لا تحتاج لإضافة زيت إضافي للمقلاة.',
          tip_en: 'A5 Wagyu renders its own pristine fat; no supplementary oil is needed in the pan.'
        },
        {
          step_number: 4,
          title_ar: 'التشريب بالغليز وإراحة اللحم',
          title_en: 'Glazing & Resting the Meat',
          instruction_ar: 'ارفع الستيك إلى لوح التقطيع الخشبي، وادهن الوجهين بسخاء بغليز التمر الدافئ باستخدام فرشاة سيليكون. اترك اللحم ليرتاح لمدة 8 إلى 10 دقائق لتعيد الألياف امتصاص السوائل.',
          instruction_en: 'Transfer steaks to a warm carving board and brush generously with warm black garlic glaze. Rest for 8-10 minutes allowing intramuscular juices to settle.',
          timer_minutes: 10,
          tip_ar: 'فترة الراحة أساسية لجعل اللحم طرياً جداً وذا عصارة متوازنة.',
          tip_en: 'Resting allows internal fibers to reabsorb flavor juices evenly throughout the steak.'
        },
        {
          step_number: 5,
          title_ar: 'التقطيع والتقديم الفاخر',
          title_en: 'Carving & Plating Presentation',
          instruction_ar: 'اقطع شرائح الستيك بزاوية 45 درجة بسماكة 1 سم. رتبها في طبق التقديم الدافئ، ورش الملح المدخن المتبقي وأضف قطرات من زيت الأعشاب بجانب بطاطس البافيه المقرمشة.',
          instruction_en: 'Carve steaks against the grain into 1cm slices. Fan out on warm plates, finish with smoked salt flakes, and drizzle residual glaze alongside potato pavé.',
          timer_minutes: 5,
          tip_ar: 'قدّم الطبق دائماً على أوانٍ مسخنة مسبقاً للحفاظ على دفء دهن الواغيو الحريري.',
          tip_en: 'Always serve on pre-warmed plates so the luscious Wagyu fat maintains its velvety texture.'
        }
      ],
      nutrition: {
        calories: 680,
        protein: '52g',
        carbs: '18g',
        fats: '46g',
        fiber: '2.5g',
        sodium: '620mg'
      },
      pairings: {
        drink_ar: 'إكسير الرمان المركز مع النعناع والماء الفوار المبرد',
        drink_en: 'Sparkling Pomegranate & Fresh Mint Botanical Elixir',
        side_ar: 'بطاطس البافيه المكرملة مع فطر الموريل البري والكمأة',
        side_en: 'Crispy Truffled Potato Pavé with Sautéed Morel Mushrooms',
        notes_ar: 'حموضة الرمان الطبيعية تكسر دسم الواغيو العالي وتبرز نكهة تمر الخلاص المعتق.',
        notes_en: 'The natural tartness of pomegranate cuts through the rich marbling while elevating the date glaze.'
      }
    },
    {
      id: 'recipe-2',
      title: 'Saffron Infused Sea Bass with Cardamom Emulsion',
      title_ar: 'قاروص البحر بالزعفران الملكي ومستحلب الهيل الأخضر',
      title_en: 'Saffron Infused Sea Bass with Cardamom Emulsion',
      description_ar: 'فيليه قاروص البحر البري المحمر بجلد مقرمش ذهبي، يقدم فوق بيوريه الشمر الحريري مع مستحلب كريمي منقوع بالزعفران السوبر نقين والهيل الأخضر.',
      description_en: 'Pan-seared wild Mediterranean Sea Bass with golden crackling skin, rested over silk fennel puree and drizzled with a rich saffron-cardamom emulsion.',
      author_id: 'chef-5',
      author_name_ar: 'شيف ليلى بن جلون',
      author_name_en: 'Chef Layla Benjelloun',
      author_avatar: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=200&q=80',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80'
      ],
      cuisine: 'Mediterranean Maghrebi Haute',
      cuisine_ar: 'بحر متوسطي مغاربي',
      cuisine_en: 'Mediterranean Maghrebi',
      category: 'Seafood',
      category_ar: 'مأكولات بحرية',
      category_en: 'Seafood',
      difficulty: 'Medium',
      difficulty_ar: 'متوسط',
      difficulty_en: 'Medium',
      base_servings: 4,
      prep_time: 25,
      cook_time: 20,
      total_time: 45,
      calories: 420,
      likes_count: 980,
      saves_count: 640,
      rating: 4.93,
      reviews_count: 88,
      created_at: '2026-08-03',
      tags: ['SeaBass', 'Saffron', 'Cardamom', 'Seafood', 'FineDining'],
      ingredients: [
        {
          id: 'ing-201',
          name_ar: 'فيليه قاروص بحر طازج بجلده',
          name_en: 'Fresh Wild Sea Bass Fillets (Skin-on)',
          baseAmount: 700,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'منزوع الشوك ومجفف جيداً',
          notes_en: 'Pin-boned and thoroughly dried'
        },
        {
          id: 'ing-202',
          name_ar: 'خيوط زعفران ملكي سوبر نقين',
          name_en: 'Royal Super Negin Saffron Threads',
          baseAmount: 1,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'منقوع في ملعقتين ماء دافئ',
          notes_en: 'Bloomed in 2 tbsp warm water'
        },
        {
          id: 'ing-203',
          name_ar: 'حبوب هيل أخضر مطحونة طازجة',
          name_en: 'Crushed Green Cardamom Pods',
          baseAmount: 6,
          unit_ar: 'حبة',
          unit_en: 'pcs',
          notes_ar: 'مفتوحة ومحمصة خفيفاً',
          notes_en: 'Lightly toasted'
        },
        {
          id: 'ing-204',
          name_ar: 'بصيلات شمر طازجة مفرومة',
          name_en: 'Fresh Fennel Bulbs',
          baseAmount: 2,
          unit_ar: 'حبة',
          unit_en: 'pcs',
          notes_ar: 'للبيوريه الحريري',
          notes_en: 'For velvet puree'
        },
        {
          id: 'ing-205',
          name_ar: 'كريمة طبخ طازجة 35%',
          name_en: 'Heavy Whipping Cream (35%)',
          baseAmount: 150,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'لقاعدة المستحلب',
          notes_en: 'For emulsion base'
        },
        {
          id: 'ing-206',
          name_ar: 'زيت زيتون بكر ممتاز نخب أول',
          name_en: 'Extra Virgin Cold Pressed Olive Oil',
          baseAmount: 40,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'للتحمير والتلميع',
          notes_en: 'For searing'
        },
        {
          id: 'ing-207',
          name_ar: 'عصير ليمون أصفر طازج',
          name_en: 'Fresh Lemon Juice',
          baseAmount: 20,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'لمسة حموضة أخيرة',
          notes_en: 'For citrus finish'
        }
      ],
      steps: [
        {
          step_number: 1,
          title_ar: 'تحضير بيوريه الشمر الحريري',
          title_en: 'Velvety Fennel Puree Preparation',
          instruction_ar: 'اسلق قطع الشمر في ماء مملح حتى تصبح طرية جداً، ثم صفها واخلطها في الخلاط عالي السرعة مع ملعقة زبدة وقليل من الكريمة حتى تصبح حريرية وناعمة.',
          instruction_en: 'Blanch chopped fennel until tender, then blitz in a high-speed blender with a knob of butter and splash of cream until completely silky.',
          timer_minutes: 15,
          tip_ar: 'مرر البيوريه عبر مصفاة شبكية ناعمة للحصول على ملمس ناعم كالمخمل.',
          tip_en: 'Pass puree through a fine tamis sieve for absolute hotel-grade smoothness.'
        },
        {
          step_number: 2,
          title_ar: 'صنع مستحلب الزعفران والهيل',
          title_en: 'Saffron-Cardamom Emulsion',
          instruction_ar: 'في مقلاة صغيرة، سخّن الكريمة مع منقوع الزعفران وحبوب الهيل على نار هادئة لمدة 8 دقائق، ثم أضف عصير الليمون واخفق بالبلندر اليدوي حتى تتكون رغوة ذهبية هوائية.',
          instruction_en: 'Gently infuse cream with bloomed saffron and crushed cardamom over low heat for 8 mins, finish with lemon juice and aerate using an immersion blender.',
          timer_minutes: 8,
          tip_ar: 'الخفق الهوائي السريع يمنح المستحلب قواماً خفيفاً لا يثقل على السمك.',
          tip_en: 'Immersion blending creates a delicate aromatic foam that lifts the dish.'
        },
        {
          step_number: 3,
          title_ar: 'تحمير فيليه القاروص بقشرة مقرمشة',
          title_en: 'Crispy Skin Fish Searing',
          instruction_ar: 'سخّن زيت الزيتون في مقلاة غير لاصقة، وضع الفيليه بحيث يكون الجلد للأسفل مع الضغط الخفيف بملعقة مسطحة لمدة 4 دقائق، ثم اقلبه لدقيقة واحدة حتى ينضج اللحم ويظل طرياً.',
          instruction_en: 'Heat olive oil in a stainless pan, press fish skin-side down firmly for 4 minutes until ultra-crisp, then flip for 1 minute to finish gently.',
          timer_minutes: 5,
          tip_ar: 'الضغط الأولي يمنع تقوس الفيليه ويضمن قرمشة متساوية لكامل سطح الجلد.',
          tip_en: 'Gentle pressure during the first 30 seconds ensures uniform skin contact and crispness.'
        },
        {
          step_number: 4,
          title_ar: 'التركيب والتقديم النهائي',
          title_en: 'Assembly & Finishing',
          instruction_ar: 'اسكب ملعقتين من بيوريه الشمر في وسط الطبق، ضع قطعة القاروص فوقه، واسكب رغوة مستحلب الزعفران والهيل حول الطبق وزيّن بأوراق الشمر الخضراء.',
          instruction_en: 'Spoon warm fennel puree in the plate center, nestle sea bass fillet on top, spoon vibrant saffron foam around, and garnish with delicate fennel fronds.',
          timer_minutes: 3,
          tip_ar: 'لا تغطِ جلد السمك المقرمش بالصلصة حتى لا يفقد قرمشته المميزة.',
          tip_en: 'Never pour emulsion over the crispy skin; keep sauce beneath and around.'
        }
      ],
      nutrition: {
        calories: 420,
        protein: '44g',
        carbs: '8g',
        fats: '22g',
        fiber: '3g',
        sodium: '410mg'
      },
      pairings: {
        drink_ar: 'شاي أبيض معطر بزهور البرتقال والليمون المعتق',
        drink_en: 'Chilled White Tea Infused with Orange Blossom & Citrus',
        side_ar: 'سلطة نبات الهليون المشوي مع زيت الصنوبر المحمص',
        side_en: 'Charred Asparagus Spears with Roasted Pine Nut Dressing',
        notes_ar: 'النكهة العطرية للهيل والزعفران تتناغم بامتياز مع حلاوة السمك الأبيض والشمر.',
        notes_en: 'Cardamom notes enhance the natural sweet salinity of fresh sea bass.'
      }
    },
    {
      id: 'recipe-3',
      title: 'Wild Truffle & Smoked Ricotta Handcrafted Agnolotti',
      title_ar: 'أنولوتي الباستا اليدوية بالريكوتا المدخنة والكمأة السوداء',
      title_en: 'Wild Truffle & Smoked Ricotta Handcrafted Agnolotti',
      description_ar: 'جيوب باستا أنولوتي حريرية محضرة يدوياً من صفار البيض العضوي، محشوة بجبنة الريكوتا المدخنة والبارميجيانو 36 شهراً، مغلفة بصلصة زبدة الكمأة وشرائح الترافل الطازج.',
      description_en: 'Delicate hand-pinched egg pasta pillows stuffed with artisanal smoked sheep ricotta and 36-month Parmigiano, glazed in emulsion of cultured truffle butter.',
      author_id: 'chef-6',
      author_name_ar: 'شيف ماركو بيليني',
      author_name_en: 'Chef Marco Bellini',
      author_avatar: 'https://images.unsplash.com/photo-1574966740793-953ad375ded5?auto=format&fit=crop&w=200&q=80',
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80'
      ],
      cuisine: 'Artisanal Italian Haute',
      cuisine_ar: 'إيطالي حرفي',
      cuisine_en: 'Artisanal Italian',
      category: 'Pasta & Grains',
      category_ar: 'باستا وحبوب',
      category_en: 'Pasta & Grains',
      difficulty: 'Hard',
      difficulty_ar: 'متقدم',
      difficulty_en: 'Hard',
      base_servings: 4,
      prep_time: 50,
      cook_time: 15,
      total_time: 65,
      calories: 540,
      likes_count: 1680,
      saves_count: 1120,
      rating: 4.98,
      reviews_count: 145,
      created_at: '2026-08-04',
      tags: ['Agnolotti', 'HandmadePasta', 'Truffle', 'Ricotta', 'Italian'],
      ingredients: [
        {
          id: 'ing-301',
          name_ar: 'دقيق قمح إيطالي ناعم نخب تيبو 00',
          name_en: 'Italian Tipo 00 Pasta Flour',
          baseAmount: 300,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'منخول مرتين',
          notes_en: 'Double sifted'
        },
        {
          id: 'ing-302',
          name_ar: 'صفار بيض دجاج عضوي حر',
          name_en: 'Organic Free-Range Egg Yolks',
          baseAmount: 8,
          unit_ar: 'حبة',
          unit_en: 'pcs',
          notes_ar: 'بحرارة الغرفة',
          notes_en: 'Room temperature'
        },
        {
          id: 'ing-303',
          name_ar: 'جبنة ريكوتا أغنام مدخنة حرفية',
          name_en: 'Artisanal Smoked Sheep Ricotta',
          baseAmount: 250,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'مصفاة من السوائل الزائدة',
          notes_en: 'Well drained'
        },
        {
          id: 'ing-304',
          name_ar: 'جبنة بارميجيانو ريجيانو معتقة 36 شهراً',
          name_en: '36-Month Aged Parmigiano-Reggiano',
          baseAmount: 80,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'مبشورة ناعماً جداً',
          notes_en: 'Microplaned finely'
        },
        {
          id: 'ing-305',
          name_ar: 'كمأة سوداء طازجة (Piedmont)',
          name_en: 'Fresh Black Winter Truffle',
          baseAmount: 25,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للبشر المباشر عند التقديم',
          notes_en: 'For tableside shaving'
        },
        {
          id: 'ing-306',
          name_ar: 'زبدة نقية فاخرة غير مملحة',
          name_en: 'Cultured Unsalted Mountain Butter',
          baseAmount: 75,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'لصلصة المستحلب',
          notes_en: 'For emulsion gloss'
        },
        {
          id: 'ing-307',
          name_ar: 'جوزة الطيب المبشورة طازجاً',
          name_en: 'Freshly Grated Whole Nutmeg',
          baseAmount: 2,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'رشة خفيفة للحشوة',
          notes_en: 'Pinch for filling'
        },
        {
          id: 'ing-308',
          name_ar: 'ملح بحري خشن لسلق الباستا',
          name_en: 'Coarse Sea Salt for Boiling',
          baseAmount: 20,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'لمياه السلق',
          notes_en: 'For pasta water'
        }
      ],
      steps: [
        {
          step_number: 1,
          title_ar: 'عجن وتشكيل عجينة الباستا الذهبية',
          title_en: 'Kneading & Resting Egg Dough',
          instruction_ar: 'اصنع فوهة بركانية من الدقيق، أضف صفار البيض ورشة ملح في الوسط. ادمج بالشوكة تدريجياً ثم اعجن باليد لمدة 10 دقائق حتى تصبح العجينة ناعمة ومطاطية. غلفها بنايلون واتركها ترتاح 30 دقيقة.',
          instruction_en: 'Form a flour well, add egg yolks and salt. Incorporate with a fork then knead vigorously for 10 mins until silky smooth. Wrap tightly and rest for 30 minutes.',
          timer_minutes: 30,
          tip_ar: 'فترة الراحة تفكك شبكة الجلوتين مما يسهل فرد العجينة لسمك رقيق جداً وشفاف.',
          tip_en: 'Resting relaxes gluten strands, essential for rolling paper-thin translucent sheets.'
        },
        {
          step_number: 2,
          title_ar: 'تحضير حشوة الريكوتا المدخنة والكمأة',
          title_en: 'Smoked Ricotta & Truffle Filling',
          instruction_ar: 'في وعاء زجاجي، اخلط الريكوتا المدخنة مع البارميجيانو المبشور وجوزة الطيب وقليل من زيت الكمأة. ضع الخليط في كيس حلواني برأس دائري صغير.',
          instruction_en: 'Whisk smoked ricotta with microplaned Parmigiano, nutmeg, and a few drops of truffle oil. Transfer into a piping bag with a round nozzle.',
          timer_minutes: 10,
          tip_ar: 'احرص على أن تكون الحشوة باردة حتى لا ترطب العجين وتجعله لزجاً.',
          tip_en: 'Keep the filling chilled to maintain piping structure without softening pasta dough.'
        },
        {
          step_number: 3,
          title_ar: 'فرد العجين وتشكيل حبات الأنولوتي',
          title_en: 'Rolling & Hand-Pinching Agnolotti',
          instruction_ar: 'افرد العجين بآلة الباستا حتى الدرجة الأرفع. ضع نقاط حشوة متباعدة بـ 2 سم، اثنِ العجين فوق الحشوة واضغط بأطراف أصابعك لإخراج الهواء ثم اقطعها بعجلة الباستا المسننة.',
          instruction_en: 'Roll pasta to the thinnest setting. Pipe filling dots 2cm apart, fold sheet over, pinch tightly to seal pockets, and cut with a fluted pasta wheel.',
          timer_minutes: 15,
          tip_ar: 'تفريغ الهواء يمنع انفجار حبات الأنولوتي أثناء السلق في الماء المغلي.',
          tip_en: 'Eliminating trapped air pockets prevents burst agnolotti during boiling.'
        },
        {
          step_number: 4,
          title_ar: 'السلق السريع والاستحلاب بالزبدة',
          title_en: 'Flash Boiling & Butter Emulsion',
          instruction_ar: 'اسلق الباستا في ماء مملح مغلي لمدة دقيقتين ونصف فقط. انقلها مباشرة إلى مقلاة واسعة تحتوي على الزبدة المذابة ومغرفة من ماء سلق الباستا النشوي، وحرك بحركة دائرية لتكوين صلصة لامعة.',
          instruction_en: 'Boil agnolotti in salted water for 2.5 minutes. Transfer directly to a warm skillet with melted butter and a ladle of starchy pasta water, tossing to create a glossy coat.',
          timer_minutes: 4,
          tip_ar: 'النشا الموجود في ماء السلق هو العامل السري الذي يربط الزبدة بالباستا بإتقان.',
          tip_en: 'Starchy pasta cooking water is the emulsifying key to a velvety glossy glaze.'
        },
        {
          step_number: 5,
          title_ar: 'البشر الفاخر للكمأة والتقديم',
          title_en: 'Truffle Shaving & Plating',
          instruction_ar: 'رتب حبات الأنولوتي في طبق غائر دافئ، اسكب الصلصة اللامعة، ثم ابشر شرائح رقيقة من الكمأة السوداء الطازجة أمام الضيوف مع رش بارميجيانو إضافي.',
          instruction_en: 'Plate agnolotti in warmed pasta bowls, coat with glossy truffle butter, and shave fresh black winter truffles generously over the top.',
          timer_minutes: 3,
          tip_ar: 'حرارة الباستا الدافئة ستطلق الزيوت العطرية الفواحة في شرائح الكمأة فور ملامستها.',
          tip_en: 'Residual pasta heat immediately activates the intense volatile aromas of shaved truffle.'
        }
      ],
      nutrition: {
        calories: 540,
        protein: '24g',
        carbs: '58g',
        fats: '26g',
        fiber: '3.2g',
        sodium: '490mg'
      },
      pairings: {
        drink_ar: 'مشروب العنب الأبيض غير الكحولي الفوار بالكمثرى',
        drink_en: 'Sparkling White Grape & Crisp Winter Pear Mocktail',
        side_ar: 'سلطة الجرجير البري مع شرائح الكمثرى والجوز المحمص',
        side_en: 'Wild Arugula Salad with Shaved Pears and Toasted Walnuts',
        notes_ar: 'طعم الريكوتا المدخنة والكمأة يكتمل بلمسة منعشة وفاكهية خفيفة.',
        notes_en: 'Earthy black truffle pairs magnificently with subtle toasted nut notes.'
      }
    },
    {
      id: 'recipe-4',
      title: 'Smoked Rosemary Crusted Lamb Chops',
      title_ar: 'ريش غنم نعيمي متبلة بإكليل الجبل المدخن والدبس',
      title_en: 'Smoked Rosemary Crusted Lamb Chops',
      description_ar: 'ريش غنم نعيمي محلية طرية متبلة بخليط إكليل الجبل المدخن ودبس الرمان والفلفل الحلبي، مشوية على جمر الحطب حتى الوصول لقرمشة خارجية وعصارة داخلية وردية.',
      description_en: 'Local prime Naemi lamb cutlets marinated in wild smoked rosemary, artisanal pomegranate molasses, and crushed Aleppo pepper, charred over live oak embers.',
      author_id: 'chef-3',
      author_name_ar: 'شيف طارق منصور',
      author_name_en: 'Chef Tariq Mansour',
      author_avatar: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=200&q=80',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
      ],
      cuisine: 'Levantine Fire & Smoke',
      cuisine_ar: 'شامي تراثي بالنار',
      cuisine_en: 'Levantine Live Fire',
      category: 'Grills & Roasts',
      category_ar: 'مشاوي ولحوم',
      category_en: 'Grills & Roasts',
      difficulty: 'Medium',
      difficulty_ar: 'متوسط',
      difficulty_en: 'Medium',
      base_servings: 4,
      prep_time: 30,
      cook_time: 25,
      total_time: 55,
      calories: 610,
      likes_count: 1190,
      saves_count: 730,
      rating: 4.94,
      reviews_count: 96,
      created_at: '2026-08-05',
      tags: ['LambChops', 'LiveFire', 'Rosemary', 'Levantine', 'Grills'],
      ingredients: [
        {
          id: 'ing-401',
          name_ar: 'ريش غنم نعيمي بلدي طازجة',
          name_en: 'Fresh Prime Local Lamb Chops (French Trimmed)',
          baseAmount: 8,
          unit_ar: 'حبة',
          unit_en: 'pcs',
          notes_ar: 'منظفة عظامها بإتقان',
          notes_en: 'Approx 800g total'
        },
        {
          id: 'ing-402',
          name_ar: 'أغصان إكليل الجبل (روزماري) طازجة',
          name_en: 'Fresh Rosemary Leaves',
          baseAmount: 20,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'مفرومة ناعماً مع الحطب',
          notes_en: 'Finely minced'
        },
        {
          id: 'ing-403',
          name_ar: 'دبس رمان جبلي حامض',
          name_en: 'Mountain Pomegranate Molasses',
          baseAmount: 40,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'مركز طبيعي',
          notes_en: 'Unsweetened reduction'
        },
        {
          id: 'ing-404',
          name_ar: 'رقائق فلفل حلبي أحمر مجروش',
          name_en: 'Crushed Aleppo Silk Chili Flakes',
          baseAmount: 10,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'حرارة معتدلة وزيتية',
          notes_en: 'Mild oily warmth'
        },
        {
          id: 'ing-405',
          name_ar: 'فصوص ثوم بلدي مهروسة',
          name_en: 'Crushed Fresh Garlic Cloves',
          baseAmount: 5,
          unit_ar: 'حبة',
          unit_en: 'pcs',
          notes_ar: 'ناعم جداً',
          notes_en: 'Finely minced paste'
        },
        {
          id: 'ing-406',
          name_ar: 'زيت زيتون معصور على البارد',
          name_en: 'Cold-Pressed Virgin Olive Oil',
          baseAmount: 50,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'للتتبيل والدهن',
          notes_en: 'For marinade'
        },
        {
          id: 'ing-407',
          name_ar: 'ملح صخري مجروش خشن',
          name_en: 'Coarse Desert Rock Salt',
          baseAmount: 12,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للتمليح',
          notes_en: 'For crust seasoning'
        }
      ],
      steps: [
        {
          step_number: 1,
          title_ar: 'تجهيز التتبيلة العطرية والتدليك',
          title_en: 'Marinade Emulsion & Rub',
          instruction_ar: 'اخلط إكليل الجبل المفروم مع الثوم ودبس الرمان والفلفل الحلبي وزيت الزيتون والملح. ادعك ريش الغنم جيداً بالتتبيلة واتركها في البراد لمدة 30 دقيقة على الأقل.',
          instruction_en: 'Combine rosemary, garlic, pomegranate molasses, Aleppo chili, olive oil, and coarse salt. Massage thoroughly over chops and chill for 30 minutes.',
          timer_minutes: 30,
          tip_ar: 'حموضة دبس الرمان تساعد على تليين ألياف اللحم وتمنحه لوناً داكناً مكراملاً عند الشواء.',
          tip_en: 'Pomegranate acidity tenderizes lamb fibers while promoting deep mahogany caramelization.'
        },
        {
          step_number: 2,
          title_ar: 'إشعال الجمر والتدخين الأولي',
          title_en: 'Live Embers & Smoke Preparation',
          instruction_ar: 'أشعل حطب السنديان أو الفحم الطبيعي حتى يتحول إلى جمر أبيض مغطى بالرماد الخفيف. ضع أغصان روزماري طازجة مباشرة فوق الجمر لإطلاق سحابة دخانية عطرية.',
          instruction_en: 'Ignite natural hardwood charcoal to white embers. Scatter fresh rosemary sprigs over embers to produce an intensely fragrant botanical smoke canopy.',
          timer_minutes: 15,
          tip_ar: 'التدخين بالأعشاب الطازجة يعطي نكهة فورية لا مثيل لها دون احتراق مر.',
          tip_en: 'Botanical smoking over coals infuses delicate forest notes directly into the crust.'
        },
        {
          step_number: 3,
          title_ar: 'الشواء المباشر على الشبك',
          title_en: 'High Direct Grilling',
          instruction_ar: 'ضع الريش فوق الشبك الساخن واشوها لمدة 3 إلى 4 دقائق لكل جانب، مع دهنها بالتتبيلة المتبقية مرة واحدة حتى تكتسب علامات شواء داكنة وحرارة داخلية 56 مئوية.',
          instruction_en: 'Grill chops over high heat for 3-4 mins per side, basting once with residual marinade until reaching an internal core temp of 56°C (Medium).',
          timer_minutes: 8,
          tip_ar: 'لا تفرط في طهي ريش النعيمي حتى لا تفقد طراوتها الفائقة.',
          tip_en: 'Do not overcook premium lamb; medium-rare to medium preserves optimum succulence.'
        },
        {
          step_number: 4,
          title_ar: 'الراحة والتقديم',
          title_en: 'Resting & Plating',
          instruction_ar: 'دع الريش ترتاح 5 دقائق قبل التقديم، ثم قدمها مع بذور الرمان الطازجة وخبز الصاج المحمص على الفحم.',
          instruction_en: 'Rest for 5 minutes, garnish with vibrant fresh pomegranate arils and serve with charred flatbread.',
          timer_minutes: 5,
          tip_ar: 'قدّمها فوراً ساخنة مع غموس الثومية الحرفية أو اللبنة المشوية.',
          tip_en: 'Serve sizzling hot alongside whipped artisanal labneh and charred garlic sauce.'
        }
      ],
      nutrition: {
        calories: 610,
        protein: '48g',
        carbs: '12g',
        fats: '42g',
        fiber: '1.8g',
        sodium: '580mg'
      },
      pairings: {
        drink_ar: 'شراب الكركديه المركز بالهيل وقطع الثلج المنعشة',
        drink_en: 'Chilled Cardamom Infused Hibiscus Cordial',
        side_ar: 'غموس اللبنة البلدية المدخنة بزيت الزيتون البكر',
        side_en: 'Smoked Artisanal Labneh Dip with Zaatar and EVOO',
        notes_ar: 'نكهة الدخان وإكليل الجبل تبرز غنى دهن لحم النعيمي البلدي.',
        notes_en: 'Earthy herbs and tang perfectly balance the rich profile of local lamb.'
      }
    },
    {
      id: 'recipe-5',
      title: 'Pistachio & Rosewater Entremet with Mastic Glaze',
      title_ar: 'إنتريميه الفستق وماء الورد مع غليز المرآة بالمستكة',
      title_en: 'Pistachio & Rosewater Entremet with Mastic Glaze',
      description_ar: 'حلوى كعكة إنتريميه فرنسية راقية بطبقات موس الفستق الصقلي، وبسكويت الجاكوند الخفيف، وحشوة هلام ماء الورد الجبلي، مغلفة بغليز مرآة لامع بنكهة المستكة اليونانية.',
      description_en: 'Haute French entremet layering Sicilian Bronte pistachio mousse, almond joconde sponge, and wild rosewater compote, encased in a high-gloss mastic mirror glaze.',
      author_id: 'chef-2',
      author_name_ar: 'شيف إيلينا روستوفا',
      author_name_en: 'Chef Elena Rostova',
      author_avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=200&q=80',
      image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80'
      ],
      cuisine: 'French Haute Pâtisserie',
      cuisine_ar: 'حلويات فرنسية فاخرة',
      cuisine_en: 'French Haute Pâtisserie',
      category: 'Desserts & Pastry',
      category_ar: 'حلويات ومعجنات',
      category_en: 'Desserts & Pastry',
      difficulty: 'Hard',
      difficulty_ar: 'متقدم',
      difficulty_en: 'Hard',
      base_servings: 6,
      prep_time: 60,
      cook_time: 30,
      total_time: 90,
      calories: 460,
      likes_count: 2150,
      saves_count: 1480,
      rating: 4.99,
      reviews_count: 210,
      created_at: '2026-08-06',
      tags: ['Entremet', 'Pistachio', 'Mastic', 'Rosewater', 'FrenchPastry'],
      ingredients: [
        {
          id: 'ing-501',
          name_ar: 'معجون فستق برونتي صقلي نقي 100%',
          name_en: '100% Pure Bronte Pistachio Paste',
          baseAmount: 120,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'بدون إضافات أو ملونات',
          notes_en: 'Unsweetened vibrant green'
        },
        {
          id: 'ing-502',
          name_ar: 'شوكولاتة بيضاء فاخرة 34% زبدة كاكاو',
          name_en: 'Valrhona 34% White Chocolate Couverture',
          baseAmount: 200,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للموس والغليز',
          notes_en: 'For mousse and glaze'
        },
        {
          id: 'ing-503',
          name_ar: 'كريمة خفق طازجة 36% دسم',
          name_en: 'Heavy Whipping Cream (36% fat)',
          baseAmount: 350,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'مخفوقة لنصف قوام (Soft Peaks)',
          notes_en: 'Whipped to soft peaks'
        },
        {
          id: 'ing-504',
          name_ar: 'ماء ورد جبلي طبيعي مقطر',
          name_en: 'Distilled Wild Mountain Rosewater',
          baseAmount: 30,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'للحشوة الهلامية',
          notes_en: 'For jelly insert'
        },
        {
          id: 'ing-505',
          name_ar: 'دموع مستكة يونانية أصلية (خيوس)',
          name_en: 'Chios Mastic Tears',
          baseAmount: 4,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'مطحونة مع قليل من السكر',
          notes_en: 'Ground finely with sugar'
        },
        {
          id: 'ing-506',
          name_ar: 'شرائح جيلاتين بقري حلال (Gold)',
          name_en: 'Halal Beef Gelatin Sheets (Gold Grade)',
          baseAmount: 6,
          unit_ar: 'حبة',
          unit_en: 'pcs',
          notes_ar: 'منقوعة في ماء مثلج',
          notes_en: 'Bloomed in ice water'
        },
        {
          id: 'ing-507',
          name_ar: 'دقيق لوز أبيض مطحون فائق النعومة',
          name_en: 'Ultra-Fine Blanched Almond Flour',
          baseAmount: 90,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'لبسكويت الجاكوند',
          notes_en: 'For joconde sponge'
        },
        {
          id: 'ing-508',
          name_ar: 'سكر بودرة فائق النعومة',
          name_en: 'Confectioners Powdered Sugar',
          baseAmount: 80,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للبسكويت والموس',
          notes_en: 'For sponge base'
        }
      ],
      steps: [
        {
          step_number: 1,
          title_ar: 'خبز بسكويت الجاكوند باللوز',
          title_en: 'Almond Joconde Sponge Baking',
          instruction_ar: 'اخفق البيض مع سكر البودرة ودقيق اللوز حتى يتضاعف حجمه. ادمج بياض البيض المخفوق بلطف واخبز على صينية رقيقة بحرارة 200 مئوية لمدة 8 دقائق، ثم اتركه يبرد واقطعه بحجم القالب.',
          instruction_en: 'Whip eggs, icing sugar, and almond flour. Fold in gentle meringue, spread thinly on parchment, and bake at 200°C for 8 mins. Cool and cut to ring size.',
          timer_minutes: 15,
          tip_ar: 'الخبز السريع في حرارة عالية يحافظ على طراوة البسكويت دون جفاف.',
          tip_en: 'High-heat flash baking keeps joconde tender and supple for layering.'
        },
        {
          step_number: 2,
          title_ar: 'تحضير حشوة هلام ماء الورد وتجميدها',
          title_en: 'Rosewater Insert Preparation',
          instruction_ar: 'سخّن ماء الورد مع قليل من عصير التوت والجيلاتين المصفى. اسكب الهلام في قوالب دائرية أصغر بـ 2 سم من القالب الرئيسي، وجمدها تماماً في الفريزر لمدة ساعتين.',
          instruction_en: 'Warm rosewater with raspberry essence and bloomed gelatin. Pour into insert silicone molds (2cm smaller than cake ring) and freeze solid for 2 hours.',
          timer_minutes: 120,
          tip_ar: 'تجميد الحشوة الداخلية خطوة أساسية لضمان ثباتها في منتصف الموس عند التركيب.',
          tip_en: 'Freezing inserts rock-solid prevents them from sinking or bleeding into the mousse.'
        },
        {
          step_number: 3,
          title_ar: 'صنع موس الفستق البافارواز',
          title_en: 'Pistachio Bavarois Mousse',
          instruction_ar: 'اصنع كاسترد إنجليزي ساخن مع معجون الفستق والجيلاتين والشوكولاتة البيضاء. عندما تبرد إلى 30 مئوية، ادمج كريمة الخفق المخفوقة بخفة بحركات دائرية.',
          instruction_en: 'Make an anglaise base with pistachio paste, white chocolate, and gelatin. When cooled to 30°C, fold in soft-whipped cream gently until homogenous.',
          timer_minutes: 20,
          tip_ar: 'درجة حرارة دمج الكريمة حاسمة؛ إذا كانت ساخنة ستذوب الكريمة، وإذا كانت باردة سيتكتل الجيلاتين.',
          tip_en: 'Temperature control (30°C) is crucial to avoid deflating the whipped cream.'
        },
        {
          step_number: 4,
          title_ar: 'التركيب العكسي والتجميد الصادم',
          title_en: 'Inverse Assembly & Blast Freezing',
          instruction_ar: 'اسكب نصف كمية موس الفستق في قالب سيليكون فاخر، ضع قرص هلام ماء الورد المجمد في الوسط، أضف بقية الموس ثم اغلق بطبقة بسكويت الجاكوند. جمد القالب ليلة كاملة.',
          instruction_en: 'Pipe half the pistachio mousse into silicone mold, insert frozen rose disc in center, top with remaining mousse, and cap with joconde sponge. Freeze overnight.',
          timer_minutes: 360,
          tip_ar: 'التركيب العكسي يضمن سطحاً أملساً خالياً من العيوب عند نزع السيليكون.',
          tip_en: 'Inverse molding produces pristine glass-smooth geometry upon demolding.'
        },
        {
          step_number: 5,
          title_ar: 'سكب غليز المرآة بالمستكة والتقديم',
          title_en: 'Mirror Glazing & Gold Leaf Finishing',
          instruction_ar: 'سخّن غليز المرآة المحضر بالمستكة والشوكولاتة البيضاء إلى درجة حرارة 32 مئوية. انزع الإنتريميه المجمد من القالب، وضعه فوق شبك واسكب الغليز دفعة واحدة وبشكل متواصل ليغطي القبة بالكامل.',
          instruction_en: 'Warm mastic mirror glaze to exactly 32°C. Demold frozen entremet onto a glazing rack, pour glaze in one fluid motion to coat seamlessly, and garnish with gold leaf and crushed pistachios.',
          timer_minutes: 10,
          tip_ar: 'صب الغليز بحركة واحدة مستمرة يمنع تكون خطوط أو تجاعيد على سطح المرآة.',
          tip_en: 'One uninterrupted pouring cascade guarantees a mirror reflection with zero streaks.'
        }
      ],
      nutrition: {
        calories: 460,
        protein: '9g',
        carbs: '42g',
        fats: '30g',
        fiber: '2.8g',
        sodium: '110mg'
      },
      pairings: {
        drink_ar: 'قهوة سعودية شقراء بالهيل والزعفران الفاخر',
        drink_en: 'Aromatic Saudi Light Roast Coffee with Cardamom',
        side_ar: 'حبات توت العليق الطازج مع لمسات ورق الذهب الغذائي',
        side_en: 'Fresh Raspberries with 24k Edible Gold Leaf',
        notes_ar: 'مرارة القهوة الخفيفة توازن حلاوة الغليز وتبرز عطرية المستكة وماء الورد.',
        notes_en: 'Lightly spiced coffee cuts through the luscious richness of pistachio bavarois.'
      }
    },
    {
      id: 'recipe-6',
      title: 'Hamachi Crudo with Yuzu White Ponzu & Finger Lime',
      title_ar: 'كروودو سمك الهاماتشي مع اليوزو وبونزو الكافيار الليموني',
      title_en: 'Hamachi Crudo with Yuzu White Ponzu & Finger Lime',
      description_ar: 'شرائح سمك هاماتشي ياباني طازج بدرجة ساشيمي، متبلة بصلصة بونزو بيضاء بنكهة فاكهة اليوزو العطرية، مغطاة بكافيار الليمون الأسترالي وزيت الكمأة البيضاء والأعشاب المجهرية.',
      description_en: 'Sashimi-grade Japanese Yellowtail thinly shaved, dressed in citrusy white yuzu shoyu ponzu, crowned with bursting Australian finger lime pearls and micro greens.',
      author_id: 'chef-4',
      author_name_ar: 'شيف كينجي تاكاهاشي',
      author_name_en: 'Chef Kenji Takahashi',
      author_avatar: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?auto=format&fit=crop&w=200&q=80',
      image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80'
      ],
      cuisine: 'Contemporary Japanese Kaiseki',
      cuisine_ar: 'ياباني معاصر كايسيكي',
      cuisine_en: 'Contemporary Japanese',
      category: 'Appetizers & Raw',
      category_ar: 'مقبلات وأطباق باردة',
      category_en: 'Appetizers & Raw',
      difficulty: 'Medium',
      difficulty_ar: 'متوسط',
      difficulty_en: 'Medium',
      base_servings: 4,
      prep_time: 20,
      cook_time: 0,
      total_time: 20,
      calories: 280,
      likes_count: 1350,
      saves_count: 820,
      rating: 4.97,
      reviews_count: 102,
      created_at: '2026-08-07',
      tags: ['Hamachi', 'Crudo', 'Sashimi', 'Yuzu', 'Japanese'],
      ingredients: [
        {
          id: 'ing-601',
          name_ar: 'فيليه سمك هاماتشي ياباني بدرجة ساشيمي',
          name_en: 'Sashimi-Grade Hamachi (Yellowtail) Loin',
          baseAmount: 360,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'مبرد ومحفوظ على ثلج جاف',
          notes_en: 'Ultra-fresh chilled sashimi grade'
        },
        {
          id: 'ing-602',
          name_ar: 'عصير يوزو ياباني طبيعي 100%',
          name_en: 'Pure Japanese Yuzu Juice',
          baseAmount: 30,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'غير محلى',
          notes_en: 'Unsweetened cold extracted'
        },
        {
          id: 'ing-603',
          name_ar: 'صلصة صويا بيضاء (شيرو شيو)',
          name_en: 'Artisanal White Soy Sauce (Shiro Shoyu)',
          baseAmount: 40,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'لحفظ لون السمك الوردي الفاتح',
          notes_en: 'Preserves pristine meat color'
        },
        {
          id: 'ing-604',
          name_ar: 'حبات كافيار الليمون الأسترالي (Finger Lime)',
          name_en: 'Fresh Finger Lime Pearls',
          baseAmount: 2,
          unit_ar: 'حبة',
          unit_en: 'pcs',
          notes_ar: 'حبيبات تنفجر بالحموضة في الفم',
          notes_en: 'Caviar-like citrus pearls'
        },
        {
          id: 'ing-605',
          name_ar: 'زيت كمأة بيضاء إيطالي فاخر',
          name_en: 'White Truffle Infused Olive Oil',
          baseAmount: 15,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'قطرات للتلميع والنكهة',
          notes_en: 'Aromatic finishing drops'
        },
        {
          id: 'ing-606',
          name_ar: 'أوراق كزبرة مجهرية وزهور شيسو بنفسجية',
          name_en: 'Micro Shiso Leaves & Edible Flowers',
          baseAmount: 10,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للتزيين الجمالي',
          notes_en: 'For visual elegance'
        }
      ],
      steps: [
        {
          step_number: 1,
          title_ar: 'تقطيع الهاماتشي بسكين الساشيمي الحرفية',
          title_en: 'Precision Sashimi Slicing',
          instruction_ar: 'باستخدام سكين ياناغيبا ياباني حاد للغاية، اقطع فيليه الهاماتشي بحركة سحب واحدة وبزاوية 45 درجة إلى شرائح رقيقة متساوية بسماكة 3 ملم.',
          instruction_en: 'Using a razor-sharp Japanese Yanagiba blade, slice hamachi against the grain in one single pulling motion into 3mm delicate sashimi ribbons.',
          timer_minutes: 10,
          tip_ar: 'حركة السحب الواحدة تحافظ على خلايا اللحم ملساء ولامعة وتمنع تمزق الأنسجة.',
          tip_en: 'A single clean pull stroke preserves cellular integrity for a glossy sheen.'
        },
        {
          step_number: 2,
          title_ar: 'تركيب صوص البونزو البيضاء باليوزو',
          title_en: 'White Yuzu Ponzu Dressing',
          instruction_ar: 'اخلط عصير اليوزو مع صلصة الصويا البيضاء وقليل من زيت الكمأة البيضاء في وعاء زجاجي صغير مبرد.',
          instruction_en: 'Whisk yuzu juice with white shoyu and drops of white truffle oil in a chilled glass vessel.',
          timer_minutes: 5,
          tip_ar: 'استخدام الصويا البيضاء يمنع اسوداد لون السمك الأبيض الشفاف.',
          tip_en: 'White soy preserves the pearl-pink translucency of fresh yellowtail.'
        },
        {
          step_number: 3,
          title_ar: 'الترتيب والتزيين بالحمضيات والزهور',
          title_en: 'Arranging, Dressing & Serving',
          instruction_ar: 'رتب شرائح الهاماتشي بشكل دائري أنيق على طبق سيراميك حجري بارد. اسكب البونزو برقة حول السمك، وزع لآلئ كافيار الليمون وزهور الشيسو وقدمه فوراً.',
          instruction_en: 'Arrange sashimi slices harmoniously on chilled slate ceramic plates. Spoon chilled ponzu around, dot with finger lime pearls, and finish with micro shiso.',
          timer_minutes: 5,
          tip_ar: 'قدم الطبق بارداً فور تحضيره للاستمتاع بانفجار حموضة كافيار الليمون.',
          tip_en: 'Serve immediately on iced plates to capture the popping citrus crunch.'
        }
      ],
      nutrition: {
        calories: 280,
        protein: '32g',
        carbs: '4g',
        fats: '15g',
        fiber: '0.8g',
        sodium: '460mg'
      },
      pairings: {
        drink_ar: 'شاي الماتشا الأخضر البارد بالخيار والزنجبيل',
        drink_en: 'Cold Brew Ceremonial Matcha with Cucumber & Ginger',
        side_ar: 'سلطة أعشاب البحر الوكامي المخللة بزيت السمسم المحمص',
        side_en: 'Pickled Wakame Seaweed with Toasted Sesame Oil',
        notes_ar: 'حموضة اليوزو تذيب دهون الهاماتشي الغنية لتمنح انتعاشاً فورياً.',
        notes_en: 'Yuzu brightness beautifully lifts the lush, rich oil content of sashimi yellowtail.'
      }
    },
    {
      id: 'recipe-7',
      title: 'Smoked Freekeh Risotto with Wild Morels',
      title_ar: 'ريزوتو الفريكة الخضراء المدخنة مع فطر الموريل البري',
      title_en: 'Smoked Freekeh Risotto with Wild Morels',
      description_ar: 'حبوب الفريكة الشامية الخضراء المحمصة على الحطب، مطهوة بأسلوب الريزوتو الإيطالي في مرق الفطر البري المعتق، مع جبنة القشقوان القديمة وفطر الموريل المكرمل.',
      description_en: 'Artisanal green fire-roasted smoked freekeh prepared risotto-style in rich wild mushroom broth, folded with aged Kashkaval cheese and pan-glazed wild morels.',
      author_id: 'chef-3',
      author_name_ar: 'شيف طارق منصور',
      author_name_en: 'Chef Tariq Mansour',
      author_avatar: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=200&q=80',
      image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80'
      ],
      cuisine: 'Modern Levantine Fusion',
      cuisine_ar: 'شامي معاصر',
      cuisine_en: 'Modern Levantine',
      category: 'Vegetarian & Grains',
      category_ar: 'نباتي وحبوب',
      category_en: 'Vegetarian & Grains',
      difficulty: 'Medium',
      difficulty_ar: 'متوسط',
      difficulty_en: 'Medium',
      base_servings: 4,
      prep_time: 20,
      cook_time: 35,
      total_time: 55,
      calories: 440,
      likes_count: 870,
      saves_count: 590,
      rating: 4.90,
      reviews_count: 74,
      created_at: '2026-08-08',
      tags: ['Freekeh', 'Morels', 'Risotto', 'Vegetarian', 'SmokedGrains'],
      ingredients: [
        {
          id: 'ing-701',
          name_ar: 'حبوب فريكة خضراء مدخنة بلدية',
          name_en: 'Green Fire-Smoked Whole Freekeh',
          baseAmount: 250,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'مغسولة ومنقوعة 15 دقيقة',
          notes_en: 'Rinsed and soaked for 15 mins'
        },
        {
          id: 'ing-702',
          name_ar: 'فطر موريل بري مجفف فاخر',
          name_en: 'Premium Dried Wild Morel Mushrooms',
          baseAmount: 40,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'منقوع في ماء دافئ ومصفى',
          notes_en: 'Rehydrated in warm broth'
        },
        {
          id: 'ing-703',
          name_ar: 'بصل شالوت فرنسي مفروم ناعماً',
          name_en: 'Minced French Shallots',
          baseAmount: 3,
          unit_ar: 'حبة',
          unit_en: 'pcs',
          notes_ar: 'لقاعدة الطهي',
          notes_en: 'For aromatic base'
        },
        {
          id: 'ing-704',
          name_ar: 'مرق خضار وفطر بري غني',
          name_en: 'Rich Wild Mushroom Vegetable Stock',
          baseAmount: 800,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'محفوظ ساخناً على نار هادئة',
          notes_en: 'Kept simmering'
        },
        {
          id: 'ing-705',
          name_ar: 'سمن بلدي بقري معتق',
          name_en: 'Artisanal Cultured Grass-Fed Ghee',
          baseAmount: 45,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للتحمير وإضفاء لمعان',
          notes_en: 'For sautéing'
        },
        {
          id: 'ing-706',
          name_ar: 'جبنة قشقوان جبلية معتقة مبشورة',
          name_en: 'Aged Mountain Kashkaval Cheese',
          baseAmount: 60,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للدمج النهائي',
          notes_en: 'For mantecatura finish'
        },
        {
          id: 'ing-707',
          name_ar: 'أوراق زعتر بري جاف وزيت زيتون',
          name_en: 'Wild Mountain Zaatar & EVOO',
          baseAmount: 10,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للتزيين العطري',
          notes_en: 'For finishing drizzle'
        }
      ],
      steps: [
        {
          step_number: 1,
          title_ar: 'تحميص الفريكة والشالوت بالسمن',
          title_en: 'Toasting Freekeh & Shallots',
          instruction_ar: 'في قدر ذي قاعدة سميكة، ذوب نصف كمية السمن وشوّح الشالوت حتى يذبل. أضف الفريكة وحمصها لمدة 4 دقائق حتى تطلق رائحة الحطب والمكسرات المحمصة.',
          instruction_en: 'Melt half the ghee in a heavy pot, sweat shallots, and toast freekeh for 4 minutes until deeply nutty and fragrant.',
          timer_minutes: 6,
          tip_ar: 'التحميص بالسمن يغلف حبات الفريكة بطبقة دهنية تمنع تعجنها وتبرز نكهة الدخان التراثية.',
          tip_en: 'Toasting creates a protective fat barrier that preserves individual grain texture.'
        },
        {
          step_number: 2,
          title_ar: 'الطهي التدريجي بالمرق الساخن (الريزوتو)',
          title_en: 'Simmering with Mushroom Broth',
          instruction_ar: 'أضف مرق الفطر الساخن بمعدل مغرفة في كل مرة مع التقليب المستمر على نار متوسطة. اترك الحبوب تمتص السائل قبل إضافة المغرفة التالية، وكرر العملية لمدة 25 دقيقة.',
          instruction_en: 'Add simmering mushroom stock one ladle at a time, stirring steadily. Allow grains to absorb liquid before adding the next ladle over 25 mins.',
          timer_minutes: 25,
          tip_ar: 'التقليب المستمر يطلق النشا الطبيعي ليعطي قواماً كريمياً لزجاً دون الحاجة للكريمة الصناعية.',
          tip_en: 'Constant agitation releases natural starch to create a velvety creaminess.'
        },
        {
          step_number: 3,
          title_ar: 'كرملة فطر الموريل البري',
          title_en: 'Caramelizing Wild Morels',
          instruction_ar: 'في مقلاة منفصلة، شوّح فطر الموريل المنقوع مع ملعقة سمن ورشة ملح وفلفل أسود لمدة 4 دقائق حتى يصبح ذهبياً ومقرمش الحواف.',
          instruction_en: 'In a separate skillet, sear rehydrated morel mushrooms in ghee for 4 minutes until golden and deeply aromatic.',
          timer_minutes: 5,
          tip_ar: 'تأكد من تجفيف الموريل جيداً قبل التحمير لضمان اكتسابه لون الكرملة الذهبي.',
          tip_en: 'Thoroughly pat morels dry to achieve a crisp, golden sauté crust.'
        },
        {
          step_number: 4,
          title_ar: 'الدمج النهائي (Mantecatura) والتقديم',
          title_en: 'Mantecatura & Plating',
          instruction_ar: 'ارفع القدر عن النار، أضف جبنة القشقوان وبقية السمن وحرك بقوة لتكوين قوام موجي كريمي. اسكب الريزوتو في أطباق دافئة وضع فطر الموريل المكرمل على الوجه مع رشة زعتر بري.',
          instruction_en: 'Remove from heat, vigorously beat in grated Kashkaval and remaining ghee for the mantecatura wave. Spoon into warm bowls, crown with morels, and dust with wild zaatar.',
          timer_minutes: 4,
          tip_ar: 'إجراء المانتيكاتورا بعيداً عن النار يضمن إذابة الجبن دون انفصال زيوته.',
          tip_en: 'Off-heat mantecatura emulsifies cheese and fat smoothly without splitting.'
        }
      ],
      nutrition: {
        calories: 440,
        protein: '16g',
        carbs: '62g',
        fats: '16g',
        fiber: '9.5g',
        sodium: '480mg'
      },
      pairings: {
        drink_ar: 'عصير التفاح الأخضر الفوار بالزنجبيل والزعتر البري',
        drink_en: 'Sparkling Green Apple Cider with Fresh Thyme & Ginger',
        side_ar: 'سلطة الشمندر المشوي مع الجوز وجبنة الماعز',
        side_en: 'Roasted Beetroot Salad with Crumbled Goat Cheese',
        notes_ar: 'نكهة الفريكة الخضراء المدخنة تتكامل ببراعة مع غنى فطر الموريل البري والأجبان الجبلية.',
        notes_en: 'Smoky earthy grain notes marry seamlessly with the umami profile of wild morels.'
      }
    },
    {
      id: 'recipe-8',
      title: 'Smoked Cardamom Dark Chocolate Ganache Tart',
      title_ar: 'تارت الشوكولاتة الداكنة بالهيل المدخن والملح الصخري',
      title_en: 'Smoked Cardamom Dark Chocolate Ganache Tart',
      description_ar: 'قاعدة تارت بسكويت الشوكولاتة الهش المقرمش (Pâte Sablée)، محشوة بغاناش حريري غني من شوكولاتة فالرونا 70% المنقوعة بحبات الهيل المدخن وعسل النحل العضوي.',
      description_en: 'Crisp chocolate pâte sablée tart shell filled with a glossy silk ganache of 70% Valrhona dark chocolate infused with crushed smoked cardamom and raw honey.',
      author_id: 'chef-2',
      author_name_ar: 'شيف إيلينا روستوفا',
      author_name_en: 'Chef Elena Rostova',
      author_avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=200&q=80',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'
      ],
      cuisine: 'Contemporary Fusion Pâtisserie',
      cuisine_ar: 'حلويات معاصرة',
      cuisine_en: 'Contemporary Pâtisserie',
      category: 'Desserts & Pastry',
      category_ar: 'حلويات ومعجنات',
      category_en: 'Desserts & Pastry',
      difficulty: 'Hard',
      difficulty_ar: 'متقدم',
      difficulty_en: 'Hard',
      base_servings: 8,
      prep_time: 45,
      cook_time: 25,
      total_time: 70,
      calories: 490,
      likes_count: 1540,
      saves_count: 1040,
      rating: 4.96,
      reviews_count: 165,
      created_at: '2026-08-09',
      tags: ['ChocolateTart', 'Ganache', 'Cardamom', 'Valrhona', 'FineDesserts'],
      ingredients: [
        {
          id: 'ing-801',
          name_ar: 'شوكولاتة داكنة فالرونا غواناخا 70%',
          name_en: 'Valrhona Guanaja 70% Dark Chocolate',
          baseAmount: 250,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'مفرومة ناعماً',
          notes_en: 'Finely chopped callets'
        },
        {
          id: 'ing-802',
          name_ar: 'كريمة خفق طازجة 36% دسم',
          name_en: 'Fresh Heavy Cream (36%)',
          baseAmount: 220,
          unit_ar: 'مل',
          unit_en: 'ml',
          notes_ar: 'لنقع الهيل والغاناش',
          notes_en: 'For cardamom infusion'
        },
        {
          id: 'ing-803',
          name_ar: 'حبوب هيل أخضر مدخنة ومطحونة',
          name_en: 'Smoked Green Cardamom Pods',
          baseAmount: 8,
          unit_ar: 'حبة',
          unit_en: 'pcs',
          notes_ar: 'مجروشة جزئياً',
          notes_en: 'Lightly crushed'
        },
        {
          id: 'ing-804',
          name_ar: 'عسل سدر بري نقي',
          name_en: 'Pure Wild Sidr Honey',
          baseAmount: 30,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'لإضفاء لمعان ومرونة للغاناش',
          notes_en: 'Invert sugar for ganache shine'
        },
        {
          id: 'ing-805',
          name_ar: 'زبدة فرنسية غير مملحة',
          name_en: 'Unsalted French Normandy Butter',
          baseAmount: 110,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للعجينة والغاناش',
          notes_en: 'Softened for emulsification'
        },
        {
          id: 'ing-806',
          name_ar: 'دقيق كاكاو هولندي داكن معالج',
          name_en: 'Dutch Processed Dark Cocoa Powder',
          baseAmount: 35,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'لقاعدة عجينة التارت',
          notes_en: 'For sable crust'
        },
        {
          id: 'ing-807',
          name_ar: 'دقيق قمح حلويات فاخر',
          name_en: 'Pastry Flour',
          baseAmount: 180,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'لعجينة السابليه',
          notes_en: 'For tart shell'
        },
        {
          id: 'ing-808',
          name_ar: 'ملح بحري مقرمش مدخن (Maldon)',
          name_en: 'Maldon Smoked Sea Salt Flakes',
          baseAmount: 5,
          unit_ar: 'جرام',
          unit_en: 'g',
          notes_ar: 'للتزيين النهائي',
          notes_en: 'For finishing crystals'
        }
      ],
      steps: [
        {
          step_number: 1,
          title_ar: 'تحضير عجينة السابليه بالكاكاو والخبز الأعمى',
          title_en: 'Chocolate Pâte Sablée Blind Baking',
          instruction_ar: 'افرك الزبدة مع الدقيق والكاكاو وسكر البودرة حتى يصبح كفتات الخبز، اجمع العجين بالبيض وافرده في قوالب التارت المفرغة. اخبز على حرارة 170 مئوية مع أثقال الخبز لمدة 18 دقيقة.',
          instruction_en: 'Rub butter into flour, cocoa, and icing sugar. Bind with egg, line perforated tart rings, and blind bake with weights at 170°C for 18 mins until crisp.',
          timer_minutes: 25,
          tip_ar: 'استخدام القوالب الدائرية المثقبة يمنح أطراف التارت استقامة هندسية حادة كالمحترفين.',
          tip_en: 'Perforated tart rings allow even steam escape, yielding crisp razor-sharp edges.'
        },
        {
          step_number: 2,
          title_ar: 'نقع الكريمة بالهيل المدخن',
          title_en: 'Smoked Cardamom Infusion',
          instruction_ar: 'اغلِ الكريمة مع حبوب الهيل المدخن المجروشة وعسل السدر، ارفعها عن النار وغطها واتركها لتنقع لمدة 15 دقيقة، ثم صفها وأعد تسخينها قبل سكبها على الشوكولاتة.',
          instruction_en: 'Bring cream, crushed smoked cardamom, and raw honey to a simmer. Cover and steep for 15 mins, then strain and reheat.',
          timer_minutes: 15,
          tip_ar: 'النقع بالغطاء يحبس الزيوت العطرية الطيارة للهيل داخل الكريمة.',
          tip_en: 'Covering during steeping preserves volatile aromatic cardamom oils.'
        },
        {
          step_number: 3,
          title_ar: 'استحلاب الغاناش الحريري والصب',
          title_en: 'Ganache Emulsion & Pouring',
          instruction_ar: 'اسكب الكريمة الساخنة على الشوكولاتة المفرومة على 3 دفعات، واخفق بالبلندر اليدوي دون إدخال فقاعات هواء حتى تحصل على مستحلب لامع وناعم. أضف الزبدة المتبقية واسكب الغاناش في قوالب التارت.',
          instruction_en: 'Pour hot infused cream over chopped chocolate in 3 additions. Emulsify with an immersion blender held beneath surface, blend in butter, and pour into baked shells.',
          timer_minutes: 10,
          tip_ar: 'إبقاء رأس الخلاط اليدوي مغموراً في القاع يمنع دخول فقاعات الهواء المزعجة إلى سطح الغاناش.',
          tip_en: 'Keep immersion blender submerged flat to avoid air bubbles on the glossy surface.'
        },
        {
          step_number: 4,
          title_ar: 'التماسك والتزيين بالملح والذهب',
          title_en: 'Setting & Maldon Salt Finishing',
          instruction_ar: 'اترك التارت ليتماسك في درجة حرارة الغرفة (18-20 مئوية) لمدة ساعتين. قبل التقديم مباشرة، وزع بلورات الملح المدخن ورقائق الذهب الغذائي على السطح اللامع.',
          instruction_en: 'Let set at room temperature (18-20°C) for 2 hours. Just before serving, crown with smoked Maldon sea salt crystals and edible gold leaf.',
          timer_minutes: 120,
          tip_ar: 'التبريد في الثلاجة قد يفقد الغاناش بريقه اللامع ويجعله باهتاً؛ يفضل التماسك البطيء في غرفة مكيفة.',
          tip_en: 'Avoid fridge condensation which dulls ganache gloss; allow setting in a cool room.'
        }
      ],
      nutrition: {
        calories: 490,
        protein: '7g',
        carbs: '46g',
        fats: '32g',
        fiber: '5.4g',
        sodium: '190mg'
      },
      pairings: {
        drink_ar: 'إسبريسو سينغل أوريجين إثيوبي بنفحات الياسمين والتوت',
        drink_en: 'Single-Origin Ethiopian Espresso with Floral Berry Notes',
        side_ar: 'آيس كريم الفانيليا المدخنة المصنوعة منزلياً',
        side_en: 'Artisanal Smoked Tahitian Vanilla Gelato',
        notes_ar: 'مرارة الشوكولاتة الداكنة وتوابل الهيل تتألق بوجود بلورات الملح المدخن المباغت.',
        notes_en: 'Crunchy smoked sea salt crystals heighten the intense aromatics of cocoa and spice.'
      }
    }
  ],

  // 3. B2B SUPPLIES MARKETPLACE (8 Commercial Items)
  supplies: [
    {
      id: 'supply-1',
      name_ar: 'عجانة لولبية تجارية للمخابز والمطاعم 50 لتر',
      name_en: 'Commercial Heavy-Duty Spiral Dough Mixer 50L',
      category: 'heavy_equipment',
      category_ar: 'معدات المطابخ الثقيلة',
      category_en: 'Heavy Kitchen Equipment',
      price: 14500,
      price_formatted: '14,500 ر.س',
      currency: 'SAR',
      moq: 1,
      unit_ar: 'وحدة',
      unit_en: 'Unit',
      in_stock: true,
      stock_count: 8,
      image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80'
      ],
      description_ar: 'عجانة حلزونية صناعية عالية التحمل بهيكل متين من الفولاذ المقاوم للصدأ AISI 304، مزودة بمحرك مزدوج السرعة ومؤقت رقمي وحاجز أمان ذكي مناسبة للتشغيل المستمر في المطاعم والمخابز الراقية.',
      description_en: 'Industrial-grade spiral mixer with AISI 304 food-grade stainless steel bowl. Equipped with dual-speed high-torque motor, digital programmable timer, and auto-shutoff safety guard for continuous bakery operation.',
      supplier: {
        id: 'supplier-1',
        name_ar: 'شركة الفنار لمعدات المطابخ التجارية',
        name_en: 'Al-Fannar Commercial Kitchens Co.',
        avatar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&q=80',
        verified: true,
        rating: 4.96,
        reviews_count: 184,
        response_rate: '98%',
        response_time: '< 1 hour',
        location_ar: 'الرياض، المملكة العربية السعودية',
        location_en: 'Riyadh, Saudi Arabia'
      },
      specs: [
        { label_ar: 'سعة الوعاء', label_en: 'Bowl Capacity', value_ar: '50 لتر (30 كغ عجين)', value_en: '50 Liters (30kg Dough)' },
        { label_ar: 'قوة المحرك', label_en: 'Motor Power', value_ar: '3.0 كيلوواط - 380 فولت', value_en: '3.0 kW - 380V Three Phase' },
        { label_ar: 'السرعات', label_en: 'Speed Levels', value_ar: 'سرعتان (125 / 250 دورة/دقيقة)', value_en: '2 Speeds (125 / 250 RPM)' },
        { label_ar: 'مادة الصنع', label_en: 'Build Material', value_ar: 'ستانلس ستيل AISI 304 صحي', value_en: 'Food-Grade AISI 304 Stainless Steel' }
      ],
      certifications: ['CE Certified', 'ISO 9001:2015', 'SASO Approved', 'NSF Listed'],
      lead_time_ar: '3 إلى 5 أيام عمل',
      lead_time_en: '3 to 5 Business Days',
      warranty_ar: 'ضمان شامل لمدة 24 شهراً مع الصيانة الموقعية',
      warranty_en: '24 Months Full Warranty with On-Site Maintenance'
    },
    {
      id: 'supply-2',
      name_ar: 'زيت زيتون بكر ممتاز نخب أول بالجملة 50 لتر - الجوف',
      name_en: 'Extra Virgin Olive Oil Bulk Drum 50L - Al-Jouf Reserve',
      category: 'bulk_ingredients',
      category_ar: 'مكونات خام بالجملة',
      category_en: 'Wholesale Bulk Ingredients',
      price: 1850,
      price_formatted: '1,850 ر.س',
      currency: 'SAR',
      moq: 2,
      unit_ar: 'برميل (50 لتر)',
      unit_en: 'Drum (50L)',
      in_stock: true,
      stock_count: 45,
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80'
      ],
      description_ar: 'زيت زيتون بكر ممتاز معصور على البارد من مزارع الجوف الشمالية، نسبة حموضة أقل من 0.2% مع نكهة فاكهية عشبية مميزة، معبأ في براميل ستانلس ستيل معزولة ومحكمة الإغلاق للطهاة والمطاعم.',
      description_en: 'First cold-pressed extra virgin olive oil from the fertile groves of Al-Jouf. Acidity below 0.2% with intense herbaceous notes, packaged in nitrogen-sealed food-safe drums for culinary enterprises.',
      supplier: {
        id: 'supplier-2',
        name_ar: 'معاصر الجوف الذهبية الزراعية',
        name_en: 'Al-Jouf Golden Olive Mills Ltd.',
        avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
        verified: true,
        rating: 4.98,
        reviews_count: 310,
        response_rate: '99%',
        response_time: '< 30 mins',
        location_ar: 'سكاكا - الجوف، المملكة العربية السعودية',
        location_en: 'Al-Jouf, Saudi Arabia'
      },
      specs: [
        { label_ar: 'نسبة الحموضة', label_en: 'Acidity Level', value_ar: '< 0.18% (فائق الجودة)', value_en: '< 0.18% Ultra-Premium' },
        { label_ar: 'طريقة العصر', label_en: 'Extraction Method', value_ar: 'عصرة أولى على البارد (22°C)', value_en: 'First Cold Pressed (22°C)' },
        { label_ar: 'موسم الحصاد', label_en: 'Harvest Season', value_ar: 'حصاد شتاء 2026', value_en: 'Winter 2026 Reserve Harvest' },
        { label_ar: 'التغليف', label_en: 'Packaging', value_ar: 'برميل ستانلس ستيل غذائي محكم', value_en: 'Nitrogen-Flushed Stainless Steel Drum' }
      ],
      certifications: ['Saudi Organic Certified', 'SFDA Approved', 'Global G.A.P.', 'ISO 22000'],
      lead_time_ar: '2 إلى 4 أيام عمل',
      lead_time_en: '2 to 4 Business Days',
      warranty_ar: 'ضمان الجودة والنقاء 100% مع شهادة التحليل المخبري',
      warranty_en: '100% Purity Guarantee with Certificate of Analysis (COA)'
    },
    {
      id: 'supply-3',
      name_ar: 'سكين الشيف الاحترافي دمشقي 67 طبقة 240 ملم',
      name_en: '67-Layer Damascus Japanese Chef Knife 240mm (Gyuto)',
      category: 'knives_cutlery',
      category_ar: 'سكاكين وأدوات القطع',
      category_en: 'Knives & Cutlery',
      price: 890,
      price_formatted: '890 ر.س',
      currency: 'SAR',
      moq: 5,
      unit_ar: 'قطعة',
      unit_en: 'Pcs',
      in_stock: true,
      stock_count: 32,
      image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80'
      ],
      description_ar: 'سكين غيوتو ياباني مصنوع يدوياً من الفولاذ الدمشقي بقلب من صلب VG-10 فائق الصلابة (60±2 HRC)، مع مقبض خشبي ثماني الأضلاع من خشب الصحراء الصلب لتوازن مثالي أثناء العمل اليومي الشاق.',
      description_en: 'Hand-forged Japanese Gyuto chef knife with 67 layers of Damascus cladding over a VG-10 high-carbon super steel core (60±2 HRC). Octagonal desert ironwood handle engineered for professional balance.',
      supplier: {
        id: 'supplier-3',
        name_ar: 'شركة كايزن لأدوات الطهاة المحترفين',
        name_en: 'Kaizen Culinary Cutlery ME',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        verified: true,
        rating: 4.94,
        reviews_count: 142,
        response_rate: '96%',
        response_time: '< 2 hours',
        location_ar: 'دبي، الإمارات العربية المتحدة',
        location_en: 'Dubai, United Arab Emirates'
      },
      specs: [
        { label_ar: 'طول النصل', label_en: 'Blade Length', value_ar: '240 ملم (9.5 إنش)', value_en: '240mm (9.5 Inches)' },
        { label_ar: 'صلابة الفولاذ', label_en: 'Rockwell Hardness', value_ar: '60±2 HRC (VG-10 Core)', value_en: '60±2 HRC (VG-10 Core)' },
        { label_ar: 'زاوية الشحذ', label_en: 'Edge Angle', value_ar: '15 درجة لكل جانب (شديد الحدة)', value_en: '15° per side (Razor Sharp)' },
        { label_ar: 'مادة المقبض', label_en: 'Handle Material', value_ar: 'خشب طبيعي ثماني الأضلاع', value_en: 'Octagonal Natural Ironwood' }
      ],
      certifications: ['Artisanal Forged Japan', 'NSF Listed', 'SGS Food Contact Safe'],
      lead_time_ar: '1 إلى 3 أيام عمل',
      lead_time_en: '1 to 3 Business Days',
      warranty_ar: 'ضمان مدى الحياة ضد عيوب التصنيع وسوء الفولاذ',
      warranty_en: 'Lifetime Warranty against Manufacturing Defects'
    },
    {
      id: 'supply-4',
      name_ar: 'جهاز سحب الهواء والتغليف المفرغ التجاري برو 400',
      name_en: 'Commercial Chamber Vacuum Sealer Pro 400',
      category: 'heavy_equipment',
      category_ar: 'معدات المطابخ الثقيلة',
      category_en: 'Heavy Kitchen Equipment',
      price: 6200,
      price_formatted: '6,200 ر.س',
      currency: 'SAR',
      moq: 1,
      unit_ar: 'وحدة',
      unit_en: 'Unit',
      in_stock: true,
      stock_count: 12,
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80'
      ],
      description_ar: 'جهاز تغليف بالتفريغ الهوائي بغرفة محكمة من الفولاذ المقاوم للصدأ ومضخة بوش الألمانية القوية، مزود بمستشعر ذكي لتغليف السوائل والصلصات والإنضاج بالتفريغ.',
      description_en: 'Commercial chamber vacuum sealer featuring heavy-duty German Busch rotary pump and digital sensor cycle. Capable of packaging delicate marinades, liquids, and large meat subprimals for sous-vide.',
      supplier: {
        id: 'supplier-1',
        name_ar: 'شركة الفنار لمعدات المطابخ التجارية',
        name_en: 'Al-Fannar Commercial Kitchens Co.',
        avatar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&q=80',
        verified: true,
        rating: 4.96,
        reviews_count: 184,
        response_rate: '98%',
        response_time: '< 1 hour',
        location_ar: 'الرياض، المملكة العربية السعودية',
        location_en: 'Riyadh, Saudi Arabia'
      },
      specs: [
        { label_ar: 'قوة المضخة', label_en: 'Pump Capacity', value_ar: '20 متر مكعب/ساعة (Busch)', value_en: '20 m³/h German Busch Pump' },
        { label_ar: 'طول شريط اللحام', label_en: 'Sealing Bar Length', value_ar: '420 ملم مزدوج اللحام', value_en: '420mm Double Seal Bar' },
        { label_ar: 'أبعاد الغرفة', label_en: 'Chamber Dimensions', value_ar: '440 × 420 × 170 ملم', value_en: '440 × 420 × 170 mm' },
        { label_ar: 'التحكم', label_en: 'Control System', value_ar: 'شاشة رقمية مع ذاكرة 10 برامج', value_en: 'Digital Display with 10 Programs' }
      ],
      certifications: ['CE Certified', 'SASO Approved', 'NSF Listed'],
      lead_time_ar: '2 إلى 5 أيام عمل',
      lead_time_en: '2 to 5 Business Days',
      warranty_ar: 'ضمان 24 شهراً مع قطع غيار أصلية متوفرة',
      warranty_en: '24 Months Warranty with Stocked Original Spare Parts'
    },
    {
      id: 'supply-5',
      name_ar: 'زيت الكمأة السوداء الشتوية الطبيعي 5 لتر',
      name_en: 'Artisanal Black Winter Truffle Infused Olive Oil 5L',
      category: 'bulk_ingredients',
      category_ar: 'مكونات خام بالجملة',
      category_en: 'Wholesale Bulk Ingredients',
      price: 1250,
      price_formatted: '1,250 ر.س',
      currency: 'SAR',
      moq: 2,
      unit_ar: 'صفيحة (5 لتر)',
      unit_en: 'Tin (5L)',
      in_stock: true,
      stock_count: 28,
      image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80'
      ],
      description_ar: 'زيت زيتون بكر إيطالي نقي منقوع بقطع وخلاصات الكمأة السوداء الشتوية الطبيعية (Tuber melanosporum) بدون نكهات كيميائية مصنعة، مخصص للاستخدام الفندقي الفاخر.',
      description_en: 'Pure Italian extra virgin olive oil naturally infused with real black winter truffle extract (Tuber melanosporum). Zero synthetic aromas or chemical 2,4-dithiapentane additives.',
      supplier: {
        id: 'supplier-4',
        name_ar: 'أومبريا لتوريد المكونات الذواقة الفاخرة',
        name_en: 'Umbria Gourmet Specialty Imports',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
        verified: true,
        rating: 4.97,
        reviews_count: 220,
        response_rate: '97%',
        response_time: '< 1 hour',
        location_ar: 'جدة، المملكة العربية السعودية',
        location_en: 'Jeddah, Saudi Arabia'
      },
      specs: [
        { label_ar: 'نوع الكمأة', label_en: 'Truffle Species', value_ar: 'كمأة سوداء شتوية نرويجية إيطالية', value_en: 'Tuber Melanosporum Vitt.' },
        { label_ar: 'نسبة النكهة الطبيعية', label_en: 'Natural Aroma', value_ar: '100% خلاصة طبيعية خالية من الكيماويات', value_en: '100% Pure Natural Extract' },
        { label_ar: 'حجم العبوة', label_en: 'Volume', value_ar: '5 لتر صفيحة معدنية واقية من الضوء', value_en: '5 Liter UV-Shielded Metal Tin' }
      ],
      certifications: ['HACCP Certified', 'EU Organic', 'SFDA Approved'],
      lead_time_ar: '2 إلى 4 أيام عمل',
      lead_time_en: '2 to 4 Business Days',
      warranty_ar: 'شهادة المنشأ الإيطالية مع التحليل العضوي',
      warranty_en: 'Italian Certificate of Origin & Organic Authentication'
    },
    {
      id: 'supply-6',
      name_ar: 'علب حفظ وتغليف الوجبات الفاخرة من قصب السكر 1000 حبة',
      name_en: 'Biodegradable Sugarcane Bagasse Takeaway Containers 1000 Pcs',
      category: 'eco_packaging',
      category_ar: 'حلول التغليف المستدام',
      category_en: 'Eco-Friendly Packaging',
      price: 520,
      price_formatted: '520 ر.س',
      currency: 'SAR',
      moq: 5,
      unit_ar: 'كرتون (1000 حبة)',
      unit_en: 'Carton (1000 Pcs)',
      in_stock: true,
      stock_count: 120,
      image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80'
      ],
      description_ar: 'علب طعام صديقة للبيئة قابلة للتحلل الحيوي بالكامل مصنوعة من ألياف قصب السكر الطبيعية، مقاومة للزيوت والسوائل الساخنة وتتحمل الميكروويف والتجميد من -20 إلى 120 مئوية.',
      description_en: '100% biodegradable, compostable food containers crafted from natural unbleached sugarcane bagasse fiber. Oil-resistant, leak-proof, microwave and freezer safe from -20°C to 120°C.',
      supplier: {
        id: 'supplier-5',
        name_ar: 'إيكوباك لحلول التغليف المستدام للضيافة',
        name_en: 'EcoPack Sustainable Solutions ME',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        verified: true,
        rating: 4.89,
        reviews_count: 95,
        response_rate: '95%',
        response_time: '< 3 hours',
        location_ar: 'الدمام، المملكة العربية السعودية',
        location_en: 'Dammam, Saudi Arabia'
      },
      specs: [
        { label_ar: 'السعة والتقسيم', label_en: 'Capacity & Style', value_ar: '850 مل - خانة واحدة أو خانتان', value_en: '850ml Single/Dual Compartment' },
        { label_ar: 'نطاق الحرارة', label_en: 'Temperature Range', value_ar: 'من -20°C إلى +120°C', value_en: '-20°C to +120°C' },
        { label_ar: 'التحلل البيئي', label_en: 'Biodegradability', value_ar: 'تحلل كامل خلال 90 يوماً في التربة', value_en: '100% Composted in 90 Days' }
      ],
      certifications: ['BPI Certified Compostable', 'EN 13432', 'SASO Green Badge', 'FDA Food Grade'],
      lead_time_ar: '1 إلى 2 يوم عمل',
      lead_time_en: '1 to 2 Business Days',
      warranty_ar: 'ضمان الجودة ومقاومة التسريب بنسبة 100%',
      warranty_en: '100% Leak-Proof & Structural Integrity Guarantee'
    },
    {
      id: 'supply-7',
      name_ar: 'جهاز الطهي الدقيق بالسوس فيد 30 لتر برو',
      name_en: 'Commercial Precision Sous-Vide Immersion Circulator 30L',
      category: 'heavy_equipment',
      category_ar: 'معدات المطابخ الثقيلة',
      category_en: 'Heavy Kitchen Equipment',
      price: 2400,
      price_formatted: '2,400 ر.س',
      currency: 'SAR',
      moq: 1,
      unit_ar: 'وحدة',
      unit_en: 'Unit',
      in_stock: true,
      stock_count: 18,
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
      ],
      description_ar: 'جهاز تدوير حراري محترف للطهي المائي البطيء بدقة حرارية تصل إلى ±0.05 درجة مئوية، ومضخة تدوير قوية تكفي لأحواض مائية حتى 30 لتراً مع شاشة لمس ملونة.',
      description_en: 'Heavy-duty professional immersion circulator for precision low-temperature sous-vide bath. Delivers ±0.05°C temperature stability with high-volume 30L bath circulation pump.',
      supplier: {
        id: 'supplier-1',
        name_ar: 'شركة الفنار لمعدات المطابخ التجارية',
        name_en: 'Al-Fannar Commercial Kitchens Co.',
        avatar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&q=80',
        verified: true,
        rating: 4.96,
        reviews_count: 184,
        response_rate: '98%',
        response_time: '< 1 hour',
        location_ar: 'الرياض، المملكة العربية السعودية',
        location_en: 'Riyadh, Saudi Arabia'
      },
      specs: [
        { label_ar: 'الدقة الحرارية', label_en: 'Temperature Accuracy', value_ar: '±0.05°C (تحكم رقمي PID)', value_en: '±0.05°C Digital PID Control' },
        { label_ar: 'قوة السخان', label_en: 'Heating Power', value_ar: '1800 واط تسخين سريع', value_en: '1800W Rapid Heating Element' },
        { label_ar: 'سعة الحوض القصوى', label_en: 'Max Bath Capacity', value_ar: '30 لتر ماء متداول', value_en: '30 Liters Continuous Circulation' }
      ],
      certifications: ['CE Certified', 'IPX7 Waterproof', 'SASO Approved'],
      lead_time_ar: '2 إلى 3 أيام عمل',
      lead_time_en: '2 to 3 Business Days',
      warranty_ar: 'ضمان 24 شهراً مع استبدال فوري عند العطل',
      warranty_en: '24 Months Warranty with Instant Replacement Support'
    },
    {
      id: 'supply-8',
      name_ar: 'زعفران سوبر نقين ملكي فاخر نخب أول 500 جرام',
      name_en: 'Grade 1 Royal Super Negin Saffron Bulk Tin 500g',
      category: 'bulk_ingredients',
      category_ar: 'مكونات خام بالجملة',
      category_en: 'Wholesale Bulk Ingredients',
      price: 5400,
      price_formatted: '5,400 ر.س',
      currency: 'SAR',
      moq: 1,
      unit_ar: 'علبة معدنية (500 جرام)',
      unit_en: 'Tin (500g)',
      in_stock: true,
      stock_count: 15,
      image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80'
      ],
      description_ar: 'زعفران سوبر نقين أحمر ملكي نقي 100% بأعلى درجات قوة اللون (كروسين > 260)، خيوط كاملة طويلة بدون أي شوائب صفراء، معبأ في علب معدنية مفرغة من الأكسجين للحفاظ على الرائحة الزكية.',
      description_en: '100% pure Grade-1 Royal Super Negin saffron with supreme coloring power (Crocin rating > 260). Long all-red stigmas with zero yellow style waste, hermetically vacuum-sealed in bulk culinary tins.',
      supplier: {
        id: 'supplier-4',
        name_ar: 'أومبريا لتوريد المكونات الذواقة الفاخرة',
        name_en: 'Umbria Gourmet Specialty Imports',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
        verified: true,
        rating: 4.97,
        reviews_count: 220,
        response_rate: '97%',
        response_time: '< 1 hour',
        location_ar: 'جدة، المملكة العربية السعودية',
        location_en: 'Jeddah, Saudi Arabia'
      },
      specs: [
        { label_ar: 'درجة الزعفران', label_en: 'Grading Category', value_ar: 'سوبر نقين ملكي - فئة أولى ISO', value_en: 'Royal Super Negin - ISO Cat I' },
        { label_ar: 'قوة اللون (Crocin)', label_en: 'Color Reading', value_ar: '> 265 (أعلى تركيز عالمي)', value_en: '> 265 Supreme Pigmentation' },
        { label_ar: 'الوزن الصافي', label_en: 'Net Weight', value_ar: '500 جرام خيوط نقية', value_en: '500g Pure Red Stigmas' }
      ],
      certifications: ['ISO 3632-1 Certified', 'SFDA Food Safety Approved', 'Halal Certified'],
      lead_time_ar: '2 إلى 4 أيام عمل',
      lead_time_en: '2 to 4 Business Days',
      warranty_ar: 'شهادة التحليل الطيفي للمختبر المعتمد مع كل عبوة',
      warranty_en: 'Spectrophotometric Lab Analysis Certificate with Each Tin'
    }
  ],

  // 4. MASTERCLASSES & COURSES (4 Intensive Workshops)
  courses: [
    {
      id: 'course-1',
      title: 'Modern Fermentation & Dry Aging Masterclass',
      title_ar: 'أسرار التخمير والإنضاج الجاف في المطابخ الفاخرة',
      title_en: 'Modern Fermentation & Dry Aging Masterclass',
      subtitle_ar: 'تقنيات متقدمة في تخمير الكوجي، ومخللات اللاكتو، وإنضاج لحوم الواغيو التراثية للمحترفين',
      subtitle_en: 'Advanced koji fermentation, lacto-pickling chemistry, and precision dry-aging for culinary leaders',
      instructor_id: 'chef-1',
      instructor_name_ar: 'الشيف فيصل الهاشمي',
      instructor_name_en: 'Chef Faisal Al-Hashemi',
      instructor_avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
      instructor_title_ar: 'شيف تنفيذي وخبير فنون الطهي المعاصر',
      instructor_title_en: 'Executive Chef & Modern Gastronomy Consultant',
      level: 'masterclass',
      level_ar: 'احترافي متقدم (Masterclass)',
      level_en: 'Masterclass',
      duration_ar: '6 أسابيع (24 ساعة تدريبية مباشرة)',
      duration_en: '6 Weeks (24 Live Hours)',
      price: 3200,
      price_formatted: '3,200 ر.س',
      currency: 'SAR',
      total_seats: 15,
      seats_left: 3,
      start_date: '2026-09-10',
      schedule_ar: 'كل ثلاثاء وخميس (6:00 م - 8:00 م بتوقيت مكة)',
      schedule_en: 'Every Tue & Thu (6:00 PM - 8:00 PM AST)',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      includes_certificate: true,
      enrolled_count: 12,
      syllabus: [
        {
          module_number: 1,
          title_ar: 'مقدمة في كيمياء التخمير والبكتيريا النافعة',
          title_en: 'Microbiology of Wild Fermentation & Safety',
          duration_ar: '4 ساعات',
          duration_en: '4 Hours',
          lessons: [
            { title_ar: 'فهم بكتيريا حمض اللاكتيك وأسس التمليح الدقيق', title_en: 'Lactic Acid Bacteria & Salt Calculations', duration_ar: '2 ساعة', duration_en: '2 Hours' },
            { title_ar: 'زراعة فطر الكوجي (Aspergillus oryzae) على الحبوب', title_en: 'Inoculating Koji Spores on Ancient Grains', duration_ar: '2 ساعة', duration_en: '2 Hours' }
          ]
        },
        {
          module_number: 2,
          title_ar: 'إنضاج اللحوم الجاف وبناء غرف التعتيق',
          title_en: 'Dry-Aging Chambers & Mycology Dynamics',
          duration_ar: '6 ساعات',
          duration_en: '6 Hours',
          lessons: [
            { title_ar: 'التحكم في الرطوبة والحرارة وتدفق الهواء لغرف الإنضاج', title_en: 'Humidity, Airflow & Thermal Engineering', duration_ar: '3 ساعات', duration_en: '3 Hours' },
            { title_ar: 'تطور النكهات الإنزيمية وتقليم طبقات التعتيق', title_en: 'Enzymatic Breakdown & Yield Trimming', duration_ar: '3 ساعات', duration_en: '3 Hours' }
          ]
        },
        {
          module_number: 3,
          title_ar: 'تخمير التمور والصلصات التراثية المعاصرة',
          title_en: 'Artisanal Date Garums & Heritage Ferments',
          duration_ar: '8 ساعات',
          duration_en: '8 Hours',
          lessons: [
            { title_ar: 'صناعة الغاروم الحديث من بروتينات اللحوم والتمر', title_en: 'Modern Meat & Date Garum Alchemy', duration_ar: '4 ساعات', duration_en: '4 Hours' },
            { title_ar: 'خلول الفواكه الطبيعية وتعتيقها في براميل خشبية', title_en: 'Live Vinegar Brewing in Casks', duration_ar: '4 ساعات', duration_en: '4 Hours' }
          ]
        },
        {
          module_number: 4,
          title_ar: 'المشروع الختامي وقائمة التذوق الفاخرة',
          title_en: 'Capstone Project & Tasting Menu Design',
          duration_ar: '6 ساعات',
          duration_en: '6 Hours',
          lessons: [
            { title_ar: 'تصميم طبق توقيع يدمج 3 عناصر مخمرة معتقة', title_en: 'Crafting a 3-Ferment Signature Plate', duration_ar: '3 ساعات', duration_en: '3 Hours' },
            { title_ar: 'جلسة التقييم والاعتماد المهني الدولي', title_en: 'Masterclass Jury & Certification Evaluation', duration_ar: '3 ساعات', duration_en: '3 Hours' }
          ]
        }
      ]
    },
    {
      id: 'course-2',
      title: 'Haute Viennoiserie & Modern Laminated Dough',
      title_ar: 'فنون المخبوزات الفرنسية الفاخرة وعجائن التوريق الحديثة',
      title_en: 'Haute Viennoiserie & Modern Laminated Dough',
      subtitle_ar: 'أسرار الكرواسون ثنائي اللون، العجائن المخمرة بالبانيتون، والتوريق الهندسي للحلويات',
      subtitle_en: 'Bicolor laminations, artisanal panettone sourdough, and architectural pastry shapes',
      instructor_id: 'chef-2',
      instructor_name_ar: 'شيف إيلينا روستوفا',
      instructor_name_en: 'Chef Elena Rostova',
      instructor_avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=200&q=80',
      instructor_title_ar: 'ماستر شيف حلويات وفائزة بجوائز دولية',
      instructor_title_en: 'Master Pastry Chef & International Awardee',
      level: 'intermediate',
      level_ar: 'متوسط (Intermediate)',
      level_en: 'Intermediate',
      duration_ar: '4 أسابيع (16 ساعة تدريبية)',
      duration_en: '4 Weeks (16 Live Hours)',
      price: 2600,
      price_formatted: '2,600 ر.س',
      currency: 'SAR',
      total_seats: 18,
      seats_left: 5,
      start_date: '2026-09-18',
      schedule_ar: 'كل سبت واثنين (5:00 م - 7:00 م بتوقيت مكة)',
      schedule_en: 'Every Sat & Mon (5:00 PM - 7:00 PM AST)',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      includes_certificate: true,
      enrolled_count: 13,
      syllabus: [
        {
          module_number: 1,
          title_ar: 'هندسة التوريق واختيار الزبدة النقية',
          title_en: 'Lamination Physics & Tournage Butter Standards',
          duration_ar: '4 ساعات',
          duration_en: '4 Hours',
          lessons: [
            { title_ar: 'اختيار الدقيق ونسب تمدد الجلوتين', title_en: 'Flour Selection & Gluten Elasticity', duration_ar: '2 ساعة', duration_en: '2 Hours' },
            { title_ar: 'الطيات الفردية والمزدوجة والتحكم بالحرارة', title_en: 'Single & Double Envelope Folds', duration_ar: '2 ساعة', duration_en: '2 Hours' }
          ]
        },
        {
          module_number: 2,
          title_ar: 'الكرواسون ثنائي اللون وتشكيل القوالب الحديثة',
          title_en: 'Bicolor Croissants & Modern Geo-Shapes',
          duration_ar: '6 ساعات',
          duration_en: '6 Hours',
          lessons: [
            { title_ar: 'تحضير عجائن الكاكاو والتوت الملونة', title_en: 'Cocoa & Berry Laminate Skins', duration_ar: '3 ساعات', duration_en: '3 Hours' },
            { title_ar: 'اللف في القوالب الأسطوانية والمكعبة', title_en: 'Rolls, Cubes & Architectural Coils', duration_ar: '3 ساعات', duration_en: '3 Hours' }
          ]
        },
        {
          module_number: 3,
          title_ar: 'التخمير البطيء والخبز في أفران البخار',
          title_en: 'Proofing Dynamics & Deck Oven Steam Baking',
          duration_ar: '6 ساعات',
          duration_en: '6 Hours',
          lessons: [
            { title_ar: 'إدارة درجات رطوبة وحرارة غرف التخمير', title_en: 'Proofer Humidity & Temperature Curves', duration_ar: '3 ساعات', duration_en: '3 Hours' },
            { title_ar: 'التلميع بالشراب اللامع وتثبيت الهشاشة', title_en: 'Gloss Glazing & Crust Preservation', duration_ar: '3 ساعات', duration_en: '3 Hours' }
          ]
        }
      ]
    },
    {
      id: 'course-3',
      title: 'Traditional Live Fire & Smoke Gastronomy',
      title_ar: 'فنون الطهي المباشر على الحطب والتدخين الحرفي',
      title_en: 'Traditional Live Fire & Smoke Gastronomy',
      subtitle_ar: 'إدارة بيوت التدخين، تحضير بهارات الرّب الجافة، وتقنيات الشواء البطيء على حطب الزيتون',
      subtitle_en: 'Smokehouse management, artisanal dry rubs, and ultra-slow low-and-slow wood pitmastery',
      instructor_id: 'chef-3',
      instructor_name_ar: 'شيف طارق منصور',
      instructor_name_en: 'Chef Tariq Mansour',
      instructor_avatar: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=200&q=80',
      instructor_title_ar: 'خبير المشاوي الحرفية والطهي بالنار الحية',
      instructor_title_en: 'Master Pitmaster & Live Fire Pioneer',
      level: 'intermediate',
      level_ar: 'متوسط (Intermediate)',
      level_en: 'Intermediate',
      duration_ar: '3 أسابيع (12 ساعة تدريبية)',
      duration_en: '3 Weeks (12 Live Hours)',
      price: 1950,
      price_formatted: '1,950 ر.س',
      currency: 'SAR',
      total_seats: 20,
      seats_left: 8,
      start_date: '2026-09-25',
      schedule_ar: 'كل جمعة وسبت (4:00 م - 6:00 م بتوقيت مكة)',
      schedule_en: 'Every Fri & Sat (4:00 PM - 6:00 PM AST)',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      includes_certificate: true,
      enrolled_count: 12,
      syllabus: [
        {
          module_number: 1,
          title_ar: 'أنواع الأخشاب وخصائص الدخان العطري',
          title_en: 'Wood Profiling & Clean Smoke Physics',
          duration_ar: '4 ساعات',
          duration_en: '4 Hours',
          lessons: [
            { title_ar: 'التمييز بين خشب الزيتون والسنديان وأشجار الفاكهة', title_en: 'Olive vs Oak vs Fruitwood Flavor Notes', duration_ar: '2 ساعة', duration_en: '2 Hours' },
            { title_ar: 'تجنب الدخان الأبيض المر وتحقيق الدخان الأزرق النظيف', title_en: 'Eliminating Creosote & Thin Blue Smoke', duration_ar: '2 ساعة', duration_en: '2 Hours' }
          ]
        },
        {
          module_number: 2,
          title_ar: 'تقطيع اللحوم الكبيرة وتوازن البهارات',
          title_en: 'Subprimal Butchery & Spice Geometry',
          duration_ar: '4 ساعات',
          duration_en: '4 Hours',
          lessons: [
            { title_ar: 'تشريح الأضلاع وقطع البريسكت والكتف', title_en: 'Trimming Brisket, Ribs & Whole Shoulders', duration_ar: '2 ساعة', duration_en: '2 Hours' },
            { title_ar: 'تركيب بهارات الرّب الجافة والتمليح الإسموزي', title_en: 'Crafting Dry Rubs & Osmotic Equilibrium', duration_ar: '2 ساعة', duration_en: '2 Hours' }
          ]
        },
        {
          module_number: 3,
          title_ar: 'الطهي البطيء (Low & Slow) لـ 14 ساعة',
          title_en: 'The 14-Hour Low & Slow Session',
          duration_ar: '4 ساعات',
          duration_en: '4 Hours',
          lessons: [
            { title_ar: 'تجاوز نقطة ثبات الحرارة (The Stall) واللف', title_en: 'Managing The Stall with Peach Butcher Paper', duration_ar: '2 ساعة', duration_en: '2 Hours' },
            { title_ar: 'فترة الراحة الحرارية والتقطيع الحريري', title_en: 'Thermal Resting in Warmers & Slicing', duration_ar: '2 ساعة', duration_en: '2 Hours' }
          ]
        }
      ]
    },
    {
      id: 'course-4',
      title: 'The Kaiseki Philosophy & Seafood Precision',
      title_ar: 'فلسفة الكايسيكي وتقنيات التعامل مع المأكولات البحرية',
      title_en: 'The Kaiseki Philosophy & Seafood Precision',
      subtitle_ar: 'تقنيات الإيكي جيمي للذبح الرحيم، تقطيع الساشيمي الحرفي، واستخلاص الداشي الفاخر',
      subtitle_en: 'Ikejime human harvesting, master yanagiba knife arts, and supreme ichiban dashi extraction',
      instructor_id: 'chef-4',
      instructor_name_ar: 'شيف كينجي تاكاهاشي',
      instructor_name_en: 'Chef Kenji Takahashi',
      instructor_avatar: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?auto=format&fit=crop&w=200&q=80',
      instructor_title_ar: 'حاصل على نجمتي ميشلان وأستاذ الكايسيكي',
      instructor_title_en: 'Two Michelin-Starred Master Chef',
      level: 'masterclass',
      level_ar: 'احترافي متقدم (Masterclass)',
      level_en: 'Masterclass',
      duration_ar: '5 أسابيع (20 ساعة تدريبية)',
      duration_en: '5 Weeks (20 Live Hours)',
      price: 3800,
      price_formatted: '3,800 ر.س',
      currency: 'SAR',
      total_seats: 12,
      seats_left: 2,
      start_date: '2026-10-02',
      schedule_ar: 'كل أربعاء وسبت (6:00 م - 8:00 م بتوقيت مكة)',
      schedule_en: 'Every Wed & Sat (6:00 PM - 8:00 PM AST)',
      image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=800&q=80',
      includes_certificate: true,
      enrolled_count: 10,
      syllabus: [
        {
          module_number: 1,
          title_ar: 'علم الإيكي جيمي وإنضاج الأسماك',
          title_en: 'Ikejime Science & Seafood Curing',
          duration_ar: '4 ساعات',
          duration_en: '4 Hours',
          lessons: [
            { title_ar: 'فيزياء شلل النخاع وتفريغ الدم لحفظ النضارة', title_en: 'Neurological Dispatch & Blood Line Draining', duration_ar: '2 ساعة', duration_en: '2 Hours' },
            { title_ar: 'التمليح والتعتيق الرطب للأسماك البيضاء (Shime)', title_en: 'Shime Curing with Kombu (Kobujime)', duration_ar: '2 ساعة', duration_en: '2 Hours' }
          ]
        },
        {
          module_number: 2,
          title_ar: 'استخلاص الداشي الأول ومركبات الأومامي',
          title_en: 'Ichiban Dashi & Umami Synergies',
          duration_ar: '6 ساعات',
          duration_en: '6 Hours',
          lessons: [
            { title_ar: 'درجات حرارة نقع عشب الكومبو لتعظيم الجلوتامات', title_en: 'Kombu Extraction Chemistry at 60°C', duration_ar: '3 ساعات', duration_en: '3 Hours' },
            { title_ar: 'إضافة رقائق الكاتسوبوشي والتصفية الحريرية', title_en: 'Katsuobushi Infusion & Paper Clarification', duration_ar: '3 ساعات', duration_en: '3 Hours' }
          ]
        },
        {
          module_number: 3,
          title_ar: 'فنون التقطيع بالسكاكين اليابانية التقليدية',
          title_en: 'Master Blade Cuts (Sogi-Giri & Hira-Zukuri)',
          duration_ar: '6 ساعات',
          duration_en: '6 Hours',
          lessons: [
            { title_ar: 'قطع الساشيمي المائل والمستقيم وفق نسيج الألياف', title_en: 'Cutting Angles Relative to Muscle Grain', duration_ar: '3 ساعات', duration_en: '3 Hours' },
            { title_ar: 'تقشير وتشكيل الخضروات الكايسيكية (Katsuramuki)', title_en: 'Paper-Thin Daikon Katsuramuki Sheeting', duration_ar: '3 ساعات', duration_en: '3 Hours' }
          ]
        },
        {
          module_number: 4,
          title_ar: 'فلسفة المواسم وتصميم قائمة الكايسيكي',
          title_en: 'Shun Seasonality & Kaiseki Course Architecture',
          duration_ar: '4 ساعات',
          duration_en: '4 Hours',
          lessons: [
            { title_ar: 'الموازنة بين الأطباق الثمانية (Sakizuke إلى Hassun)', title_en: 'Harmonizing the 8 Classical Kaiseki Courses', duration_ar: '2 ساعة', duration_en: '2 Hours' },
            { title_ar: 'اختيار الأواني الخزفية والتقديم الجمالي', title_en: 'Ceramic Selection & Seasonal Geometry', duration_ar: '2 ساعة', duration_en: '2 Hours' }
          ]
        }
      ]
    }
  ],

  // 5. DIRECT CHATS & RFQ NEGOTIATIONS (Initial Threads)
  chats: [
    {
      id: 'chat-1',
      partner: {
        id: 'supplier-1',
        name_ar: 'شركة الفنار لمعدات المطابخ',
        name_en: 'Al-Fannar Commercial Kitchens',
        avatar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&q=80',
        role: 'supplier',
        verified: true,
        online: true
      },
      last_message_ar: 'مرحباً شيف فيصل، قمنا بمراجعة طلب التسعير للعجانة اللولبية 50 لتر ويسعدنا تقديم خصم إضافي للدفعة الأولى.',
      last_message_en: 'Hello Chef Faisal, we reviewed your RFQ for the 50L Spiral Mixer and are pleased to offer an exclusive commercial batch discount.',
      last_message_time: '10:45 AM',
      unread_count: 1,
      category: 'supplier',
      rfq_card: {
        rfq_id: 'rfq-9801',
        item_id: 'supply-1',
        item_name_ar: 'عجانة لولبية تجارية للمخابز 50 لتر',
        item_name_en: 'Commercial Spiral Dough Mixer 50L',
        item_image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=200&q=80',
        quantity: 2,
        unit_ar: 'وحدة',
        unit_en: 'Units',
        target_price: 27000,
        unit_price: 13500,
        total_price: 27000,
        currency: 'SAR',
        status: 'quoted', // pending | quoted | accepted | rejected
        destination_ar: 'الرياض - حي حطين',
        destination_en: 'Riyadh - Hittin District',
        target_date: '2026-09-01'
      },
      messages: [
        {
          id: 'msg-101',
          sender: 'me',
          text_ar: 'السلام عليكم، أود الاستفسار عن توفر عجانة 50 لتر الفولاذية وإمكانية توريد وحدتين لمطعمنا الجديد بالرياض خلال أسبوعين.',
          text_en: 'Greetings, I would like to inquire about stock availability for 2 units of the 50L Spiral Mixer for our new restaurant opening in 2 weeks.',
          timestamp: '09:30 AM',
          has_rfq: true
        },
        {
          id: 'msg-102',
          sender: 'partner',
          text_ar: 'وعليكم السلام والرحمة شيف فيصل. الوحدات متوفرة في مستودعاتنا المركزية بالرياض وجاهزة للشحن الفوري مع التوصيل والتركيب المجاني.',
          text_en: 'Welcome Chef Faisal. Both units are in stock at our central Riyadh warehouse, ready for immediate dispatch with complimentary installation.',
          timestamp: '10:15 AM'
        },
        {
          id: 'msg-103',
          sender: 'partner',
          text_ar: 'مرحباً شيف فيصل، قمنا بمراجعة طلب التسعير للعجانة اللولبية 50 لتر ويسعدنا تقديم خصم إضافي للدفعة الأولى.',
          text_en: 'Hello Chef Faisal, we reviewed your RFQ for the 50L Spiral Mixer and are pleased to offer an exclusive commercial batch discount.',
          timestamp: '10:45 AM'
        }
      ]
    },
    {
      id: 'chat-2',
      partner: {
        id: 'chef-2',
        name_ar: 'شيف إيلينا روستوفا',
        name_en: 'Chef Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=200&q=80',
        role: 'chef',
        verified: true,
        online: false
      },
      last_message_ar: 'أهلاً شيف فيصل، وصفتك الجديدة للواغيو بغليز التمر كانت مبهرة! هل يمكننا التنسيق لورشة عمل مشتركة؟',
      last_message_en: 'Hello Chef Faisal, your new Wagyu with date glaze recipe was phenomenal! Can we collaborate on a joint masterclass?',
      last_message_time: 'Yesterday',
      unread_count: 0,
      category: 'chef',
      rfq_card: null,
      messages: [
        {
          id: 'msg-201',
          sender: 'partner',
          text_ar: 'أهلاً شيف فيصل، وصفتك الجديدة للواغيو بغليز التمر كانت مبهرة! هل يمكننا التنسيق لورشة عمل مشتركة؟',
          text_en: 'Hello Chef Faisal, your new Wagyu with date glaze recipe was phenomenal! Can we collaborate on a joint masterclass?',
          timestamp: 'Yesterday 04:20 PM'
        },
        {
          id: 'msg-202',
          sender: 'me',
          text_ar: 'أهلاً شيف إيلينا، يسعدني جداً ذلك! يسعدني دمج الحلويات المبتكرة مع الأطباق التراثية في ورشة الشهر القادم.',
          text_en: 'Hello Chef Elena, I would be honored! Let us plan a fusion pastry-gastronomy workshop next month.',
          timestamp: 'Yesterday 05:00 PM'
        }
      ]
    },
    {
      id: 'chat-3',
      partner: {
        id: 'supplier-2',
        name_ar: 'معاصر الجوف الذهبية',
        name_en: 'Al-Jouf Golden Olive Mills',
        avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
        role: 'supplier',
        verified: true,
        online: true
      },
      last_message_ar: 'تم تأكيد شحن 4 براميل من زيت الزيتون البكر الممتاز، رقم التتبع مرفق بطلبك.',
      last_message_en: 'Dispatched 4 drums of extra virgin olive oil reserve, tracking number attached to your RFQ order.',
      last_message_time: 'Aug 12',
      unread_count: 0,
      category: 'supplier',
      rfq_card: {
        rfq_id: 'rfq-9802',
        item_id: 'supply-2',
        item_name_ar: 'زيت زيتون بكر ممتاز 50 لتر - الجوف',
        item_name_en: 'Extra Virgin Olive Oil Bulk Drum 50L',
        item_image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80',
        quantity: 4,
        unit_ar: 'برميل',
        unit_en: 'Drums',
        target_price: 7400,
        unit_price: 1850,
        total_price: 7400,
        currency: 'SAR',
        status: 'accepted',
        destination_ar: 'الدرعية - الرياض',
        destination_en: 'Diriyah - Riyadh',
        target_date: '2026-08-20'
      },
      messages: [
        {
          id: 'msg-301',
          sender: 'partner',
          text_ar: 'تم تأكيد شحن 4 براميل من زيت الزيتون البكر الممتاز، رقم التتبع مرفق بطلبك.',
          text_en: 'Dispatched 4 drums of extra virgin olive oil reserve, tracking number attached to your RFQ order.',
          timestamp: 'Aug 12 11:15 AM'
        }
      ]
    }
  ],

  // 6. NOTIFICATIONS CENTER (Grouped Feed Items)
  notifications: [
    {
      id: 'notif-1',
      type: 'rfq',
      category: 'rfqs',
      title_ar: 'عرض سعر جديد جاهز للمراجعة',
      title_en: 'New RFQ Quotation Ready',
      message_ar: 'قدمت شركة الفنار عرض سعر رسمي لطلبك الخاص بالعجانة اللولبية 50 لتر.',
      message_en: 'Al-Fannar Kitchens submitted an official quotation for your 50L Spiral Mixer RFQ.',
      time_ar: 'منذ 15 دقيقة',
      time_en: '15 mins ago',
      timestamp: '2026-08-15T01:20:00Z',
      read: false,
      avatar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=100&q=80',
      target_url: 'chat.html?id=chat-1'
    },
    {
      id: 'notif-2',
      type: 'like',
      category: 'likes',
      title_ar: 'إعجابات جديدة بوصفة الستيك',
      title_en: 'New Recipe Likes',
      message_ar: 'أبدى 45 شيفاً إعجابهم بوصفة "ستيك واغيو بريب آي مع غليز التمر".',
      message_en: '45 chefs liked your "Wagyu Ribeye with Black Garlic Date Glaze" recipe.',
      time_ar: 'منذ ساعتين',
      time_en: '2 hours ago',
      timestamp: '2026-08-14T23:30:00Z',
      read: false,
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80',
      target_url: 'recipe.html?id=recipe-1'
    },
    {
      id: 'notif-3',
      type: 'course',
      category: 'courses',
      title_ar: 'تسجيل جديد في ورشة التخمير',
      title_en: 'New Masterclass Enrollment',
      message_ar: 'انضم الشيف ماركو بيليني إلى دورة "أسرار التخمير والإنضاج الجاف". تبقى 3 مقاعد فقط!',
      message_en: 'Chef Marco Bellini enrolled in "Modern Fermentation Masterclass". Only 3 seats left!',
      time_ar: 'منذ 4 ساعات',
      time_en: '4 hours ago',
      timestamp: '2026-08-14T21:30:00Z',
      read: true,
      avatar: 'https://images.unsplash.com/photo-1574966740793-953ad375ded5?auto=format&fit=crop&w=100&q=80',
      target_url: 'courses.html?id=course-1'
    },
    {
      id: 'notif-4',
      type: 'comment',
      category: 'likes',
      title_ar: 'تعليق جديد من الشيف إيلينا',
      title_en: 'New Comment on Recipe',
      message_ar: 'علقت الشيف إيلينا روستوفا: "تناغم دبس تمر الخلاص مع الثوم الأسود ابتكار استثنائي!"',
      message_en: 'Chef Elena Rostova commented: "The balance of Kholas dates and black garlic is sublime!"',
      time_ar: 'منذ 6 ساعات',
      time_en: '6 hours ago',
      timestamp: '2026-08-14T19:30:00Z',
      read: true,
      avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=100&q=80',
      target_url: 'recipe.html?id=recipe-1'
    },
    {
      id: 'notif-5',
      type: 'rfq',
      category: 'rfqs',
      title_ar: 'تم قبول طلب التوريد بنجاح',
      title_en: 'RFQ Order Accepted',
      message_ar: 'تم قبول وتأكيد طلب توريد براميل زيت الزيتون من معاصر الجوف الذهبية.',
      message_en: 'Al-Jouf Golden Mills accepted and confirmed your olive oil bulk shipment.',
      time_ar: 'منذ يوم',
      time_en: '1 day ago',
      timestamp: '2026-08-13T10:00:00Z',
      read: true,
      avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80',
      target_url: 'chat.html?id=chat-3'
    },
    {
      id: 'notif-6',
      type: 'follow',
      category: 'likes',
      title_ar: 'متابعون جدد لملفك الشخصي',
      title_en: 'New Followers',
      message_ar: 'بدأ 128 متخصصاً في فنون الطهي بمتابعة حسابك هذا الأسبوع.',
      message_en: '128 culinary professionals started following your profile this week.',
      time_ar: 'منذ يومين',
      time_en: '2 days ago',
      timestamp: '2026-08-12T14:00:00Z',
      read: true,
      avatar: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?auto=format&fit=crop&w=100&q=80',
      target_url: 'chef.html?id=chef-1'
    }
  ],

  // 7. PLATFORM TRENDS & DISCOVERY HIGHLIGHTS
  trends: {
    topics: [
      {
        tag: '#NewNajdiCuisine',
        title_ar: 'المطبخ النجدي المعاصر',
        title_en: 'Contemporary Najdi Gastronomy',
        posts_count: '1.4k'
      },
      {
        tag: '#KojiFermentation',
        title_ar: 'تقنيات تخمير الكوجي',
        title_en: 'Koji Fermentation Arts',
        posts_count: '890'
      },
      {
        tag: '#ArtisanalPasta',
        title_ar: 'الباستا الحرفية اليدوية',
        title_en: 'Handmade Artisanal Pasta',
        posts_count: '2.1k'
      },
      {
        tag: '#CommercialKitchenTech',
        title_ar: 'تقنيات المطابخ السحابية',
        title_en: 'Commercial Kitchen Tech',
        posts_count: '640'
      },
      {
        tag: '#PastryArchitecture',
        title_ar: 'هندسة الحلويات الفرنسية',
        title_en: 'Architectural Haute Pastry',
        posts_count: '1.8k'
      }
    ],
    stories: [
      {
        id: 'story-1',
        chef_id: 'chef-1',
        chef_name_ar: 'فيصل الهاشمي',
        chef_name_en: 'Faisal Al-Hashemi',
        avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
        unviewed: true
      },
      {
        id: 'story-2',
        chef_id: 'chef-2',
        chef_name_ar: 'إيلينا روستوفا',
        chef_name_en: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=150&q=80',
        image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
        unviewed: true
      },
      {
        id: 'story-3',
        chef_id: 'chef-3',
        chef_name_ar: 'طارق منصور',
        chef_name_en: 'Tariq Mansour',
        avatar: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=150&q=80',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        unviewed: true
      },
      {
        id: 'story-4',
        chef_id: 'chef-4',
        chef_name_ar: 'كينجي تاكاهاشي',
        chef_name_en: 'Kenji Takahashi',
        avatar: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?auto=format&fit=crop&w=150&q=80',
        image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
        unviewed: false
      },
      {
        id: 'story-5',
        chef_id: 'chef-5',
        chef_name_ar: 'ليلى بن جلون',
        chef_name_en: 'Layla Benjelloun',
        avatar: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=150&q=80',
        image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
        unviewed: false
      },
      {
        id: 'story-6',
        chef_id: 'chef-6',
        chef_name_ar: 'ماركو بيليني',
        chef_name_en: 'Marco Bellini',
        avatar: 'https://images.unsplash.com/photo-1574966740793-953ad375ded5?auto=format&fit=crop&w=150&q=80',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
        unviewed: false
      }
    ],
    top_suppliers: [
      {
        id: 'supplier-1',
        name_ar: 'شركة الفنار للمعدات',
        name_en: 'Al-Fannar Kitchens',
        category_ar: 'معدات ثقيلة',
        category_en: 'Heavy Equipment',
        avatar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=100&q=80',
        rating: 4.96,
        orders_count: 480
      },
      {
        id: 'supplier-2',
        name_ar: 'معاصر الجوف الذهبية',
        name_en: 'Al-Jouf Olive Mills',
        category_ar: 'مكونات بالجملة',
        category_en: 'Bulk Ingredients',
        avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80',
        rating: 4.98,
        orders_count: 920
      },
      {
        id: 'supplier-3',
        name_ar: 'كايزن لأدوات الطهاة',
        name_en: 'Kaizen Cutlery',
        category_ar: 'سكاكين يابانية',
        category_en: 'Japanese Cutlery',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
        rating: 4.94,
        orders_count: 310
      }
    ],
    upcoming_workshops: [
      {
        id: 'course-1',
        title_ar: 'أسرار التخمير والإنضاج الجاف',
        title_en: 'Fermentation & Dry Aging',
        instructor_ar: 'شيف فيصل الهاشمي',
        instructor_en: 'Chef Faisal Al-Hashemi',
        date_ar: '10 سبتمبر 2026',
        date_en: 'Sep 10, 2026',
        seats_left: 3
      },
      {
        id: 'course-2',
        title_ar: 'فنون المخبوزات الفرنسية الفاخرة',
        title_en: 'Haute Viennoiserie Masterclass',
        instructor_ar: 'شيف إيلينا روستوفا',
        instructor_en: 'Chef Elena Rostova',
        date_ar: '18 سبتمبر 2026',
        date_en: 'Sep 18, 2026',
        seats_left: 5
      }
    ]
  },

  // 8. ACTIVE LOGGED-IN USER SESSION MOCK
  user: {
    id: 'chef-1',
    name_ar: 'الشيف فيصل الهاشمي',
    name_en: 'Chef Faisal Al-Hashemi',
    handle: '@chef_faisal',
    email: 'faisal@meyar.sa',
    role: 'chef',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    title_ar: 'المدير التنفيذي للطهي ومستشار فنون الطهي المعاصر',
    title_en: 'Executive Culinary Director & Gastronomy Consultant',
    bio_ar: 'رائد فنون الطهي السعودي المعاصر. يعيد ابتكار الوصفات التراثية النجدية والحجازية باستخدام أحدث تقنيات الإنضاج الجاف والتخمير الطبيعي وفنون الطهي الجزيئي.',
    bio_en: 'Pioneer of modern Saudi fine dining. Reinventing heritage Najdi and Hejazi recipes through precision dry-aging, wild fermentation, and progressive molecular gastronomy.',
    business_profile: {
      company_name_ar: 'استوديو نجد لفنون الطهي والضيافة',
      company_name_en: 'Najd Culinary Studio & Hospitality Consultancy',
      cr_number: '1010894521',
      vat_number: '310245896300003',
      category: 'Fine Dining & Hospitality Consulting',
      location_ar: 'حي حطين، الرياض',
      location_en: 'Hittin, Riyadh, Saudi Arabia'
    },
    stats: {
      recipes_count: 24,
      followers_count: 42800,
      following_count: 310,
      saved_count: 86,
      monthly_views: 48250,
      total_likes: 18400
    }
  },

  // 9. PLATFORM & DASHBOARD KPI STATS
  stats: {
    kpis: {
      views: 48250,
      views_growth: '+18.4%',
      impressions: 142800,
      impressions_growth: '+24.1%',
      rfqs: 38,
      rfqs_growth: '+12.5%',
      revenue: 194500,
      revenue_formatted: '194,500 ر.س',
      revenue_growth: '+31.2%'
    },
    chart_monthly: [
      { month_ar: 'يناير', month_en: 'Jan', views: 24000, revenue: 110000, rfqs: 18 },
      { month_ar: 'فبراير', month_en: 'Feb', views: 29000, revenue: 125000, rfqs: 22 },
      { month_ar: 'مارس', month_en: 'Mar', views: 34000, revenue: 142000, rfqs: 26 },
      { month_ar: 'أبريل', month_en: 'Apr', views: 38000, revenue: 158000, rfqs: 29 },
      { month_ar: 'مايو', month_en: 'May', views: 42000, revenue: 175000, rfqs: 33 },
      { month_ar: 'يونيو', month_en: 'Jun', views: 48250, revenue: 194500, rfqs: 38 }
    ],
    published_recipes_count: 24,
    active_listings_count: 14,
    pending_rfqs_count: 7
  }
};
