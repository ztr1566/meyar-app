import { CHEF_FIXTURES } from './chefs.js';
import { RECIPE_FIXTURES } from './recipes.js';
import { SUPPLY_FIXTURES } from './supplies.js';
import { COURSE_FIXTURES } from './courses.js';
import { CHAT_FIXTURES } from './chats.js';
import { NOTIFICATION_FIXTURES } from './notifications.js';
import { TREND_FIXTURES } from './trends.js';
import { USER_FIXTURES, DEMO_USERS } from './users.js';
import { STAT_FIXTURES } from './stats.js';
import { SETTING_FIXTURES } from './settings.js';
import { RFQ_FIXTURES } from './rfqs.js';
import { DASHBOARD_ENROLLMENT_FIXTURES, DASHBOARD_PERIOD_FIXTURES, DASHBOARD_RFQ_FIXTURES } from './dashboard.js';
import { CHEF_ACTIVITY_FIXTURES, CHEF_COLLECTION_FIXTURES } from './chef-content.js';

export {
  CHEF_FIXTURES,
  RECIPE_FIXTURES,
  SUPPLY_FIXTURES,
  COURSE_FIXTURES,
  CHAT_FIXTURES,
  NOTIFICATION_FIXTURES,
  TREND_FIXTURES,
  USER_FIXTURES,
  DEMO_USERS,
  STAT_FIXTURES,
  SETTING_FIXTURES,
  RFQ_FIXTURES,
  DASHBOARD_ENROLLMENT_FIXTURES,
  DASHBOARD_PERIOD_FIXTURES,
  DASHBOARD_RFQ_FIXTURES,
  CHEF_ACTIVITY_FIXTURES,
  CHEF_COLLECTION_FIXTURES
};

export const MOCK_DATA = {
  chefs: CHEF_FIXTURES,
  recipes: RECIPE_FIXTURES,
  supplies: SUPPLY_FIXTURES,
  courses: COURSE_FIXTURES,
  chats: CHAT_FIXTURES,
  notifications: NOTIFICATION_FIXTURES,
  trends: TREND_FIXTURES,
  user: USER_FIXTURES,
  stats: STAT_FIXTURES
};
