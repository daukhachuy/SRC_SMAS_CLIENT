/**
 * SignalR — hubs: kitchen, chat, notifications (nếu backend map hub).
 * JWT qua accessTokenFactory (WebSocket co the kem query access_token).
 * Chat: reconnect → JoinConversation lại; unmount → connection.stop().
 */
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL } from '../api/axiosInstance';

/** @type {string} */
export const KITCHEN_HUB = '/hubs/kitchen';
/** @type {string} */
export const CHAT_HUB = '/hubs/chat';
/** @type {string} */
export const NOTIFICATION_HUB = '/hubs/notifications';

export const getAccessToken = () =>
  localStorage.getItem('authToken') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('tableAccessToken') ||
  '';

const resolveHubUrl = (hubPath) => {
  const apiBase = String(API_BASE_URL || '').trim().replace(/\/+$/, '');
  const root = apiBase.replace(/\/api$/i, '');
  if (/^https?:\/\//i.test(root)) return `${root}${hubPath}`;
  if (root.startsWith('/')) return `${root}${hubPath}`;
  return hubPath;
};

/**
 * @param {string} hubPath
 * @returns {import('@microsoft/signalr').HubConnection}
 */
export const createHubConnection = (hubPath) =>
  new HubConnectionBuilder()
    .withUrl(resolveHubUrl(hubPath), {
      accessTokenFactory: () => Promise.resolve(getAccessToken()),
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
