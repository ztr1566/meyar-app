export const CHAT_FIXTURES = [
  {
    "id": "chat-1",
    "partner": {
      "id": "supplier-1",
      "name_ar": "شركة الفنار لمعدات المطابخ",
      "name_en": "Al-Fannar Commercial Kitchens",
      "avatar": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&q=80",
      "role": "supplier",
      "verified": true,
      "online": true
    },
    "last_message_ar": "مرحباً شيف فيصل، قمنا بمراجعة طلب التسعير للعجانة اللولبية 50 لتر ويسعدنا تقديم خصم إضافي للدفعة الأولى.",
    "last_message_en": "Hello Chef Faisal, we reviewed your RFQ for the 50L Spiral Mixer and are pleased to offer an exclusive commercial batch discount.",
    "last_message_time": "10:45 AM",
    "unread_count": 1,
    "category": "supplier",
    "rfq_card": {
      "rfq_id": "rfq-9801",
      "item_id": "supply-1",
      "item_name_ar": "عجانة لولبية تجارية للمخابز 50 لتر",
      "item_name_en": "Commercial Spiral Dough Mixer 50L",
      "item_image": "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=200&q=80",
      "quantity": 2,
      "unit_ar": "وحدة",
      "unit_en": "Units",
      "target_price": 27000,
      "unit_price": 13500,
      "total_price": 27000,
      "currency": "SAR",
      "status": "quoted",
      "destination_ar": "الرياض - حي حطين",
      "destination_en": "Riyadh - Hittin District",
      "target_date": "2026-09-01"
    },
    "messages": [
      {
        "id": "msg-101",
        "sender": "me",
        "text_ar": "السلام عليكم، أود الاستفسار عن توفر عجانة 50 لتر الفولاذية وإمكانية توريد وحدتين لمطعمنا الجديد بالرياض خلال أسبوعين.",
        "text_en": "Greetings, I would like to inquire about stock availability for 2 units of the 50L Spiral Mixer for our new restaurant opening in 2 weeks.",
        "timestamp": "09:30 AM",
        "has_rfq": true
      },
      {
        "id": "msg-102",
        "sender": "partner",
        "text_ar": "وعليكم السلام والرحمة شيف فيصل. الوحدات متوفرة في مستودعاتنا المركزية بالرياض وجاهزة للشحن الفوري مع التوصيل والتركيب المجاني.",
        "text_en": "Welcome Chef Faisal. Both units are in stock at our central Riyadh warehouse, ready for immediate dispatch with complimentary installation.",
        "timestamp": "10:15 AM"
      },
      {
        "id": "msg-103",
        "sender": "partner",
        "text_ar": "مرحباً شيف فيصل، قمنا بمراجعة طلب التسعير للعجانة اللولبية 50 لتر ويسعدنا تقديم خصم إضافي للدفعة الأولى.",
        "text_en": "Hello Chef Faisal, we reviewed your RFQ for the 50L Spiral Mixer and are pleased to offer an exclusive commercial batch discount.",
        "timestamp": "10:45 AM"
      }
    ]
  },
  {
    "id": "chat-2",
    "partner": {
      "id": "chef-2",
      "name_ar": "شيف إيلينا روستوفا",
      "name_en": "Chef Elena Rostova",
      "avatar": "https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=200&q=80",
      "role": "chef",
      "verified": true,
      "online": false
    },
    "last_message_ar": "أهلاً شيف فيصل، وصفتك الجديدة للواغيو بغليز التمر كانت مبهرة! هل يمكننا التنسيق لورشة عمل مشتركة؟",
    "last_message_en": "Hello Chef Faisal, your new Wagyu with date glaze recipe was phenomenal! Can we collaborate on a joint masterclass?",
    "last_message_time": "Yesterday",
    "unread_count": 0,
    "category": "chef",
    "rfq_card": null,
    "messages": [
      {
        "id": "msg-201",
        "sender": "partner",
        "text_ar": "أهلاً شيف فيصل، وصفتك الجديدة للواغيو بغليز التمر كانت مبهرة! هل يمكننا التنسيق لورشة عمل مشتركة؟",
        "text_en": "Hello Chef Faisal, your new Wagyu with date glaze recipe was phenomenal! Can we collaborate on a joint masterclass?",
        "timestamp": "Yesterday 04:20 PM"
      },
      {
        "id": "msg-202",
        "sender": "me",
        "text_ar": "أهلاً شيف إيلينا، يسعدني جداً ذلك! يسعدني دمج الحلويات المبتكرة مع الأطباق التراثية في ورشة الشهر القادم.",
        "text_en": "Hello Chef Elena, I would be honored! Let us plan a fusion pastry-gastronomy workshop next month.",
        "timestamp": "Yesterday 05:00 PM"
      }
    ]
  },
  {
    "id": "chat-3",
    "partner": {
      "id": "supplier-2",
      "name_ar": "معاصر الجوف الذهبية",
      "name_en": "Al-Jouf Golden Olive Mills",
      "avatar": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
      "role": "supplier",
      "verified": true,
      "online": true
    },
    "last_message_ar": "تم تأكيد شحن 4 براميل من زيت الزيتون البكر الممتاز، رقم التتبع مرفق بطلبك.",
    "last_message_en": "Dispatched 4 drums of extra virgin olive oil reserve, tracking number attached to your RFQ order.",
    "last_message_time": "Aug 12",
    "unread_count": 0,
    "category": "supplier",
    "rfq_card": {
      "rfq_id": "rfq-9802",
      "item_id": "supply-2",
      "item_name_ar": "زيت زيتون بكر ممتاز 50 لتر - الجوف",
      "item_name_en": "Extra Virgin Olive Oil Bulk Drum 50L",
      "item_image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80",
      "quantity": 4,
      "unit_ar": "برميل",
      "unit_en": "Drums",
      "target_price": 7400,
      "unit_price": 1850,
      "total_price": 7400,
      "currency": "SAR",
      "status": "accepted",
      "destination_ar": "الدرعية - الرياض",
      "destination_en": "Diriyah - Riyadh",
      "target_date": "2026-08-20"
    },
    "messages": [
      {
        "id": "msg-301",
        "sender": "partner",
        "text_ar": "تم تأكيد شحن 4 براميل من زيت الزيتون البكر الممتاز، رقم التتبع مرفق بطلبك.",
        "text_en": "Dispatched 4 drums of extra virgin olive oil reserve, tracking number attached to your RFQ order.",
        "timestamp": "Aug 12 11:15 AM"
      }
    ]
  }
];
