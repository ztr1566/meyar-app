export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  handle: true,
  role: true,
  avatar: true,
  bio: true,
  location: true,
  verified: true,
  createdAt: true
};

export const PUBLIC_AUTHOR_SELECT = {
  id: true,
  name: true,
  handle: true,
  role: true,
  avatar: true,
  verified: true
};

export const PUBLIC_COMMENT_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  author: { select: PUBLIC_AUTHOR_SELECT }
};
