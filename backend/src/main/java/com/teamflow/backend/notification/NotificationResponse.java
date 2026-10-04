package com.teamflow.backend.notification;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String message,
        String kind,
        boolean read,
        Long userId,
        Instant createdAt,
        Instant readAt) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getMessage(), notification.getKind(),
                notification.getReadAt() != null, notification.getUser().getId(),
                notification.getCreatedAt(), notification.getReadAt());
    }
}
