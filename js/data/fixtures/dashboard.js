export const DASHBOARD_PERIOD_FIXTURES = {
  '7d': {
    multiplier: 0.23,
    viewsGrowth: '+8.2%',
    impressionsGrowth: '+11.4%',
    rfqsGrowth: '+5.0%',
    revenueGrowth: '+14.6%',
    trafficPoints: [
      { label_ar: 'السبت', label_en: 'Sat', views: 1800, impressions: 5200 },
      { label_ar: 'الأحد', label_en: 'Sun', views: 2400, impressions: 6800 },
      { label_ar: 'الاثنين', label_en: 'Mon', views: 2900, impressions: 8400 },
      { label_ar: 'الثلاثاء', label_en: 'Tue', views: 3200, impressions: 9600 },
      { label_ar: 'الأربعاء', label_en: 'Wed', views: 3800, impressions: 11200 },
      { label_ar: 'الخميس', label_en: 'Thu', views: 4600, impressions: 13800 },
      { label_ar: 'الجمعة', label_en: 'Fri', views: 5400, impressions: 16500 }
    ],
    revenuePoints: [
      { label_ar: 'السبت', label_en: 'Sat', revenue: 14000, rfqs: 2 },
      { label_ar: 'الأحد', label_en: 'Sun', revenue: 18500, rfqs: 3 },
      { label_ar: 'الاثنين', label_en: 'Mon', revenue: 22000, rfqs: 4 },
      { label_ar: 'الثلاثاء', label_en: 'Tue', revenue: 26500, rfqs: 5 },
      { label_ar: 'الأربعاء', label_en: 'Wed', revenue: 31000, rfqs: 6 },
      { label_ar: 'الخميس', label_en: 'Thu', revenue: 38500, rfqs: 8 },
      { label_ar: 'الجمعة', label_en: 'Fri', revenue: 44000, rfqs: 10 }
    ]
  },
  '30d': {
    multiplier: 1.0,
    viewsGrowth: '+18.4%',
    impressionsGrowth: '+24.1%',
    rfqsGrowth: '+12.5%',
    revenueGrowth: '+31.2%',
    trafficPoints: [
      { label_ar: 'أسبوع 1', label_en: 'Week 1', views: 9800, impressions: 28500 },
      { label_ar: 'أسبوع 2', label_en: 'Week 2', views: 11400, impressions: 34200 },
      { label_ar: 'أسبوع 3', label_en: 'Week 3', views: 13200, impressions: 39500 },
      { label_ar: 'أسبوع 4', label_en: 'Week 4', views: 13850, impressions: 40600 }
    ],
    revenuePoints: [
      { label_ar: 'أسبوع 1', label_en: 'Week 1', revenue: 38000, rfqs: 7 },
      { label_ar: 'أسبوع 2', label_en: 'Week 2', revenue: 46500, rfqs: 9 },
      { label_ar: 'أسبوع 3', label_en: 'Week 3', revenue: 52000, rfqs: 10 },
      { label_ar: 'أسبوع 4', label_en: 'Week 4', revenue: 58000, rfqs: 12 }
    ]
  },
  '6m': {
    multiplier: 5.6,
    viewsGrowth: '+34.8%',
    impressionsGrowth: '+42.5%',
    rfqsGrowth: '+28.0%',
    revenueGrowth: '+52.4%',
    trafficPoints: [
      { label_ar: 'يناير', label_en: 'Jan', views: 24000, impressions: 68000 },
      { label_ar: 'فبراير', label_en: 'Feb', views: 29000, impressions: 82000 },
      { label_ar: 'مارس', label_en: 'Mar', views: 34000, impressions: 98000 },
      { label_ar: 'أبريل', label_en: 'Apr', views: 38000, impressions: 112000 },
      { label_ar: 'مايو', label_en: 'May', views: 42000, impressions: 128000 },
      { label_ar: 'يونيو', label_en: 'Jun', views: 48250, impressions: 142800 }
    ],
    revenuePoints: [
      { label_ar: 'يناير', label_en: 'Jan', revenue: 110000, rfqs: 18 },
      { label_ar: 'فبراير', label_en: 'Feb', revenue: 125000, rfqs: 22 },
      { label_ar: 'مارس', label_en: 'Mar', revenue: 142000, rfqs: 26 },
      { label_ar: 'أبريل', label_en: 'Apr', revenue: 158000, rfqs: 29 },
      { label_ar: 'مايو', label_en: 'May', revenue: 175000, rfqs: 33 },
      { label_ar: 'يونيو', label_en: 'Jun', revenue: 194500, rfqs: 38 }
    ]
  },
  '1y': {
    multiplier: 11.2,
    viewsGrowth: '+68.5%',
    impressionsGrowth: '+85.2%',
    rfqsGrowth: '+48.0%',
    revenueGrowth: '+94.0%',
    trafficPoints: [
      { label_ar: 'الربع 1', label_en: 'Q1', views: 87000, impressions: 248000 },
      { label_ar: 'الربع 2', label_en: 'Q2', views: 128000, impressions: 382000 },
      { label_ar: 'الربع 3', label_en: 'Q3', views: 165000, impressions: 490000 },
      { label_ar: 'الربع 4', label_en: 'Q4', views: 194000, impressions: 580000 }
    ],
    revenuePoints: [
      { label_ar: 'الربع 1', label_en: 'Q1', revenue: 377000, rfqs: 66 },
      { label_ar: 'الربع 2', label_en: 'Q2', revenue: 527500, rfqs: 100 },
      { label_ar: 'الربع 3', label_en: 'Q3', revenue: 640000, rfqs: 124 },
      { label_ar: 'الربع 4', label_en: 'Q4', revenue: 785000, rfqs: 156 }
    ]
  }
};

