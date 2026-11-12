import { Link } from 'react-router-dom';
import { notificationApi } from '../api/endpoints';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { formatDateTime } from '../domain/labels';
import { useAction } from '../hooks/useAction';
import { useAsync } from '../hooks/useAsync';

export function NotificationsPage() {
  const notifications = useAsync(notificationApi.latest);
  const { error, run } = useAction();

  const markAsRead = async (notificationId: string) => {
    if (await run(() => notificationApi.markAsRead(notificationId))) {
      notifications.reload();
    }
  };

  return (
    <section className="narrow">
      <h1>Notificaciones</h1>
      {notifications.loading && <Loading />}
      <ErrorMessage message={notifications.error ?? error} />
      {notifications.data?.length === 0 && <EmptyState text="No tienes notificaciones." />}
      <ul className="plain-list">
        {notifications.data?.map((notification) => (
          <li key={notification.id} className={notification.readAt ? 'notification read' : 'notification'}>
            <div>
              <p>{notification.message}</p>
              <span className="muted">{formatDateTime(notification.createdAt)}</span>
            </div>
            <div className="actions">
              {notification.relatedContent && <Link to={`/kudos/${notification.relatedContent.id}`}>Ver</Link>}
              {!notification.readAt && (
                <button type="button" className="link-button" onClick={() => void markAsRead(notification.id)}>
                  Marcar como leída
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
