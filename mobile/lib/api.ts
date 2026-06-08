import axios from 'axios';

import { API_URL } from './config';
import type { Conversation, FakeUser, Message, Notification, Post, User } from './types';

const client = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

export async function createUser(username: string, displayName: string, bio = ''): Promise<User> {
  const { data } = await client.post<User>('/users', {
    username,
    display_name: displayName,
    bio,
  });
  return data;
}

export async function getUser(userId: string): Promise<User> {
  const { data } = await client.get<User>(`/users/${userId}`);
  return data;
}

export async function upgradePremium(userId: string): Promise<void> {
  await client.patch(`/users/${userId}/premium`);
}

export async function getFeed(userId: string): Promise<Post[]> {
  const { data } = await client.get<Post[]>(`/feed/${userId}`);
  return data;
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const { data } = await client.get<Post[]>(`/posts/user/${userId}`);
  return data;
}

export async function getPost(postId: string) {
  const { data } = await client.get(`/posts/${postId}`);
  return data;
}

export async function createPost(
  userId: string,
  imageUri: string,
  caption: string,
  location?: string
) {
  const form = new FormData();
  form.append('image', {
    uri: imageUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  form.append('caption', caption);
  if (location) form.append('location', location);

  const { data } = await client.post(`/posts?user_id=${userId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data } = await client.get<Notification[]>(`/notifications/${userId}`);
  return data;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { data } = await client.get<{ count: number }>(`/notifications/${userId}/unread-count`);
  return data.count;
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await client.patch(`/notifications/${userId}/read-all`);
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data } = await client.get<Conversation[]>(`/messages/conversations/${userId}`);
  return data;
}

export async function getMessages(conversationId: string, userId: string): Promise<Message[]> {
  const { data } = await client.get<Message[]>(
    `/messages/conversations/${conversationId}/messages?user_id=${userId}`
  );
  return data;
}

export async function sendMessage(conversationId: string, userId: string, content: string) {
  const { data } = await client.post(
    `/messages/conversations/${conversationId}/send?user_id=${userId}`,
    { content }
  );
  return data;
}

export async function startConversation(userId: string, fakeUserId: string) {
  const { data } = await client.post(`/messages/start/${userId}/${fakeUserId}`);
  return data;
}

export async function getExplorePosts(): Promise<{ id: string; image_url: string; caption?: string }[]> {
  const { data } = await client.get<{ id: string; image_url: string; caption?: string }[]>(
    '/fake-users/explore/posts'
  );
  return data;
}

export async function getTier1Characters(): Promise<FakeUser[]> {
  const { data } = await client.get<FakeUser[]>('/fake-users/tier1/list');
  return data;
}

export async function getFakeUser(fakeUserId: string): Promise<FakeUser> {
  const { data } = await client.get<FakeUser>(`/fake-users/${fakeUserId}`);
  return data;
}