export const DASHBOARD_RFQ_FIXTURES = [
  {
    id: 'RFQ-9801',
    client_name_ar: 'شركة مطاعم لوسيل الفاخرة',
    client_name_en: 'Lusail Fine Dining Group',
    buyer_name: 'أحمد السبيعي',
    buyer_email: 'a.subaie@lusail-dining.sa',
    item_id: 'supply-1',
    item_name_ar: 'عجانة لولبية تجارية 50 لتر',
    item_name_en: 'Commercial Heavy-Duty Spiral Dough Mixer 50L',
    quantity: 3,
    destination_ar: 'الرياض - حي الملز',
    destination_en: 'Riyadh - Al-Malaz',
    target_date: '2026-09-01',
    status: 'pending',
    quoted_price: null,
    lead_time: null,
    created_at: '2026-08-14'
  },
  {
    id: 'RFQ-9802',
    client_name_ar: 'مجموعة الضيافة المبتكرة',
    client_name_en: 'Innovative Hospitality Group',
    buyer_name: 'م. راكان الغامدي',
    buyer_email: 'rakan@ihg-sa.com',
    item_id: 'supply-2',
    item_name_ar: 'طقم سكاكين دمشقية يابانية 6 قطع',
    item_name_en: 'Master Japanese Damascus Chef Knives Set 6pcs',
    quantity: 10,
    destination_ar: 'جدة - الروضة',
    destination_en: 'Jeddah - Al-Rawdah',
    target_date: '2026-08-28',
    status: 'quoted',
    quoted_price: 36000,
    quoted_price_formatted: '36,000 ر.س',
    lead_time: '4 أيام عمل',
    created_at: '2026-08-13'
  },
  {
    id: 'RFQ-9803',
    client_name_ar: 'مخبز ومقهى السنبلة الذهبية',
    client_name_en: 'Golden Spike Artisanal Bakery',
    buyer_name: 'نورة المنصور',
    buyer_email: 'noura@goldenspike.sa',
    item_id: 'supply-3',
    item_name_ar: 'دقيق فاخر عضوي T65 فرنسي 25 كغ',
    item_name_en: 'Organic French Wheat Flour T65 25kg',
    quantity: 50,
    destination_ar: 'الخبر - الحزام الأخضر',
    destination_en: 'Khobar - Green Belt',
    target_date: '2026-09-15',
    status: 'accepted',
    quoted_price: 10500,
    quoted_price_formatted: '10,500 ر.س',
    lead_time: '2 أيام عمل',
    created_at: '2026-08-11'
  },
  {
    id: 'RFQ-9804',
    client_name_ar: 'منتجع شاطئ النورس',
    client_name_en: 'Al-Nawras Beach Resort',
    buyer_name: 'فهد العتيبي',
    buyer_email: 'f.otaibi@al-nawras.sa',
    item_id: 'supply-4',
    item_name_ar: 'عبوات تقديم صديقة للبيئة قابلة للتحلل',
    item_name_en: 'Biodegradable Eco Food Packaging Containers',
    quantity: 200,
    destination_ar: 'الدمام - الشاطئ الغربي',
    destination_en: 'Dammam - West Coast',
    target_date: '2026-08-30',
    status: 'pending',
    quoted_price: null,
    lead_time: null,
    created_at: '2026-08-14'
  },
  {
    id: 'RFQ-9805',
    client_name_ar: 'شركة إتقان للمطابخ المركزية',
    client_name_en: 'Itqan Cloud Kitchens',
    buyer_name: 'سالم الدوسري',
    buyer_email: 'salem@itqan-kitchens.sa',
    item_id: 'supply-1',
    item_name_ar: 'عجانة لولبية تجارية 50 لتر',
    item_name_en: 'Commercial Heavy-Duty Spiral Dough Mixer 50L',
    quantity: 2,
    destination_ar: 'الرياض - السلي',
    destination_en: 'Riyadh - Al-Sulay',
    target_date: '2026-08-25',
    status: 'rejected',
    quoted_price: 29000,
    quoted_price_formatted: '29,000 ر.س',
    lead_time: '5 أيام عمل',
    created_at: '2026-08-08'
  }
];

