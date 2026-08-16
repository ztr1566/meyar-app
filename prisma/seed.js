import { createHash } from 'node:crypto';
import { prisma, disconnectDatabase } from '../server/db/client.js';
import {
  USER_FIXTURES,
  DEMO_USERS,
  CHEF_FIXTURES,
  RECIPE_FIXTURES,
  SUPPLY_FIXTURES,
  RFQ_FIXTURES,
  CHAT_FIXTURES,
  NOTIFICATION_FIXTURES
} from '../js/data/fixtures/index.js';

function roleFromFixture(role) {
  return { chef: 'CHEF', supplier: 'SUPPLIER', enthusiast: 'USER', user: 'USER' }[role] ?? 'USER';
}

function parseDate(value, fallback) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function fixturePasswordHash(id) {
  return `fixture:${createHash('sha256').update(`meyar-fixture:${id}`).digest('hex')}`;
}

function parseMessageTimestamp(str) {
  if (!str) return new Date();
  
  const now = new Date();
  
  // If it's just a time like "09:30 AM" or "10:45 AM"
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(str.trim())) {
    const [time, modifier] = str.trim().split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    
    const date = new Date(now);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  
  // If it starts with "Yesterday"
  if (/^Yesterday/i.test(str.trim())) {
    const date = new Date(now);
    date.setDate(date.getDate() - 1);
    
    const timePart = str.replace(/^Yesterday\s*/i, '').trim();
    if (timePart) {
      const [time, modifier] = timePart.split(/\s+/);
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier && modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier && modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
      date.setHours(hours, minutes, 0, 0);
    }
    return date;
  }
  
  // If it's like "Aug 12 11:15 AM" or "Aug 12"
  let dateStr = str.trim();
  if (!/\d{4}/.test(dateStr)) {
    dateStr = `${dateStr}, ${now.getFullYear()}`;
  }
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return now;
}