export const DASHBOARD_ENROLLMENT_FIXTURES = [
  {
    id: 'ENR-2041',
    student_name_ar: 'سارة عبد الله الشمري',
    student_name_en: 'Sarah Abdullah Al-Shammari',
    student_email: 'sarah.shammari@gmail.com',
    student_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    course_id: 'course-1',
    course_title_ar: 'أسرار التخمير والإنضاج الجاف في المطابخ الفاخرة',
    course_title_en: 'Modern Fermentation & Dry Aging Masterclass',
    booking_date: '2026-08-14',
    payment_status: 'paid',
    amount_formatted: '3,200 ر.س',
    progress: 75
  },
  {
    id: 'ENR-2042',
    student_name_ar: 'خالد بن ناصر القحطاني',
    student_name_en: 'Khaled Nasser Al-Qahtani',
    student_email: 'khaled.q@outlook.com',
    student_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    course_id: 'course-1',
    course_title_ar: 'أسرار التخمير والإنضاج الجاف في المطابخ الفاخرة',
    course_title_en: 'Modern Fermentation & Dry Aging Masterclass',
    booking_date: '2026-08-12',
    payment_status: 'paid',
    amount_formatted: '3,200 ر.س',
    progress: 60
  },
  {
    id: 'ENR-2043',
    student_name_ar: 'منى بنت سليمان الزهراني',
    student_name_en: 'Mona Sulaiman Al-Zahrani',
    student_email: 'mona.z@yahoo.com',
    student_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    course_id: 'course-2',
    course_title_ar: 'فنون المخبوزات الفرنسية الفاخرة (Viennoiserie)',
    course_title_en: 'Haute Viennoiserie Masterclass',
    booking_date: '2026-08-10',
    payment_status: 'confirmed',
    amount_formatted: '2,800 ر.س',
    progress: 100
  },
  {
    id: 'ENR-2044',
    student_name_ar: 'ياسر محمد الحربي',
    student_name_en: 'Yasser Mohammed Al-Harbi',
    student_email: 'yasser.harbi@cloudkitchen.sa',
    student_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    course_id: 'course-1',
    course_title_ar: 'أسرار التخمير والإنضاج الجاف في المطابخ الفاخرة',
    course_title_en: 'Modern Fermentation & Dry Aging Masterclass',
    booking_date: '2026-08-09',
    payment_status: 'paid',
    amount_formatted: '3,200 ر.س',
    progress: 40
  }
];