async function main() {
  console.log('Starting database seeding...');

  // Step 1: Normalize and merge users
  const usersMap = new Map();

  function addRawUser(raw) {
    if (!raw || !raw.id) return;
    const id = raw.id;
    const existing = usersMap.get(id) || {};
    
    const email = raw.email || existing.email || `${id}@meyar.local`;
    const handle = raw.handle || existing.handle || `@${id}`;
    const name = raw.name_en || raw.name || existing.name || raw.name_ar || id;
    const role = roleFromFixture(raw.role || existing.role);
    const avatar = raw.avatar || existing.avatar || null;
    const bio = raw.bio_en || raw.bio || existing.bio || raw.bio_ar || null;
    
    let location = raw.location || existing.location || null;
    if (!location && raw.business_profile && raw.business_profile.location_en) {
      location = raw.business_profile.location_en;
    }
    if (!location && raw.business_profile && raw.business_profile.location_ar) {
      location = raw.business_profile.location_ar;
    }
    if (!location && raw.location_en) {
      location = raw.location_en;
    }
    if (!location && raw.location_ar) {
      location = raw.location_ar;
    }

    const verified = raw.verified !== undefined ? raw.verified : (existing.verified !== undefined ? existing.verified : false);

    usersMap.set(id, {
      id,
      email,
      name,
      handle,
      role,
      avatar,
      bio,
      location,
      verified
    });
  }

  // Collect users from all fixtures
  addRawUser(USER_FIXTURES);

  if (DEMO_USERS) {
    addRawUser(DEMO_USERS.activeUser);
    addRawUser(DEMO_USERS.supplierUser);
    addRawUser(DEMO_USERS.enthusiastUser);
  }

  if (Array.isArray(CHEF_FIXTURES)) {
    CHEF_FIXTURES.forEach(chef => addRawUser(chef));
  }

  if (Array.isArray(SUPPLY_FIXTURES)) {
    SUPPLY_FIXTURES.forEach(supply => {
      if (supply.supplier) {
        addRawUser({
          id: supply.supplier.id,
          name_ar: supply.supplier.name_ar,
          name_en: supply.supplier.name_en,
          avatar: supply.supplier.avatar,
          role: 'supplier',
          verified: supply.supplier.verified
        });
      }
    });
  }

  if (Array.isArray(CHAT_FIXTURES)) {
    CHAT_FIXTURES.forEach(chat => {
      if (chat.partner) {
        addRawUser({
          id: chat.partner.id,
          name_ar: chat.partner.name_ar,
          name_en: chat.partner.name_en,
          avatar: chat.partner.avatar,
          role: chat.partner.role,
          verified: chat.partner.verified
        });
      }
    });
  }

  // Run everything inside an interactive transaction
  await prisma.$transaction(async (tx) => {
    // Step 2: Upsert users
    console.log(`Upserting ${usersMap.size} users...`);
    for (const user of usersMap.values()) {
      await tx.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          name: user.name,
          handle: user.handle,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          verified: user.verified,
          passwordHash: fixturePasswordHash(user.id)
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          handle: user.handle,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          verified: user.verified,
          passwordHash: fixturePasswordHash(user.id)
        }
      });
    }

    // Step 3: Upsert recipes
    if (Array.isArray(RECIPE_FIXTURES)) {
      console.log(`Upserting ${RECIPE_FIXTURES.length} recipes...`);
      for (const recipe of RECIPE_FIXTURES) {
        await tx.recipe.upsert({
          where: { id: recipe.id },
          update: {
            title: recipe.title_en || recipe.title,
            description: recipe.description_en || recipe.description_ar || recipe.description || '',
            prepTime: recipe.prep_time || 0,
            cookTime: recipe.cook_time || 0,
            servings: recipe.base_servings || 1,
            difficulty: recipe.difficulty_en || recipe.difficulty || 'Medium',
            ingredients: recipe.ingredients || [],
            steps: recipe.steps || [],
            tags: recipe.tags || [],
            likesCount: recipe.likes_count || 0,
            authorId: recipe.author_id,
            createdAt: parseDate(recipe.created_at, new Date())
          },
          create: {
            id: recipe.id,
            title: recipe.title_en || recipe.title,
            description: recipe.description_en || recipe.description_ar || recipe.description || '',
            prepTime: recipe.prep_time || 0,
            cookTime: recipe.cook_time || 0,
            servings: recipe.base_servings || 1,
            difficulty: recipe.difficulty_en || recipe.difficulty || 'Medium',
            ingredients: recipe.ingredients || [],
            steps: recipe.steps || [],
            tags: recipe.tags || [],
            likesCount: recipe.likes_count || 0,
            authorId: recipe.author_id,
            createdAt: parseDate(recipe.created_at, new Date())
          }
        });
      }
    }

    // Step 3 (cont): Upsert supplies
    if (Array.isArray(SUPPLY_FIXTURES)) {
      console.log(`Upserting ${SUPPLY_FIXTURES.length} supplies...`);
      for (const supply of SUPPLY_FIXTURES) {
        const supplierId = supply.supplier ? supply.supplier.id : null;
        if (!supplierId) {
          console.warn(`Supply item ${supply.id} is missing a supplier. Skipping.`);
          continue;
        }
        await tx.supplyItem.upsert({
          where: { id: supply.id },
          update: {
            title: supply.name_en || supply.name_ar || supply.name || '',
            category: supply.category || '',
            price: supply.price || 0.0,
            unit: supply.unit_en || supply.unit_ar || supply.unit || '',
            stock: supply.stock_count || 0,
            status: supply.in_stock ? 'IN_STOCK' : 'OUT_OF_STOCK',
            supplierId: supplierId
          },
          create: {
            id: supply.id,
            title: supply.name_en || supply.name_ar || supply.name || '',
            category: supply.category || '',
            price: supply.price || 0.0,
            unit: supply.unit_en || supply.unit_ar || supply.unit || '',
            stock: supply.stock_count || 0,
            status: supply.in_stock ? 'IN_STOCK' : 'OUT_OF_STOCK',
            supplierId: supplierId
          }
        });
      }
    }

    // Step 4: Upsert RFQs
    const rfqsMap = new Map();

    function addRawRfq(raw) {
      if (!raw) return;
      const id = raw.rfq_id || raw.id;
      if (!id) return;
      
      const existing = rfqsMap.get(id) || {};
      
      const title = raw.item_name_en || existing.title || 'RFQ';
      const quantity = raw.quantity || existing.quantity || 1;
      const unit = raw.unit_en || existing.unit || 'Units';
      const destination = raw.destination_en || existing.destination || '';
      const description = `Item: ${title}, Quantity: ${quantity} ${unit}, Destination: ${destination}`;
      
      const budget = raw.total_price || raw.target_price || existing.budget || 0.0;
      const deadline = parseDate(raw.target_date, new Date());
      const status = raw.status || existing.status || 'pending';
      
      rfqsMap.set(id, {
        id,
        title,
        description,
        budget,
        deadline,
        status,
        requesterId: 'chef-1'
      });
    }

    if (Array.isArray(RFQ_FIXTURES)) {
      RFQ_FIXTURES.forEach(rfq => addRawRfq(rfq));
    }

    if (Array.isArray(CHAT_FIXTURES)) {
      CHAT_FIXTURES.forEach(chat => {
        if (chat.rfq_card) {
          addRawRfq(chat.rfq_card);
        }
      });
    }

    console.log(`Upserting ${rfqsMap.size} RFQs...`);
    for (const rfq of rfqsMap.values()) {
      await tx.rfq.upsert({
        where: { id: rfq.id },
        update: {
          title: rfq.title,
          description: rfq.description,
          budget: rfq.budget,
          deadline: rfq.deadline,
          status: rfq.status,
          requesterId: rfq.requesterId
        },
        create: {
          id: rfq.id,
          title: rfq.title,
          description: rfq.description,
          budget: rfq.budget,
          deadline: rfq.deadline,
          status: rfq.status,
          requesterId: rfq.requesterId
        }
      });
    }

    // Step 4 (cont): Upsert conversations and messages
    if (Array.isArray(CHAT_FIXTURES)) {
      console.log(`Upserting ${CHAT_FIXTURES.length} chat conversations...`);
      for (const chat of CHAT_FIXTURES) {
        const partnerId = chat.partner ? chat.partner.id : null;
        if (!partnerId) {
          console.warn(`Chat conversation ${chat.id} is missing a partner. Skipping.`);
          continue;
        }
        
        await tx.chatConversation.upsert({
          where: { id: chat.id },
          update: {
            senderId: 'chef-1',
            receiverId: partnerId
          },
          create: {
            id: chat.id,
            senderId: 'chef-1',
            receiverId: partnerId
          }
        });
        
        if (Array.isArray(chat.messages)) {
          for (const msg of chat.messages) {
            const isMe = msg.sender === 'me';
            const senderId = isMe ? 'chef-1' : partnerId;
            const receiverId = isMe ? partnerId : 'chef-1';
            
            await tx.chatMessage.upsert({
              where: { id: msg.id },
              update: {
                conversationId: chat.id,
                senderId,
                receiverId,
                content: msg.text_en || msg.text_ar || '',
                isRead: isMe ? true : (chat.unread_count === 0),
                createdAt: parseMessageTimestamp(msg.timestamp)
              },
              create: {
                id: msg.id,
                conversationId: chat.id,
                senderId,
                receiverId,
                content: msg.text_en || msg.text_ar || '',
                isRead: isMe ? true : (chat.unread_count === 0),
                createdAt: parseMessageTimestamp(msg.timestamp)
              }
            });
          }
        }
      }
    }

    // Step 4 (cont): Upsert notifications
    if (Array.isArray(NOTIFICATION_FIXTURES)) {
      console.log(`Upserting ${NOTIFICATION_FIXTURES.length} notifications...`);
      for (const notif of NOTIFICATION_FIXTURES) {
        await tx.notification.upsert({
          where: { id: notif.id },
          update: {
            userId: USER_FIXTURES.id,
            type: notif.type || 'info',
            content: notif.message_en || notif.message_ar || '',
            isRead: notif.read !== undefined ? notif.read : false,
            createdAt: parseDate(notif.timestamp, new Date())
          },
          create: {
            id: notif.id,
            userId: USER_FIXTURES.id,
            type: notif.type || 'info',
            content: notif.message_en || notif.message_ar || '',
            isRead: notif.read !== undefined ? notif.read : false,
            createdAt: parseDate(notif.timestamp, new Date())
          }
        });
      }
    }
  });

  console.log('Database seeding completed successfully.');
}

main()
  .then(async () => {
    await disconnectDatabase();
  })
  .catch(async (error) => {
    console.error(error);
    await disconnectDatabase();
    process.exitCode = 1;
  });
